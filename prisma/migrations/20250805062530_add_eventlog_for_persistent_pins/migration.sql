-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PIN_CREATED', 'PIN_UPDATED', 'PIN_DELETED', 'COMMENT_ADDED', 'COMMENT_EDITED', 'COMMENT_DELETED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateTable
CREATE TABLE "widget_feedback" (
    "id" TEXT NOT NULL,
    "test_group_id" TEXT NOT NULL,
    "submitted_by" TEXT,
    "url" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "emoji" TEXT,
    "severity" TEXT,
    "comment" TEXT,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'LOW',
    "response" TEXT,
    "responder_id" TEXT,
    "response_time" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widget_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_comments" (
    "id" TEXT NOT NULL,
    "feedback_id" TEXT NOT NULL,
    "author_id" TEXT,
    "content" TEXT NOT NULL,
    "authorType" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "pinId" TEXT,
    "userId" TEXT,
    "pageUrl" TEXT,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "emoji" TEXT,
    "severity" "Severity",
    "comment" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "widget_feedback_test_group_id_idx" ON "widget_feedback"("test_group_id");

-- CreateIndex
CREATE INDEX "widget_feedback_submitted_by_idx" ON "widget_feedback"("submitted_by");

-- CreateIndex
CREATE INDEX "widget_feedback_status_idx" ON "widget_feedback"("status");

-- CreateIndex
CREATE INDEX "feedback_comments_feedback_id_idx" ON "feedback_comments"("feedback_id");

-- CreateIndex
CREATE INDEX "feedback_comments_author_id_idx" ON "feedback_comments"("author_id");

-- AddForeignKey
ALTER TABLE "widget_feedback" ADD CONSTRAINT "widget_feedback_test_group_id_fkey" FOREIGN KEY ("test_group_id") REFERENCES "test_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widget_feedback" ADD CONSTRAINT "widget_feedback_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_comments" ADD CONSTRAINT "feedback_comments_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "widget_feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_comments" ADD CONSTRAINT "feedback_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
