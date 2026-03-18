/**
 * Domain Layer - Permission Service
 *
 * Location permission yönetimi için merkezi servis.
 * Hem LocationService hem LocationWatcher tarafından kullanılır (DRY prensibi).
 */

import * as Location from "expo-location";

export class PermissionService {
    /**
     * Mevcut permission durumunu kontrol et
     */
    static async getStatus(): Promise<Location.PermissionStatus> {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            return status;
        } catch {
            return Location.PermissionStatus.UNDETERMINED;
        }
    }

    /**
     * Permission zaten verilmiş mi?
     */
    static async isGranted(): Promise<boolean> {
        const status = await this.getStatus();
        return status === "granted";
    }

    /**
     * Permission iste (eğer gerekirse)
     */
    static async request(): Promise<boolean> {
        try {
            // Önce mevcut durumu kontrol et
            if (await this.isGranted()) {
                return true;
            }

            // Permission iste
            const { status } = await Location.requestForegroundPermissionsAsync();
            return status === "granted";
        } catch {
            return false;
        }
    }

    /**
     * Location servislerinin açık olup olmadığını kontrol et
     */
    static async areServicesEnabled(): Promise<boolean> {
        try {
            return await Location.hasServicesEnabledAsync();
        } catch {
            return false;
        }
    }
}
