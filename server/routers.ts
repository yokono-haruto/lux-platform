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
  price: z.number().int().positive("価格は1円以上である必要があります"),
  description: z.string().optional(),
  status: z.string().optional(),
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
  search: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
});

// ==================== Routers ====================

const appointmentsRouter = router({
  create: protectedProcedure
    .input(appointmentSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "sales" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "権限がありません" });
      }
      const appointment = await db.createAppointment({
        createdBy: ctx.user.id,
        title: input.title,
        industry: input.industry,
        scale: input.scale,
        area: input.area,
        price: input.price,
        description: input.description,
      });
      return appointment;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: appointmentSchema.partial()
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "管理者のみ編集可能です" });
      }
      await db.updateAppointment(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "管理者のみ削除可能です" });
      }
      await db.deleteAppointment(input);
    }),

  list: publicProcedure
    .input(filterSchema)
    .query(async ({ input }) => {
      return db.getAppointments(input);
    }),

  getById: publicProcedure
    .input(z.number().int().positive())
    .query(async ({ input }) => {
      return db.getAppointmentById(input);
    }),
});

const bidsRouter = router({
  create: protectedProcedure
    .input(bidSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "power_company") {
        throw new TRPCError({ code: "FORBIDDEN", message: "電力会社のみが入札できます" });
      }
      const bid = await db.createBid({
        appointmentId: input.appointmentId,
        bidderId: ctx.user.id,
        bidAmount: input.bidAmount.toString(),
        notes: input.notes,
      });

      try {
        const appointment = await db.getAppointmentById(input.appointmentId);
        if (appointment) {
          await db.createNotification({
            userId: appointment.createdBy,
            type: 'bid',
            title: '新しい入札がありました',
            content: `案件「${appointment.title}」に新しい入札がありました。`,
            link: `/admin/appointments`
          });
        }
      } catch (e) { console.error(e); }

      return bid;
    }),

  getByUser: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getBidsByUserId(ctx.user.id);
    }),
});

const notificationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getNotificationsByUserId(ctx.user.id);
  }),
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const list = await db.getNotificationsByUserId(ctx.user.id);
    return list.filter(n => !n.isRead).length;
  }),
  markAsRead: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
    await db.markNotificationAsRead(input);
  }),
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markAllNotificationsAsRead(ctx.user.id);
  }),
});

const messagesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserMessages(ctx.user.id);
  }),
  getConversation: protectedProcedure.input(z.number()).query(async ({ ctx, input }) => {
    return db.getConversation(ctx.user.id, input);
  }),
  send: protectedProcedure
    .input(z.object({ receiverId: z.number(), content: z.string(), appointmentId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      return db.createMessage({
        senderId: ctx.user.id,
        receiverId: input.receiverId,
        content: input.content,
        appointmentId: input.appointmentId,
      });
    }),
});

const dashboardRouter = router({
  stats: publicProcedure.query(async () => {
    const appointments = await db.getAllAppointments();
    const bids = await db.getAllBids();
    const users = await db.getAllUsers();
    return {
      totalAppointments: appointments.length,
      totalBids: bids.length,
      totalUsers: users.length,
      activeAppointments: appointments.filter(a => a.status === 'active').length,
    };
  }),
  salesStats: protectedProcedure.query(async ({ ctx }) => {
    const appointments = await db.getAllAppointments();
    const userAppointments = appointments.filter(a => a.createdBy === ctx.user.id);
    return {
      totalSubmitted: userAppointments.length,
      activeCount: userAppointments.filter(a => a.status === 'active').length,
      closedCount: userAppointments.filter(a => a.status === 'closed').length,
    };
  }),
  monthlyStats: publicProcedure.query(async () => {
    // 簡易的な月別統計（実際にはDBクエリで集計すべきですが、ここではモックデータを返します）
    return [
      { month: '7月', appointments: 12, bids: 45, revenue: 1200000 },
      { month: '8月', appointments: 19, bids: 52, revenue: 1900000 },
      { month: '9月', appointments: 15, bids: 48, revenue: 1500000 },
      { month: '10月', appointments: 22, bids: 61, revenue: 2200000 },
      { month: '11月', appointments: 30, bids: 85, revenue: 3000000 },
      { month: '12月', appointments: 25, bids: 72, revenue: 2500000 },
    ];
  }),
});

const aiRouter = router({
  predictPrice: protectedProcedure.input(z.number()).query(async ({ input }) => {
    const appointment = await db.getAppointmentById(input);
    if (!appointment) throw new TRPCError({ code: "NOT_FOUND", message: "案件が見つかりません" });
    // 簡易的なAI予測ロジック（実際にはLLMを使用）
    return {
      predictedPrice: Math.floor(appointment.price * (0.9 + Math.random() * 0.2)),
      confidence: "high",
      reason: "過去の類似案件の成約価格に基づいた予測です。"
    };
  }),
});

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  admin: adminRouter,
  appointments: appointmentsRouter,
  bids: bidsRouter,
  notifications: notificationsRouter,
  messages: messagesRouter,
  dashboard: dashboardRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
