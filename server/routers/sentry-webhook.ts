import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const sentryWebhookRouter = router({
  // Sentry Webhookを受信してGitHub Actionsをトリガー
  handleWebhook: publicProcedure
    .input(
      z.object({
        event: z.object({
          event_id: z.string(),
          message: z.string().optional(),
          exception: z.object({
            values: z.array(
              z.object({
                type: z.string(),
                value: z.string(),
                stacktrace: z.object({
                  frames: z.array(z.any()),
                }).optional(),
              })
            ),
          }).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const errorMessage = input.event.exception?.values?.[0]?.value || input.event.message || "Unknown error";
        const stackTrace = JSON.stringify(input.event.exception?.values?.[0]?.stacktrace?.frames || [], null, 2);
        
        // GitHub Actionsをトリガー
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_REPO = process.env.GITHUB_REPO || "yokono-haruto/lux-platform";
        
        if (!GITHUB_TOKEN) {
          console.error("GITHUB_TOKEN is not set");
          return { success: false, message: "GITHUB_TOKEN is not configured" };
        }

        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
          {
            method: "POST",
            headers: {
              "Accept": "application/vnd.github+json",
              "Authorization": `Bearer ${GITHUB_TOKEN}`,
              "X-GitHub-Api-Version": "2022-11-28",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              event_type: "sentry-error",
              client_payload: {
                error_message: errorMessage,
                stack_trace: stackTrace,
                event_id: input.event.event_id,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("GitHub API error:", errorText);
          return { success: false, message: "Failed to trigger GitHub Actions" };
        }

        console.log(`✅ GitHub Actions triggered for Sentry event: ${input.event.event_id}`);
        
        return {
          success: true,
          message: "Auto-fix workflow triggered",
          eventId: input.event.event_id,
        };
      } catch (error: any) {
        console.error("Error handling Sentry webhook:", error);
        return {
          success: false,
          message: error.message || "Unknown error",
        };
      }
    }),
});
