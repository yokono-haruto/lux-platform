import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { appointments, bids, users } from "../../drizzle/schema";
import { eq, sql, and, gte } from "drizzle-orm";

export const systemStatusRouter = router({
  getTodayStatus: protectedProcedure.query(async ({ ctx }) => {
    // 管理者のみアクセス可能
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "この機能は管理者のみ利用できます。",
      });
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 本日の新規案件数
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "データベースに接続できません。",
        });
      }

      const newAppointmentsToday = await db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(gte(appointments.createdAt, today.toISOString()))
        .then((rows) => rows[0]?.count || 0);

      // 本日の新規入札数
      const newBidsToday = await db
        .select({ count: sql<number>`count(*)` })
        .from(bids)
        .where(gte(bids.createdAt, today.toISOString()))
        .then((rows) => rows[0]?.count || 0);

      // 承認待ち案件数
      const pendingAppointments = await db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(eq(appointments.status, "pending"))
        .then((rows) => rows[0]?.count || 0);

      // 公開中の案件数
      const activeAppointments = await db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(eq(appointments.status, "active"))
        .then((rows) => rows[0]?.count || 0);

      // 総ユーザー数
      const totalUsers = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .then((rows) => rows[0]?.count || 0);

      // アクティブユーザー数（isActive = 1）
      const activeUsers = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.isActive, 1))
        .then((rows) => rows[0]?.count || 0);

      // システムの健全性を判定
      let systemHealth: "healthy" | "warning" | "critical" = "healthy";
      const issues: Array<{
        id: string;
        severity: "info" | "warning" | "critical";
        title: string;
        description: string;
        impact: string;
        status: string;
        actionRequired: boolean;
      }> = [];

      // 承認待ち案件が多い場合
      if (pendingAppointments > 5) {
        systemHealth = "warning";
        issues.push({
          id: "pending-appointments-high",
          severity: "warning",
          title: "承認待ちの案件が増えています",
          description: `現在${pendingAppointments}件の案件が承認待ちです。早めの確認をお勧めします。`,
          impact: "案件の公開が遅れる可能性があります",
          status: "対応待ち",
          actionRequired: true,
        });
      } else if (pendingAppointments > 0) {
        issues.push({
          id: "pending-appointments",
          severity: "info",
          title: "承認待ちの案件があります",
          description: `${pendingAppointments}件の案件が承認待ちです。`,
          impact: "通常範囲内",
          status: "確認推奨",
          actionRequired: true,
        });
      }

      // 本日の活動状況
      if (newAppointmentsToday > 0 || newBidsToday > 0) {
        issues.push({
          id: "daily-activity",
          severity: "info",
          title: "本日の新規活動",
          description: `新規案件：${newAppointmentsToday}件、新規入札：${newBidsToday}件`,
          impact: "なし",
          status: "情報のみ",
          actionRequired: false,
        });
      }

      return {
        systemHealth,
        summary: {
          newAppointmentsToday,
          newBidsToday,
          pendingAppointments,
          activeAppointments,
          totalUsers,
          activeUsers,
        },
        issues,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("System status fetch error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "システム状況の取得中にエラーが発生しました。",
      });
    }
  }),

  approveIssue: protectedProcedure
    .input(z.object({ issueId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 管理者のみアクセス可能
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この機能は管理者のみ利用できます。",
        });
      }

      // 実際の承認処理をここに実装
      // 例: データベースに承認状況を記録
      console.log(`Issue ${input.issueId} approved by ${ctx.user.email}`);
      
      return {
        success: true,
        message: "承認しました",
      };
    }),
});
