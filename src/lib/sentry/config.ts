// Sentry Error Tracking Configuration
// To enable Sentry, install the package and configure your DSN:
// npm install @sentry/react-native
// Then uncomment and configure the code below

/*
import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.EXPO_PUBLIC_APP_ENV || 'development',
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    tracesSampleRate: 1.0,
    debug: __DEV__,
    beforeSend(event) {
      // Don't send events in development
      if (__DEV__) {
        return null;
      }
      return event;
    },
  });
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.error('Sentry would capture:', error, context);
    return;
  }
  
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (__DEV__) {
    console.log('Sentry would capture message:', message, level);
    return;
  }
  
  Sentry.captureMessage(message, level);
}

export function setUser(user: { id: string; email?: string; username?: string } | null) {
  Sentry.setUser(user);
}

export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}
*/

// Placeholder exports for when Sentry is not installed
export function initSentry() {
  // Sentry not configured - this is a placeholder
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  console.error('Error:', error, context);
}

export function captureMessage(message: string, level: string = 'info') {
  console.log(`[${level}]`, message);
}

export function setUser(_user: { id: string; email?: string; username?: string } | null) {
  // Placeholder
}

export function addBreadcrumb(_breadcrumb: { category?: string; message?: string; level?: string }) {
  // Placeholder
}
