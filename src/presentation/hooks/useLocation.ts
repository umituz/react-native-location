import { useState, useCallback } from "react";
import { locationService } from "../../infrastructure/services/LocationService";
import { LocationData, LocationError } from "../../domain/entities/Location";

export interface UseLocationResult {
    location: LocationData | null;
    isLoading: boolean;
    error: LocationError | null;
    getCurrentLocation: () => Promise<LocationData | null>;
}

export function useLocation(): UseLocationResult {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<LocationError | null>(null);

    const getCurrentLocation = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await locationService.getCurrentPosition(true);
            setLocation(data);
            return data;
        } catch (err: any) {
            const errorObj = {
                code: err.code || "UNKNOWN_ERROR",
                message: err.message || "An unknown error occurred",
            };
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
