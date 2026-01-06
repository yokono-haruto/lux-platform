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
    const { users, appointments, bids, transactions } = await import("../../drizzle/schema");
    const { sql } = await import("drizzle-orm");
    
    const sqlite = new Database("local.db");
    const db = drizzle(sqlite);
    
    // Create tables if they don't exist
    console.log("📋 Creating tables...");
    
    // Users table
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
        companyAddress TEXT,
        companyPhone TEXT,
        companyIndustry TEXT,
        isActive INTEGER DEFAULT 1 NOT NULL,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        lastSignedIn INTEGER
      )
    `);
    
    // Appointments table
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
    
    // Bids table
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
    
    // Transactions table
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
    
    console.log("✅ Tables created successfully");
    
    // Create admin user
    console.log("👤 Creating admin user...");
    
    const adminEmail = "lux.yokono@gmail.com";
    const adminPassword = "20250515";
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    await db.insert(users).values({
      email: adminEmail,
      name: "横野 晴人",
      loginMethod: "email",
      passwordHash: passwordHash,
      role: "admin",
      isActive: true,
      openId: "lux_yokono"
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash: passwordHash,
        role: "admin",
        isActive: true
      }
    });
    
    console.log("✅ Admin user created successfully");
    console.log("📧 Email: lux.yokono@gmail.com");
    console.log("🔑 Password: 20250515");
    console.log("🆔 User ID: lux_yokono");
    
  } catch (e) {
    console.error("❌ Database initialization error:", e.message);
    throw e;
  }
}

async function startServer() {
  // Initialize database before starting server
  await initializeDatabase();
  
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
