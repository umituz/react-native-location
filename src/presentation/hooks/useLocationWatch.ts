import { useEffect, useRef, useState, useCallback } from "react";
import { LocationWatcher } from "../../infrastructure/services/LocationWatcher";
import { LocationData, LocationError, LocationWatcherOptions } from "../../types/location.types";
import { LocationUtils } from "../../infrastructure/utils/LocationUtils";

export interface UseLocationWatchResult {
    location: LocationData | null;
    error: LocationError | null;
    isWatching: boolean;
    startWatching: () => Promise<void>;
    stopWatching: () => void;
}

export function useLocationWatch(options?: LocationWatcherOptions): UseLocationWatchResult {
    // Use stable reference for deep comparison of options object
    const optionsStringRef = useRef<string>(LocationUtils.getStableReference(options));
    const watcherRef = useRef<LocationWatcher | null>(null);
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
        setError(null);

        const watcher = new LocationWatcher(options);
        watcherRef.current = watcher;

        await watcher.watchPosition(
            (data) => {
                setLocation(data);
                setError(null);
            },
            (err) => {
                // Clear watcher reference on error to maintain consistent state
                watcherRef.current = null;
                setError(err);
                setIsWatching(false);
            },
        );

        if (watcher.isWatching()) {
            setIsWatching(true);
        }
    }, [optionsStringRef, stopWatching]); // Use string ref for stable dependency

    useEffect(() => {
        return () => {
            stopWatching();
        };
    }, [stopWatching]);

    return { location, error, isWatching, startWatching, stopWatching };
}
