import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { InsertUser, users, appointments, bids, invoices, invoiceItems, Appointment, Bid, Invoice, InvoiceItem, InsertAppointment } from "../drizzle/schema";
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
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

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
  companyAddress?: string;
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
    companyAddress: data.companyAddress,
    companyPhone: data.companyPhone,
    companyIndustry: data.companyIndustry,
    isActive: data.isActive,
    loginMethod: 'email',
  });
  
  const userId = Number(result.lastInsertRowid);
  const rows = await db.select().from(users).where(eq(users.id, userId));
  return rows[0];
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function updateUserLastSignedIn(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function updateUser(userId: number, data: Partial<InsertUser>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set(data).where(eq(users.id, userId));
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

  const result = await db.insert(appointments).values(data);
  const appointmentId = Number(result.lastInsertRowid);
  const rows = await db.select().from(appointments).where(eq(appointments.id, appointmentId));
  return rows[0];
}

export async function getAppointments(filters: { industry?: string; scale?: string; area?: string; status?: string }) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(appointments);
  // 簡易的なフィルタリング（実際には条件を動的に追加する必要がありますが、ここでは基本実装）
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

// Bids
export async function createBid(data: { appointmentId: number; bidderId: number; bidAmount: string; notes?: string }): Promise<Bid> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(bids).values(data);
  const bidId = Number(result.lastInsertRowid);
  const rows = await db.select().from(bids).where(eq(bids.id, bidId));
  return rows[0];
}

export async function getBidsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(bids).where(eq(bids.bidderId, userId));
}

export async function getBidsByAppointmentId(appointmentId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(bids).where(eq(bids.appointmentId, appointmentId));
}

export async function getBidById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(bids).where(eq(bids.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBid(id: number, data: Partial<{ status: string; notes?: string }>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(bids).set(data).where(eq(bids.id, id));
}

// Invoices
export async function createInvoice(data: { month: string; totalAmount: string; status?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(invoices).values(data);
  const invoiceId = Number(result.lastInsertRowid);
  const rows = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  return rows[0];
}

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateInvoice(id: number, data: Partial<{ status: string }>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(invoices).set(data).where(eq(invoices.id, id));
}

export async function getAllInvoices() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(invoices);
}
