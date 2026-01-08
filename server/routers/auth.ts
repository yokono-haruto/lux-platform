import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as authService from "../auth";
import * as db from "../db";
import bcrypt from "bcrypt";
import { logActivity } from "../sheets";

const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const updateProfileSchema = z.object({
  name: z.string().optional(),
  companyName: z.string().optional(),
  companyPhone: z.string().optional(),
  companyIndustry: z.string().optional(),
});

export const authRouter = router({
  // メール + パスワードでログイン
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      // 最優先: 指定されたテストアカウントの場合は即座に成功
      if (input.email === 'lux_yokono' && input.password === '20250515') {
        // データベース上のlux.yokono@gmail.comを管理者として確保
        let user = await db.getUserByEmail("lux.yokono@gmail.com");
        if (!user) {
          const passwordHash = await bcrypt.hash("20250515", 10);
          user = await db.createUserWithPassword({
            email: "lux.yokono@gmail.com",
            name: "横野 晴飛",
            passwordHash: passwordHash,
            role: "admin",
            companyName: "LUX",
            isActive: true,
          });
        } else if (user.role !== "admin") {
          await db.updateUser(user.id, { role: "admin" });
          // 更新後のユーザー情報を再取得
          user = await db.getUserByEmail("lux.yokono@gmail.com");
          if (!user) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "User not found after update" });
          }
        }

        // セッションクッキーを設定
        const COOKIE_NAME = "session";
        ctx.res.cookie(COOKIE_NAME, `admin-session-${user.id}`, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        
        // ログイン成功をスプレッドシートに記録
        logActivity(user.id, user.name || 'admin', 'login', '管理者ログイン', ctx.req?.ip || 'unknown').catch(console.error);
        
        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyName: user.companyName,
          }
        };
      }

      // 営業チームテストアカウント
      if (input.email === 'lux_sales' && input.password === 'sales2025') {
        let user = await db.getUserByEmail("sales@lux-test.com");
        if (!user) {
          // テストユーザーを自動作成
          const passwordHash = await bcrypt.hash("sales2025", 10);
          user = await db.createUserWithPassword({
            email: "sales@lux-test.com",
            name: "営業部隊テスト",
            passwordHash: passwordHash,
            role: "sales",
            companyName: "LUX営業部",
            isActive: true,
          });
        }

        const COOKIE_NAME = "session";
        ctx.res.cookie(COOKIE_NAME, `user-session-${user.id}`, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        
        // ログイン成功をスプレッドシートに記録
        logActivity(user.id, user.name || 'sales', 'login', '営業部隊ログイン', ctx.req?.ip || 'unknown').catch(console.error);
        
        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyName: user.companyName,
          }
        };
      }

      // 電力会社テストアカウント
      if (input.email === 'lux_company' && input.password === 'company2025') {
        let user = await db.getUserByEmail("company@lux-test.com");
        if (!user) {
          // テストユーザーを自動作成
          const passwordHash = await bcrypt.hash("company2025", 10);
          user = await db.createUserWithPassword({
            email: "company@lux-test.com",
            name: "電力会社テスト",
            passwordHash: passwordHash,
            role: "power_company",
            companyName: "テスト電力株式会社",
            isActive: true,
          });
        }

        const COOKIE_NAME = "session";
        ctx.res.cookie(COOKIE_NAME, `user-session-${user.id}`, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        
        // ログイン成功をスプレッドシートに記録
        logActivity(user.id, user.name || 'company', 'login', '電力会社ログイン', ctx.req?.ip || 'unknown').catch(console.error);
        
        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyName: user.companyName,
          }
        };
      }

      // 通常のログイン処理
      const result = await authService.loginWithEmail(input.email, input.password);

      if (!result) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "メールアドレスまたはパスワードが正しくありません",
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
      companyIndustry: ctx.user.companyIndustry,
    };
  }),

  // パスワードを変更
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const success = await authService.changePassword(
        ctx.user.id,
        input.currentPassword,
        input.newPassword
      );

      if (!success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "パスワードの変更に失敗しました。現在のパスワードを確認してください。",
        });
      }

      return { success: true };
    }),

  // プロフィールを更新
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      await db.updateUser(ctx.user.id, input);
      return { success: true };
    }),

  // ログアウト
  logout: publicProcedure.mutation(({ ctx }) => {
    const COOKIE_NAME = "session";
    ctx.res.clearCookie(COOKIE_NAME);
    return { success: true };
  }),
});
