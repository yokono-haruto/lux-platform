import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  const cookieHeader = opts.req.headers.cookie;
  if (cookieHeader) {
    const cookies = parseCookieHeader(cookieHeader);
    const session = cookies.session;

    if (session) {
      // 管理者セッションのチェック
      if (session.startsWith("admin-session-")) {
        const userIdStr = session.replace("admin-session-", "");
        const userId = parseInt(userIdStr);
        
        if (!isNaN(userId)) {
          user = await db.getUserById(userId);
        } else if (session === "admin-session-lux-yokono") {
          user = await db.getUserByEmail("lux.yokono@gmail.com");
        }

        if (user && user.role === "admin") {
          return { req: opts.req, res: opts.res, user };
        }
      }
      
      // ユーザーセッションのチェック
      if (session.startsWith("user-session-")) {
        const userIdStr = session.replace("user-session-", "");
        const userId = parseInt(userIdStr);
        
        if (!isNaN(userId)) {
          user = await db.getUserById(userId);
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
    user,
  };
}
