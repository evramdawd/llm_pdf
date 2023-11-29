import {pgTable, serial, text, timestamp, varchar, integer, pgEnum} from 'drizzle-orm/pg-core';

// Table Schema Definitions below:

// Create enum for the role column in the messages table (i.e. user or system/LLM - 2 options in the chat)
export const userSystemEnum = pgEnum('user_system_enum', ['system', 'user']);

// Each chat will be 1 row in DB & will contain name of PDF, url to PDF, userId, and the actual conversation
export const chats = pgTable('chats', {
  id: serial('id').primaryKey(),
  pdfName: text('pdf_name').notNull(),
  pdfUrl: text('pdf_url').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  userId: varchar('user_id', {length: 256}).notNull(),
  fileKey: text('file_key').notNull(),
})

export type DrizzleChat = typeof chats.$inferSelect; // Dope way to get the type of the Chats schema above (exporting to ChatSideBar component)

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  // each message belongs to a chat. This is how we form the 1:many relationship
  // references(takes a call back - foreign key back to chats table, id column)
  chatId: integer('chat_id').references(() => chats.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  role: userSystemEnum('role').notNull()
})

// drizzle-orm: what interacts with our DB
// drizzle-kit: provides us w utility functions to create migrations and to ensure DB is synced up with the schema above
