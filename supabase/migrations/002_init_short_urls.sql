BEGIN;

CREATE TABLE IF NOT EXISTS short_urls (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  user_id BIGINT NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  short_code VARCHAR(12) UNIQUE,
  long_url TEXT NOT NULL,

  header_values JSONB,

  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_active_short_code
  ON short_urls (short_code)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_active_urls
  ON short_urls (user_id)
  WHERE is_active = true;

ALTER TABLE short_urls DISABLE ROW LEVEL SECURITY;

COMMIT;
