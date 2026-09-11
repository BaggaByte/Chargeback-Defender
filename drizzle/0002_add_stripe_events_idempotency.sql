CREATE TABLE "stripe_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'processing' NOT NULL,
	"error" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
