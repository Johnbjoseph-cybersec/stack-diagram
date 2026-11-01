CREATE TABLE "reporter_strikes" (
	"reporter_hash" text PRIMARY KEY NOT NULL,
	"strikes" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"stack_id" text NOT NULL,
	"reporter_hash" text NOT NULL,
	"ip_hash" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_stack_id_reporter_hash_pk" PRIMARY KEY("stack_id","reporter_hash")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stacks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"stack" jsonb NOT NULL,
	"stack_keys" text[] NOT NULL,
	"name" text NOT NULL,
	"github_login" text,
	"github_id" text,
	"status" text NOT NULL,
	"scores" jsonb,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"reports" integer DEFAULT 0 NOT NULL,
	"delete_key_hash" text NOT NULL,
	"ip_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "used_challenges" (
	"hash" text PRIMARY KEY NOT NULL,
	"ip_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"stack_id" text NOT NULL,
	"voter_hash" text NOT NULL,
	"ip_hash" text NOT NULL,
	"value" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "votes_stack_id_voter_hash_pk" PRIMARY KEY("stack_id","voter_hash")
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_stack_id_stacks_id_fk" FOREIGN KEY ("stack_id") REFERENCES "public"."stacks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_stack_id_stacks_id_fk" FOREIGN KEY ("stack_id") REFERENCES "public"."stacks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reports_reporter_created_idx" ON "reports" USING btree ("reporter_hash","created_at");--> statement-breakpoint
CREATE INDEX "reports_ip_created_idx" ON "reports" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "stacks_status_created_idx" ON "stacks" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "stacks_status_score_idx" ON "stacks" USING btree ("status","score");--> statement-breakpoint
CREATE INDEX "stacks_github_id_idx" ON "stacks" USING btree ("github_id");--> statement-breakpoint
CREATE INDEX "stacks_stack_keys_idx" ON "stacks" USING gin ("stack_keys");--> statement-breakpoint
CREATE INDEX "stacks_stack_idx" ON "stacks" USING gin ("stack" jsonb_path_ops);--> statement-breakpoint
CREATE INDEX "used_challenges_created_at_idx" ON "used_challenges" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "votes_voter_created_idx" ON "votes" USING btree ("voter_hash","created_at");--> statement-breakpoint
CREATE INDEX "votes_ip_created_idx" ON "votes" USING btree ("ip_hash","created_at");