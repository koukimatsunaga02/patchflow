CREATE TABLE `presence` (
	`key` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`client_id` text NOT NULL,
	`data` text NOT NULL,
	`updated_at` integer NOT NULL
);
