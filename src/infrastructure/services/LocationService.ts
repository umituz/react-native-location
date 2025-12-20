import * as Location from "expo-location";
import { LocationData, LocationError } from "../../domain/entities/Location";

export class LocationService {
    /**
     * Requests foreground location permissions.
     * @returns boolean indicating if permission was granted.
     */
    async requestPermissions(): Promise<boolean> {
        try {
            console.log("[LocationService] Requesting permissions...");
            const { status } = await Location.requestForegroundPermissionsAsync();
            console.log("[LocationService] Permission status:", status);
            return status === "granted";
        } catch (error) {
            console.error("[LocationService] Error requesting permissions:", error);
            return false;
        }
    }

    /**
     * Gets the current position of the device.
     * @param withAddress If true, also performs reverse geocoding.
     */
    async getCurrentPosition(withAddress: boolean = false): Promise<LocationData> {
        console.log("[LocationService] getCurrentPosition called");
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
            console.warn("[LocationService] Permission denied");
            throw { code: "PERMISSION_DENIED", message: "Location permission not granted" };
        }

        try {
            console.log("[LocationService] getting position async...");
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            console.log("[LocationService] position obtained", location);

            let addressData;
            if (withAddress) {
                console.log("[LocationService] reverse geocoding...");
                addressData = await this.reverseGeocode(
                    location.coords.latitude,
                    location.coords.longitude
                );
                console.log("[LocationService] address obtained", addressData);
            }

            return {
                coords: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                },
                timestamp: location.timestamp,
                address: addressData,
            };
        } catch (error) {
            console.error("[LocationService] Error getting location:", error);
            // Type guard for error object
            const errorMessage = error instanceof Error ? error.message : "Unknown error getting location";
            throw { code: "LOCATION_ERROR", message: errorMessage };
        }
    }

    /**
     * Reverse geocodes coordinates to an address.
     */
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
            console.warn("[LocationService] Reverse geocode failed:", error);
            return undefined;
        }
    }
}

export const locationService = new LocationService();
