/**
 * Presentation Layer - useLocationWatch Hook
 *
 * Refactored using LocationWatcher and domain services.
 * Simplified state management.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { LocationWatcher } from "../../infrastructure/services/LocationWatcherService";
import { LocationLogger } from "../../infrastructure/services/LocationLoggerService";
import { LocationData, LocationError, LocationWatcherOptions } from "../../types/location.types";
import { ILoggerPort } from "../../application/ports/ILoggerPort";
import { LocationErrors } from "../../domain/errors/LocationErrors";

// Default logger instance
const defaultLogger: ILoggerPort = new LocationLogger("useLocationWatch");

export interface UseLocationWatchResult {
    location: LocationData | null;
    error: LocationError | null;
    isWatching: boolean;
    startWatching: () => Promise<void>;
    stopWatching: () => void;
}

/**
 * Stable reference generator for options comparison
 */
function getStableReference(obj: unknown): string {
    return JSON.stringify(obj ?? {});
}

export function useLocationWatch(
    options?: LocationWatcherOptions,
    logger: ILoggerPort = defaultLogger
): UseLocationWatchResult {
    // Stable reference for options
    const optionsStringRef = useRef<string>(getStableReference(options));
    const watcherRef = useRef<LocationWatcher | null>(null);

    // State
    const [location, setLocation] = useState<LocationData | null>(null);
    const [error, setError] = useState<LocationError | null>(null);
    const [isWatching, setIsWatching] = useState(false);

    // Initialize watcher on first render
    if (!watcherRef.current) {
        watcherRef.current = new LocationWatcher(logger, options);
    }

    const stopWatching = useCallback(() => {
        if (watcherRef.current) {
            watcherRef.current.clearWatch();
            setIsWatching(false);
        }
    }, []);

    const startWatching = useCallback(async () => {
        if (!watcherRef.current) return;

        stopWatching();
        setError(null);

        // Recreate watcher if options changed
        const currentOptionsString = getStableReference(options);
        if (optionsStringRef.current !== currentOptionsString) {
            optionsStringRef.current = currentOptionsString;
            watcherRef.current = new LocationWatcher(logger, options);
        }

        await watcherRef.current.watchPosition(
            (data) => {
                setLocation(data);
                setError(null);
            },
            (err) => {
                const locationError: LocationError = {
                    code: LocationErrors.extractErrorCode(err),
                    message: LocationErrors.extractMessage(err),
                };
                setError(locationError);
                setIsWatching(false);
            }
        );

        if (watcherRef.current.isWatching()) {
            setIsWatching(true);
        }
    }, [optionsStringRef, stopWatching, logger, options]);

    useEffect(() => {
        return () => {
            stopWatching();
        };
    }, [stopWatching]);

    return { location, error, isWatching, startWatching, stopWatching };
}
