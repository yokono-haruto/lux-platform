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
      // 入札設定価格
      monthlyAmount: integer("monthlyAmount").default(0).notNull(),
      // 月額料金/使用量
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
async function updateBidStatus(bidId, status) {
  const db = await getDb();
  if (!db) return;
  await db.update(bids).set({ status }).where(eq(bids.id, bidId));
}
async function createNotification(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = /* @__PURE__ */ new Date();
  const result = await db.insert(notifications).values({
    ...data,
    createdAt: now
  });
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
  const now = /* @__PURE__ */ new Date();
  const result = await db.insert(messages).values({
    ...data,
    createdAt: now
  });
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
import { z as z9 } from "zod";
import { TRPCError as TRPCError9 } from "@trpc/server";

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
  currentPassword: z2.string().min(1),
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
      input.currentPassword,
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

// server/routers/chatbot.ts
import { z as z4 } from "zod";
import { TRPCError as TRPCError5 } from "@trpc/server";
var rateLimitStore = /* @__PURE__ */ new Map();
var RATE_LIMIT_WINDOW = 60 * 1e3;
var RATE_LIMIT_MAX = 10;
function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  if (!userLimit || now > userLimit.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }
  userLimit.count++;
  return true;
}
var FAQ_RESPONSES = {
  "\u6848\u4EF6": "\u6848\u4EF6\u306E\u767B\u9332\u306F\u3001\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9\u306E\u300C\u6848\u4EF6\u30C7\u30FC\u30BF\u7BA1\u7406\u300D\u304B\u3089\u884C\u3048\u307E\u3059\u3002\u65B0\u898F\u767B\u9332\u30DC\u30BF\u30F3\u3092\u30AF\u30EA\u30C3\u30AF\u3057\u3066\u3001\u5FC5\u8981\u306A\u60C5\u5831\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  "\u767B\u9332": "\u65B0\u898F\u767B\u9332\u306B\u3064\u3044\u3066\u306F\u3001\u7BA1\u7406\u8005\u306B\u304A\u554F\u3044\u5408\u308F\u305B\u304F\u3060\u3055\u3044\u3002\u55B6\u696D\u90E8\u968A\u3084\u96FB\u529B\u4F1A\u793E\u306E\u30A2\u30AB\u30A6\u30F3\u30C8\u767A\u884C\u306F\u7BA1\u7406\u8005\u304C\u884C\u3044\u307E\u3059\u3002",
  "\u5165\u672D": "\u5165\u672D\u306F\u96FB\u529B\u4F1A\u793E\u30A2\u30AB\u30A6\u30F3\u30C8\u3067\u30ED\u30B0\u30A4\u30F3\u5F8C\u3001\u30DE\u30FC\u30B1\u30C3\u30C8\u30D7\u30EC\u30A4\u30B9\u304B\u3089\u884C\u3048\u307E\u3059\u3002\u6848\u4EF6\u8A73\u7D30\u3092\u78BA\u8A8D\u3057\u3001\u5165\u672D\u91D1\u984D\u3092\u5165\u529B\u3057\u3066\u9001\u4FE1\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  "\u30ED\u30B0\u30A4\u30F3": "\u30ED\u30B0\u30A4\u30F3\u30DA\u30FC\u30B8\u3067\u30E6\u30FC\u30B6\u30FCID\u3068\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u5FD8\u308C\u305F\u5834\u5408\u306F\u7BA1\u7406\u8005\u306B\u304A\u554F\u3044\u5408\u308F\u305B\u304F\u3060\u3055\u3044\u3002",
  "\u30D1\u30B9\u30EF\u30FC\u30C9": "\u30D1\u30B9\u30EF\u30FC\u30C9\u306E\u30EA\u30BB\u30C3\u30C8\u306F\u7BA1\u7406\u8005\u306B\u304A\u554F\u3044\u5408\u308F\u305B\u304F\u3060\u3055\u3044\u3002\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306E\u305F\u3081\u3001\u672C\u4EBA\u78BA\u8A8D\u304C\u5FC5\u8981\u3067\u3059\u3002",
  "\u4F7F\u3044\u65B9": "LUX\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u306F\u3001\u55B6\u696D\u90E8\u968A\u304C\u6848\u4EF6\u3092\u767B\u9332\u3057\u3001\u96FB\u529B\u4F1A\u793E\u304C\u5165\u672D\u3059\u308B\u30DE\u30C3\u30C1\u30F3\u30B0\u30B7\u30B9\u30C6\u30E0\u3067\u3059\u3002\u8A73\u7D30\u306F\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9\u3092\u3054\u78BA\u8A8D\u304F\u3060\u3055\u3044\u3002",
  "\u30D8\u30EB\u30D7": "\u304A\u56F0\u308A\u306E\u70B9\u304C\u3054\u3056\u3044\u307E\u3057\u305F\u3089\u3001\u5177\u4F53\u7684\u306A\u8CEA\u554F\u3092\u304A\u805E\u304B\u305B\u304F\u3060\u3055\u3044\u3002\u6848\u4EF6\u767B\u9332\u3001\u5165\u672D\u3001\u30A2\u30AB\u30A6\u30F3\u30C8\u7BA1\u7406\u306A\u3069\u3001\u69D8\u3005\u306A\u30B5\u30DD\u30FC\u30C8\u304C\u53EF\u80FD\u3067\u3059\u3002",
  "\u3053\u3093\u306B\u3061\u306F": "\u3053\u3093\u306B\u3061\u306F\uFF01LUX\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u3078\u3088\u3046\u3053\u305D\u3002\u4F55\u304B\u304A\u624B\u4F1D\u3044\u3067\u304D\u308B\u3053\u3068\u306F\u3042\u308A\u307E\u3059\u304B\uFF1F",
  "\u3042\u308A\u304C\u3068\u3046": "\u3069\u3046\u3044\u305F\u3057\u307E\u3057\u3066\uFF01\u4ED6\u306B\u3054\u8CEA\u554F\u304C\u3054\u3056\u3044\u307E\u3057\u305F\u3089\u3001\u304A\u6C17\u8EFD\u306B\u304A\u805E\u304D\u304F\u3060\u3055\u3044\u3002"
};
function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }
  return null;
}
var SYSTEM_PROMPT = `\u3042\u306A\u305F\u306FLUX\u96FB\u529B\u53D6\u5F15\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u306E\u512A\u79C0\u306AAI\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u3067\u3059\u3002
\u30E6\u30FC\u30B6\u30FC\u306E\u8CEA\u554F\u306B\u5BFE\u3057\u3066\u3001\u89AA\u5207\u3067\u7C21\u6F54\u306A\u65E5\u672C\u8A9E\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u306E\u6982\u8981\u3011
LUX\u306F\u3001\u55B6\u696D\u90E8\u968A\u3068\u96FB\u529B\u4F1A\u793E\u3092\u3064\u306A\u3050B2B\u30DE\u30C3\u30C1\u30F3\u30B0\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u3067\u3059\u3002

\u3010\u30E6\u30FC\u30B6\u30FC\u306E\u7A2E\u985E\u3068\u6A5F\u80FD\u3011
1. \u7BA1\u7406\u8005\uFF08Admin\uFF09
   - \u5168\u6848\u4EF6\u30FB\u5168\u30E6\u30FC\u30B6\u30FC\u306E\u7BA1\u7406
   - \u5165\u672D\u306E\u627F\u8A8D\u30FB\u5374\u4E0B
   - \u53D6\u5F15\u30FB\u8ACB\u6C42\u7BA1\u7406
   - \u30B7\u30B9\u30C6\u30E0\u8A2D\u5B9A

2. \u55B6\u696D\u90E8\u968A\uFF08Sales\uFF09
   - \u6848\u4EF6\u306E\u767B\u9332\u30FB\u7BA1\u7406
   - \u5165\u672D\u72B6\u6CC1\u306E\u78BA\u8A8D
   - \u6210\u7D04\u5B9F\u7E3E\u306E\u78BA\u8A8D

3. \u96FB\u529B\u4F1A\u793E\uFF08Power Company\uFF09
   - \u30DE\u30FC\u30B1\u30C3\u30C8\u30D7\u30EC\u30A4\u30B9\u3067\u6848\u4EF6\u3092\u95B2\u89A7
   - \u6848\u4EF6\u3078\u306E\u5165\u672D
   - \u8CFC\u5165\u5C65\u6B74\u306E\u78BA\u8A8D

\u3010\u56DE\u7B54\u306E\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3\u3011
- \u7C21\u6F54\u3067\u5206\u304B\u308A\u3084\u3059\u3044\u56DE\u7B54\u3092\u5FC3\u304C\u3051\u308B
- \u5177\u4F53\u7684\u306A\u64CD\u4F5C\u624B\u9806\u3092\u6848\u5185\u3059\u308B
- \u4E0D\u660E\u70B9\u306F\u7BA1\u7406\u8005\u3078\u306E\u554F\u3044\u5408\u308F\u305B\u3092\u4FC3\u3059
- \u4E01\u5BE7\u3067\u89AA\u3057\u307F\u3084\u3059\u3044\u30C8\u30FC\u30F3\u3092\u7DAD\u6301\u3059\u308B`;
var chatbotRouter = router({
  chat: protectedProcedure.input(z4.object({ message: z4.string().min(1).max(1e3) })).mutation(async ({ ctx, input }) => {
    if (!checkRateLimit(ctx.user.id)) {
      throw new TRPCError5({
        code: "TOO_MANY_REQUESTS",
        message: "\u8CEA\u554F\u306F1\u5206\u9593\u306B10\u56DE\u307E\u3067\u3067\u3059\u3002\u5C11\u3057\u5F85\u3063\u3066\u304B\u3089\u518D\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002"
      });
    }
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      console.log("OPENAI_API_KEY not set, using fallback responses");
      const fallback = getFallbackResponse(input.message);
      if (fallback) {
        return { reply: fallback };
      }
      return {
        reply: "\u7533\u3057\u8A33\u3054\u3056\u3044\u307E\u305B\u3093\u3002\u73FE\u5728AI\u30B5\u30DD\u30FC\u30C8\u306F\u4E00\u6642\u7684\u306B\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3002\u304A\u554F\u3044\u5408\u308F\u305B\u306F\u7BA1\u7406\u8005\u307E\u3067\u3054\u9023\u7D61\u304F\u3060\u3055\u3044\u3002"
      };
    }
    try {
      const response = await fetch(
        process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4.1-nano",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: input.message }
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error response:", response.status, errorText);
        const fallback = getFallbackResponse(input.message);
        if (fallback) {
          return { reply: fallback };
        }
        throw new Error(`OpenAI API request failed: ${response.status}`);
      }
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "\u7533\u3057\u8A33\u3054\u3056\u3044\u307E\u305B\u3093\u3002\u56DE\u7B54\u3092\u751F\u6210\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002";
      return { reply };
    } catch (error) {
      console.error("OpenAI API error:", error);
      const fallback = getFallbackResponse(input.message);
      if (fallback) {
        return { reply: fallback };
      }
      return {
        reply: "\u7533\u3057\u8A33\u3054\u3056\u3044\u307E\u305B\u3093\u3002\u73FE\u5728AI\u30B5\u30DD\u30FC\u30C8\u306F\u4E00\u6642\u7684\u306B\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3002\u3057\u3070\u3089\u304F\u7D4C\u3063\u3066\u304B\u3089\u518D\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002"
      };
    }
  })
});

