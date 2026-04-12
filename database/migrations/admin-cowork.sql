-- ============================================================================
-- ADMIN PANEL & COWORK - Database Migrations
-- ============================================================================

-- 1. Mejorar tabla user_brands (ya existe, agregar columnas)
ALTER TABLE user_brands ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- 2. Tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'assign_brand', 'remove_brand', 'create_user', etc.
  target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_audit_logs(created_at DESC);

-- 3. Tabla de conexiones del Seller Center (encriptada)
CREATE TABLE IF NOT EXISTS seller_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  seller_email VARCHAR(255) NOT NULL,
  encrypted_password TEXT NOT NULL, -- Usar pgcrypto
  seller_shop_id VARCHAR(255),
  last_login TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'disconnected', 'error'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seller_connections_user_id ON seller_connections(user_id);

-- 4. Tabla de períodos de extracción
CREATE TABLE IF NOT EXISTS extraction_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  period_type VARCHAR(50) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  period_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  extracted_at TIMESTAMP WITH TIME ZONE,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_extraction_periods_user_id ON extraction_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_extraction_periods_brand_id ON extraction_periods(brand_id);
CREATE INDEX IF NOT EXISTS idx_extraction_periods_status ON extraction_periods(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_extraction_periods_unique ON extraction_periods(user_id, brand_id, period_date);

-- 5. Tabla de datos extraídos
CREATE TABLE IF NOT EXISTS extracted_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  data_type VARCHAR(50) NOT NULL, -- 'overview', 'campaigns', 'products', 'affiliates', 'creatives', 'seller_center_full'
  period DATE,
  data JSONB NOT NULL,
  file_url TEXT, -- URL del archivo en storage si aplica
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_extracted_data_user_id ON extracted_data(user_id);
CREATE INDEX IF NOT EXISTS idx_extracted_data_brand_id ON extracted_data(brand_id);
CREATE INDEX IF NOT EXISTS idx_extracted_data_data_type ON extracted_data(data_type);
CREATE INDEX IF NOT EXISTS idx_extracted_data_period ON extracted_data(period DESC);

-- 6. Tabla de logs de extracción
CREATE TABLE IF NOT EXISTS extraction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL, -- 'started', 'success', 'failed', 'partial'
  error_message TEXT,
  records_extracted INT,
  duration_seconds INT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_extraction_logs_user_id ON extraction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_extraction_logs_completed_at ON extraction_logs(completed_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_logs ENABLE ROW LEVEL SECURITY;

-- admin_audit_logs: Solo el admin propietario puede verlos
CREATE POLICY "Admin can view own audit logs"
  ON admin_audit_logs FOR SELECT
  USING (admin_id = auth.uid());

-- seller_connections: Super secreto - solo propietario
CREATE POLICY "Users can access own seller connections"
  ON seller_connections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own seller connections"
  ON seller_connections FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert seller connections"
  ON seller_connections FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- extraction_periods: Solo propietario + admin
CREATE POLICY "Users see own extraction periods"
  ON extraction_periods FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admin sees all extraction periods"
  ON extraction_periods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_brands
      WHERE user_brands.user_id = auth.uid()
      AND user_brands.is_admin = true
    )
  );

-- extracted_data: Solo propietario + admin de la marca
CREATE POLICY "Users see own extracted data"
  ON extracted_data FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Brand admins see brand data"
  ON extracted_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_brands
      WHERE user_brands.user_id = auth.uid()
      AND user_brands.brand_id = extracted_data.brand_id
      AND user_brands.is_admin = true
    )
  );

-- extraction_logs: Solo propietario + admin
CREATE POLICY "Users see own extraction logs"
  ON extraction_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admin sees all extraction logs"
  ON extraction_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_brands
      WHERE user_brands.user_id = auth.uid()
      AND user_brands.is_admin = true
    )
  );

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Función para registrar cambios en user_brands
CREATE OR REPLACE FUNCTION log_user_brands_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_audit_logs (admin_id, action, target_user_id, target_brand_id, changes)
  VALUES (
    auth.uid(),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'assign_brand'
      WHEN TG_OP = 'DELETE' THEN 'remove_brand'
      ELSE 'update_brand'
    END,
    NEW.user_id,
    NEW.brand_id,
    jsonb_build_object(
      'old_is_admin', OLD.is_admin,
      'new_is_admin', NEW.is_admin
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditoría de user_brands
CREATE TRIGGER trigger_user_brands_audit
AFTER INSERT OR UPDATE OR DELETE ON user_brands
FOR EACH ROW
EXECUTE FUNCTION log_user_brands_change();

-- Función para actualizar updated_at en seller_connections
CREATE OR REPLACE FUNCTION update_seller_connections_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER trigger_seller_connections_timestamp
BEFORE UPDATE ON seller_connections
FOR EACH ROW
EXECUTE FUNCTION update_seller_connections_timestamp();

-- ============================================================================
-- INITIAL DATA (si aplica)
-- ============================================================================

-- Ya no necesitamos insertar nada aquí - se crea desde la app
