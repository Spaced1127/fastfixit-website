-- Lead source on website requests
-- Run once against an existing database:
--   npx wrangler d1 execute fastfixit-requests --remote --file=migrations/003-source.sql

ALTER TABLE repair_requests ADD COLUMN source TEXT;
ALTER TABLE repair_requests ADD COLUMN source_detail TEXT;