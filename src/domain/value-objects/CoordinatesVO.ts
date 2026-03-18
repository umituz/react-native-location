/**
 * Domain Layer - Coordinates Value Object
 *
 * Koordinat validasyonu ve karşılaştırma işlemleri.
 * Immutable value object pattern.
 */

import { Coordinates } from "../../types/location.types";

export class CoordinatesVO {
    private static readonly LATITUDE_MIN = -90;
    private static readonly LATITUDE_MAX = 90;
    private static readonly LONGITUDE_MIN = -180;
    private static readonly LONGITUDE_MAX = 180;
    private static readonly DEFAULT_PRECISION = 6;

    /**
     * Koordinat validasyonu
     */
    static isValid(latitude: number, longitude: number): boolean {
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return false;
        }

        return (
            latitude >= this.LATITUDE_MIN &&
            latitude <= this.LATITUDE_MAX &&
            longitude >= this.LONGITUDE_MIN &&
            longitude <= this.LONGITUDE_MAX
        );
    }

    /**
     * İki koordinat eşit mi (belirtilen hassasiyette)
     */
    static areEqual(
        coord1: Coordinates,
        coord2: Coordinates,
        precision = this.DEFAULT_PRECISION
    ): boolean {
        const valid = [
            coord1.latitude,
            coord1.longitude,
            coord2.latitude,
            coord2.longitude,
        ].every(Number.isFinite);

        if (!valid) return false;

        const epsilon = Math.pow(10, -precision);
        return (
            Math.abs(coord1.latitude - coord2.latitude) < epsilon &&
            Math.abs(coord1.longitude - coord2.longitude) < epsilon
        );
    }

    /**
     * Koordinat object oluşturma (validasyon ile)
     */
    static create(latitude: number, longitude: number): Coordinates | null {
        if (!this.isValid(latitude, longitude)) {
            return null;
        }
        return { latitude, longitude };
    }
}
