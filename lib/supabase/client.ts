import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://zfjfkcrbkwydytdytris.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmamZrY3Jia3d5ZHl0ZHl0cmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjM4OTUsImV4cCI6MjA5MDczOTg5NX0.uI0Hxd8sgkcNLncjneOD7Iki80h-HD5vHmsB-bfsVWo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
