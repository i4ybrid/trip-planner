// Logger with configurable log levels

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
