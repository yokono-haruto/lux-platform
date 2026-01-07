import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const errorFixRouter = router({
  analyzeError: protectedProcedure
    .input(z.object({ 
      errorMessage: z.string(),
      stackTrace: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 管理者のみ実行可能
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この機能は管理者のみ利用できます。",
        });
      }

      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI修正機能が利用できません。",
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
                      text: `あなたはシステムエラーを分析する専門家です。
以下のエラー情報を分析し、原因と修正方法を日本語で提案してください。

エラーメッセージ: ${input.errorMessage}
${input.stackTrace ? `スタックトレース: ${input.stackTrace}` : ''}

以下の形式で回答してください：
1. エラーの原因
2. 推奨される修正方法
3. 予防策`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1000,
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Gemini API request failed");
        }

        const data = await response.json();
        const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "分析に失敗しました。";

        return { analysis };
      } catch (error) {
        console.error("Error analysis failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "エラー分析中に問題が発生しました。",
        });
      }
    }),
});