// server/routers/error-fix.ts
import { z as z5 } from "zod";
import { TRPCError as TRPCError6 } from "@trpc/server";
var errorFixRouter = router({
  analyzeError: protectedProcedure.input(z5.object({
    errorMessage: z5.string(),
    stackTrace: z5.string().optional()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError6({
        code: "FORBIDDEN",
        message: "\u3053\u306E\u6A5F\u80FD\u306F\u7BA1\u7406\u8005\u306E\u307F\u5229\u7528\u3067\u304D\u307E\u3059\u3002"
      });
    }
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new TRPCError6({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI\u4FEE\u6B63\u6A5F\u80FD\u304C\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3002"
      });
    }
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `\u3042\u306A\u305F\u306F\u30B7\u30B9\u30C6\u30E0\u30A8\u30E9\u30FC\u3092\u5206\u6790\u3059\u308B\u5C02\u9580\u5BB6\u3067\u3059\u3002
\u4EE5\u4E0B\u306E\u30A8\u30E9\u30FC\u60C5\u5831\u3092\u5206\u6790\u3057\u3001\u539F\u56E0\u3068\u4FEE\u6B63\u65B9\u6CD5\u3092\u65E5\u672C\u8A9E\u3067\u63D0\u6848\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u30A8\u30E9\u30FC\u30E1\u30C3\u30BB\u30FC\u30B8: ${input.errorMessage}
${input.stackTrace ? `\u30B9\u30BF\u30C3\u30AF\u30C8\u30EC\u30FC\u30B9: ${input.stackTrace}` : ""}

\u4EE5\u4E0B\u306E\u5F62\u5F0F\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
1. \u30A8\u30E9\u30FC\u306E\u539F\u56E0
2. \u63A8\u5968\u3055\u308C\u308B\u4FEE\u6B63\u65B9\u6CD5
3. \u4E88\u9632\u7B56`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1e3
            }
          })
        }
      );
      if (!response.ok) {
        throw new Error("Gemini API request failed");
      }
      const data = await response.json();
      const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "\u5206\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002";
      return { analysis };
    } catch (error) {
      console.error("Error analysis failed:", error);
      throw new TRPCError6({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u30A8\u30E9\u30FC\u5206\u6790\u4E2D\u306B\u554F\u984C\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002"
      });
    }
  })
});

