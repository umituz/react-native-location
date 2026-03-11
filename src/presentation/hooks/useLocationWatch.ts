import { useEffect, useRef, useState, useCallback } from "react";
import { LocationWatcher } from "../../infrastructure/services/LocationWatcher";
import { LocationData, LocationError, LocationWatcherOptions } from "../../types/location.types";

export interface UseLocationWatchResult {
    location: LocationData | null;
    error: LocationError | null;
    isWatching: boolean;
    startWatching: () => Promise<void>;
    stopWatching: () => void;
}

export function useLocationWatch(options?: LocationWatcherOptions): UseLocationWatchResult {
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
                setError(err);
                setIsWatching(false);
            },
        );

        if (watcher.isWatching()) {
            setIsWatching(true);
        }
    }, [options, stopWatching]);

    useEffect(() => {
        return () => {
            stopWatching();
        };
    }, [stopWatching]);

    return { location, error, isWatching, startWatching, stopWatching };
}
