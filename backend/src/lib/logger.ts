// Logger with configurable log levels

import fs from 'fs';
import path from 'path';

export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LOG_LEVELS: Record<LogLevel, number> = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
};

// Get log level from environment variable
const getLogLevelFromEnv = (): LogLevel => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  if (envLevel && LOG_LEVELS[envLevel as LogLevel] !== undefined) {
    return envLevel as LogLevel;
  }
  // Default to INFO in production, DEBUG in development
  return process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO';
};

let currentLogLevel = getLogLevelFromEnv();

// Allow runtime updates via environment
export const setLogLevel = (level: LogLevel) => {
  currentLogLevel = level;
};

export const getLogLevel = (): LogLevel => currentLogLevel;

// --- Crash log writer ---
const CRASH_LOG_DIR = path.resolve(__dirname, '../../log/crashes');

function ensureCrashLogDir() {
  if (!fs.existsSync(CRASH_LOG_DIR)) {
    fs.mkdirSync(CRASH_LOG_DIR, { recursive: true });
  }
}

function formatCrashEntry(level: LogLevel, message: string, stack?: string): string {
  const timestamp = new Date().toISOString();
  let entry = `[${timestamp}] [${level}] ${message}\n`;
  if (stack) {
    entry += `stack: ${stack}\n`;
  }
  entry += '---\n';
  return entry;
}

export function writeCrashLog(level: LogLevel, message: string, stack?: string): void {
  try {
    ensureCrashLogDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `crash-${timestamp}.log`;
    const filepath = path.join(CRASH_LOG_DIR, filename);
    const content = formatCrashEntry(level, message, stack);
    fs.appendFileSync(filepath, content, 'utf-8');
  } catch (err) {
    // Fallback: log to stderr so we don't silently swallow write errors
    console.error('[CRASH-LOGGER] Failed to write crash log:', err);
  }
}

// --- Global crash handlers ---
export function registerGlobalErrorHandlers(): void {
  process.on('uncaughtException', (err: Error) => {
    const msg = `Uncaught Exception: ${err.message}`;
    writeCrashLog('ERROR', msg, err.stack);
    // Re-throw so the process still exits (default behavior)
    throw err;
  });

  process.on('unhandledRejection', (reason: unknown) => {
    const msg = reason instanceof Error ? `Unhandled Promise Rejection: ${reason.message}` : `Unhandled Promise Rejection: ${String(reason)}`;
    const stack = reason instanceof Error ? reason.stack : undefined;
    writeCrashLog('ERROR', msg, stack);
  });
}

export const logger = {
  trace: (message: string, ...args: unknown[]) => {
    if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.TRACE) {
      console.log(`[TRACE] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
  debug: (message: string, ...args: unknown[]) => {
    if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.INFO) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
};
