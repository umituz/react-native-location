import { useState, useCallback, useRef, useEffect } from "react";
import { LocationService } from "../../infrastructure/services/LocationService";
import { LocationData, LocationError, LocationConfig, LocationErrorCode } from "../../types/location.types";
import { LocationUtils } from "../../infrastructure/utils/LocationUtils";

const VALID_ERROR_CODES: readonly LocationErrorCode[] = ["PERMISSION_DENIED", "TIMEOUT", "UNKNOWN_ERROR"] as const;

export interface UseLocationResult {
    location: LocationData | null;
    isLoading: boolean;
    error: LocationError | null;
    getCurrentLocation: () => Promise<LocationData | null>;
}

export function useLocation(config?: LocationConfig): UseLocationResult {
    // Use stable reference for deep comparison of config object
    const configStringRef = useRef<string>(LocationUtils.getStableReference(config));
    const serviceRef = useRef(new LocationService(config));

    const currentConfigString = LocationUtils.getStableReference(config);
    if (configStringRef.current !== currentConfigString) {
        configStringRef.current = currentConfigString;
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
            // Extract and validate error code inline
            let code: LocationErrorCode = "UNKNOWN_ERROR";
            if (err instanceof Error && "code" in err && typeof err.code === "string") {
                if (VALID_ERROR_CODES.includes(err.code as LocationErrorCode)) {
                    code = err.code as LocationErrorCode;
                }
            }

            const errorObj: LocationError = {
                code,
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
    }, [configStringRef]);

    return { location, isLoading, error, getCurrentLocation };
}
