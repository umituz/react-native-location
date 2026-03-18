/**
 * Infrastructure Layer - Location Watcher Service
 *
 * Refactored watcher using domain services.
 * Shares permission logic with LocationService (DRY).
 */

import * as Location from "expo-location";
import { LocationData, LocationWatcherOptions } from "../../types/location.types";
import { ILocationWatcherPort } from "../../application/ports/ILocationPort";
import { ILoggerPort } from "../../application/ports/ILoggerPort";
import { PermissionService } from "../../domain/services/PermissionService";
import { LocationErrors } from "../../domain/errors/LocationErrors";

const DEFAULT_OPTIONS: Required<LocationWatcherOptions> = {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 10,
    timeInterval: 10000,
};

export class LocationWatcher implements ILocationWatcherPort {
    private subscription: Location.LocationSubscription | null = null;
    private options: Required<LocationWatcherOptions>;

    constructor(
        private logger: ILoggerPort,
        options: LocationWatcherOptions = {}
    ) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    async watchPosition(
        onSuccess: (location: LocationData) => void,
        onError?: (error: Error) => void
    ): Promise<void> {
        this.clearWatch();

        // Permission check
        const hasPermission = await PermissionService.request();
        if (!hasPermission) {
            const error = LocationErrors.permissionDenied();
            onError?.(error);
            return;
        }

        try {
            this.subscription = await Location.watchPositionAsync(
                {
                    accuracy: this.options.accuracy,
                    distanceInterval: this.options.distanceInterval,
                    timeInterval: this.options.timeInterval,
                },
                (location) => {
                    onSuccess(this.mapToLocationData(location));
                }
            );

            this.logger.debug("Started watching location");
        } catch (error) {
            const locationError = this.handleError(error);
            onError?.(locationError);
        }
    }

    clearWatch(): void {
        if (this.subscription) {
            this.logger.debug("Clearing location watch");
            this.subscription.remove();
            this.subscription = null;
        }
    }

    isWatching(): boolean {
        return this.subscription !== null;
    }

    private mapToLocationData(location: Location.LocationObject): LocationData {
        return {
            coords: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            },
            timestamp: location.timestamp,
        };
    }

    private handleError(error: unknown): Error {
        this.logger.error("Error watching position", error);

        const code = LocationErrors.extractErrorCode(error);
        const message = LocationErrors.extractMessage(error);

        return LocationErrors.unknown(message);
    }
}
