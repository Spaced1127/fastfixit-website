-- FastFixIt repair request inbox: RepairTrackerV2 link
-- Run once against an existing database:
--   npx wrangler d1 execute fastfixit-requests --remote --file=migrations/002-tracker.sql

ALTER TABLE repair_requests ADD COLUMN tracker_ticket_number INTEGER;
ALTER TABLE repair_requests ADD COLUMN tracker_ticket_id TEXT;
ALTER TABLE repair_requests ADD COLUMN tracker_public_token TEXT;
ALTER TABLE repair_requests ADD COLUMN tracker_status TEXT;
ALTER TABLE repair_requests ADD COLUMN tracker_synced_at TEXT;
ALTER TABLE repair_requests ADD COLUMN tracker_error TEXT;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);