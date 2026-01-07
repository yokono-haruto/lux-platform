import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// レート制限用のメモリストア（本番環境ではRedisなどを使用すべき）
const rateLimitStore = new Map<number, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1分
const RATE_LIMIT_MAX = 3; // 1分間に3回まで

function checkRateLimit(userId: number): boolean {
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

export const chatbotRouter = router({
  chat: protectedProcedure
    .input(z.object({ message: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      // レート制限チェック
      if (!checkRateLimit(ctx.user.id)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "質問は1分間に3回までです。少し待ってから再度お試しください。",
        });
      }

      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "チャットボット機能が利用できません。",
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
                      text: `あなたはLUX電力取引プラットフォームのサポートアシスタントです。
ユーザーの質問に対して、親切で簡潔な日本語で回答してください。

プラットフォームの機能：
- 管理者：案件管理、ユーザー管理、取引管理、入札管理
- 営業部隊：案件の投入、管理、成約状況の確認
- 電力会社：公開案件の閲覧、入札、購入履歴の確認

ユーザーの質問: ${input.message}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Gemini API request failed");
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "申し訳ございません。回答を生成できませんでした。";

        return { reply };
      } catch (error) {
        console.error("Gemini API error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "回答の生成中にエラーが発生しました。",
        });
      }
    }),
});
