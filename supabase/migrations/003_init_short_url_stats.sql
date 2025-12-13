BEGIN;

CREATE TABLE IF NOT EXISTS short_url_stats (
  short_url_id BIGINT PRIMARY KEY
    REFERENCES short_urls(id)
    ON DELETE CASCADE,

  click_count BIGINT NOT NULL DEFAULT 0,
  last_accessed TIMESTAMP NULL
);

ALTER TABLE short_url_stats DISABLE ROW LEVEL SECURITY;

COMMIT;
