BEGIN;
CREATE TABLE IF NOT EXISTS knowledge_staff (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  professional_role text NOT NULL,
  role text NOT NULL CHECK (role IN ('editor','reviewer')),
  password_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS knowledge_topics (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS knowledge_revisions (
  id text PRIMARY KEY,
  topic_id text NOT NULL REFERENCES knowledge_topics(id),
  version integer NOT NULL CHECK (version > 0),
  lock_version integer NOT NULL DEFAULT 1 CHECK (lock_version > 0),
  status text NOT NULL CHECK (status IN ('draft','in_review','approved','rejected','withdrawn','superseded')),
  content jsonb NOT NULL,
  authored_by text NOT NULL,
  contributors text[] NOT NULL,
  reviewed_by text REFERENCES knowledge_staff(id),
  reviewed_at timestamptz,
  expires_at timestamptz,
  review_note text,
  attestation jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (topic_id, version),
  CHECK (status <> 'approved' OR (
    reviewed_by IS NOT NULL AND reviewed_by <> ALL(contributors)
    AND reviewed_at IS NOT NULL AND expires_at > reviewed_at
    AND attestation IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS one_editorial_candidate ON knowledge_revisions(topic_id)
  WHERE status IN ('draft','in_review');
CREATE UNIQUE INDEX IF NOT EXISTS one_editorial_publication ON knowledge_revisions(topic_id)
  WHERE status = 'approved';
CREATE TABLE IF NOT EXISTS knowledge_review_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  revision_id text NOT NULL REFERENCES knowledge_revisions(id),
  staff_subject text NOT NULL,
  action text NOT NULL CHECK (action IN ('import','create','save','submit','approve','reject','revise','withdraw','supersede')),
  note text NOT NULL DEFAULT '',
  occurred_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS revision_id text REFERENCES knowledge_revisions(id);
CREATE OR REPLACE FUNCTION protect_review_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Editorial events are append only'; END; $$;
DROP TRIGGER IF EXISTS immutable_review_event ON knowledge_review_events;
CREATE TRIGGER immutable_review_event BEFORE UPDATE OR DELETE ON knowledge_review_events
FOR EACH ROW EXECUTE FUNCTION protect_review_event();
CREATE OR REPLACE FUNCTION protect_reviewed_content() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Keep editorial revision history'; END IF;
  IF OLD.status <> 'draft' AND (NEW.content IS DISTINCT FROM OLD.content OR
    NEW.contributors IS DISTINCT FROM OLD.contributors OR NEW.authored_by <> OLD.authored_by) THEN
    RAISE EXCEPTION 'Reviewed content is immutable; create a new revision';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS immutable_reviewed_content ON knowledge_revisions;
CREATE TRIGGER immutable_reviewed_content BEFORE UPDATE OR DELETE ON knowledge_revisions
FOR EACH ROW EXECUTE FUNCTION protect_reviewed_content();
CREATE OR REPLACE VIEW published_knowledge AS
SELECT i.* FROM knowledge_items i JOIN knowledge_revisions r ON r.id = i.revision_id
JOIN knowledge_sources s ON s.id = i.source_id
WHERE r.status = 'approved' AND i.status = 'approved' AND i.version = r.version
  AND i.reviewed_by = r.reviewed_by AND i.reviewed_at = r.reviewed_at AND i.expires_at = r.expires_at
  AND i.domain = r.content->>'domain' AND i.title = r.content->'title'->>i.language
  AND i.body = (r.content->'body'->>i.language) || E'\n\n' || (r.content->'scope'->>i.language)
  AND s.url = r.content->'source'->>'url' AND s.publisher = r.content->'source'->>'publisher';
COMMIT;
