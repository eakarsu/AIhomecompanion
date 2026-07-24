BEGIN;
CREATE TABLE IF NOT EXISTS companion_ai_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES companion_households(id),
  profile_id uuid NOT NULL,
  actor_id uuid NOT NULL REFERENCES companion_users(id),
  feature text NOT NULL,
  input jsonb NOT NULL,
  output jsonb NOT NULL,
  model text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(tenant_id,profile_id) REFERENCES companion_profiles(tenant_id,id)
);
CREATE INDEX IF NOT EXISTS companion_ai_interactions_history_idx
  ON companion_ai_interactions(tenant_id,profile_id,actor_id,created_at DESC);
ALTER TABLE companion_ai_interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON companion_ai_interactions;
CREATE POLICY tenant_isolation ON companion_ai_interactions
  USING (tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid)
  WITH CHECK (tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
COMMIT;