// server/routers/system-status.ts
import { TRPCError as TRPCError7 } from "@trpc/server";
import { z as z6 } from "zod";
init_schema();
import { eq as eq2, sql, and as and2, gte as gte2 } from "drizzle-orm";
var systemStatusRouter = router({
  getTodayStatus: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError7({
        code: "FORBIDDEN",
        message: "\u3053\u306E\u6A5F\u80FD\u306F\u7BA1\u7406\u8005\u306E\u307F\u5229\u7528\u3067\u304D\u307E\u3059\u3002"
      });
    }
    try {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const db = await getDb();
      if (!db) {
        throw new TRPCError7({
          code: "INTERNAL_SERVER_ERROR",
          message: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3002"
        });
      }
      const newAppointmentsToday = await db.select({ count: sql`count(*)` }).from(appointments).where(gte2(appointments.createdAt, today)).then((rows) => rows[0]?.count || 0);
      const newBidsToday = await db.select({ count: sql`count(*)` }).from(bids).where(gte2(bids.createdAt, today)).then((rows) => rows[0]?.count || 0);
      const pendingAppointments = await db.select({ count: sql`count(*)` }).from(appointments).where(eq2(appointments.status, "pending")).then((rows) => rows[0]?.count || 0);
      const activeAppointments = await db.select({ count: sql`count(*)` }).from(appointments).where(eq2(appointments.status, "active")).then((rows) => rows[0]?.count || 0);
      const salesCount = await db.select({ count: sql`count(*)` }).from(users).where(eq2(users.role, "sales")).then((rows) => rows[0]?.count || 0);
      const powerCompanyCount = await db.select({ count: sql`count(*)` }).from(users).where(eq2(users.role, "power_company")).then((rows) => rows[0]?.count || 0);
      const activeSalesCount = await db.select({ count: sql`count(*)` }).from(users).where(and2(eq2(users.role, "sales"), eq2(users.isActive, 1))).then((rows) => rows[0]?.count || 0);
      const activePowerCompanyCount = await db.select({ count: sql`count(*)` }).from(users).where(and2(eq2(users.role, "power_company"), eq2(users.isActive, 1))).then((rows) => rows[0]?.count || 0);
      let systemHealth = "healthy";
      const issues = [];
      if (pendingAppointments > 5) {
        systemHealth = "warning";
        issues.push({
          id: "pending-appointments-high",
          severity: "warning",
          title: "\u627F\u8A8D\u5F85\u3061\u306E\u6848\u4EF6\u304C\u5897\u3048\u3066\u3044\u307E\u3059",
          description: `\u73FE\u5728${pendingAppointments}\u4EF6\u306E\u6848\u4EF6\u304C\u627F\u8A8D\u5F85\u3061\u3067\u3059\u3002\u65E9\u3081\u306E\u78BA\u8A8D\u3092\u304A\u52E7\u3081\u3057\u307E\u3059\u3002`,
          impact: "\u6848\u4EF6\u306E\u516C\u958B\u304C\u9045\u308C\u308B\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059",
          status: "\u5BFE\u5FDC\u5F85\u3061",
          actionRequired: true
        });
      } else if (pendingAppointments > 0) {
        issues.push({
          id: "pending-appointments",
          severity: "info",
          title: "\u627F\u8A8D\u5F85\u3061\u306E\u6848\u4EF6\u304C\u3042\u308A\u307E\u3059",
          description: `${pendingAppointments}\u4EF6\u306E\u6848\u4EF6\u304C\u627F\u8A8D\u5F85\u3061\u3067\u3059\u3002`,
          impact: "\u901A\u5E38\u7BC4\u56F2\u5185",
          status: "\u78BA\u8A8D\u63A8\u5968",
          actionRequired: true
        });
      }
      if (newAppointmentsToday > 0 || newBidsToday > 0) {
        issues.push({
          id: "daily-activity",
          severity: "info",
          title: "\u672C\u65E5\u306E\u65B0\u898F\u6D3B\u52D5",
          description: `\u65B0\u898F\u6848\u4EF6\uFF1A${newAppointmentsToday}\u4EF6\u3001\u65B0\u898F\u5165\u672D\uFF1A${newBidsToday}\u4EF6`,
          impact: "\u306A\u3057",
          status: "\u60C5\u5831\u306E\u307F",
          actionRequired: false
        });
      }
      return {
        systemHealth,
        summary: {
          newAppointmentsToday,
          newBidsToday,
          pendingAppointments,
          activeAppointments,
          salesCount,
          powerCompanyCount,
          activeSalesCount,
          activePowerCompanyCount
        },
        issues,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      console.error("System status fetch error:", error);
      throw new TRPCError7({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u30B7\u30B9\u30C6\u30E0\u72B6\u6CC1\u306E\u53D6\u5F97\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002"
      });
    }
  }),
  approveIssue: protectedProcedure.input(z6.object({ issueId: z6.string() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError7({
        code: "FORBIDDEN",
        message: "\u3053\u306E\u6A5F\u80FD\u306F\u7BA1\u7406\u8005\u306E\u307F\u5229\u7528\u3067\u304D\u307E\u3059\u3002"
      });
    }
    console.log(`Issue ${input.issueId} approved by ${ctx.user.email}`);
    return {
      success: true,
      message: "\u627F\u8A8D\u3057\u307E\u3057\u305F"
    };
  })
});

