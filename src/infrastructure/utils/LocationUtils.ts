import { Coordinates, DistanceUnit, LocationAddress } from "../../types/location.types";
import * as Location from "expo-location";

export class LocationUtils {
    private static readonly EARTH_RADIUS_KM = 6371;
    private static readonly EARTH_RADIUS_MILES = 3959;
    private static readonly EARTH_RADIUS_METERS = 6371000;

    // Accuracy thresholds in meters for classification
    private static readonly ACCURACY_EXCELLENT_THRESHOLD = 10;
    private static readonly ACCURACY_GOOD_THRESHOLD = 50;
    private static readonly ACCURACY_FAIR_THRESHOLD = 100;
    private static readonly DEFAULT_MAX_ACCURACY = 100;

    /**
     * Generates a cache key for location data
     * @param cacheKey Base cache key
     * @param withAddress Whether address is included
     * @returns Formatted cache key
     */
    static generateCacheKey(cacheKey: string, withAddress: boolean): string {
        const suffix = withAddress ? "_addr" : "";
        return `location_cache_${cacheKey}${suffix}`;
    }

    /**
     * Calculates the age of a cached location
     * @param cachedTimestamp Timestamp when location was cached
     * @returns Age in milliseconds
     */
    static getCacheAge(cachedTimestamp: number): number {
        return Date.now() - cachedTimestamp;
    }

    /**
     * Checks if cached location is expired
     * @param cachedTimestamp Timestamp when location was cached
     * @param cacheDuration Maximum cache duration in milliseconds
     * @returns True if cache is expired
     */
    static isCacheExpired(cachedTimestamp: number, cacheDuration: number): boolean {
        return LocationUtils.getCacheAge(cachedTimestamp) > cacheDuration;
    }

    /**
     * Builds a formatted address from Expo Location address object
     * @param address Expo Location address object (from reverseGeocodeAsync)
     * @returns Formatted LocationAddress
     */
    static buildFormattedAddress(
        address: Pick<Location.LocationGeocodedAddress, "street" | "city" | "region" | "country">
    ): LocationAddress {
        const addressParts = [
            address.street,
            address.city,
            address.region,
            address.country,
        ].filter((part): part is string => Boolean(part));

        return {
            city: address.city ?? null,
            region: address.region ?? null,
            country: address.country ?? null,
            street: address.street ?? null,
            formattedAddress: addressParts.length > 0 ? addressParts.join(", ") : null,
        };
    }

    /**
     * Deep compares two objects by JSON stringification
     * @param obj1 First object
     * @param obj2 Second object
     * @returns True if objects are deeply equal
     */
    static deepEqual(obj1: unknown, obj2: unknown): boolean {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    /**
     * Generates a stable string reference for deep comparison
     * @param obj Object to stringify
     * @returns JSON string representation
     */
    static getStableReference(obj: unknown): string {
        return JSON.stringify(obj ?? {});
    }

    static calculateDistance(
        from: Coordinates,
        to: Coordinates,
        unit: DistanceUnit = "km"
    ): number {
        const lat1Rad = (from.latitude * Math.PI) / 180;
        const lat2Rad = (to.latitude * Math.PI) / 180;
        const deltaLatRad = ((to.latitude - from.latitude) * Math.PI) / 180;
        const deltaLonRad = ((to.longitude - from.longitude) * Math.PI) / 180;

        const a =
            Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) *
                Math.cos(lat2Rad) *
                Math.sin(deltaLonRad / 2) *
                Math.sin(deltaLonRad / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        switch (unit) {
            case "miles":
                return this.EARTH_RADIUS_MILES * c;
            case "meters":
                return this.EARTH_RADIUS_METERS * c;
            case "km":
            default:
                return this.EARTH_RADIUS_KM * c;
        }
    }

    static isValidCoordinate(latitude: number, longitude: number): boolean {
        // Check for NaN and Infinity first
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return false;
        }

        return (
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
        );
    }

    static isValidAccuracy(accuracy: number | null | undefined, maxAccuracy = LocationUtils.DEFAULT_MAX_ACCURACY): boolean {
        if (accuracy === null || accuracy === undefined) {
            return false;
        }
        // Check for NaN and Infinity
        if (!Number.isFinite(accuracy)) {
            return false;
        }
        return accuracy > 0 && accuracy <= maxAccuracy;
    }

    static formatAccuracy(accuracy: number | null | undefined): string {
        if (accuracy === null || accuracy === undefined) {
            return "Unknown";
        }

        if (accuracy < LocationUtils.ACCURACY_EXCELLENT_THRESHOLD) {
            return "Excellent (±" + Math.round(accuracy) + "m)";
        }
        if (accuracy < LocationUtils.ACCURACY_GOOD_THRESHOLD) {
            return "Good (±" + Math.round(accuracy) + "m)";
        }
        if (accuracy < LocationUtils.ACCURACY_FAIR_THRESHOLD) {
            return "Fair (±" + Math.round(accuracy) + "m)";
        }
        return "Poor (±" + Math.round(accuracy) + "m)";
    }

    static coordinatesAreEqual(
        coord1: Coordinates,
        coord2: Coordinates,
        precision = 6
    ): boolean {
        // Check for NaN and Infinity first
        if (
            !Number.isFinite(coord1.latitude) ||
            !Number.isFinite(coord1.longitude) ||
            !Number.isFinite(coord2.latitude) ||
            !Number.isFinite(coord2.longitude)
        ) {
            return false;
        }

        const epsilon = Math.pow(10, -precision);
        return (
            Math.abs(coord1.latitude - coord2.latitude) < epsilon &&
            Math.abs(coord1.longitude - coord2.longitude) < epsilon
        );
    }
}
