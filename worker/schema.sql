-- FastFixIt repair request inbox
-- Run after creating the D1 database:
--   npx wrangler d1 execute fastfixit-requests --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS repair_requests (
  reference TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  contact TEXT,
  device TEXT,
  device_id TEXT,
  model TEXT,
  serial TEXT,
  fault_category TEXT,
  fault_label TEXT,
  details TEXT,
  previous TEXT,
  liquid TEXT,
  handoff TEXT,
  mail_in INTEGER NOT NULL DEFAULT 0,
  return_street TEXT,
  return_city TEXT,
  return_state TEXT,
  return_zip TEXT,
  return_address TEXT,
  shipping_carrier TEXT,
  tracking_number TEXT,
  accessories TEXT,
  estimate TEXT,
  photo_count INTEGER NOT NULL DEFAULT 0,
  email_status TEXT,
  tracker_ticket_number INTEGER,
  tracker_ticket_id TEXT,
  tracker_public_token TEXT,
  tracker_status TEXT,
  tracker_synced_at TEXT,
  tracker_error TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_repair_requests_created
  ON repair_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_repair_requests_status
  ON repair_requests (status);