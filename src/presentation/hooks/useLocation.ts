import { useState, useCallback, useRef } from "react";
import { createLocationService } from "../../infrastructure/services/LocationService";
import { LocationData, LocationError, LocationConfig } from "../../types/location.types";

export interface UseLocationResult {
    location: LocationData | null;
    isLoading: boolean;
    error: LocationError | null;
    getCurrentLocation: () => Promise<LocationData | null>;
}

export function useLocation(config?: LocationConfig): UseLocationResult {
    const serviceRef = useRef(createLocationService(config));
    const [location, setLocation] = useState<LocationData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<LocationError | null>(null);

    const getCurrentLocation = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await serviceRef.current.getCurrentPosition();
            setLocation(data);
            return data;
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
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        location,
        isLoading,
        error,
        getCurrentLocation,
    };
}
