import { useState, useCallback, useRef, useEffect } from "react";
import { LocationService } from "../../infrastructure/services/LocationService";
import { LocationData, LocationError, LocationConfig, LocationErrorCode } from "../../types/location.types";

export interface UseLocationResult {
    location: LocationData | null;
    isLoading: boolean;
    error: LocationError | null;
    getCurrentLocation: () => Promise<LocationData | null>;
}

export function useLocation(config?: LocationConfig): UseLocationResult {
    const configRef = useRef(config);
    const serviceRef = useRef(new LocationService(config));

    if (configRef.current !== config) {
        configRef.current = config;
        serviceRef.current = new LocationService(config);
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
        setIsLoading(true);
        setError(null);

        try {
            const data = await serviceRef.current.getCurrentPosition();
            if (mountedRef.current) {
                setLocation(data);
            }
            return data;
        } catch (err) {
            const errorObj: LocationError = {
                code: extractErrorCode(err),
                message: err instanceof Error ? err.message : "An unknown error occurred",
            };

            if (mountedRef.current) {
                setError(errorObj);
            }
            return null;
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    return { location, isLoading, error, getCurrentLocation };
}

function extractErrorCode(err: unknown): LocationErrorCode {
    if (err instanceof Error && "code" in err && typeof (err as { code: unknown }).code === "string") {
        return (err as { code: string }).code as LocationErrorCode;
    }
    return "UNKNOWN_ERROR";
}
