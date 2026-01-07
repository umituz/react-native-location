import * as Location from "expo-location";
import {
    LocationData,
    LocationError,
    LocationCallback,
    LocationErrorCallback,
    LocationWatcherOptions,
    LocationErrorImpl,
    LocationErrorCode,
} from "../../types/location.types";

declare const __DEV__: boolean;

export class LocationWatcher {
    private subscription: Location.LocationSubscription | null = null;
    private options: LocationWatcherOptions;

    constructor(options: LocationWatcherOptions = {}) {
        this.options = options;
    }

    private log(message: string, ...args: unknown[]): void {
        if (__DEV__) {
            console.log(`[LocationWatcher] ${message}`, ...args);
        }
    }

    private logError(message: string, error: unknown): void {
        if (__DEV__) {
            console.error(`[LocationWatcher] ${message}`, error);
        }
    }

    async watchPosition(
        onSuccess: LocationCallback,
        onError?: LocationErrorCallback
    ): Promise<string> {
        try {
            this.log("Requesting permissions...");
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                const error: LocationError = {
                    code: "PERMISSION_DENIED",
                    message: "Location permission not granted",
                };
                if (onError) {
                    onError(error);
                }
                throw new LocationErrorImpl("PERMISSION_DENIED", "Location permission not granted");
            }

            this.log("Starting location watch...");

            this.subscription = await Location.watchPositionAsync(
                {
                    accuracy: this.options.accuracy || Location.Accuracy.Balanced,
                },
                (location) => {
                    this.log("Location update received", location);

                    const locationData: LocationData = {
                        coords: {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        },
                        timestamp: location.timestamp,
                    };

                    onSuccess(locationData);
                }
            );

            return "watching";
        } catch (error) {
            this.logError("Error watching position:", error);

            let errorCode: LocationErrorCode = "UNKNOWN_ERROR";
            let errorMessage = "Unknown error watching location";

            if (error instanceof LocationErrorImpl) {
                errorCode = error.code;
                errorMessage = error.message;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            const locationError: LocationError = {
                code: errorCode,
                message: errorMessage,
            };

            if (onError) {
                onError(locationError);
            }

            throw new LocationErrorImpl(errorCode, errorMessage);
        }
    }

    clearWatch(): void {
        if (this.subscription) {
            this.log("Clearing location watch");
            this.subscription.remove();
            this.subscription = null;
        }
    }

    isWatching(): boolean {
        return this.subscription !== null;
    }
}

export function createLocationWatcher(options?: LocationWatcherOptions): LocationWatcher {
    return new LocationWatcher(options);
}
