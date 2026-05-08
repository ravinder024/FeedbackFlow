-- Part 0 foundation cleanup
-- Remove pin-related structures, remove coordinate columns, and add base Event model.

-- Drop foreign keys first if they exist.
ALTER TABLE IF EXISTS "comments" DROP CONSTRAINT IF EXISTS "comments_pin_id_fkey";
ALTER TABLE IF EXISTS "comments" DROP CONSTRAINT IF EXISTS "comments_user_id_fkey";
ALTER TABLE IF EXISTS "pins" DROP CONSTRAINT IF EXISTS "pins_user_id_fkey";

-- Drop pin tables.
DROP TABLE IF EXISTS "comments";
DROP TABLE IF EXISTS "pins";

-- Drop obsolete enum if present.
DROP TYPE IF EXISTS "PinStatus";

-- Remove legacy event_logs pin reference.
DROP INDEX IF EXISTS "event_logs_pinId_idx";
ALTER TABLE IF EXISTS "event_logs" DROP COLUMN IF EXISTS "pinId";

-- Remove coordinate storage from widget feedback.
ALTER TABLE IF EXISTS "widget_feedback" DROP COLUMN IF EXISTS "x";
ALTER TABLE IF EXISTS "widget_feedback" DROP COLUMN IF EXISTS "y";

-- Add generic events table.
CREATE TABLE IF NOT EXISTS "events" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "element" TEXT,
  "page" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "events_type_idx" ON "events"("type");
CREATE INDEX IF NOT EXISTS "events_page_idx" ON "events"("page");
CREATE INDEX IF NOT EXISTS "events_timestamp_idx" ON "events"("timestamp");
