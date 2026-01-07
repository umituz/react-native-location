import * as Location from "expo-location";
import { storageRepository, unwrap } from "@umituz/react-native-storage";
import {
    LocationData,
    LocationConfig,
    DEFAULT_LOCATION_CONFIG,
    CachedLocationData,
    LocationErrorImpl,
    LocationErrorCode,
} from "../../types/location.types";

declare const __DEV__: boolean;

export class LocationService {
    private config: LocationConfig;
    private storage = storageRepository;

    constructor(config: LocationConfig = {}) {
        this.config = { ...DEFAULT_LOCATION_CONFIG, ...config };
    }

    private log(message: string, ...args: unknown[]): void {
        if (__DEV__) {
            console.log(`[LocationService] ${message}`, ...args);
        }
    }

    private logError(message: string, error: unknown): void {
        if (__DEV__) {
            console.error(`[LocationService] ${message}`, error);
        }
    }

    private logWarn(message: string, ...args: unknown[]): void {
        if (__DEV__) {
            console.warn(`[LocationService] ${message}`, ...args);
        }
    }

    async requestPermissions(): Promise<boolean> {
        try {
            this.log("Requesting permissions...");
            const { status } = await Location.requestForegroundPermissionsAsync();
            this.log("Permission status:", status);
            return status === "granted";
        } catch (error) {
            this.logError("Error requesting permissions:", error);
            return false;
        }
    }

    private async getCachedLocation(): Promise<LocationData | null> {
        if (!this.config.enableCache) {
            return null;
        }

        try {
            const cacheKey = `location_cache_${this.config.cacheKey}`;
            const result = await this.storage.getItem<CachedLocationData | null>(cacheKey, null);
            const cached = unwrap(result, null);

            if (!cached) {
                this.log("No cached location found");
                return null;
            }

            const now = Date.now();
            const cacheAge = now - cached.timestamp;
            const cacheDuration = this.config.cacheDuration || 300000;

            if (cacheAge > cacheDuration) {
                this.log("Cache expired");
                await this.storage.removeItem(cacheKey);
                return null;
            }

            this.log("Using cached location");
            return cached.location;
        } catch (error) {
            this.logError("Cache read error:", error);
            return null;
        }
    }

    private async cacheLocation(location: LocationData): Promise<void> {
        if (!this.config.enableCache) {
            return;
        }

        try {
            const cacheKey = `location_cache_${this.config.cacheKey}`;
            const cachedData: CachedLocationData = {
                location,
                timestamp: Date.now(),
            };
            await this.storage.setItem(cacheKey, cachedData);
            this.log("Location cached successfully");
        } catch (error) {
            this.logError("Cache write error:", error);
        }
    }

    async getCurrentPosition(): Promise<LocationData> {
        const withAddress = this.config.withAddress ?? true;

        this.log("getCurrentPosition called");

        const cached = await this.getCachedLocation();
        if (cached) {
            this.log("Returning cached location");
            return cached;
        }

        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
            this.logWarn("Permission denied");
            throw new LocationErrorImpl("PERMISSION_DENIED", "Location permission not granted");
        }

        try {
            this.log("Getting position...");
            const location = await Location.getCurrentPositionAsync({
                accuracy: this.config.accuracy,
            });
            this.log("Position obtained", location);

            let addressData;
            if (withAddress) {
                this.log("Reverse geocoding...");
                addressData = await this.reverseGeocode(
                    location.coords.latitude,
                    location.coords.longitude
                );
                this.log("Address obtained", addressData);
            }

            const locationData: LocationData = {
                coords: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                },
                timestamp: location.timestamp,
                address: addressData,
            };

            await this.cacheLocation(locationData);

            return locationData;
        } catch (error) {
            this.logError("Error getting location:", error);

            let errorCode: LocationErrorCode = "UNKNOWN_ERROR";
            let errorMessage = "Unknown error getting location";

            if (error instanceof LocationErrorImpl) {
                errorCode = error.code;
                errorMessage = error.message;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            throw new LocationErrorImpl(errorCode, errorMessage);
        }
    }

    async reverseGeocode(latitude: number, longitude: number) {
        try {
            const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (!address) return undefined;

            return {
                city: address.city,
                region: address.region,
                country: address.country,
                street: address.street,
                formattedAddress: [address.city, address.country].filter(Boolean).join(", "),
            };
        } catch (error) {
            this.logWarn("Reverse geocode failed:", error);
            return undefined;
        }
    }
}

export function createLocationService(config?: LocationConfig): LocationService {
    return new LocationService(config);
}
