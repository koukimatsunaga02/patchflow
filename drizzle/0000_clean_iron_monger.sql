CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`edit_hash` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`data` text NOT NULL,
	`updated_at` integer NOT NULL
);
