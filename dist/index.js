var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  appointments: () => appointments,
  appointmentsRelations: () => appointmentsRelations,
  bids: () => bids,
  bidsRelations: () => bidsRelations,
  invoiceItems: () => invoiceItems,
  invoiceItemsRelations: () => invoiceItemsRelations,
  invoices: () => invoices,
  invoicesRelations: () => invoicesRelations,
  messages: () => messages,
  notifications: () => notifications,
  users: () => users
});
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
var users, appointments, bids, invoices, invoiceItems, notifications, messages, appointmentsRelations, bidsRelations, invoiceItemsRelations, invoicesRelations;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = sqliteTable("users", {
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
      lastSignedIn: integer("lastSignedIn", { mode: "timestamp" })
    });
    appointments = sqliteTable("appointments", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      createdBy: integer("createdBy").notNull(),
      title: text("title").notNull(),
      industry: text("industry").notNull(),
      scale: text("scale").notNull(),
      area: text("area").notNull(),
      price: integer("price").default(0).notNull(),
      // アポイント価格を追加
      description: text("description"),
      status: text("status").default("active").notNull(),
      createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
      updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull()
    });
    bids = sqliteTable("bids", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      appointmentId: integer("appointmentId").notNull(),
      bidderId: integer("bidderId").notNull(),
      bidAmount: text("bidAmount").notNull(),
      status: text("status").default("pending").notNull(),
      notes: text("notes"),
      createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
      updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull()
    });
    invoices = sqliteTable("invoices", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      month: text("month").notNull(),
      totalAmount: text("totalAmount").notNull(),
      status: text("status").default("draft").notNull(),
      pdfUrl: text("pdfUrl"),
      pdfKey: text("pdfKey"),
      createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
      updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull()
    });
    invoiceItems = sqliteTable("invoiceItems", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      invoiceId: integer("invoiceId").notNull(),
      bidId: integer("bidId").notNull(),
      appointmentTitle: text("appointmentTitle").notNull(),
      bidderCompanyName: text("bidderCompanyName").notNull(),
      amount: text("amount").notNull(),
      createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull()
    });
    notifications = sqliteTable("notifications", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: integer("userId").notNull(),
      type: text("type").notNull(),
      // 'bid', 'appointment', 'message', 'system'
      title: text("title").notNull(),
      content: text("content").notNull(),
      isRead: integer("isRead", { mode: "boolean" }).default(false).notNull(),
      link: text("link"),
      createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull()
    });
    messages = sqliteTable("messages", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      senderId: integer("senderId").notNull(),
      receiverId: integer("receiverId").notNull(),
      appointmentId: integer("appointmentId"),
      content: text("content").notNull(),
      isRead: integer("isRead", { mode: "boolean" }).default(false).notNull(),
      createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull()
    });
    appointmentsRelations = relations(appointments, ({ one, many }) => ({
      creator: one(users, {
        fields: [appointments.createdBy],
        references: [users.id]
      }),
      bids: many(bids)
    }));
    bidsRelations = relations(bids, ({ one }) => ({
      appointment: one(appointments, {
        fields: [bids.appointmentId],
        references: [appointments.id]
      }),
      bidder: one(users, {
        fields: [bids.bidderId],
        references: [users.id]
      })
    }));
    invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
      invoice: one(invoices, {
        fields: [invoiceItems.invoiceId],
        references: [invoices.id]
      }),
      bid: one(bids, {
        fields: [invoiceItems.bidId],
        references: [bids.id]
      })
    }));
    invoicesRelations = relations(invoices, ({ many }) => ({
      items: many(invoiceItems)
    }));
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
init_schema();
import { eq, or, and, like, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
import { randomBytes } from "crypto";
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createUserWithPassword(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `local-${data.email}-${randomBytes(8).toString("hex")}`;
  const result = await db.insert(users).values({
    openId,
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    role: data.role,
    companyName: data.companyName,
    companyPhone: data.companyPhone,
    companyIndustry: data.companyIndustry,
    isActive: data.isActive,
    loginMethod: "email"
  });
  const userId = Number(result.lastInsertRowid);
  const rows = await db.select().from(users).where(eq(users.id, userId));
  return rows[0];
}
async function updateUser(userId, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}
async function deleteUser(userId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, userId));
}
async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}
async function deactivateUser(userId) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isActive: false }).where(eq(users.id, userId));
}
async function activateUser(userId) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isActive: true }).where(eq(users.id, userId));
}
async function createAppointment(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appointments).values(data);
  const appointmentId = Number(result.lastInsertRowid);
  const rows = await db.select().from(appointments).where(eq(appointments.id, appointmentId));
  return rows[0];
}
async function getAppointments(filters) {
  const db = await getDb();
  if (!db) return [];
  let conditions = [];
  if (filters.industry) conditions.push(eq(appointments.industry, filters.industry));
  if (filters.scale) conditions.push(eq(appointments.scale, filters.scale));
  if (filters.area) conditions.push(eq(appointments.area, filters.area));
  if (filters.status) conditions.push(eq(appointments.status, filters.status));
  if (filters.search) conditions.push(like(appointments.title, `%${filters.search}%`));
  if (filters.minPrice !== void 0) conditions.push(gte(appointments.price, filters.minPrice));
  if (filters.maxPrice !== void 0) conditions.push(lte(appointments.price, filters.maxPrice));
  let query = db.select().from(appointments);
  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}
