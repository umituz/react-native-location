/**
 * Infrastructure Layer - Location Logger Service
 *
 * Console-based logger implementation.
 * Uses __DEV__ checks for production optimization.
 */

import { ILoggerPort, LogLevel } from "../../application/ports/ILoggerPort";

export class LocationLogger implements ILoggerPort {
    private readonly context: string;
    private readonly enabled: boolean;

    constructor(context: string, enabled = __DEV__) {
        this.context = context;
        this.enabled = enabled;
    }

    private log(level: LogLevel, message: string, ...args: unknown[]): void {
        if (!this.enabled) return;

        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level}] [${this.context}]`;

        switch (level) {
            case LogLevel.DEBUG:
            case LogLevel.INFO:
                console.log(prefix, message, ...args);
                break;
            case LogLevel.WARN:
                console.warn(prefix, message, ...args);
                break;
            case LogLevel.ERROR:
                console.error(prefix, message, ...args);
                break;
        }
    }

    debug(message: string, context?: string): void {
        const ctx = context || this.context;
        this.log(LogLevel.DEBUG, message, `[${ctx}]`);
    }

    info(message: string, context?: string): void {
        const ctx = context || this.context;
        this.log(LogLevel.INFO, message, `[${ctx}]`);
    }

    warn(message: string, context?: string): void {
        const ctx = context || this.context;
        this.log(LogLevel.WARN, message, `[${ctx}]`);
    }

    error(message: string, error?: unknown, context?: string): void {
        const ctx = context || this.context;
        this.log(LogLevel.ERROR, message, `[${ctx}]`, error);
    }
}
