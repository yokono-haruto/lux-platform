import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import bcrypt from "bcrypt";
import { initSentry } from "../lib/sentry";
import { initializeSpreadsheet, logSystem } from "../sheets";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function initializeDatabase() {
  try {
    console.log("🔧 Initializing database...");
    
    const { drizzle } = await import("drizzle-orm/better-sqlite3");
    const Database = (await import("better-sqlite3")).default;
    const { users, appointments, bids } = await import("../../drizzle/schema");
    
    const sqlite = new Database("local.db");
    const db = drizzle(sqlite);
    
    // Helper function to get current timestamp in milliseconds
    const nowMs = () => Date.now();
    
    // Create tables if they don't exist
    console.log("📋 Creating tables...");
    
    // Users table - using milliseconds for timestamps
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
    
    // Drop and recreate appointments table to ensure correct schema with milliseconds
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
    console.log("✅ Appointments table recreated with correct schema (milliseconds timestamps)");
    
    // Bids table - Drop and recreate to ensure correct schema
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
    console.log("✅ Bids table recreated with correct schema");
    
    // Transactions table
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
    
    // Invoices table
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
    
    // Invoice items table
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
    
    // Notifications table
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
    
    // Messages table
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
    
    console.log("✅ Tables created successfully");
    
    // Create admin user
    console.log("👤 Creating admin user...");
    
    const adminEmail = "lux.yokono@gmail.com";
    const adminPassword = "20250515";
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    await db.insert(users).values({
      email: adminEmail,
      name: "横野 晴飛",
      loginMethod: "email",
      passwordHash: passwordHash,
      role: "admin",
      isActive: true,
      openId: "lux_yokono",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash: passwordHash,
        role: "admin",
        isActive: true,
        updatedAt: new Date()
      }
    });
    
    console.log("✅ Admin user created successfully");
    console.log("📧 Email: lux.yokono@gmail.com");
    console.log("🔑 Password: 20250515");
    console.log("🆔 User ID: lux_yokono");
    
    // Create sales test user
    console.log("👤 Creating sales test user...");
    const salesPassword = "sales2025";
    const salesPasswordHash = await bcrypt.hash(salesPassword, 10);
    
    await db.insert(users).values({
      email: "sales@lux-test.com",
      name: "営業部隊テスト",
      loginMethod: "email",
      passwordHash: salesPasswordHash,
      role: "sales",
      companyName: "LUX営業部",
      isActive: true,
      openId: "lux_sales",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash: salesPasswordHash,
        role: "sales",
        isActive: true,
        updatedAt: new Date()
      }
    });
    
    console.log("✅ Sales user created successfully");
    console.log("📧 Email: sales@lux-test.com");
    console.log("🔑 Password: sales2025");
    console.log("🆔 User ID: lux_sales");
    
    // Create power company test user
    console.log("👤 Creating power company test user...");
    const companyPassword = "company2025";
    const companyPasswordHash = await bcrypt.hash(companyPassword, 10);
    
    await db.insert(users).values({
      email: "company@lux-test.com",
      name: "電力会社テスト",
      loginMethod: "email",
      passwordHash: companyPasswordHash,
      role: "power_company",
      companyName: "テスト電力株式会社",
      isActive: true,
      openId: "lux_company",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash: companyPasswordHash,
        role: "power_company",
        isActive: true,
        updatedAt: new Date()
      }
    });
    
    console.log("✅ Power company user created successfully");
    console.log("📧 Email: company@lux-test.com");
    console.log("🔑 Password: company2025");
    console.log("🆔 User ID: lux_company");
    
  } catch (e: any) {
    console.error("❌ Database initialization error:", e.message);
    throw e;
  }
}

async function startServer() {
  // Initialize Sentry for error monitoring
  initSentry();
  
  // Initialize database before starting server
  await initializeDatabase();
  
  // Initialize Google Sheets integration
  await initializeSpreadsheet();
  
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
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
