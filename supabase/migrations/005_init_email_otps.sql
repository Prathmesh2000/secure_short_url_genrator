BEGIN;

CREATE TABLE email_otps (
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  purpose TEXT NOT NULL, -- signup | reset_password
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_otps_email
ON email_otps (email);

COMMIT;