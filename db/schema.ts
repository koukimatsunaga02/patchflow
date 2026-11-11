import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{id:text('id').primaryKey(),editHash:text('edit_hash').notNull(),revision:integer('revision').notNull().default(1),data:text('data').notNull(),updatedAt:integer('updated_at').notNull()});