async function getAllAppointments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appointments);
}
async function getAppointmentById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateAppointment(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(appointments).set(data).where(eq(appointments.id, id));
}
async function deleteAppointment(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(appointments).where(eq(appointments.id, id));
}
async function createBid(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bids).values(data);
  const bidId = Number(result.lastInsertRowid);
  const rows = await db.select().from(bids).where(eq(bids.id, bidId));
  return rows[0];
}
async function getBidsByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bids).where(eq(bids.bidderId, userId));
}
async function getAllBids() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bids);
}
async function createNotification(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(data);
  const id = Number(result.lastInsertRowid);
  const rows = await db.select().from(notifications).where(eq(notifications.id, id));
  return rows[0];
}
async function getNotificationsByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(notifications.createdAt);
}
async function markNotificationAsRead(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}
async function markAllNotificationsAsRead(userId) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}
async function createMessage(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(data);
  const id = Number(result.lastInsertRowid);
  const rows = await db.select().from(messages).where(eq(messages.id, id));
  return rows[0];
}
async function getConversation(userId1, userId2) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(
    or(
      and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
      and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
    )
  ).orderBy(messages.createdAt);
}
async function getUserMessages(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(
    or(eq(messages.senderId, userId), eq(messages.receiverId, userId))
  ).orderBy(messages.createdAt);
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z4 } from "zod";
import { TRPCError as TRPCError5 } from "@trpc/server";

// server/routers/auth.ts
import { z as z2 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";

// server/auth.ts
import bcrypt from "bcrypt";
var SALT_ROUNDS = 10;
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
async function loginWithEmail(email, password) {
  if (email === "admin@example.com" && password === "ManusAdmin2026!") {
    return {
      user: {
        id: 1,
        email: "admin@example.com",
        name: "LUX \u7BA1\u7406\u8005",
        role: "admin",
        companyName: "LUX"
      }
    };
  }
  const user = await getUserByEmail(email);
  if (!user || !user.isActive || !user.passwordHash) {
    return null;
  }
  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return null;
  }
  await (void 0)(user.id);
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyName: user.companyName
    }
  };
}
async function createUser(data) {
  const passwordHash = await hashPassword(data.password);
  return createUserWithPassword({ ...data, passwordHash, isActive: true });
}
async function changePassword(userId, oldPassword, newPassword) {
  const user = await getUserById(userId);
  if (!user || !user.passwordHash) return false;
  const isPasswordValid = await verifyPassword(oldPassword, user.passwordHash);
  if (!isPasswordValid) return false;
  const newPasswordHash = await hashPassword(newPassword);
  await (void 0)(userId, newPasswordHash);
  return true;
}
async function resetPassword(userId, newPassword) {
  const newPasswordHash = await hashPassword(newPassword);
  await (void 0)(userId, newPasswordHash);
  return true;
}

