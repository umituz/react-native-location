/**
 * Application Layer - Cache Port
 *
 * Cache abstraction for dependency inversion.
 * Decouples from specific storage implementation.
 */

import { LocationData } from "../../types/location.types";

export interface CachedLocationData {
    location: LocationData;
    timestamp: number;
}

export interface ICachePort {
    /**
     * Cache'den location al
     */
    get(key: string): Promise<CachedLocationData | null>;

    /**
     * Location'ı cache'le
     */
    set(key: string, data: CachedLocationData): Promise<void>;

    /**
     * Cache'i temizle
     */
    remove(key: string): Promise<void>;

    /**
     * Tüm cache'i temizle
     */
    clear(): Promise<void>;
}
