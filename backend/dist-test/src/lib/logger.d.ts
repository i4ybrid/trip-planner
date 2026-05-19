export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
export declare const setLogLevel: (level: LogLevel) => void;
export declare const getLogLevel: () => LogLevel;
export declare function writeCrashLog(level: LogLevel, message: string, stack?: string): void;
export declare function registerGlobalErrorHandlers(): void;
export declare const logger: {
    trace: (message: string, ...args: unknown[]) => void;
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
};
//# sourceMappingURL=logger.d.ts.map