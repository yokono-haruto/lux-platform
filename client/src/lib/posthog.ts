import posthog from 'posthog-js';

export function initPostHog() {
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

  if (apiKey) {
    posthog.init(apiKey, {
      api_host: host,
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
      loaded: (posthog) => {
        if (import.meta.env.DEV) {
          console.log('PostHog initialized');
        }
      },
    });
  }
}

export { posthog };