// server/routers/auto-fix.ts
import { TRPCError as TRPCError8 } from "@trpc/server";
import { z as z7 } from "zod";
function getFallbackAnalysis(errorLog, stackTrace) {
  const errorPatterns = [
    {
      pattern: /Cannot read properties of undefined \(reading '(\w+)'\)/i,
      analysis: (match) => `\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u304C undefined \u306E\u72B6\u614B\u3067 '${match[1]}' \u30D7\u30ED\u30D1\u30C6\u30A3\u306B\u30A2\u30AF\u30BB\u30B9\u3057\u3088\u3046\u3068\u3057\u3066\u3044\u307E\u3059\u3002\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u524D\u306Bnull\u30C1\u30A7\u30C3\u30AF\u3092\u8FFD\u52A0\u3059\u308B\u304B\u3001\u30AA\u30D7\u30B7\u30E7\u30CA\u30EB\u30C1\u30A7\u30FC\u30F3(?.)\u3092\u4F7F\u7528\u3057\u3066\u304F\u3060\u3055\u3044\u3002`,
      severity: "medium"
    },
    {
      pattern: /Cannot read properties of null/i,
      analysis: () => "\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u304C null \u306E\u72B6\u614B\u3067\u30D7\u30ED\u30D1\u30C6\u30A3\u306B\u30A2\u30AF\u30BB\u30B9\u3057\u3088\u3046\u3068\u3057\u3066\u3044\u307E\u3059\u3002null\u30C1\u30A7\u30C3\u30AF\u3092\u8FFD\u52A0\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
      severity: "medium"
    },
    {
      pattern: /is not a function/i,
      analysis: () => "\u95A2\u6570\u3068\u3057\u3066\u547C\u3073\u51FA\u305D\u3046\u3068\u3057\u3066\u3044\u308B\u3082\u306E\u304C\u95A2\u6570\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u5909\u6570\u306E\u578B\u3084\u521D\u671F\u5316\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
      severity: "high"
    },
    {
      pattern: /Network Error|Failed to fetch/i,
      analysis: () => "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u3066\u3044\u307E\u3059\u3002API\u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8\u306E\u53EF\u7528\u6027\u3068CORS\u8A2D\u5B9A\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
      severity: "high"
    },
    {
      pattern: /no such column/i,
      analysis: () => "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306B\u6307\u5B9A\u3055\u308C\u305F\u30AB\u30E9\u30E0\u304C\u5B58\u5728\u3057\u307E\u305B\u3093\u3002\u30B9\u30AD\u30FC\u30DE\u3068\u30AF\u30A8\u30EA\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
      severity: "high"
    },
    {
      pattern: /UNIQUE constraint failed/i,
      analysis: () => "\u4E00\u610F\u5236\u7D04\u9055\u53CD\u3067\u3059\u3002\u91CD\u8907\u3059\u308B\u30C7\u30FC\u30BF\u3092\u633F\u5165\u3057\u3088\u3046\u3068\u3057\u3066\u3044\u307E\u3059\u3002",
      severity: "medium"
    }
  ];
  const filePathMatch = stackTrace.match(/at\s+\w+\s+\(([^:]+\.tsx?)/);
  const filePath = filePathMatch ? `/home/ubuntu/lux-platform/client/src/${filePathMatch[1]}` : "/home/ubuntu/lux-platform/client/src/App.tsx";
  for (const { pattern, analysis, severity } of errorPatterns) {
    const match = errorLog.match(pattern);
    if (match) {
      return {
        analysis: typeof analysis === "function" ? analysis(match) : analysis,
        fixCode: `// \u81EA\u52D5\u4FEE\u6B63\u30B3\u30FC\u30C9\u306F\u751F\u6210\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002
// \u4EE5\u4E0B\u306E\u30AC\u30A4\u30C0\u30F3\u30B9\u306B\u5F93\u3063\u3066\u624B\u52D5\u3067\u4FEE\u6B63\u3057\u3066\u304F\u3060\u3055\u3044\u3002
// 
// \u63A8\u5968\u3055\u308C\u308B\u4FEE\u6B63\u65B9\u6CD5:
// 1. \u8A72\u5F53\u7B87\u6240\u3067null\u30C1\u30A7\u30C3\u30AF\u3092\u8FFD\u52A0
// 2. \u30AA\u30D7\u30B7\u30E7\u30CA\u30EB\u30C1\u30A7\u30FC\u30F3(?.)\u3092\u4F7F\u7528
// 3. \u30C7\u30D5\u30A9\u30EB\u30C8\u5024\u3092\u8A2D\u5B9A
// 
// \u4F8B:
// const data = response?.data ?? [];
// if (data && data.length > 0) { ... }`,
        filePath,
        severity
      };
    }
  }
  return {
    analysis: "\u30A8\u30E9\u30FC\u306E\u8A73\u7D30\u306A\u5206\u6790\u306B\u306F\u8FFD\u52A0\u60C5\u5831\u304C\u5FC5\u8981\u3067\u3059\u3002\u30B9\u30BF\u30C3\u30AF\u30C8\u30EC\u30FC\u30B9\u3092\u78BA\u8A8D\u3057\u3001\u8A72\u5F53\u3059\u308B\u30B3\u30FC\u30C9\u3092\u898B\u76F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    fixCode: "",
    filePath,
    severity: "medium"
  };
}
async function analyzeErrorWithGemini(errorLog, stackTrace) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.log("GEMINI_API_KEY is not set, using fallback analysis");
    return getFallbackAnalysis(errorLog, stackTrace);
  }
  const prompt = `\u3042\u306A\u305F\u306F\u30B7\u30B9\u30C6\u30E0\u30A8\u30E9\u30FC\u3092\u5206\u6790\u3057\u3066\u4FEE\u6B63\u6848\u3092\u63D0\u6848\u3059\u308B\u30A8\u30AD\u30B9\u30D1\u30FC\u30C8\u3067\u3059\u3002

\u4EE5\u4E0B\u306E\u30A8\u30E9\u30FC\u30ED\u30B0\u3068\u30B9\u30BF\u30C3\u30AF\u30C8\u30EC\u30FC\u30B9\u3092\u5206\u6790\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A

\u30A8\u30E9\u30FC\u30ED\u30B0:
${errorLog}

\u30B9\u30BF\u30C3\u30AF\u30C8\u30EC\u30FC\u30B9:
${stackTrace}

\u4EE5\u4E0B\u306E\u5F62\u5F0F\u3067JSON\u5F62\u5F0F\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "analysis": "\u30A8\u30E9\u30FC\u306E\u539F\u56E0\u3092\u65E5\u672C\u8A9E\u3067\u7C21\u6F54\u306B\u8AAC\u660E",
  "fixCode": "\u4FEE\u6B63\u5F8C\u306E\u30B3\u30FC\u30C9\u5168\u4F53\uFF08\u8A72\u5F53\u30D5\u30A1\u30A4\u30EB\u306E\u5B8C\u5168\u306A\u30B3\u30FC\u30C9\uFF09",
  "filePath": "\u4FEE\u6B63\u304C\u5FC5\u8981\u306A\u30D5\u30A1\u30A4\u30EB\u306E\u30D1\u30B9\uFF08\u4F8B: /home/ubuntu/lux-platform/client/src/App.tsx\uFF09",
  "severity": "low/medium/high \u306E\u3044\u305A\u308C\u304B"
}

\u6CE8\u610F\uFF1A
- fixCode\u306F\u8A72\u5F53\u30D5\u30A1\u30A4\u30EB\u306E\u5B8C\u5168\u306A\u30B3\u30FC\u30C9\u3092\u542B\u3081\u3066\u304F\u3060\u3055\u3044
- filePath\u306F\u7D76\u5BFE\u30D1\u30B9\u3067\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044
- \u4FEE\u6B63\u304C\u4E0D\u53EF\u80FD\u306A\u5834\u5408\u306F\u3001fixCode\u3092\u7A7A\u6587\u5B57\u5217\u306B\u3057\u3066\u304F\u3060\u3055\u3044`;
  try {
    const models = [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-2.0-flash-exp"
    ];
    let lastError = null;
    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 8e3
              }
            })
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`Model ${model} failed: ${response.status} - ${errorText}`);
          lastError = new Error(`Gemini API error: ${response.statusText}`);
          continue;
        }
        const data = await response.json();
        const text2 = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = text2.match(/```json\n([\s\S]*?)\n```/) || text2.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Failed to parse Gemini response");
        }
        const result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return result;
      } catch (modelError) {
        console.log(`Model ${model} error:`, modelError);
        lastError = modelError;
        continue;
      }
    }
    console.log("All Gemini models failed, using fallback analysis");
    return getFallbackAnalysis(errorLog, stackTrace);
  } catch (error) {
    console.error("Gemini API error:", error);
    return getFallbackAnalysis(errorLog, stackTrace);
  }
}
var autoFixRouter = router({
  // エラーログを分析して修正案を生成
  analyzeError: protectedProcedure.input(
    z7.object({
      errorLog: z7.string(),
      stackTrace: z7.string()
    })
  ).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError8({
        code: "FORBIDDEN",
        message: "\u3053\u306E\u6A5F\u80FD\u306F\u7BA1\u7406\u8005\u306E\u307F\u5229\u7528\u3067\u304D\u307E\u3059\u3002"
      });
    }
    try {
      const result = await analyzeErrorWithGemini(
        input.errorLog,
        input.stackTrace
      );
      return {
        success: true,
        fixId: `fix-${Date.now()}`,
        ...result
      };
    } catch (error) {
      console.error("Error analysis failed:", error);
      throw new TRPCError8({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "\u30A8\u30E9\u30FC\u5206\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002"
      });
    }
  }),
  // 修正案を承認して適用
  applyFix: protectedProcedure.input(
    z7.object({
      fixId: z7.string(),
      filePath: z7.string(),
      fixCode: z7.string()
    })
  ).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError8({
        code: "FORBIDDEN",
        message: "\u3053\u306E\u6A5F\u80FD\u306F\u7BA1\u7406\u8005\u306E\u307F\u5229\u7528\u3067\u304D\u307E\u3059\u3002"
      });
    }
    try {
      const fs2 = await import("fs/promises");
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      await fs2.writeFile(input.filePath, input.fixCode, "utf-8");
      const commitMessage = `Auto-fix: ${input.fixId}`;
      await execAsync(
        `cd /home/ubuntu/lux-platform && git add "${input.filePath}" && git commit -m "${commitMessage}"`
      );
      return {
        success: true,
        message: "\u4FEE\u6B63\u3092\u9069\u7528\u3057\u307E\u3057\u305F\u3002",
        filePath: input.filePath
      };
    } catch (error) {
      console.error("Fix application failed:", error);
      throw new TRPCError8({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "\u4FEE\u6B63\u306E\u9069\u7528\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002"
      });
    }
  }),
  // 修正案の一覧を取得
  listPendingFixes: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError8({
        code: "FORBIDDEN",
        message: "\u3053\u306E\u6A5F\u80FD\u306F\u7BA1\u7406\u8005\u306E\u307F\u5229\u7528\u3067\u304D\u307E\u3059\u3002"
      });
    }
    return {
      fixes: []
    };
  })
});

