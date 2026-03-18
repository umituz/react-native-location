/**
 * Presentation Layer - useLocation Hook
 *
 * Refactored using domain errors and ports.
 * Simplified error handling using LocationErrors.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { LocationService } from "../../infrastructure/services/LocationService";
import { LocationCacheRepository } from "../../infrastructure/repositories/LocationCache.repository";
import { LocationLogger } from "../../infrastructure/services/LocationLoggerService";
import { LocationData, LocationError, LocationConfig } from "../../types/location.types";
import { LocationErrors } from "../../domain/errors/LocationErrors";
import { ILoggerPort } from "../../application/ports/ILoggerPort";

// Default logger instance
const defaultLogger: ILoggerPort = new LocationLogger("useLocation");

export interface UseLocationResult {
    location: LocationData | null;
    isLoading: boolean;
    error: LocationError | null;
    getCurrentLocation: () => Promise<LocationData | null>;
}

/**
 * Stable reference generator for config comparison
 */
function getStableReference(obj: unknown): string {
    return JSON.stringify(obj ?? {});
}

export function useLocation(
    config?: LocationConfig,
    logger: ILoggerPort = defaultLogger
): UseLocationResult {
    // Stable references for config and service
    const configStringRef = useRef<string>(getStableReference(config));
    const serviceRef = useRef<LocationService | null>(null);

    // Update service when config changes
    const currentConfigString = getStableReference(config);
    if (configStringRef.current !== currentConfigString) {
        configStringRef.current = currentConfigString;
        serviceRef.current = new LocationService(
            new LocationCacheRepository(),
            logger,
            config
        );
    }

    // Initialize service on first render
    if (!serviceRef.current) {
        serviceRef.current = new LocationService(new LocationCacheRepository(), logger, config);
    }

    const [location, setLocation] = useState<LocationData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<LocationError | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const getCurrentLocation = useCallback(async () => {
        if (!serviceRef.current) return null;

        setIsLoading(true);
        setError(null);

        try {
            const data = await serviceRef.current.getCurrentPosition();
            if (mountedRef.current) {
                setLocation(data);
            }
            return data;
        } catch (err) {
            const locationError: LocationError = {
                code: LocationErrors.extractErrorCode(err),
                message: LocationErrors.extractMessage(err),
            };

            if (mountedRef.current) {
                setError(locationError);
            }
            return null;
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [configStringRef]);

    return { location, isLoading, error, getCurrentLocation };
}
