/**
 * Frontend crash / error logger
 * Catches browser-level uncaught errors and unhandled promise rejections,
 * then persists them to the server via an API route (which writes to frontend/log/).
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

function formatCrashEntry(level: LogLevel, message: string, stack?: string): string {
  const timestamp = new Date().toISOString();
  let entry = `[${timestamp}] [${level}] ${message}\n`;
  if (stack) {
    entry += `stack: ${stack}\n`;
  }
  entry += '---\n';
  return entry;
}

async function sendCrashLog(level: LogLevel, message: string, stack?: string): Promise<void> {
  try {
    await fetch('/api/crash-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, stack }),
    });
  } catch {
    // Silently fail — crashing while reporting a crash is counterproductive
  }
}

function setupGlobalHandlers(): void {
  window.onerror = (message, _source, _lineno, _colno, error?: Error) => {
    const msg = typeof message === 'string' ? message : String(message);
    const stack = error?.stack;
    sendCrashLog('ERROR', `window.onerror: ${msg}`, stack);
  };

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const msg = reason instanceof Error ? `Unhandled Promise Rejection: ${reason.message}` : `Unhandled Promise Rejection: ${String(reason)}`;
    const stack = reason instanceof Error ? reason.stack : undefined;
    sendCrashLog('ERROR', msg, stack);
  });
}

/**
 * Public API — also exposes a manual `error()` helper so components can
 * voluntarily report application-level errors.
 */
export const frontendLogger = {
  /** Call once at app startup to wire up global browser handlers. */
  init: () => setupGlobalHandlers(),

  error: (message: string, stack?: string) => {
    sendCrashLog('ERROR', message, stack);
  },

  warn: (message: string) => {
    sendCrashLog('WARN', message);
  },
};