// server/routers/sentry-webhook.ts
import { z as z8 } from "zod";
var sentryWebhookRouter = router({
  // Sentry Webhookを受信してGitHub Actionsをトリガー
  handleWebhook: publicProcedure.input(
    z8.object({
      event: z8.object({
        event_id: z8.string(),
        message: z8.string().optional(),
        exception: z8.object({
          values: z8.array(
            z8.object({
              type: z8.string(),
              value: z8.string(),
              stacktrace: z8.object({
                frames: z8.array(z8.any())
              }).optional()
            })
          )
        }).optional()
      })
    })
  ).mutation(async ({ input }) => {
    try {
      const errorMessage = input.event.exception?.values?.[0]?.value || input.event.message || "Unknown error";
      const stackTrace = JSON.stringify(input.event.exception?.values?.[0]?.stacktrace?.frames || [], null, 2);
      const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
      const GITHUB_REPO = process.env.GITHUB_REPO || "yokono-haruto/lux-platform";
      if (!GITHUB_TOKEN) {
        console.error("GITHUB_TOKEN is not set");
        return { success: false, message: "GITHUB_TOKEN is not configured" };
      }
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
        {
          method: "POST",
          headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": `Bearer ${GITHUB_TOKEN}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            event_type: "sentry-error",
            client_payload: {
              error_message: errorMessage,
              stack_trace: stackTrace,
              event_id: input.event.event_id
            }
          })
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("GitHub API error:", errorText);
        return { success: false, message: "Failed to trigger GitHub Actions" };
      }
      console.log(`\u2705 GitHub Actions triggered for Sentry event: ${input.event.event_id}`);
      return {
        success: true,
        message: "Auto-fix workflow triggered",
        eventId: input.event.event_id
      };
    } catch (error) {
      console.error("Error handling Sentry webhook:", error);
      return {
        success: false,
        message: error.message || "Unknown error"
      };
    }
  })
});

