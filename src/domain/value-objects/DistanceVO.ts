/**
 * Domain Layer - Distance Value Object
 *
 * Mesafe hesaplama işlemleri.
 * Haversine formula implementation.
 */

import { Coordinates, DistanceUnit } from "../../types/location.types";

export class DistanceVO {
    private static readonly EARTH_RADIUS_KM = 6371;
    private static readonly EARTH_RADIUS_MILES = 3959;
    private static readonly EARTH_RADIUS_METERS = 6371000;

    /**
     * İki koordinat arasındaki mesafeyi hesapla (Haversine)
     */
    static calculate(
        from: Coordinates,
        to: Coordinates,
        unit: DistanceUnit = "km"
    ): number {
        const lat1Rad = this.toRadians(from.latitude);
        const lat2Rad = this.toRadians(to.latitude);
        const deltaLatRad = this.toRadians(to.latitude - from.latitude);
        const deltaLonRad = this.toRadians(to.longitude - from.longitude);

        const a = this.calculateHaversineA(lat1Rad, lat2Rad, deltaLatRad, deltaLonRad);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return this.multiplyByRadius(c, unit);
    }

    private static toRadians(degrees: number): number {
        return (degrees * Math.PI) / 180;
    }

    private static calculateHaversineA(
        lat1Rad: number,
        lat2Rad: number,
        deltaLatRad: number,
        deltaLonRad: number
    ): number {
        return (
            Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) *
            Math.cos(lat2Rad) *
            Math.sin(deltaLonRad / 2) *
            Math.sin(deltaLonRad / 2)
        );
    }

    private static multiplyByRadius(c: number, unit: DistanceUnit): number {
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
}
