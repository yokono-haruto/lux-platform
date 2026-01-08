import { eq, or, and, like, gte, lte } from "drizzle-orm";
import { syncUser, syncAppointment, syncBid, logActivity, logError } from "./sheets";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { 
  InsertUser, users, appointments, bids, invoices, invoiceItems, 
  Appointment, Bid, Invoice, InvoiceItem, InsertAppointment,
  notifications, messages, Notification, Message, InsertNotification, InsertMessage
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { randomBytes } from 'crypto';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    try {
      _db = drizzle(new (await import("better-sqlite3")).default("local.db"));
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

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: {
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  companyName?: string;
  companyPhone?: string;
  companyIndustry?: string;
  isActive: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `local-${data.email}-${randomBytes(8).toString('hex')}`;
  const result = await db.insert(users).values({
    openId,
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    role: data.role as any,
    companyName: data.companyName,
    companyPhone: data.companyPhone,
    companyIndustry: data.companyIndustry,
    isActive: data.isActive,
    loginMethod: 'email',
  });
  const userId = Number(result.lastInsertRowid);
  const rows = await db.select().from(users).where(eq(users.id, userId));
  const user = rows[0];
  
  // スプレッドシートに同期
  try {
    await syncUser({
      id: user.id,
      email: user.email || '',
      name: user.name || '',
      role: user.role,
      openId: user.openId,
      companyName: user.companyName || '',
      isActive: user.isActive ?? true,
    }, 'create');
  } catch (e) {
    console.error('[Sheets] ユーザー同期エラー:', e);
  }
  
  return user;
}

export async function updateUser(userId: number, data: Partial<InsertUser>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function deleteUser(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

export async function deactivateUser(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isActive: false }).where(eq(users.id, userId));
}

export async function activateUser(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isActive: true }).where(eq(users.id, userId));
}

// Appointments
export async function createAppointment(data: InsertAppointment): Promise<Appointment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // createdAtを明示的に現在時刻で設定（Dateオブジェクト）
  const dataWithTimestamp = {
    ...data,
    createdAt: new Date(),
  };
  const result = await db.insert(appointments).values(dataWithTimestamp);
  const appointmentId = Number(result.lastInsertRowid);
  const rows = await db.select().from(appointments).where(eq(appointments.id, appointmentId));
  const appointment = rows[0];
  
  // スプレッドシートに同期
  try {
    await syncAppointment({
      id: appointment.id,
      title: appointment.title,
      industry: appointment.industry,
      scale: appointment.scale,
      area: appointment.area,
      bidPrice: appointment.bidPrice || 0,
      monthlyAmount: appointment.monthlyAmount || 0,
      status: appointment.status,
      description: appointment.description || '',
    }, 'create');
  } catch (e) {
    console.error('[Sheets] 案件同期エラー:', e);
  }
  
  return appointment;
}

export async function getAppointments(filters: { 
  industry?: string; 
  scale?: string; 
  area?: string; 
  status?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let conditions = [];
  if (filters.industry) conditions.push(eq(appointments.industry, filters.industry));
  if (filters.scale) conditions.push(eq(appointments.scale, filters.scale));
  if (filters.area) conditions.push(eq(appointments.area, filters.area));
  if (filters.status) conditions.push(eq(appointments.status, filters.status));
  if (filters.search) conditions.push(like(appointments.title, `%${filters.search}%`));
  if (filters.minPrice !== undefined) conditions.push(gte(appointments.price, filters.minPrice));
  if (filters.maxPrice !== undefined) conditions.push(lte(appointments.price, filters.maxPrice));

  let query = db.select().from(appointments);
  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function getAllAppointments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appointments);
}

export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAppointment(id: number, data: Partial<InsertAppointment>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(appointments).set(data).where(eq(appointments.id, id));
}

export async function deleteAppointment(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(appointments).where(eq(appointments.id, id));
}

// Bids
export async function createBid(data: { appointmentId: number; bidderId: number; bidAmount: string; notes?: string }): Promise<Bid> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // createdAtを明示的に現在時刻で設定（Dateオブジェクト）
  const dataWithTimestamp = {
    ...data,
    createdAt: new Date(),
  };
  const result = await db.insert(bids).values(dataWithTimestamp);
  const bidId = Number(result.lastInsertRowid);
  const rows = await db.select().from(bids).where(eq(bids.id, bidId));
  const bid = rows[0];
  
  // スプレッドシートに同期
  try {
    await syncBid({
      id: bid.id,
      appointmentId: bid.appointmentId,
      bidderId: bid.bidderId,
      amount: parseFloat(bid.bidAmount) || 0,
      status: bid.status || 'pending',
      message: bid.notes || '',
    }, 'create');
  } catch (e) {
    console.error('[Sheets] 入札同期エラー:', e);
  }
  
  return bid;
}

export async function getBidsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bids).where(eq(bids.bidderId, userId));
}

export async function getAllBids() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bids);
}

export async function updateBidStatus(bidId: number, status: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(bids).set({ status }).where(eq(bids.id, bidId));
}

// Notifications
export async function createNotification(data: InsertNotification): Promise<Notification> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // createdAtを明示的に現在時刻で設定（Dateオブジェクト）
  const result = await db.insert(notifications).values({
    ...data,
    createdAt: new Date()
  });
  const id = Number(result.lastInsertRowid);
  const rows = await db.select().from(notifications).where(eq(notifications.id, id));
  return rows[0];
}

export async function getNotificationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(notifications.createdAt);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// Messages
export async function createMessage(data: InsertMessage): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // createdAtを明示的に現在時刻で設定（Dateオブジェクト）
  const result = await db.insert(messages).values({
    ...data,
    createdAt: new Date()
  });
  const id = Number(result.lastInsertRowid);
  const rows = await db.select().from(messages).where(eq(messages.id, id));
  return rows[0];
}

export async function getConversation(userId1: number, userId2: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(
    or(
      and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
      and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
    )
  ).orderBy(messages.createdAt);
}

export async function getUserMessages(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(
    or(eq(messages.senderId, userId), eq(messages.receiverId, userId))
  ).orderBy(messages.createdAt);
}

export async function markMessagesAsRead(senderId: number, receiverId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(messages).set({ isRead: true }).where(
    and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId))
  );
}


// Update user's last signed in timestamp
export async function updateUserLastSignedIn(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

// Update user's password
export async function updateUserPassword(userId: number, newPasswordHash: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, userId));
}
