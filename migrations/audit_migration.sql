-- migration for audit_db (recommended in a separate Supabase project)

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
