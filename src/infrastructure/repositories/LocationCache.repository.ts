/**
 * Infrastructure Layer - Location Cache Repository
 *
 * Storage repository wrapper implementing cache port.
 * Handles cache expiration logic.
 */

import { storageRepository, unwrap } from "@umituz/react-native-design-system/storage";
import { ICachePort, CachedLocationData } from "../../application/ports/ICachePort";

export class LocationCacheRepository implements ICachePort {
    async get(key: string): Promise<CachedLocationData | null> {
        try {
            const result = await storageRepository.getItem<CachedLocationData | null>(key, null);
            return unwrap(result, null);
        } catch {
            return null;
        }
    }

    async set(key: string, data: CachedLocationData): Promise<void> {
        try {
            await storageRepository.setItem(key, data);
        } catch {
            // Silent fail - cache write errors shouldn't block location fetching
        }
    }

    async remove(key: string): Promise<void> {
        try {
            await storageRepository.removeItem(key);
        } catch {
            // Silent fail
        }
    }

    async clear(): Promise<void> {
        // Not implemented - cache clearing not needed for location
        // Individual cache entries are removed when expired
    }
}

/**
 * Cache utilities
 */
export class CacheUtils {
    /**
     * Cache anahtarı oluştur
     */
    static generateKey(baseKey: string, withAddress: boolean): string {
        const suffix = withAddress ? "_addr" : "";
        return `location_cache_${baseKey}${suffix}`;
    }

    /**
     * Cache yaşını hesapla (ms)
     */
    static getAge(cachedTimestamp: number): number {
        return Date.now() - cachedTimestamp;
    }

    /**
     * Cache expired mi?
     */
    static isExpired(cachedTimestamp: number, maxDuration: number): boolean {
        return this.getAge(cachedTimestamp) > maxDuration;
    }
}
