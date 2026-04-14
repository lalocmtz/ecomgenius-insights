#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Leer .env.local manualmente
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2];
});

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env.local');
  console.log('Found:', { SUPABASE_URL: !!SUPABASE_URL, SUPABASE_KEY: !!SUPABASE_KEY });
  process.exit(1);
}

console.log(`📝 Connecting to Supabase: ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sql = `
CREATE TABLE IF NOT EXISTS live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  live_date TEXT,
  gmv NUMERIC DEFAULT 0,
  gasto_ads NUMERIC DEFAULT 0,
  pedidos INTEGER DEFAULT 0,
  duracion_minutos INTEGER,
  creadores JSONB,
  roi NUMERIC,
  margen NUMERIC,
  source TEXT DEFAULT 'seller_center_cowork',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_brand_user UNIQUE(brand_id, user_id, live_date)
);

CREATE INDEX IF NOT EXISTS idx_live_sessions_brand_user ON live_sessions(brand_id, user_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_created_at ON live_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_sessions_date ON live_sessions(live_date);

ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON live_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON live_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON live_sessions;

CREATE POLICY "Users can view own sessions" ON live_sessions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own sessions" ON live_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own sessions" ON live_sessions
  FOR UPDATE USING (auth.uid()::text = user_id);
`;

async function createTable() {
  try {
    console.log('⏳ Creating live_sessions table...');
    
    // Intentar ejecutar usando rpc
    const { data, error } = await supabase.rpc('exec', { sql }).catch(err => {
      return { data: null, error: err };
    });

    if (!error) {
      console.log('✅ Table created successfully!');
      process.exit(0);
    }

    console.log('ℹ️  RPC method not available or needs manual execution');
    console.log('\n📖 Copy this SQL to Supabase Dashboard:');
    console.log('https://app.supabase.com/project/YOUR_PROJECT/sql/new');
    console.log('\n' + sql);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error?.message);
    console.log('\n📖 Create the table manually at:');
    console.log('https://app.supabase.com/project/YOUR_PROJECT/sql/new\n');
    console.log(sql);
    process.exit(1);
  }
}

createTable();