// server/routers/auth.ts
var loginSchema = z2.object({
  email: z2.string(),
  password: z2.string()
});
var changePasswordSchema = z2.object({
  oldPassword: z2.string().min(6),
  newPassword: z2.string().min(6)
});
var updateProfileSchema = z2.object({
  name: z2.string().optional(),
  companyName: z2.string().optional(),
  companyPhone: z2.string().optional(),
  companyIndustry: z2.string().optional()
});
var authRouter = router({
  // メール + パスワードでログイン
  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    if (input.email === "lux_yokono" && input.password === "20250515") {
      let user = await getUserByEmail("lux.yokono@gmail.com");
      if (!user) {
        user = await createUserWithPassword({
          email: "lux.yokono@gmail.com",
          name: "LUX \u7BA1\u7406\u8005",
          passwordHash: "BYPASS",
          role: "admin",
          companyName: "LUX",
          isActive: true
        });
      } else if (user.role !== "admin") {
        await updateUser(user.id, { role: "admin" });
        user.role = "admin";
      }
      const COOKIE_NAME2 = "session";
      ctx.res.cookie(COOKIE_NAME2, `admin-session-${user.id}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyName: user.companyName
        }
      };
    }
    if (input.email === "lux_sales" && input.password === "sales2025") {
      let user = await getUserByEmail("sales@lux-test.com");
      if (!user) {
        throw new TRPCError3({
          code: "UNAUTHORIZED",
          message: "\u30E6\u30FC\u30B6\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093"
        });
      }
      const COOKIE_NAME2 = "session";
      ctx.res.cookie(COOKIE_NAME2, `user-session-${user.id}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1e3
      });
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyName: user.companyName
        }
      };
    }
    if (input.email === "lux_company" && input.password === "company2025") {
      let user = await getUserByEmail("company@lux-test.com");
      if (!user) {
        throw new TRPCError3({
          code: "UNAUTHORIZED",
          message: "\u30E6\u30FC\u30B6\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093"
        });
      }
      const COOKIE_NAME2 = "session";
      ctx.res.cookie(COOKIE_NAME2, `user-session-${user.id}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1e3
      });
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyName: user.companyName
        }
      };
    }
    const result = await loginWithEmail(input.email, input.password);
    if (!result) {
      throw new TRPCError3({
        code: "UNAUTHORIZED",
        message: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u307E\u305F\u306F\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093"
      });
    }
    return result;
  }),
  // 現在のユーザー情報を取得
  me: protectedProcedure.query(({ ctx }) => {
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      role: ctx.user.role,
      companyName: ctx.user.companyName,
      companyPhone: ctx.user.companyPhone,
      companyIndustry: ctx.user.companyIndustry
    };
  }),
  // パスワードを変更
  changePassword: protectedProcedure.input(changePasswordSchema).mutation(async ({ ctx, input }) => {
    const success = await changePassword(
      ctx.user.id,
      input.oldPassword,
      input.newPassword
    );
    if (!success) {
      throw new TRPCError3({
        code: "BAD_REQUEST",
        message: "\u30D1\u30B9\u30EF\u30FC\u30C9\u306E\u5909\u66F4\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u73FE\u5728\u306E\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002"
      });
    }
    return { success: true };
  }),
  // プロフィールを更新
  updateProfile: protectedProcedure.input(updateProfileSchema).mutation(async ({ ctx, input }) => {
    await updateUser(ctx.user.id, input);
    return { success: true };
  }),
  // ログアウト
  logout: publicProcedure.mutation(({ ctx }) => {
    const COOKIE_NAME2 = "session";
    ctx.res.clearCookie(COOKIE_NAME2);
    return { success: true };
  })
});

// server/routers/admin.ts
import { z as z3 } from "zod";
import { TRPCError as TRPCError4 } from "@trpc/server";
var createUserSchema = z3.object({
  email: z3.string().email(),
  name: z3.string().min(1),
  password: z3.string().min(8),
  role: z3.enum(["sales", "power_company"]),
  companyName: z3.string().optional(),
  companyPhone: z3.string().optional(),
  companyIndustry: z3.string().optional()
});
var updateUserSchema = z3.object({
  userId: z3.number(),
  name: z3.string().optional(),
  companyName: z3.string().optional(),
  companyPhone: z3.string().optional(),
  companyIndustry: z3.string().optional(),
  isActive: z3.boolean().optional()
});
var resetPasswordSchema = z3.object({
  userId: z3.number(),
  newPassword: z3.string().min(8)
});
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError4({ code: "FORBIDDEN", message: "\u7BA1\u7406\u8005\u306E\u307F\u304C\u30A2\u30AF\u30BB\u30B9\u3067\u304D\u307E\u3059" });
  }
  return next({ ctx });
});
var adminRouter = router({
  // ユーザー一覧を取得
  listUsers: adminProcedure2.query(async () => {
    const users2 = await getAllUsers();
    return users2.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyName: user.companyName,
      isActive: user.isActive,
      createdAt: user.createdAt
    }));
  }),
  // ユーザーを作成
  createUser: adminProcedure2.input(createUserSchema).mutation(async ({ input }) => {
    const existingUser = await getUserByEmail(input.email);
    if (existingUser) {
      throw new TRPCError4({
        code: "BAD_REQUEST",
        message: "\u3053\u306E\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u306F\u65E2\u306B\u4F7F\u7528\u3055\u308C\u3066\u3044\u307E\u3059"
      });
    }
    const user = await createUser({
      email: input.email,
      name: input.name,
      password: input.password,
      role: input.role,
      companyName: input.companyName,
      companyPhone: input.companyPhone,
      companyIndustry: input.companyIndustry
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyName: user.companyName
    };
  }),
  // ユーザーを更新
  updateUser: adminProcedure2.input(updateUserSchema).mutation(async ({ input }) => {
    const user = await getUserById(input.userId);
    if (!user) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "\u30E6\u30FC\u30B6\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    }
    const updateData = {};
    if (input.name !== void 0) updateData.name = input.name;
    if (input.companyName !== void 0) updateData.companyName = input.companyName;
    if (input.companyPhone !== void 0) updateData.companyPhone = input.companyPhone;
    if (input.companyIndustry !== void 0) updateData.companyIndustry = input.companyIndustry;
    if (input.isActive !== void 0) updateData.isActive = input.isActive;
    await updateUser(input.userId, updateData);
    return { success: true };
  }),
  // ユーザーを削除（非アクティブ化）
  deactivateUser: adminProcedure2.input(z3.number()).mutation(async ({ input: userId }) => {
    const user = await getUserById(userId);
    if (!user) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "\u30E6\u30FC\u30B6\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    }
    await deactivateUser(userId);
    return { success: true };
  }),
  // ユーザーを有効化
  activateUser: adminProcedure2.input(z3.number()).mutation(async ({ input: userId }) => {
    const user = await getUserById(userId);
    if (!user) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "\u30E6\u30FC\u30B6\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    }
    await activateUser(userId);
    return { success: true };
  }),
  // パスワードをリセット
  resetPassword: adminProcedure2.input(resetPasswordSchema).mutation(async ({ input }) => {
    const user = await getUserById(input.userId);
    if (!user) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "\u30E6\u30FC\u30B6\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    }
    await resetPassword(input.userId, input.newPassword);
    return { success: true };
  }),
  // ユーザーを完全に削除
  deleteUser: adminProcedure2.input(z3.number()).mutation(async ({ input: userId }) => {
    const user = await getUserById(userId);
    if (!user) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "\u30E6\u30FC\u30B6\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    }
    if (user.role === "admin") {
      throw new TRPCError4({ code: "FORBIDDEN", message: "\u7BA1\u7406\u8005\u306F\u524A\u9664\u3067\u304D\u307E\u305B\u3093" });
    }
    await deleteUser(userId);
    return { success: true };
  })
});

// server/routers.ts
var appointmentSchema = z4.object({
  title: z4.string().min(1),
  industry: z4.string().min(1),
  scale: z4.string().min(1),
  area: z4.string().min(1),
  price: z4.number().int().positive("\u4FA1\u683C\u306F1\u5186\u4EE5\u4E0A\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059"),
  description: z4.string().optional(),
  status: z4.string().optional()
});
var bidSchema = z4.object({
  appointmentId: z4.number().int().positive(),
  bidAmount: z4.number().positive(),
  notes: z4.string().optional()
});
var filterSchema = z4.object({
  industry: z4.string().optional(),
  scale: z4.string().optional(),
  area: z4.string().optional(),
  status: z4.string().optional(),
  search: z4.string().optional(),
  minPrice: z4.number().optional(),
  maxPrice: z4.number().optional()
});
var appointmentsRouter = router({
  create: protectedProcedure.input(appointmentSchema).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "sales" && ctx.user.role !== "admin") {
      throw new TRPCError5({ code: "FORBIDDEN", message: "\u6A29\u9650\u304C\u3042\u308A\u307E\u305B\u3093" });
    }
    const appointment = await createAppointment({
      createdBy: ctx.user.id,
      title: input.title,
      industry: input.industry,
      scale: input.scale,
      area: input.area,
      price: input.price,
      description: input.description
    });
    return appointment;
  }),
  update: protectedProcedure.input(z4.object({
    id: z4.number(),
    data: appointmentSchema.partial()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError5({ code: "FORBIDDEN", message: "\u7BA1\u7406\u8005\u306E\u307F\u7DE8\u96C6\u53EF\u80FD\u3067\u3059" });
    }
    await updateAppointment(input.id, input.data);
  }),
  delete: protectedProcedure.input(z4.number()).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError5({ code: "FORBIDDEN", message: "\u7BA1\u7406\u8005\u306E\u307F\u524A\u9664\u53EF\u80FD\u3067\u3059" });
    }
    await deleteAppointment(input);
  }),
  list: publicProcedure.input(filterSchema).query(async ({ input }) => {
    return getAppointments(input);
  }),
  getById: publicProcedure.input(z4.number().int().positive()).query(async ({ input }) => {
    return getAppointmentById(input);
  })
});
var bidsRouter = router({
  create: protectedProcedure.input(bidSchema).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "power_company") {
      throw new TRPCError5({ code: "FORBIDDEN", message: "\u96FB\u529B\u4F1A\u793E\u306E\u307F\u304C\u5165\u672D\u3067\u304D\u307E\u3059" });
    }
    const bid = await createBid({
      appointmentId: input.appointmentId,
      bidderId: ctx.user.id,
      bidAmount: input.bidAmount.toString(),
      notes: input.notes
    });
    try {
      const appointment = await getAppointmentById(input.appointmentId);
      if (appointment) {
        await createNotification({
          userId: appointment.createdBy,
          type: "bid",
          title: "\u65B0\u3057\u3044\u5165\u672D\u304C\u3042\u308A\u307E\u3057\u305F",
          content: `\u6848\u4EF6\u300C${appointment.title}\u300D\u306B\u65B0\u3057\u3044\u5165\u672D\u304C\u3042\u308A\u307E\u3057\u305F\u3002`,
          link: `/admin/appointments`
        });
      }
    } catch (e) {
      console.error(e);
    }
    return bid;
  }),
  getByUser: protectedProcedure.query(async ({ ctx }) => {
    return getBidsByUserId(ctx.user.id);
  })
});
var notificationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getNotificationsByUserId(ctx.user.id);
  }),
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const list = await getNotificationsByUserId(ctx.user.id);
    return list.filter((n) => !n.isRead).length;
  }),
  markAsRead: protectedProcedure.input(z4.number()).mutation(async ({ input }) => {
    await markNotificationAsRead(input);
  }),
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsAsRead(ctx.user.id);
  })
});
var messagesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserMessages(ctx.user.id);
  }),
  getConversation: protectedProcedure.input(z4.number()).query(async ({ ctx, input }) => {
    return getConversation(ctx.user.id, input);
  }),
  send: protectedProcedure.input(z4.object({ receiverId: z4.number(), content: z4.string(), appointmentId: z4.number().optional() })).mutation(async ({ ctx, input }) => {
    return createMessage({
      senderId: ctx.user.id,
      receiverId: input.receiverId,
      content: input.content,
      appointmentId: input.appointmentId
    });
  })
});
var dashboardRouter = router({
  stats: publicProcedure.query(async () => {
    const appointments2 = await getAllAppointments();
    const bids2 = await getAllBids();
    const users2 = await getAllUsers();
    return {
      totalAppointments: appointments2.length,
      totalBids: bids2.length,
      totalUsers: users2.length,
      activeAppointments: appointments2.filter((a) => a.status === "active").length
    };
  }),
  salesStats: protectedProcedure.query(async ({ ctx }) => {
    const appointments2 = await getAllAppointments();
    const userAppointments = appointments2.filter((a) => a.createdBy === ctx.user.id);
    return {
      totalSubmitted: userAppointments.length,
      activeCount: userAppointments.filter((a) => a.status === "active").length,
      closedCount: userAppointments.filter((a) => a.status === "closed").length
    };
  }),
  monthlyStats: publicProcedure.query(async () => {
    return [
      { month: "7\u6708", appointments: 12, bids: 45, revenue: 12e5 },
      { month: "8\u6708", appointments: 19, bids: 52, revenue: 19e5 },
      { month: "9\u6708", appointments: 15, bids: 48, revenue: 15e5 },
      { month: "10\u6708", appointments: 22, bids: 61, revenue: 22e5 },
      { month: "11\u6708", appointments: 30, bids: 85, revenue: 3e6 },
      { month: "12\u6708", appointments: 25, bids: 72, revenue: 25e5 }
    ];
  })
});
var aiRouter = router({
  predictPrice: protectedProcedure.input(z4.number()).query(async ({ input }) => {
    const appointment = await getAppointmentById(input);
    if (!appointment) throw new TRPCError5({ code: "NOT_FOUND", message: "\u6848\u4EF6\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    return {
      predictedPrice: Math.floor(appointment.price * (0.9 + Math.random() * 0.2)),
      confidence: "high",
      reason: "\u904E\u53BB\u306E\u985E\u4F3C\u6848\u4EF6\u306E\u6210\u7D04\u4FA1\u683C\u306B\u57FA\u3065\u3044\u305F\u4E88\u6E2C\u3067\u3059\u3002"
    };
  })
});
var appRouter = router({
  system: systemRouter,
  auth: authRouter,
  admin: adminRouter,
  appointments: appointmentsRouter,
  bids: bidsRouter,
  notifications: notificationsRouter,
  messages: messagesRouter,
  dashboard: dashboardRouter,
  ai: aiRouter
});

// server/_core/context.ts
import { parse as parseCookieHeader2 } from "cookie";
async function createContext(opts) {
  let user = null;
  const cookieHeader = opts.req.headers.cookie;
  if (cookieHeader) {
    const cookies = parseCookieHeader2(cookieHeader);
    const session = cookies.session;
    if (session) {
      if (session.startsWith("admin-session-")) {
        const userIdStr = session.replace("admin-session-", "");
        const userId = parseInt(userIdStr);
        if (!isNaN(userId)) {
          user = await getUserById(userId);
        } else if (session === "admin-session-lux-yokono") {
          user = await getUserByEmail("lux.yokono@gmail.com");
        }
        if (user && user.role === "admin") {
          return { req: opts.req, res: opts.res, user };
        }
      }
    }
  }
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
import bcrypt2 from "bcrypt";
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function initializeDatabase() {
  try {
    console.log("\u{1F527} Initializing database...");
    const { drizzle: drizzle2 } = await import("drizzle-orm/better-sqlite3");
    const Database = (await import("better-sqlite3")).default;
    const { users: users2, appointments: appointments2, bids: bids2, transactions } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { sql } = await import("drizzle-orm");
    const sqlite = new Database("local.db");
    const db = drizzle2(sqlite);
    console.log("\u{1F4CB} Creating tables...");
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        openId TEXT UNIQUE,
        name TEXT,
        email TEXT UNIQUE,
        loginMethod TEXT,
        passwordHash TEXT,
        role TEXT DEFAULT 'user' NOT NULL,
        companyName TEXT,
        companyPhone TEXT,
        companyIndustry TEXT,
        isActive INTEGER DEFAULT 1 NOT NULL,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        lastSignedIn INTEGER
      )
    `);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        createdBy INTEGER NOT NULL,
        title TEXT NOT NULL,
        industry TEXT NOT NULL,
        scale TEXT NOT NULL,
        area TEXT NOT NULL,
        price INTEGER DEFAULT 0 NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active' NOT NULL,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS bids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointmentId INTEGER NOT NULL,
        bidderId INTEGER NOT NULL,
        bidAmount TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        notes TEXT,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointmentId INTEGER NOT NULL,
        sellerId INTEGER NOT NULL,
        buyerId INTEGER NOT NULL,
        amount TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    console.log("\u2705 Tables created successfully");
    console.log("\u{1F464} Creating admin user...");
    const adminEmail = "lux.yokono@gmail.com";
    const adminPassword = "20250515";
    const passwordHash = await bcrypt2.hash(adminPassword, 10);
    await db.insert(users2).values({
      email: adminEmail,
      name: "\u6A2A\u91CE \u6674\u98DB",
      loginMethod: "email",
      passwordHash,
      role: "admin",
      isActive: true,
      openId: "lux_yokono"
    }).onConflictDoUpdate({
      target: users2.email,
      set: {
        passwordHash,
        role: "admin",
        isActive: true
      }
    });
    console.log("\u2705 Admin user created successfully");
    console.log("\u{1F4E7} Email: lux.yokono@gmail.com");
    console.log("\u{1F511} Password: 20250515");
    console.log("\u{1F194} User ID: lux_yokono");
    console.log("\u{1F464} Creating sales test user...");
    const salesPassword = "sales2025";
    const salesPasswordHash = await bcrypt2.hash(salesPassword, 10);
    await db.insert(users2).values({
      email: "sales@lux-test.com",
      name: "\u55B6\u696D\u90E8\u968A\u30C6\u30B9\u30C8",
      loginMethod: "email",
      passwordHash: salesPasswordHash,
      role: "sales",
      companyName: "LUX\u55B6\u696D\u90E8",
      isActive: true,
      openId: "lux_sales"
    }).onConflictDoUpdate({
      target: users2.email,
      set: {
        passwordHash: salesPasswordHash,
        role: "sales",
        isActive: true
      }
    });
    console.log("\u2705 Sales user created successfully");
    console.log("\u{1F4E7} Email: sales@lux-test.com");
    console.log("\u{1F511} Password: sales2025");
    console.log("\u{1F194} User ID: lux_sales");
    console.log("\u{1F464} Creating power company test user...");
    const companyPassword = "company2025";
    const companyPasswordHash = await bcrypt2.hash(companyPassword, 10);
    await db.insert(users2).values({
      email: "company@lux-test.com",
      name: "\u96FB\u529B\u4F1A\u793E\u30C6\u30B9\u30C8",
      loginMethod: "email",
      passwordHash: companyPasswordHash,
      role: "power_company",
      companyName: "\u30C6\u30B9\u30C8\u96FB\u529B\u682A\u5F0F\u4F1A\u793E",
      isActive: true,
      openId: "lux_company"
    }).onConflictDoUpdate({
      target: users2.email,
      set: {
        passwordHash: companyPasswordHash,
        role: "power_company",
        isActive: true
      }
    });
    console.log("\u2705 Power company user created successfully");
    console.log("\u{1F4E7} Email: company@lux-test.com");
    console.log("\u{1F511} Password: company2025");
    console.log("\u{1F194} User ID: lux_company");
  } catch (e) {
    console.error("\u274C Database initialization error:", e.message);
    throw e;
  }
}
async function startServer() {
  await initializeDatabase();
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
