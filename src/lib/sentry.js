// ═══════════════════════════════════════════
// Sentry — Error Monitoring & Performance
// Diinisialisasi di main.jsx sebelum React render
// ═══════════════════════════════════════════
import * as Sentry from '@sentry/react';

Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,

    // Hanya aktif di production (tidak kirim error saat dev lokal)
    enabled: import.meta.env.PROD,

    // Performance monitoring — sample 20% of transactions
    tracesSampleRate: 0.2,

    // Session replay — record 10% sessions, 100% on error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
    ],

    // Filter noise — jangan kirim error dari extension browser dll
    beforeSend(event) {
        // Skip error dari browser extension
        if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
            f => f.filename?.includes('extension://')
        )) {
            return null;
        }
        return event;
    },

    // Environment tag
    environment: import.meta.env.MODE, // 'development' | 'production'
});

export default Sentry;
