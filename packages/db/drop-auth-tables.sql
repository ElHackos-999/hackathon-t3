-- Drop auth tables manually
-- Run this with: psql $POSTGRES_URL -f drop-auth-tables.sql

DROP TABLE IF EXISTS "account" CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "verification" CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
