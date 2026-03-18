/**
 * Application Layer - Location Service Port
 *
 * Core location operations interface.
 * Defines what location services can do, not how.
 */

import { LocationData, LocationAddress, LocationConfig } from "../../types/location.types";

export interface ILocationPort {
    /**
     * Mevcut konumu al
     */
    getCurrentPosition(): Promise<LocationData>;

    /**
     * Son bilinen konumu al
     */
    getLastKnownPosition(): Promise<LocationData | null>;

    /**
     * Reverse geocoding
     */
    reverseGeocode(latitude: number, longitude: number): Promise<LocationAddress | undefined>;

    /**
     * Location servisleri açık mı?
     */
    isLocationEnabled(): Promise<boolean>;

    /**
     * Permission durumu
     */
    getPermissionStatus(): Promise<string>;
}

/**
 * Location watcher için callback interface
 */
export interface ILocationWatcherPort {
    /**
     * Konum değişikliklerini dinle
     */
    watchPosition(
        onSuccess: (location: LocationData) => void,
        onError?: (error: Error) => void
    ): Promise<void>;

    /**
     * Dinlemeyi durdur
     */
    clearWatch(): void;

    /**
     * Dinliyor mu?
     */
    isWatching(): boolean;
}
