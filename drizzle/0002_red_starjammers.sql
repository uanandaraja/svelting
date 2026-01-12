ALTER TABLE "conversation" ALTER COLUMN "system_prompt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "conversation" ALTER COLUMN "model" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "active_stream_id" text;