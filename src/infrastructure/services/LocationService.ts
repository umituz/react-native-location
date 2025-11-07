/**
 * Location Service Implementation
 *
 * Handles device location retrieval, permissions, caching, and reverse geocoding
 * with intelligent fallback strategies
 *
 * Features:
 * - Multi-tier accuracy fallback (High → Balanced → Cached)
 * - 15-minute location caching for performance
 * - Reverse geocoding with coordinate fallback
 * - Platform detection (iOS/Android only, no web)
 * - Silent failures (no console logging)
 * - AsyncStorage persistence
 *
 * Dependencies:
 * - expo-location (GPS and permissions API)
 * - AsyncStorage (cache persistence)
 *
 * USAGE:
 * ```typescript
 * import { locationService } from '@umituz/react-native-location';
 *
 * // Check permission
 * const hasPermission = await locationService.hasPermissions();
 *
 * // Request permission if needed
 * if (!hasPermission) {
 *   const granted = await locationService.requestPermissions();
 * }
 *
 * // Get current location
 * const location = await locationService.getCurrentLocation();
 * if (location) {
 *   console.log(location.latitude, location.longitude);
 *   console.log(locationService.formatLocation(location));
 * }
 * ```
 */

import { Platform } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  LocationData,
  LocationPermissionStatus,
  CachedLocation,
  ILocationService,
} from '../../domain/entities/Location';
import { LOCATION_CONSTANTS } from '../../domain/entities/Location';

class LocationService implements ILocationService {
  private cachedLocation: LocationData | null = null;
  private cachedAt: number = 0;
  private permissionStatus: LocationPermissionStatus = 'unknown';

  constructor() {
    this.loadCachedLocation();
  }

  /**
   * Check if location services are available on this platform
   */
  isLocationAvailable(): boolean {
    // Location services not available on web
    if (Platform.OS === 'web') {
      return false;
    }
    return true;
  }

  /**
   * Load cached location from AsyncStorage
   */
  private async loadCachedLocation(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(LOCATION_CONSTANTS.CACHE_KEY);
      if (cached) {
        const parsed: CachedLocation = JSON.parse(cached);
        if (Date.now() - parsed.cachedAt < LOCATION_CONSTANTS.CACHE_DURATION) {
          this.cachedLocation = parsed.data;
          this.cachedAt = parsed.cachedAt;
        } else {
          // Expired cache, remove it
          await AsyncStorage.removeItem(LOCATION_CONSTANTS.CACHE_KEY);
        }
      }
    } catch (error) {
      // Silent failure on cache load
    }
  }

  /**
   * Save location to cache (AsyncStorage + memory)
   */
  private async saveCachedLocation(location: LocationData): Promise<void> {
    try {
      const cached: CachedLocation = {
        data: location,
        cachedAt: Date.now(),
      };
      this.cachedLocation = location;
      this.cachedAt = cached.cachedAt;
      await AsyncStorage.setItem(
        LOCATION_CONSTANTS.CACHE_KEY,
        JSON.stringify(cached)
      );
    } catch (error) {
      // Silent failure on cache save
    }
  }

  /**
   * Get cached location if available and not expired
   */
  getCachedLocation(): LocationData | null {
    if (!this.cachedLocation) {
      return null;
    }
    const age = Date.now() - this.cachedAt;
    if (age < LOCATION_CONSTANTS.CACHE_DURATION) {
      return { ...this.cachedLocation, isCached: true };
    }
    return null;
  }

  /**
   * Request location permissions from user
   */
  async requestPermissions(): Promise<boolean> {
    if (!this.isLocationAvailable()) {
      this.permissionStatus = 'denied';
      return false;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.permissionStatus = status === 'granted' ? 'granted' : 'denied';
      return status === 'granted';
    } catch (error) {
      this.permissionStatus = 'denied';
      return false;
    }
  }

  /**
   * Check if location permissions are granted
   */
  async hasPermissions(): Promise<boolean> {
    if (!this.isLocationAvailable()) {
      return false;
    }

    // Use cached permission status if available
    if (this.permissionStatus !== 'unknown') {
      return this.permissionStatus === 'granted';
    }

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      this.permissionStatus = status === 'granted' ? 'granted' : 'denied';
      return status === 'granted';
    } catch (error) {
      this.permissionStatus = 'denied';
      return false;
    }
  }

  /**
   * Get permission status without requesting
   */
  getPermissionStatus(): LocationPermissionStatus {
    return this.permissionStatus;
  }

  /**
   * Get current location with fallback strategies
   * Priority: High accuracy → Balanced accuracy → Cached location → null
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    if (!this.isLocationAvailable()) {
      return null;
    }

    try {
      const hasPermission = await this.hasPermissions();

      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          // Return cached location if available
          return this.getCachedLocation();
        }
      }

      // Try high accuracy first
      let locationData = await this.getLocationWithAccuracy(
        Location.Accuracy.High,
        LOCATION_CONSTANTS.HIGH_ACCURACY_TIMEOUT
      );

      // Fallback to balanced accuracy if high accuracy fails
      if (!locationData) {
        locationData = await this.getLocationWithAccuracy(
          Location.Accuracy.Balanced,
          LOCATION_CONSTANTS.BALANCED_ACCURACY_TIMEOUT
        );
      }

      // Fallback to cached location
      if (!locationData) {
        return this.getCachedLocation();
      }

      // Cache the new location
      await this.saveCachedLocation(locationData);

      return locationData;
    } catch (error) {
      // Return cached location as last resort
      return this.getCachedLocation();
    }
  }

  /**
   * Get location with specific accuracy and timeout
   */
  private async getLocationWithAccuracy(
    accuracy: Location.LocationAccuracy,
    timeout: number
  ): Promise<LocationData | null> {
    try {
      const location = (await Promise.race([
        Location.getCurrentPositionAsync({ accuracy }),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout)
        ),
      ])) as Location.LocationObject | null;

      if (!location) {
        return null;
      }

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
        accuracy: location.coords.accuracy ?? undefined,
        isCached: false,
      };

      // Try to get address (reverse geocoding)
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addresses && addresses.length > 0) {
          const address = addresses[0];
          const addressParts = [address.street, address.city, address.region].filter(
            Boolean
          );

          locationData.address =
            addressParts.join(', ') || 'Unknown location';
        }
      } catch (error) {
        // Fallback to coordinates if geocoding fails
        locationData.address = `${location.coords.latitude.toFixed(
          LOCATION_CONSTANTS.COORDINATE_PRECISION
        )}, ${location.coords.longitude.toFixed(LOCATION_CONSTANTS.COORDINATE_PRECISION)}`;
      }

      return locationData;
    } catch (error) {
      return null;
    }
  }

  /**
   * Format location for display (address or coordinates)
   */
  formatLocation(location: LocationData): string {
    if (location.address) {
      return location.address;
    }
    return `${location.latitude.toFixed(
      LOCATION_CONSTANTS.COORDINATE_PRECISION
    )}, ${location.longitude.toFixed(LOCATION_CONSTANTS.COORDINATE_PRECISION)}`;
  }
}

/**
 * Singleton instance
 * Use this for all location operations
 */
export const locationService = new LocationService();
