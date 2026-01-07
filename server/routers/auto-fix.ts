import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

// Gemini APIクライアント
async function analyzeErrorWithGemini(errorLog: string, stackTrace: string): Promise<{
  analysis: string;
  fixCode: string;
  filePath: string;
  severity: "low" | "medium" | "high";
}> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const prompt = `あなたはシステムエラーを分析して修正案を提案するエキスパートです。

以下のエラーログとスタックトレースを分析してください：

エラーログ:
${errorLog}

スタックトレース:
${stackTrace}

以下の形式でJSON形式で回答してください：
{
  "analysis": "エラーの原因を日本語で簡潔に説明",
  "fixCode": "修正後のコード全体（該当ファイルの完全なコード）",
  "filePath": "修正が必要なファイルのパス（例: /home/ubuntu/lux-platform/client/src/App.tsx）",
  "severity": "low/medium/high のいずれか"
}

注意：
- fixCodeは該当ファイルの完全なコードを含めてください
- filePathは絶対パスで指定してください
- 修正が不可能な場合は、fixCodeを空文字列にしてください`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // JSONを抽出（```json ... ``` の中身を取得）
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse Gemini response");
    }

    const result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    return result;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

export const autoFixRouter = router({
  // エラーログを分析して修正案を生成
  analyzeError: protectedProcedure
    .input(
      z.object({
        errorLog: z.string(),
        stackTrace: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 管理者のみアクセス可能
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この機能は管理者のみ利用できます。",
        });
      }

      try {
        const result = await analyzeErrorWithGemini(
          input.errorLog,
          input.stackTrace
        );

        // 修正案をデータベースに保存（実装は省略）
        // 実際のプロダクションでは、修正案をDBに保存して承認待ち状態にする

        return {
          success: true,
          fixId: `fix-${Date.now()}`,
          ...result,
        };
      } catch (error: any) {
        console.error("Error analysis failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "エラー分析に失敗しました。",
        });
      }
    }),

  // 修正案を承認して適用
  applyFix: protectedProcedure
    .input(
      z.object({
        fixId: z.string(),
        filePath: z.string(),
        fixCode: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 管理者のみアクセス可能
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この機能は管理者のみ利用できます。",
        });
      }

      try {
        const fs = await import("fs/promises");
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);

        // ファイルに修正を適用
        await fs.writeFile(input.filePath, input.fixCode, "utf-8");

        // Gitにコミット
        const commitMessage = `Auto-fix: ${input.fixId}`;
        await execAsync(
          `cd /home/ubuntu/lux-platform && git add "${input.filePath}" && git commit -m "${commitMessage}"`
        );

        // GitHubにプッシュ（本番環境では実行しない）
        // await execAsync(`cd /home/ubuntu/lux-platform && git push origin main`);

        return {
          success: true,
          message: "修正を適用しました。",
          filePath: input.filePath,
        };
      } catch (error: any) {
        console.error("Fix application failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "修正の適用に失敗しました。",
        });
      }
    }),

  // 修正案の一覧を取得
  listPendingFixes: protectedProcedure.query(async ({ ctx }) => {
    // 管理者のみアクセス可能
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "この機能は管理者のみ利用できます。",
      });
    }

    // 実際のプロダクションでは、DBから承認待ちの修正案を取得
    // ここではダミーデータを返す
    return {
      fixes: [],
    };
  }),
});
