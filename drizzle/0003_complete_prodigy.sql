ALTER TABLE `rooms` ADD `owner_id` text;--> statement-breakpoint
ALTER TABLE `rooms` ADD `visibility` text DEFAULT 'link' NOT NULL;--> statement-breakpoint
ALTER TABLE `rooms` ADD `token_cipher` text;--> statement-breakpoint
ALTER TABLE `rooms` ADD `archived_at` integer;--> statement-breakpoint
ALTER TABLE `rooms` ADD `created_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `rooms_owner_updated` ON `rooms` (`owner_id`,`updated_at`);