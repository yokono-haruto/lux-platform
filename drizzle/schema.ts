import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").unique(),
  name: text("name"),
  email: text("email").unique(),
  loginMethod: text("loginMethod"),
  passwordHash: text("passwordHash"),
  role: text("role").default("user").notNull(),
  companyName: text("companyName"),
  companyPhone: text("companyPhone"),
  companyIndustry: text("companyIndustry"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdBy: integer("createdBy").notNull(),
  title: text("title").notNull(),
  industry: text("industry").notNull(),
  scale: text("scale").notNull(),
  area: text("area").notNull(),
  price: integer("price").default(0).notNull(), // 入札設定価格
  monthlyAmount: integer("monthlyAmount").default(0).notNull(), // 月額料金/使用量
  description: text("description"),
  status: text("status").default("active").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

export const bids = sqliteTable("bids", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  appointmentId: integer("appointmentId").notNull(),
  bidderId: integer("bidderId").notNull(),
  bidAmount: text("bidAmount").notNull(),
  status: text("status").default("pending").notNull(),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type Bid = typeof bids.$inferSelect;
export type InsertBid = typeof bids.$inferInsert;

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  month: text("month").notNull(),
  totalAmount: text("totalAmount").notNull(),
  status: text("status").default("draft").notNull(),
  pdfUrl: text("pdfUrl"),
  pdfKey: text("pdfKey"),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

export const invoiceItems = sqliteTable("invoiceItems", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoiceId").notNull(),
  bidId: integer("bidId").notNull(),
  appointmentTitle: text("appointmentTitle").notNull(),
  bidderCompanyName: text("bidderCompanyName").notNull(),
  amount: text("amount").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  type: text("type").notNull(), // 'bid', 'appointment', 'message', 'system'
  title: text("title").notNull(),
  content: text("content").notNull(),
  isRead: integer("isRead", { mode: "boolean" }).default(false).notNull(),
  link: text("link"),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  senderId: integer("senderId").notNull(),
  receiverId: integer("receiverId").notNull(),
  appointmentId: integer("appointmentId"),
  content: text("content").notNull(),
  isRead: integer("isRead", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  creator: one(users, {
    fields: [appointments.createdBy],
    references: [users.id],
  }),
  bids: many(bids),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  appointment: one(appointments, {
    fields: [bids.appointmentId],
    references: [appointments.id],
  }),
  bidder: one(users, {
    fields: [bids.bidderId],
    references: [users.id],
  }),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  bid: one(bids, {
    fields: [invoiceItems.bidId],
    references: [bids.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ many }) => ({
  items: many(invoiceItems),
}));
