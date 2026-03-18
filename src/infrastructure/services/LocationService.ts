/**
 * Infrastructure Layer - Location Service
 *
 * Refactored location service using domain services and ports.
 * DRY principle - no code duplication.
 */

import * as Location from "expo-location";
import { LocationData, LocationAddress, LocationConfig } from "../../types/location.types";
import { ILocationPort } from "../../application/ports/ILocationPort";
import { ICachePort } from "../../application/ports/ICachePort";
import { ILoggerPort } from "../../application/ports/ILoggerPort";
import { PermissionService } from "../../domain/services/PermissionService";
import { LocationErrors } from "../../domain/errors/LocationErrors";
import { CacheUtils } from "../repositories/LocationCache.repository";

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

export class LocationService implements ILocationPort {
    private config: Required<LocationConfig>;
    private inFlightRequest: Promise<LocationData> | null = null;

    constructor(
        private cache: ICachePort,
        private logger: ILoggerPort,
        config: LocationConfig = {}
    ) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    async getCurrentPosition(): Promise<LocationData> {
        // Request deduplication
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
        // Cache check
        const cached = await this.getCachedLocation();
        if (cached) return cached;

        // Permission check
        const hasPermission = await PermissionService.request();
        if (!hasPermission) {
            throw LocationErrors.permissionDenied();
        }

        // Fetch with timeout
        const location = await this.getPositionWithTimeout();

        // Optional reverse geocoding
        let address: LocationAddress | undefined;
        if (this.config.withAddress) {
            address = await this.reverseGeocode(
                location.coords.latitude,
                location.coords.longitude
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
    }

    private async getCachedLocation(): Promise<LocationData | null> {
        if (!this.config.enableCache) return null;

        const cacheKey = CacheUtils.generateKey(this.config.cacheKey, this.config.withAddress);
        const cached = await this.cache.get(cacheKey);

        if (!cached) return null;

        if (CacheUtils.isExpired(cached.timestamp, this.config.cacheDuration)) {
            await this.cache.remove(cacheKey);
            return null;
        }

        this.logger.debug("Using cached location");
        return cached.location;
    }

    private async cacheLocation(location: LocationData): Promise<void> {
        if (!this.config.enableCache) return;

        const cacheKey = CacheUtils.generateKey(this.config.cacheKey, this.config.withAddress);
        const data: CachedLocationData = { location, timestamp: Date.now() };

        await this.cache.set(cacheKey, data);
    }

    private async getPositionWithTimeout(): Promise<Location.LocationObject> {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const locationPromise = Location.getCurrentPositionAsync({
            accuracy: this.config.accuracy,
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(
                    LocationErrors.timeout(
                        `Location request timed out after ${this.config.timeout}ms`
                    )
                );
            }, this.config.timeout);
        });

        try {
            return await Promise.race([locationPromise, timeoutPromise]);
        } finally {
            if (timeoutId !== null) clearTimeout(timeoutId);
        }
    }

    async reverseGeocode(latitude: number, longitude: number): Promise<LocationAddress | undefined> {
        try {
            const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (!address) return undefined;

            return this.buildAddress(address);
        } catch (error) {
            this.logger.error("Reverse geocode failed", error);
            return undefined;
        }
    }

    private buildAddress(
        address: Pick<Location.LocationGeocodedAddress, "street" | "city" | "region" | "country">
    ): LocationAddress {
        const parts = [address.street, address.city, address.region, address.country].filter(
            Boolean
        ) as string[];

        return {
            city: address.city ?? null,
            region: address.region ?? null,
            country: address.country ?? null,
            street: address.street ?? null,
            formattedAddress: parts.length > 0 ? parts.join(", ") : null,
        };
    }

    async isLocationEnabled(): Promise<boolean> {
        return PermissionService.areServicesEnabled();
    }

    async getPermissionStatus(): Promise<string> {
        return await PermissionService.getStatus();
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
            this.logger.error("Error getting last known position", error);
            return null;
        }
    }
}
