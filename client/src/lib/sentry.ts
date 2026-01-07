import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (dsn) {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: 0.1, // 10%のトランザクションをサンプリング（無料枠内）
      replaysSessionSampleRate: 0.1, // 10%のセッションを記録
      replaysOnErrorSampleRate: 1.0, // エラー発生時は100%記録
      beforeSend(event) {
        // 開発環境ではコンソールに出力
        if (import.meta.env.DEV) {
          console.log('Sentry event:', event);
        }
        return event;
      },
    });
  }
}

export { Sentry };
