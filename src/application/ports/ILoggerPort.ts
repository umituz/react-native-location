/**
 * Application Layer - Logger Port
 *
 * Logging abstraction for dependency inversion.
 * Implementation can be easily swapped.
 */

export enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
}

export interface ILoggerPort {
    debug(message: string, context?: string): void;
    info(message: string, context?: string): void;
    warn(message: string, context?: string): void;
    error(message: string, error?: unknown, context?: string): void;
}

/**
 * No-op logger (production default)
 */
export class NoOpLogger implements ILoggerPort {
    debug(): void {}
    info(): void {}
    warn(): void {}
    error(): void {}
}
