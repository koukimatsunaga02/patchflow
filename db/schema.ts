import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{id:text('id').primaryKey(),editHash:text('edit_hash').notNull(),revision:integer('revision').notNull().default(1),data:text('data').notNull(),updatedAt:integer('updated_at').notNull()});
export const presence=sqliteTable('presence',{key:text('key').primaryKey(),roomId:text('room_id').notNull(),clientId:text('client_id').notNull(),data:text('data').notNull(),updatedAt:integer('updated_at').notNull()},t=>[index('presence_room_updated').on(t.roomId,t.updatedAt)]);
