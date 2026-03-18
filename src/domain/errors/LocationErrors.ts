/**
 * Domain Layer - Error Handling
 *
 * Merkezi error oluşturma ve validasyon.
 * Tüm location error'ları buradan üretilir (Single Responsibility).
 */

import { LocationErrorCode, LocationError } from "../../types/location.types";

export class LocationErrors {
    private static readonly VALID_ERROR_CODES: readonly LocationErrorCode[] = [
        "PERMISSION_DENIED",
        "TIMEOUT",
        "UNKNOWN_ERROR",
    ] as const;

    /**
     * Error code validation
     */
    static isValidErrorCode(code: string): code is LocationErrorCode {
        return this.VALID_ERROR_CODES.includes(code as LocationErrorCode);
    }

    /**
     * Error object'ten code çıkarma
     */
    static extractErrorCode(error: unknown): LocationErrorCode {
        if (error instanceof Error && "code" in error && typeof error.code === "string") {
            if (this.isValidErrorCode(error.code)) {
                return error.code;
            }
        }
        return "UNKNOWN_ERROR";
    }

    /**
     * Error mesajı çıkarma
     */
    static extractMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return "An unknown error occurred";
    }

    /**
     * Permission denied error
     */
    static permissionDenied(message = "Location permission not granted"): LocationError & Error {
        return this.createError("PERMISSION_DENIED", message);
    }

    /**
     * Timeout error
     */
    static timeout(message: string): LocationError & Error {
        return this.createError("TIMEOUT", message);
    }

    /**
     * Unknown error
     */
    static unknown(message: string): LocationError & Error {
        return this.createError("UNKNOWN_ERROR", message);
    }

    /**
     * Generic error factory
     */
    private static createError(code: LocationErrorCode, message: string): LocationError & Error {
        const error = new Error(message) as Error & LocationError;
        error.name = "LocationError";
        error.code = code;
        return error;
    }
}
