import * as Location from "expo-location";
import {
    LocationData,
    LocationError,
    LocationErrorCode,
    LocationWatcherOptions,
} from "../../types/location.types";

export class LocationWatcher {
    private static readonly VALID_ERROR_CODES: readonly LocationErrorCode[] = [
        "PERMISSION_DENIED",
        "TIMEOUT",
        "UNKNOWN_ERROR",
    ] as const;

    private subscription: Location.LocationSubscription | null = null;
    private options: LocationWatcherOptions;

    constructor(options: LocationWatcherOptions = {}) {
        this.options = options;
    }

    async watchPosition(
        onSuccess: (location: LocationData) => void,
        onError?: (error: LocationError) => void,
    ): Promise<void> {
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
            if (__DEV__) console.error("[LocationWatcher] Error watching position:", error);

            let code: LocationErrorCode = "UNKNOWN_ERROR";
            let message = "Unknown error watching location";

            if (error instanceof Error) {
                message = error.message;
                if ("code" in error && typeof error.code === "string") {
                    if (LocationWatcher.VALID_ERROR_CODES.includes(error.code as LocationErrorCode)) {
                        code = error.code as LocationErrorCode;
                    }
                }
            }

            onError?.({ code, message });
        }
    }

    clearWatch(): void {
        if (this.subscription) {
            if (__DEV__) console.log("[LocationWatcher] Clearing location watch");
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

            if (__DEV__) console.log("[LocationWatcher] Requesting permissions...");
            const { status } = await Location.requestForegroundPermissionsAsync();
            return status === "granted";
        } catch (error) {
            if (__DEV__) console.error("[LocationWatcher] Error requesting permissions:", error);
            return false;
        }
    }
}
