import { Coordinates, DistanceUnit } from "../../types/location.types";

export class LocationUtils {
    private static readonly EARTH_RADIUS_KM = 6371;
    private static readonly EARTH_RADIUS_MILES = 3959;
    private static readonly EARTH_RADIUS_METERS = 6371000;

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
        return (
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
        );
    }

    static isValidAccuracy(accuracy: number | null | undefined, maxAccuracy = 100): boolean {
        if (accuracy === null || accuracy === undefined) {
            return false;
        }
        return accuracy > 0 && accuracy <= maxAccuracy;
    }

    static formatAccuracy(accuracy: number | null | undefined): string {
        if (accuracy === null || accuracy === undefined) {
            return "Unknown";
        }

        if (accuracy < 10) {
            return "Excellent (±" + Math.round(accuracy) + "m)";
        }
        if (accuracy < 50) {
            return "Good (±" + Math.round(accuracy) + "m)";
        }
        if (accuracy < 100) {
            return "Fair (±" + Math.round(accuracy) + "m)";
        }
        return "Poor (±" + Math.round(accuracy) + "m)";
    }

    static coordinatesAreEqual(
        coord1: Coordinates,
        coord2: Coordinates,
        precision = 6
    ): boolean {
        const lat1 = coord1.latitude.toFixed(precision);
        const lat2 = coord2.latitude.toFixed(precision);
        const lon1 = coord1.longitude.toFixed(precision);
        const lon2 = coord2.longitude.toFixed(precision);

        return lat1 === lat2 && lon1 === lon2;
    }
}
