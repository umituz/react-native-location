/**
 * Location Domain Entities
 *
 * Core location types and interfaces for device location services
 * and geolocation features
 *
 * Features:
 * - Current location retrieval with GPS
 * - Location permission management
 * - Location caching (15-minute cache)
 * - Reverse geocoding (address lookup)
 * - Fallback strategies (High → Balanced → Cached)
 * - Platform-aware (iOS/Android only, no web)
 *
 * Dependencies:
 * - expo-location (GPS and permissions)
 * - AsyncStorage (location cache)
 */

/**
 * Location data with coordinates and optional address
 */
export interface LocationData {
  /** Latitude coordinate */
  latitude: number;

  /** Longitude coordinate */
  longitude: number;

  /** Human-readable address (reverse geocoded) */
  address?: string;

  /** Timestamp when location was captured (milliseconds since epoch) */
  timestamp: number;

  /** GPS accuracy in meters (lower is better) */
  accuracy?: number;

  /** Whether this location is from cache (not fresh GPS) */
  isCached?: boolean;
}

/**
 * Location permission status
 */
export type LocationPermissionStatus = 'granted' | 'denied' | 'unknown';

/**
 * Location accuracy levels for GPS
 */
export enum LocationAccuracy {
  /** Lowest accuracy, fastest response, battery-friendly */
  Lowest = 1,

  /** Low accuracy */
  Low = 2,

  /** Balanced accuracy (recommended for most use cases) */
  Balanced = 3,

  /** High accuracy (GPS-based) */
  High = 4,

  /** Highest accuracy (most battery-intensive) */
  Highest = 5,

  /** Best for navigation (continuous high accuracy) */
  BestForNavigation = 6,
}

/**
 * Location cache configuration
 */
export interface LocationCacheConfig {
  /** Cache duration in milliseconds (default: 15 minutes) */
  duration: number;

  /** Storage key for cached location */
  storageKey: string;
}

/**
 * Location retrieval configuration
 */
export interface LocationRetrievalConfig {
  /** Timeout for high accuracy request (milliseconds) */
  highAccuracyTimeout: number;

  /** Timeout for balanced accuracy request (milliseconds) */
  balancedAccuracyTimeout: number;

  /** Whether to enable reverse geocoding (address lookup) */
  enableGeocoding: boolean;
}

/**
 * Cached location storage format
 */
export interface CachedLocation {
  /** Location data */
  data: LocationData;

  /** Timestamp when location was cached (milliseconds since epoch) */
  cachedAt: number;
}

/**
 * Location Service Interface
 * Defines all location-related operations
 */
export interface ILocationService {
  /**
   * Request location permissions from user
   * @returns Promise resolving to true if granted, false otherwise
   */
  requestPermissions(): Promise<boolean>;

  /**
   * Check if location permissions are granted
   * @returns Promise resolving to true if granted, false otherwise
   */
  hasPermissions(): Promise<boolean>;

  /**
   * Get current permission status without requesting
   * @returns Current permission status ('granted' | 'denied' | 'unknown')
   */
  getPermissionStatus(): LocationPermissionStatus;

  /**
   * Get current device location with fallback strategies
   * Priority: High accuracy → Balanced accuracy → Cached location → null
   * @returns Promise resolving to LocationData or null if unavailable
   */
  getCurrentLocation(): Promise<LocationData | null>;

  /**
   * Get cached location if available and not expired
   * @returns Cached location or null
   */
  getCachedLocation(): LocationData | null;

  /**
   * Format location for display (address or coordinates)
   * @param location - LocationData to format
   * @returns Formatted string (address or "lat, lng")
   */
  formatLocation(location: LocationData): string;

  /**
   * Check if location services are available on this platform
   * @returns True if available (iOS/Android), false otherwise (web)
   */
  isLocationAvailable(): boolean;
}

/**
 * Location service constants
 */
export const LOCATION_CONSTANTS = {
  /** Cache duration: 15 minutes */
  CACHE_DURATION: 15 * 60 * 1000,

  /** High accuracy timeout: 15 seconds */
  HIGH_ACCURACY_TIMEOUT: 15000,

  /** Balanced accuracy timeout: 8 seconds */
  BALANCED_ACCURACY_TIMEOUT: 8000,

  /** AsyncStorage key for cached location */
  CACHE_KEY: '@location_cache',

  /** Coordinate decimal precision for display */
  COORDINATE_PRECISION: 4,
} as const;
