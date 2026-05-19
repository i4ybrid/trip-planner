"use strict";
// Logger with configurable log levels
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.getLogLevel = exports.setLogLevel = void 0;
exports.writeCrashLog = writeCrashLog;
exports.registerGlobalErrorHandlers = registerGlobalErrorHandlers;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const LOG_LEVELS = {
    TRACE: 0,
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
};
// Get log level from environment variable
const getLogLevelFromEnv = () => {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
        return envLevel;
    }
    // Default to INFO in production, DEBUG in development
    return process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO';
};
let currentLogLevel = getLogLevelFromEnv();
// Allow runtime updates via environment
const setLogLevel = (level) => {
    currentLogLevel = level;
};
exports.setLogLevel = setLogLevel;
const getLogLevel = () => currentLogLevel;
exports.getLogLevel = getLogLevel;
// --- Crash log writer ---
const CRASH_LOG_DIR = path_1.default.resolve(__dirname, '../../log/crashes');
function ensureCrashLogDir() {
    if (!fs_1.default.existsSync(CRASH_LOG_DIR)) {
        fs_1.default.mkdirSync(CRASH_LOG_DIR, { recursive: true });
    }
}
function formatCrashEntry(level, message, stack) {
    const timestamp = new Date().toISOString();
    let entry = `[${timestamp}] [${level}] ${message}\n`;
    if (stack) {
        entry += `stack: ${stack}\n`;
    }
    entry += '---\n';
    return entry;
}
function writeCrashLog(level, message, stack) {
    try {
        ensureCrashLogDir();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `crash-${timestamp}.log`;
        const filepath = path_1.default.join(CRASH_LOG_DIR, filename);
        const content = formatCrashEntry(level, message, stack);
        fs_1.default.appendFileSync(filepath, content, 'utf-8');
    }
    catch (err) {
        // Fallback: log to stderr so we don't silently swallow write errors
        console.error('[CRASH-LOGGER] Failed to write crash log:', err);
    }
}
// --- Global crash handlers ---
function registerGlobalErrorHandlers() {
    process.on('uncaughtException', (err) => {
        const msg = `Uncaught Exception: ${err.message}`;
        writeCrashLog('ERROR', msg, err.stack);
        // Re-throw so the process still exits (default behavior)
        throw err;
    });
    process.on('unhandledRejection', (reason) => {
        const msg = reason instanceof Error ? `Unhandled Promise Rejection: ${reason.message}` : `Unhandled Promise Rejection: ${String(reason)}`;
        const stack = reason instanceof Error ? reason.stack : undefined;
        writeCrashLog('ERROR', msg, stack);
    });
}
exports.logger = {
    trace: (message, ...args) => {
        if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.TRACE) {
            console.log(`[TRACE] ${new Date().toISOString()} - ${message}`, ...args);
        }
    },
    debug: (message, ...args) => {
        if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.DEBUG) {
            console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
        }
    },
    info: (message, ...args) => {
        if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.INFO) {
            console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
        }
    },
    warn: (message, ...args) => {
        if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.WARN) {
            console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
        }
    },
    error: (message, ...args) => {
        if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.ERROR) {
            console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
        }
    },
};
//# sourceMappingURL=logger.js.map