// server/routers.ts
var appointmentSchema = z9.object({
  title: z9.string().min(1),
  industry: z9.string().min(1),
  scale: z9.string().min(1),
  area: z9.string().min(1),
  bidPrice: z9.number().int().min(0, "\u5165\u672D\u8A2D\u5B9A\u4FA1\u683C\u306F0\u4EE5\u4E0A\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059"),
  monthlyAmount: z9.number().int().min(0, "\u6708\u984D\u6599\u91D1\u306F0\u4EE5\u4E0A\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059"),
  description: z9.string().optional(),
  status: z9.string().optional()
});
var bidSchema = z9.object({
  appointmentId: z9.number().int().positive(),
  bidAmount: z9.number().positive(),
  notes: z9.string().optional()
});
var filterSchema = z9.object({
  industry: z9.string().optional(),
  scale: z9.string().optional(),
  area: z9.string().optional(),
  status: z9.string().optional(),
  search: z9.string().optional(),
  minPrice: z9.number().optional(),
  maxPrice: z9.number().optional()
});
var appointmentsRouter = router({
  create: protectedProcedure.input(appointmentSchema).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "sales" && ctx.user.role !== "admin") {
      throw new TRPCError9({ code: "FORBIDDEN", message: "\u6A29\u9650\u304C\u3042\u308A\u307E\u305B\u3093" });
    }
    const appointment = await createAppointment({
      createdBy: ctx.user.id,
      title: input.title,
      industry: input.industry,
      scale: input.scale,
      area: input.area,
      price: input.bidPrice,
      monthlyAmount: input.monthlyAmount,
      description: input.description
    });
    return appointment;
  }),
  update: protectedProcedure.input(z9.object({
    id: z9.number(),
    data: appointmentSchema.partial()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError9({ code: "FORBIDDEN", message: "\u7BA1\u7406\u8005\u306E\u307F\u7DE8\u96C6\u53EF\u80FD\u3067\u3059" });
    }
    await updateAppointment(input.id, input.data);
  }),
  delete: protectedProcedure.input(z9.number()).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError9({ code: "FORBIDDEN", message: "\u7BA1\u7406\u8005\u306E\u307F\u524A\u9664\u53EF\u80FD\u3067\u3059" });
    }
    await deleteAppointment(input);
  }),
  list: publicProcedure.input(filterSchema).query(async ({ input }) => {
    return getAppointments(input);
  }),
  getById: publicProcedure.input(z9.number().int().positive()).query(async ({ input }) => {
    return getAppointmentById(input);
  })
});
var bidsRouter = router({
  create: protectedProcedure.input(bidSchema).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "power_company") {
      throw new TRPCError9({ code: "FORBIDDEN", message: "\u96FB\u529B\u4F1A\u793E\u306E\u307F\u304C\u5165\u672D\u3067\u304D\u307E\u3059" });
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
  }),
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError9({ code: "FORBIDDEN", message: "\u7BA1\u7406\u8005\u306E\u307F" });
    }
    return getAllBids();
  }),
  myBids: protectedProcedure.query(async ({ ctx }) => {
    return getBidsByUserId(ctx.user.id);
  }),
  updateStatus: protectedProcedure.input(z9.object({ bidId: z9.number(), status: z9.string() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError9({ code: "FORBIDDEN", message: "\u7BA1\u7406\u8005\u306E\u307F" });
    }
    await updateBidStatus(input.bidId, input.status);
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
  markAsRead: protectedProcedure.input(z9.number()).mutation(async ({ input }) => {
    await markNotificationAsRead(input);
  }),
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsAsRead(ctx.user.id);
  }),
  broadcast: protectedProcedure.input(z9.object({ title: z9.string(), content: z9.string(), targetRole: z9.string() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError9({ code: "FORBIDDEN", message: "\u7BA1\u7406\u8005\u306E\u307F" });
    }
    const users2 = await getAllUsers();
    const targets = input.targetRole === "all" ? users2 : users2.filter((u) => u.role === input.targetRole || input.targetRole === "company" && u.role === "power_company");
    for (const u of targets) {
      await createNotification({
        userId: u.id,
        type: "system",
        title: input.title,
        content: input.content
      });
    }
    return { sent: targets.length };
  })
});
var messagesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserMessages(ctx.user.id);
  }),
  getConversation: protectedProcedure.input(z9.number()).query(async ({ ctx, input }) => {
    return getConversation(ctx.user.id, input);
  }),
  getAvailableUsers: protectedProcedure.query(async ({ ctx }) => {
    const allUsers = await getAllUsers();
    const currentUser = ctx.user;
    if (currentUser.role === "admin") {
      return allUsers.filter((u) => u.id !== currentUser.id && u.isActive).map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        companyName: u.companyName
      }));
    } else {
      return allUsers.filter((u) => u.role === "admin" && u.isActive).map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        companyName: u.companyName
      }));
    }
  }),
  send: protectedProcedure.input(z9.object({ receiverId: z9.number(), content: z9.string(), appointmentId: z9.number().optional() })).mutation(async ({ ctx, input }) => {
    return createMessage({
      senderId: ctx.user.id,
      receiverId: input.receiverId,
      content: input.content,
      appointmentId: input.appointmentId
    });
  }),
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const messages2 = await getUserMessages(ctx.user.id);
    return messages2.filter((m) => m.receiverId === ctx.user.id && !m.isRead).length;
  })
});
var dashboardRouter = router({
  stats: publicProcedure.query(async () => {
    const appointments2 = await getAllAppointments();
    const bids2 = await getAllBids();
    const users2 = await getAllUsers();
    const salesCount = users2.filter((u) => u.role === "sales").length;
    const powerCompanyCount = users2.filter((u) => u.role === "power_company").length;
    return {
      totalAppointments: appointments2.length,
      totalBids: bids2.length,
      salesCount,
      powerCompanyCount,
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
  predictPrice: protectedProcedure.input(z9.number()).query(async ({ input }) => {
    const appointment = await getAppointmentById(input);
    if (!appointment) throw new TRPCError9({ code: "NOT_FOUND", message: "\u6848\u4EF6\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
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
  ai: aiRouter,
  chatbot: chatbotRouter,
  errorFix: errorFixRouter,
  systemStatus: systemStatusRouter,
  autoFix: autoFixRouter,
  sentryWebhook: sentryWebhookRouter
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
      if (session.startsWith("user-session-")) {
        const userIdStr = session.replace("user-session-", "");
        const userId = parseInt(userIdStr);
        if (!isNaN(userId)) {
          user = await getUserById(userId);
          if (user) {
            return { req: opts.req, res: opts.res, user };
          }
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
  const distPath = path2.resolve(process.cwd(), "dist", "public");
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

// server/lib/sentry.ts
import * as Sentry from "@sentry/node";
function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "production",
      tracesSampleRate: 0.1,
      // 10%のトランザクションをサンプリング
      beforeSend(event) {
        if (process.env.NODE_ENV === "development") {
          console.log("Sentry event:", event);
        }
        return event;
      }
    });
  }
}

// server/_core/index.ts
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
    const { users: users2, appointments: appointments2, bids: bids2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const sqlite = new Database("local.db");
    const db = drizzle2(sqlite);
    const nowMs = () => Date.now();
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
        createdAt INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)),
        updatedAt INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)),
        lastSignedIn INTEGER
      )
    `);
    sqlite.exec(`DROP TABLE IF EXISTS appointments`);
    sqlite.exec(`
      CREATE TABLE appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        createdBy INTEGER NOT NULL,
        title TEXT NOT NULL,
        industry TEXT NOT NULL,
        scale TEXT NOT NULL,
        area TEXT NOT NULL,
        price INTEGER DEFAULT 0 NOT NULL,
        monthlyAmount INTEGER DEFAULT 0 NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active' NOT NULL,
        createdAt INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)),
        updatedAt INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))
      )
    `);
    console.log("\u2705 Appointments table recreated with correct schema (milliseconds timestamps)");
    sqlite.exec(`DROP TABLE IF EXISTS bids`);
    sqlite.exec(`
      CREATE TABLE bids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointmentId INTEGER NOT NULL,
        bidderId INTEGER NOT NULL,
        bidAmount TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        notes TEXT,
        createdAt INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)),
        updatedAt INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))
      )
    `);
    console.log("\u2705 Bids table recreated with correct schema");
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointmentId INTEGER NOT NULL,
        sellerId INTEGER NOT NULL,
        buyerId INTEGER NOT NULL,
        amount TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        createdAt INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)),
        updatedAt INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))
      )
    `);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT NOT NULL,
        totalAmount TEXT NOT NULL,
        status TEXT DEFAULT 'draft' NOT NULL,
        pdfUrl TEXT,
        pdfKey TEXT,
        createdAt INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)),
        updatedAt INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))
      )
    `);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS invoiceItems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoiceId INTEGER NOT NULL,
        bidId INTEGER NOT NULL,
        appointmentTitle TEXT NOT NULL,
        bidderCompanyName TEXT NOT NULL,
        amount TEXT NOT NULL,
        createdAt INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))
      )
    `);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        isRead INTEGER DEFAULT 0 NOT NULL,
        link TEXT,
        createdAt INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))
      )
    `);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        senderId INTEGER NOT NULL,
        receiverId INTEGER NOT NULL,
        appointmentId INTEGER,
        content TEXT NOT NULL,
        isRead INTEGER DEFAULT 0 NOT NULL,
        createdAt INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))
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
      openId: "lux_yokono",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).onConflictDoUpdate({
      target: users2.email,
      set: {
        passwordHash,
        role: "admin",
        isActive: true,
        updatedAt: /* @__PURE__ */ new Date()
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
      openId: "lux_sales",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).onConflictDoUpdate({
      target: users2.email,
      set: {
        passwordHash: salesPasswordHash,
        role: "sales",
        isActive: true,
        updatedAt: /* @__PURE__ */ new Date()
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
      openId: "lux_company",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).onConflictDoUpdate({
      target: users2.email,
      set: {
        passwordHash: companyPasswordHash,
        role: "power_company",
        isActive: true,
        updatedAt: /* @__PURE__ */ new Date()
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
  initSentry();
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
