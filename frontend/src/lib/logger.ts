type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

const currentLevel: LogLevel = 
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug') as LogLevel;

function formatLevel(level: LogLevel): string {
  return level.toUpperCase().padEnd(5);
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export const logger = {
  trace(message: string, context?: unknown) {
    if (shouldLog('trace')) {
      console.log(`[TRACE] ${message}`, context ?? '');
    }
  },
  debug(message: string, context?: unknown) {
    if (shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, context ?? '');
    }
  },
  info(message: string, context?: unknown) {
    if (shouldLog('info')) {
      console.info(`[INFO]  ${message}`, context ?? '');
    }
  },
  warn(message: string, context?: unknown) {
    if (shouldLog('warn')) {
      console.warn(`[WARN]  ${message}`, context ?? '');
    }
  },
  error(message: string, context?: unknown) {
    if (shouldLog('error')) {
      console.error(`[ERROR] ${message}`, context ?? '');
    }
  },
};
