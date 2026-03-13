import * as Location from "expo-location";
import { storageRepository, unwrap } from "@umituz/react-native-design-system/storage";
import {
    LocationData,
    LocationAddress,
    LocationConfig,
    LocationError,
    LocationErrorCode,
} from "../../types/location.types";
import { LocationUtils } from "../utils/LocationUtils";

interface CachedLocationData {
    location: LocationData;
    timestamp: number;
}

const DEFAULT_CONFIG: Required<LocationConfig> = {
    accuracy: Location.Accuracy.Balanced,
    timeout: 10000,
    enableCache: true,
    cacheKey: "default",
    cacheDuration: 300000,
    withAddress: true,
};

export class LocationService {
    private config: Required<LocationConfig>;
    private inFlightRequest: Promise<LocationData> | null = null;

    constructor(config: LocationConfig = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    async requestPermissions(): Promise<boolean> {
        try {
            const { status: current } = await Location.getForegroundPermissionsAsync();
            if (current === "granted") return true;

            if (__DEV__) console.log("[LocationService] Requesting permissions...");
            const { status } = await Location.requestForegroundPermissionsAsync();
            return status === "granted";
        } catch (error) {
            if (__DEV__) console.error("[LocationService] Error requesting permissions:", error);
            return false;
        }
    }

    private getCacheKey(): string {
        return LocationUtils.generateCacheKey(this.config.cacheKey, this.config.withAddress);
    }

    private async getCachedLocation(): Promise<LocationData | null> {
        if (!this.config.enableCache) return null;

        try {
            const cacheKey = this.getCacheKey();
            const result = await storageRepository.getItem<CachedLocationData | null>(cacheKey, null);
            const cached = unwrap(result, null);

            if (!cached) return null;

            if (LocationUtils.isCacheExpired(cached.timestamp, this.config.cacheDuration)) {
                await storageRepository.removeItem(cacheKey);
                return null;
            }

            if (__DEV__) console.log("[LocationService] Using cached location");
            return cached.location;
        } catch (error) {
            if (__DEV__) console.error("[LocationService] Cache read error:", error);
            return null;
        }
    }

    private async cacheLocation(location: LocationData): Promise<void> {
        if (!this.config.enableCache) return;

        try {
            const data: CachedLocationData = { location, timestamp: Date.now() };
            await storageRepository.setItem(this.getCacheKey(), data);
        } catch (error) {
            if (__DEV__) console.error("[LocationService] Cache write error:", error);
        }
    }

    async getCurrentPosition(): Promise<LocationData> {
        if (this.inFlightRequest) {
            return this.inFlightRequest;
        }

        this.inFlightRequest = this.fetchPosition();
        try {
            return await this.inFlightRequest;
        } finally {
            this.inFlightRequest = null;
        }
    }

    private async fetchPosition(): Promise<LocationData> {
        const cached = await this.getCachedLocation();
        if (cached) return cached;

        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
            throw this.createError("PERMISSION_DENIED", "Location permission not granted");
        }

        try {
            const location = await this.getPositionWithTimeout();

            let address: LocationAddress | undefined;
            if (this.config.withAddress) {
                address = await this.reverseGeocode(
                    location.coords.latitude,
                    location.coords.longitude,
                );
            }

            const locationData: LocationData = {
                coords: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                },
                timestamp: location.timestamp,
                address,
            };

            await this.cacheLocation(locationData);
            return locationData;
        } catch (error) {
            if (__DEV__) console.error("[LocationService] Error getting location:", error);

            const message = error instanceof Error ? error.message : "Unknown error getting location";
            throw this.createError("UNKNOWN_ERROR", message);
        }
    }

    private async getPositionWithTimeout(): Promise<Location.LocationObject> {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const locationPromise = Location.getCurrentPositionAsync({
            accuracy: this.config.accuracy,
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(this.createError("TIMEOUT", `Location request timed out after ${this.config.timeout}ms`));
            }, this.config.timeout);
        });

        try {
            const result = await Promise.race([locationPromise, timeoutPromise]);
            return result;
        } finally {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
        }
    }

    async reverseGeocode(latitude: number, longitude: number): Promise<LocationAddress | undefined> {
        try {
            const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (!address) return undefined;

            return LocationUtils.buildFormattedAddress(address);
        } catch (error) {
            if (__DEV__) console.error("[LocationService] Reverse geocode failed:", error);
            return undefined;
        }
    }

    async isLocationEnabled(): Promise<boolean> {
        try {
            return await Location.hasServicesEnabledAsync();
        } catch (error) {
            if (__DEV__) console.error("[LocationService] Error checking location enabled:", error);
            return false;
        }
    }

    async getPermissionStatus(): Promise<Location.PermissionStatus> {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            return status;
        } catch (error) {
            if (__DEV__) console.error("[LocationService] Error getting permission status:", error);
            return Location.PermissionStatus.UNDETERMINED;
        }
    }

    async getLastKnownPosition(): Promise<LocationData | null> {
        try {
            const location = await Location.getLastKnownPositionAsync();
            if (!location) return null;

            return {
                coords: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                },
                timestamp: location.timestamp,
            };
        } catch (error) {
            if (__DEV__) console.error("[LocationService] Error getting last known position:", error);
            return null;
        }
    }

    private createError(code: LocationErrorCode, message: string): LocationError & Error {
        const error = new Error(message) as Error & LocationError;
        error.name = "LocationError";
        error.code = code;
        return error;
    }
}
