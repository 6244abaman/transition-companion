-- Knowledge only. Never add soldier profiles, messages, goals or individual events.
BEGIN;
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id text PRIMARY KEY,
  url text NOT NULL CHECK (url LIKE 'https://%'),
  publisher text NOT NULL,
  approved boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS knowledge_items (
  id text PRIMARY KEY,
  source_id text NOT NULL REFERENCES knowledge_sources(id),
  domain text NOT NULL CHECK (domain IN ('benefits','education','employment','general')),
  language text NOT NULL CHECK (language IN ('he','en')),
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','withdrawn')),
  reviewed_at timestamptz,
  expires_at timestamptz,
  reviewed_by text,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  CHECK (status <> 'approved' OR (reviewed_at IS NOT NULL AND expires_at > reviewed_at AND reviewed_by IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS knowledge_lookup ON knowledge_items (domain, language, status, expires_at);
CREATE TABLE IF NOT EXISTS knowledge_admin_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_id text NOT NULL REFERENCES knowledge_items(id),
  staff_subject text NOT NULL,
  action text NOT NULL CHECK (action IN ('create','review','approve','withdraw')),
  occurred_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
