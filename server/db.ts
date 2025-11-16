import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  agents, 
  InsertAgent, 
  Agent,
  knowledgeBases,
  InsertKnowledgeBase,
  KnowledgeBase,
  knowledgeItems,
  InsertKnowledgeItem,
  KnowledgeItem,
  conversations,
  InsertConversation,
  Conversation,
  messages,
  InsertMessage,
  Message,
  bookings,
  InsertBooking,
  Booking
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== Agent Management =====

export async function createAgent(agent: InsertAgent): Promise<Agent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(agents).values(agent);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(agents).where(eq(agents.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getAgentById(id: number): Promise<Agent | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result[0];
}

export async function getAgentsByUserId(userId: number): Promise<Agent[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(agents).where(eq(agents.userId, userId)).orderBy(desc(agents.createdAt));
}

export async function getAllAgents(): Promise<Agent[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(agents).orderBy(desc(agents.createdAt));
}

export async function updateAgent(id: number, updates: Partial<InsertAgent>): Promise<Agent | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(agents).set(updates).where(eq(agents.id, id));
  return getAgentById(id);
}

export async function deleteAgent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(agents).where(eq(agents.id, id));
}

// ===== Knowledge Base Management =====

export async function createKnowledgeBase(kb: InsertKnowledgeBase): Promise<KnowledgeBase> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(knowledgeBases).values(kb);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(knowledgeBases).where(eq(knowledgeBases.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getKnowledgeBaseById(id: number): Promise<KnowledgeBase | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(knowledgeBases).where(eq(knowledgeBases.id, id)).limit(1);
  return result[0];
}

export async function getKnowledgeBasesByAgentId(agentId: number): Promise<KnowledgeBase[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(knowledgeBases).where(eq(knowledgeBases.agentId, agentId)).orderBy(desc(knowledgeBases.createdAt));
}

export async function updateKnowledgeBase(id: number, updates: Partial<InsertKnowledgeBase>): Promise<KnowledgeBase | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(knowledgeBases).set(updates).where(eq(knowledgeBases.id, id));
  return getKnowledgeBaseById(id);
}

export async function deleteKnowledgeBase(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(knowledgeBases).where(eq(knowledgeBases.id, id));
}

// ===== Knowledge Item Management =====

export async function createKnowledgeItem(item: InsertKnowledgeItem): Promise<KnowledgeItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(knowledgeItems).values(item);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(knowledgeItems).where(eq(knowledgeItems.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getKnowledgeItemById(id: number): Promise<KnowledgeItem | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(knowledgeItems).where(eq(knowledgeItems.id, id)).limit(1);
  return result[0];
}

export async function getKnowledgeItemsByKnowledgeBaseId(knowledgeBaseId: number): Promise<KnowledgeItem[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(knowledgeItems).where(eq(knowledgeItems.knowledgeBaseId, knowledgeBaseId)).orderBy(desc(knowledgeItems.createdAt));
}

export async function updateKnowledgeItem(id: number, updates: Partial<InsertKnowledgeItem>): Promise<KnowledgeItem | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(knowledgeItems).set(updates).where(eq(knowledgeItems.id, id));
  return getKnowledgeItemById(id);
}

export async function deleteKnowledgeItem(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(knowledgeItems).where(eq(knowledgeItems.id, id));
}

// ===== Conversation Management =====

export async function createConversation(conv: InsertConversation): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(conversations).values(conv);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(conversations).where(eq(conversations.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getConversationById(id: number): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result[0];
}

export async function getConversationBySessionId(sessionId: string): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(conversations).where(eq(conversations.sessionId, sessionId)).limit(1);
  return result[0];
}

export async function getConversationsByAgentId(agentId: number): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(conversations).where(eq(conversations.agentId, agentId)).orderBy(desc(conversations.updatedAt));
}

// ===== Message Management =====

export async function createMessage(msg: InsertMessage): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values(msg);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(messages).where(eq(messages.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getMessagesByConversationId(conversationId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}

// ===== Booking Management =====

export async function createBooking(booking: InsertBooking): Promise<Booking> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(bookings).values(booking);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(bookings).where(eq(bookings.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getBookingsByConversationId(conversationId: number): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(bookings).where(eq(bookings.conversationId, conversationId)).orderBy(desc(bookings.createdAt));
}

export async function updateBookingStatus(id: number, status: "pending" | "confirmed" | "cancelled"): Promise<Booking | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(bookings).set({ status }).where(eq(bookings.id, id));
  
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0];
}

export async function getAllBookings(): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(bookings).orderBy(desc(bookings.createdAt));
}

export async function getBookingById(id: number): Promise<Booking | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0];
}
