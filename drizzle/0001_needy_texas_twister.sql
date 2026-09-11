ALTER TABLE "disputes" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "disputes" ALTER COLUMN "status" SET DEFAULT 'OPEN'::text;--> statement-breakpoint
DROP TYPE "public"."dispute_status";--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('RECEIVED', 'PROCESSING', 'EVIDENCE_READY', 'AI_ANALYZED', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED', 'SUBMITTED', 'RESOLVED', 'FAILED', 'OPEN', 'EVIDENCE_COLLECTING', 'PENDING_APPROVAL', 'WON', 'LOST', 'EXPIRED');--> statement-breakpoint
ALTER TABLE "disputes" ALTER COLUMN "status" SET DEFAULT 'OPEN'::"public"."dispute_status";--> statement-breakpoint
ALTER TABLE "disputes" ALTER COLUMN "status" SET DATA TYPE "public"."dispute_status" USING "status"::"public"."dispute_status";