-- AlterTable
ALTER TABLE "events" ADD COLUMN     "session_id" TEXT;

-- CreateIndex
CREATE INDEX "events_session_id_idx" ON "events"("session_id");
