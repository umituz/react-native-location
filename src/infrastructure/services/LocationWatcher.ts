import * as Location from "expo-location";
import {
    LocationData,
    LocationError,
    LocationErrorCode,
    LocationWatcherOptions,
} from "../../types/location.types";

type LocationCallback = (location: LocationData) => void;
type ErrorCallback = (error: LocationError) => void;

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

    async watchPosition(onSuccess: LocationCallback, onError?: ErrorCallback): Promise<void> {
        this.clearWatch();

        try {
            const granted = await this.ensurePermission();
            if (!granted) {
                onError?.({ code: "PERMISSION_DENIED", message: "Location permission not granted" });
                return;
            }

            this.subscription = await Location.watchPositionAsync(
                {
                    accuracy: this.options.accuracy ?? Location.Accuracy.Balanced,
                    distanceInterval: this.options.distanceInterval,
                    timeInterval: this.options.timeInterval,
                },
                (location) => {
                    onSuccess({
                        coords: {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        },
                        timestamp: location.timestamp,
                    });
                },
            );
        } catch (error) {
            this.logError("Error watching position:", error);

            let code: LocationErrorCode = "UNKNOWN_ERROR";
            let message = "Unknown error watching location";

            if (error instanceof Error) {
                message = error.message;
                if ("code" in error) {
                    code = (error as { code: string }).code as LocationErrorCode;
                }
            }

            onError?.({ code, message });
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

    private async ensurePermission(): Promise<boolean> {
        try {
            const { status: current } = await Location.getForegroundPermissionsAsync();
            if (current === "granted") return true;

            this.log("Requesting permissions...");
            const { status } = await Location.requestForegroundPermissionsAsync();
            return status === "granted";
        } catch (error) {
            this.logError("Error requesting permissions:", error);
            return false;
        }
    }
}
