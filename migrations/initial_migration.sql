-- initial migration for app_db (Supabase project A)

-- roles table
CREATE TABLE IF NOT EXISTS roles (
  name text primary key
);

INSERT INTO roles (name) VALUES
('developer'),
('manager'),
('supervisor'),
('sindico'),
('tecnico'),
('zelador')
ON CONFLICT DO NOTHING;

-- users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  name text,
  role text REFERENCES roles(name),
  manager_id uuid REFERENCES users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- condominios
CREATE TABLE IF NOT EXISTS condominios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  created_by uuid REFERENCES users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- clientes
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  documento text,
  contato jsonb,
  condominio_id uuid REFERENCES condominios(id),
  created_by uuid REFERENCES users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ambientes
CREATE TABLE IF NOT EXISTS ambientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id uuid REFERENCES condominios(id),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- itens_ambiente
CREATE TABLE IF NOT EXISTS itens_ambiente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambiente_id uuid REFERENCES ambientes(id),
  name text NOT NULL,
  description text
);

-- routine_models and inspection_models
CREATE TABLE IF NOT EXISTS routine_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id uuid REFERENCES condominios(id),
  name text NOT NULL,
  version_number integer NOT NULL,
  created_by uuid REFERENCES users(id),
  json_structure jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inspection_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id uuid REFERENCES condominios(id),
  name text NOT NULL,
  version_number integer NOT NULL,
  created_by uuid REFERENCES users(id),
  json_structure jsonb,
  created_at timestamptz DEFAULT now()
);

-- rotinas and vistorias (instances)
CREATE TABLE IF NOT EXISTS rotinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id uuid REFERENCES routine_models(id),
  condominio_id uuid REFERENCES condominios(id),
  created_by uuid REFERENCES users(id),
  scheduled_at timestamptz,
  status text,
  resultado jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vistorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id uuid REFERENCES inspection_models(id),
  condominio_id uuid REFERENCES condominios(id),
  created_by uuid REFERENCES users(id),
  scheduled_at timestamptz,
  status text,
  resultado jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- files
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text,
  entity_id uuid,
  storage_key text,
  url text,
  mime text,
  size bigint,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz DEFAULT now()
);

-- ordem de servico
CREATE TABLE IF NOT EXISTS os_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid,
  item text,
  quantity integer,
  unit_price numeric(12,2),
  subtotal numeric(12,2)
);

CREATE TABLE IF NOT EXISTS ordens_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id uuid REFERENCES condominios(id),
  created_by uuid REFERENCES users(id),
  total numeric(12,2),
  status text,
  observations text,
  created_at timestamptz DEFAULT now()
);

-- audit logs will be created in a separate project (audit_db) but we include a local table for dev
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_table text,
  entity_id uuid,
  action text,
  actor_id uuid,
  before jsonb,
  after jsonb,
  reason text,
  created_at timestamptz DEFAULT now()
);
