BEGIN;

CREATE TABLE IF NOT EXISTS short_url_access_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  short_url_id BIGINT NOT NULL
    REFERENCES short_urls(id)
    ON DELETE CASCADE,

  accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),

  ip_address INET NULL,
  user_agent TEXT NULL,
  referer TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_access_logs_short_url
  ON short_url_access_logs (short_url_id);

CREATE INDEX IF NOT EXISTS idx_access_logs_accessed_at
  ON short_url_access_logs (accessed_at);

ALTER TABLE short_url_access_logs DISABLE ROW LEVEL SECURITY;

COMMIT;
