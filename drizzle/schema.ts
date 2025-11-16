import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extended with Stripe billing fields for subscription management.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Stripe billing fields
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  stripeCurrentPeriodEnd: timestamp("stripeCurrentPeriodEnd"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Agent types: Travel Agent or Hotel Concierge Bot
 */
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the agent
  name: varchar("name", { length: 255 }).notNull(),
  agentType: mysqlEnum("agentType", ["travelAgent", "hotelBot"]).notNull(),
  
  // Optional branding fields
  hotelName: varchar("hotelName", { length: 255 }),
  agencyName: varchar("agencyName", { length: 255 }),
  
  // Agent configuration
  description: text("description"),
  personality: text("personality"), // e.g., "Friendly and professional concierge"
  tone: varchar("tone", { length: 255 }).default("friendly and professional").notNull(),
  avatarUrl: text("avatarUrl"),
  systemPrompt: text("systemPrompt").notNull(),
  defaultLanguage: varchar("defaultLanguage", { length: 10 }).default("en").notNull(),
  
  // Allowed tools (stored as JSON array)
  allowedTools: json("allowedTools").$type<string[]>(),
  
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Knowledge Base: Each agent can have multiple knowledge bases
 */
export const knowledgeBases = mysqlTable("knowledgeBases", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBases.$inferInsert;

/**
 * Knowledge Items: Individual pieces of knowledge within a knowledge base
 */
export const knowledgeItems = mysqlTable("knowledgeItems", {
  id: int("id").autoincrement().primaryKey(),
  knowledgeBaseId: int("knowledgeBaseId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeItem = typeof knowledgeItems.$inferSelect;
export type InsertKnowledgeItem = typeof knowledgeItems.$inferInsert;

/**
 * Conversations: Chat sessions between end users and agents
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  sessionId: varchar("sessionId", { length: 255 }).notNull().unique(), // For anonymous users
  userId: int("userId"), // Optional: for logged-in users
  title: varchar("title", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages: Individual messages within a conversation
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(), // For tool calls, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Bookings: Mock booking records created through the chat interface
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  agentId: int("agentId").notNull(),
  
  // Booking details
  bookingType: mysqlEnum("bookingType", ["hotel", "flight", "package"]).notNull(),
  hotelName: varchar("hotelName", { length: 255 }),
  checkInDate: timestamp("checkInDate"),
  checkOutDate: timestamp("checkOutDate"),
  guestCount: int("guestCount"),
  roomType: varchar("roomType", { length: 255 }),
  
  // Pricing
  totalPrice: int("totalPrice").notNull(), // Stored in cents
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  
  // Status
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled"]).default("pending").notNull(),
  
  // Additional data
  bookingData: json("bookingData").$type<Record<string, unknown>>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  agents: many(agents),
  conversations: many(conversations),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  owner: one(users, {
    fields: [agents.userId],
    references: [users.id],
  }),
  knowledgeBases: many(knowledgeBases),
  conversations: many(conversations),
  bookings: many(bookings),
}));

export const knowledgeBasesRelations = relations(knowledgeBases, ({ one, many }) => ({
  agent: one(agents, {
    fields: [knowledgeBases.agentId],
    references: [agents.id],
  }),
  items: many(knowledgeItems),
}));

export const knowledgeItemsRelations = relations(knowledgeItems, ({ one }) => ({
  knowledgeBase: one(knowledgeBases, {
    fields: [knowledgeItems.knowledgeBaseId],
    references: [knowledgeBases.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  agent: one(agents, {
    fields: [conversations.agentId],
    references: [agents.id],
  }),
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
  bookings: many(bookings),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  conversation: one(conversations, {
    fields: [bookings.conversationId],
    references: [conversations.id],
  }),
  agent: one(agents, {
    fields: [bookings.agentId],
    references: [agents.id],
  }),
}));