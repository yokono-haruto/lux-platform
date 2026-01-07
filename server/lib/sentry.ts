import * as Sentry from '@sentry/node';

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (dsn) {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'production',
      tracesSampleRate: 0.1, // 10%のトランザクションをサンプリング
      beforeSend(event) {
        // 開発環境ではコンソールに出力
        if (process.env.NODE_ENV === 'development') {
          console.log('Sentry event:', event);
        }
        return event;
      },
    });
  }
}

export { Sentry };
