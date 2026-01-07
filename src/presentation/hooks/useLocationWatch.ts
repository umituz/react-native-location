import { useEffect, useRef, useState, useCallback } from "react";
import { createLocationWatcher } from "../../infrastructure/services/LocationWatcher";
import { LocationData, LocationError, LocationWatcherOptions } from "../../types/location.types";

export interface UseLocationWatchResult {
    location: LocationData | null;
    error: LocationError | null;
    isWatching: boolean;
    startWatching: () => Promise<void>;
    stopWatching: () => void;
}

export function useLocationWatch(options?: LocationWatcherOptions): UseLocationWatchResult {
    const watcherRef = useRef<ReturnType<typeof createLocationWatcher> | null>(null);
    const [location, setLocation] = useState<LocationData | null>(null);
    const [error, setError] = useState<LocationError | null>(null);
    const [isWatching, setIsWatching] = useState(false);

    const stopWatching = useCallback(() => {
        if (watcherRef.current) {
            watcherRef.current.clearWatch();
            watcherRef.current = null;
            setIsWatching(false);
        }
    }, []);

    const startWatching = useCallback(async () => {
        stopWatching();

        const watcher = createLocationWatcher(options);
        watcherRef.current = watcher;

        try {
            await watcher.watchPosition(
                (data) => {
                    setLocation(data);
                    setError(null);
                },
                (err) => {
                    setError(err);
                }
            );
            setIsWatching(true);
        } catch (err) {
            let errorObj: LocationError = {
                code: "UNKNOWN_ERROR",
                message: "An unknown error occurred",
            };

            if (err && typeof err === "object" && "code" in err && "message" in err) {
                errorObj = {
                    code: typeof err.code === "string" ? err.code : "UNKNOWN_ERROR",
                    message: typeof err.message === "string" ? err.message : "An unknown error occurred",
                };
            }

            setError(errorObj);
            setIsWatching(false);
        }
    }, [options, stopWatching]);

    useEffect(() => {
        return () => {
            stopWatching();
        };
    }, [stopWatching]);

    return {
        location,
        error,
        isWatching,
        startWatching,
        stopWatching,
    };
}
