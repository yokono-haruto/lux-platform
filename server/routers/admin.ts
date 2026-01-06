import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as authService from "../auth";
import * as db from "../db";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(["sales", "power_company"]),
  companyName: z.string().optional(),
  companyPhone: z.string().optional(),
  companyIndustry: z.string().optional(),
});

const updateUserSchema = z.object({
  userId: z.number(),
  name: z.string().optional(),
  companyName: z.string().optional(),
  companyPhone: z.string().optional(),
  companyIndustry: z.string().optional(),
  isActive: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  userId: z.number(),
  newPassword: z.string().min(8),
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "管理者のみがアクセスできます" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // ユーザー一覧を取得
  listUsers: adminProcedure.query(async () => {
    const users = await db.getAllUsers();
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyName: user.companyName,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));
  }),

  // ユーザーを作成
  createUser: adminProcedure
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      // メールアドレスが既に存在するか確認
      const existingUser = await db.getUserByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "このメールアドレスは既に使用されています",
        });
      }

      const user = await authService.createUser({
        email: input.email,
        name: input.name,
        password: input.password,
        role: input.role,
        companyName: input.companyName,
        companyPhone: input.companyPhone,
        companyIndustry: input.companyIndustry,
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
      };
    }),

  // ユーザーを更新
  updateUser: adminProcedure
    .input(updateUserSchema)
    .mutation(async ({ input }) => {
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ユーザーが見つかりません" });
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.companyName !== undefined) updateData.companyName = input.companyName;
      if (input.companyPhone !== undefined) updateData.companyPhone = input.companyPhone;
      if (input.companyIndustry !== undefined) updateData.companyIndustry = input.companyIndustry;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      await db.updateUser(input.userId, updateData);

      return { success: true };
    }),

  // ユーザーを削除（非アクティブ化）
  deactivateUser: adminProcedure
    .input(z.number())
    .mutation(async ({ input: userId }) => {
      const user = await db.getUserById(userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ユーザーが見つかりません" });
      }

      await db.deactivateUser(userId);
      return { success: true };
    }),

  // ユーザーを有効化
  activateUser: adminProcedure
    .input(z.number())
    .mutation(async ({ input: userId }) => {
      const user = await db.getUserById(userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ユーザーが見つかりません" });
      }

      await db.activateUser(userId);
      return { success: true };
    }),

  // パスワードをリセット
  resetPassword: adminProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input }) => {
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ユーザーが見つかりません" });
      }

      await authService.resetPassword(input.userId, input.newPassword);
      return { success: true };
    }),
});
