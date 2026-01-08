import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// レート制限用のメモリストア
const rateLimitStore = new Map<number, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1分
const RATE_LIMIT_MAX = 10; // 1分間に10回まで

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

// よくある質問への定型回答（フォールバック用）
const FAQ_RESPONSES: Record<string, string> = {
  "案件": "案件の登録は、ダッシュボードの「案件データ管理」から行えます。新規登録ボタンをクリックして、必要な情報を入力してください。",
  "登録": "新規登録については、管理者にお問い合わせください。営業部隊や電力会社のアカウント発行は管理者が行います。",
  "入札": "入札は電力会社アカウントでログイン後、マーケットプレイスから行えます。案件詳細を確認し、入札金額を入力して送信してください。",
  "ログイン": "ログインページでユーザーIDとパスワードを入力してください。パスワードを忘れた場合は管理者にお問い合わせください。",
  "パスワード": "パスワードのリセットは管理者にお問い合わせください。セキュリティのため、本人確認が必要です。",
  "使い方": "LUXプラットフォームは、営業部隊が案件を登録し、電力会社が入札するマッチングシステムです。詳細はダッシュボードをご確認ください。",
  "ヘルプ": "お困りの点がございましたら、具体的な質問をお聞かせください。案件登録、入札、アカウント管理など、様々なサポートが可能です。",
  "こんにちは": "こんにちは！LUXプラットフォームへようこそ。何かお手伝いできることはありますか？",
  "ありがとう": "どういたしまして！他にご質問がございましたら、お気軽にお聞きください。",
};

function getFallbackResponse(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }
  return null;
}

const SYSTEM_PROMPT = `あなたはLUX電力取引プラットフォームの優秀なAIアシスタントです。
ユーザーの質問に対して、親切で簡潔な日本語で回答してください。

【プラットフォームの概要】
LUXは、営業部隊と電力会社をつなぐB2Bマッチングプラットフォームです。

【ユーザーの種類と機能】
1. 管理者（Admin）
   - 全案件・全ユーザーの管理
   - 入札の承認・却下
   - 取引・請求管理
   - システム設定

2. 営業部隊（Sales）
   - 案件の登録・管理
   - 入札状況の確認
   - 成約実績の確認

3. 電力会社（Power Company）
   - マーケットプレイスで案件を閲覧
   - 案件への入札
   - 購入履歴の確認

【回答のガイドライン】
- 簡潔で分かりやすい回答を心がける
- 具体的な操作手順を案内する
- 不明点は管理者への問い合わせを促す
- 丁寧で親しみやすいトーンを維持する`;

export const chatbotRouter = router({
  chat: protectedProcedure
    .input(z.object({ message: z.string().min(1).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      // レート制限チェック
      if (!checkRateLimit(ctx.user.id)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "質問は1分間に10回までです。少し待ってから再度お試しください。",
        });
      }

      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      
      // APIキーがない場合はフォールバック応答を使用
      if (!OPENAI_API_KEY) {
        console.log("OPENAI_API_KEY not set, using fallback responses");
        const fallback = getFallbackResponse(input.message);
        if (fallback) {
          return { reply: fallback };
        }
        return { 
          reply: "申し訳ございません。現在AIサポートは一時的に利用できません。お問い合わせは管理者までご連絡ください。" 
        };
      }

      try {
        // OpenAI互換APIを使用
        const response = await fetch(
          process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4.1-nano",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: input.message }
              ],
              temperature: 0.7,
              max_tokens: 500,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("OpenAI API error response:", response.status, errorText);
          
          // APIエラー時はフォールバック応答を使用
          const fallback = getFallbackResponse(input.message);
          if (fallback) {
            return { reply: fallback };
          }
          
          throw new Error(`OpenAI API request failed: ${response.status}`);
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "申し訳ございません。回答を生成できませんでした。";

        return { reply };
      } catch (error) {
        console.error("OpenAI API error:", error);
        
        // エラー時はフォールバック応答を試みる
        const fallback = getFallbackResponse(input.message);
        if (fallback) {
          return { reply: fallback };
        }
        
        return {
          reply: "申し訳ございません。現在AIサポートは一時的に利用できません。しばらく経ってから再度お試しください。"
        };
      }
    }),
});
