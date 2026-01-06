import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { notifyNewBid } from "./notification";
import { authRouter } from "./routers/auth";
import { adminRouter } from "./routers/admin";

// ==================== Validators ====================

const appointmentSchema = z.object({
  title: z.string().min(1),
  industry: z.string().min(1),
  scale: z.string().min(1),
  area: z.string().min(1),
  price: z.number().int().nonnegative(), // 金額バリデーション追加
  description: z.string().optional(),
});

const bidSchema = z.object({
  appointmentId: z.number().int().positive(),
  bidAmount: z.number().positive(),
  notes: z.string().optional(),
});

const filterSchema = z.object({
  industry: z.string().optional(),
  scale: z.string().optional(),
  area: z.string().optional(),
  status: z.string().optional(),
});

// ==================== Routers ====================

const appointmentsRouter = router({
  // 案件を登録（管理者または営業部隊）
  create: protectedProcedure
    .input(appointmentSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "sales" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "権限がありません",
        });
      }

      return db.createAppointment({
        createdBy: ctx.user.id,
        title: input.title,
        industry: input.industry,
        scale: input.scale,
        area: input.area,
        price: input.price,
        description: input.description,
      });
    }),

  // 案件一覧を取得
  list: publicProcedure
    .input(filterSchema)
    .query(async ({ input }) => {
      return db.getAppointments(input);
    }),

  // 案件詳細を取得
  getById: publicProcedure
    .input(z.number().int().positive())
    .query(async ({ input }) => {
      return db.getAppointmentById(input);
    }),
});

const bidsRouter = router({
  // 入札を作成
  create: protectedProcedure
    .input(bidSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "power_company") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "電力会社のみが入札できます",
        });
      }

      const bid = await db.createBid({
        appointmentId: input.appointmentId,
        bidderId: ctx.user.id,
        bidAmount: input.bidAmount.toString(),
        notes: input.notes,
      });

      // 通知（オプション）
      try {
        await notifyNewBid(bid.id);
      } catch (e) {
        console.error("Failed to notify new bid:", e);
      }

      return bid;
    }),

  // 自分の入札一覧を取得
  getByUser: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getBidsByUserId(ctx.user.id);
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  admin: adminRouter,
  appointments: appointmentsRouter,
  bids: bidsRouter,
});

export type AppRouter = typeof appRouter;
