/**
 * useLocation Hook
 *
 * React hook for device location services
 * Wraps locationService with React-friendly state management
 *
 * Features:
 * - Get current location with loading state
 * - Permission management
 * - Cached location access
 * - Error handling
 * - Format locations for display
 *
 * USAGE:
 * ```typescript
 * import { useLocation } from '@umituz/react-native-location';
 *
 * const MyComponent = () => {
 *   const {
 *     location,
 *     loading,
 *     error,
 *     hasPermission,
 *     requestPermission,
 *     getCurrentLocation,
 *     getCached,
 *     formatLocation,
 *   } = useLocation();
 *
 *   useEffect(() => {
 *     // Auto-fetch location on mount
 *     getCurrentLocation();
 *   }, []);
 *
 *   if (loading) return <LoadingIndicator />;
 *   if (error) return <ErrorMessage message={error} />;
 *
 *   return (
 *     <View>
 *       {location && (
 *         <Text>Location: {formatLocation(location)}</Text>
 *       )}
 *       <AtomicButton onPress={getCurrentLocation}>
 *         Refresh Location
 *       </AtomicButton>
 *     </View>
 *   );
 * };
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { locationService } from '../../infrastructure/services/LocationService';
import type {
  LocationData,
  LocationPermissionStatus,
} from '../../domain/entities/Location';

export interface UseLocationReturn {
  /** Current location data (null if not retrieved) */
  location: LocationData | null;

  /** Loading state during location retrieval */
  loading: boolean;

  /** Error message if location retrieval failed */
  error: string | null;

  /** Current permission status */
  permissionStatus: LocationPermissionStatus;

  /** Whether location permissions are granted */
  hasPermission: boolean;

  /** Whether location services are available on this platform */
  isAvailable: boolean;

  /**
   * Request location permissions from user
   * @returns Promise resolving to true if granted
   */
  requestPermission: () => Promise<boolean>;

  /**
   * Get current location with fallback strategies
   * Updates location state and handles errors
   */
  getCurrentLocation: () => Promise<void>;

  /**
   * Get cached location if available
   * @returns Cached location or null
   */
  getCached: () => LocationData | null;

  /**
   * Format location for display
   * @param loc - LocationData to format
   * @returns Formatted string (address or coordinates)
   */
  formatLocation: (loc: LocationData) => string;

  /**
   * Clear current location state
   */
  clearLocation: () => void;
}

/**
 * Hook for device location services
 */
export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus>('unknown');

  // Check if location services are available
  const isAvailable = locationService.isLocationAvailable();

  // Check initial permission status
  useEffect(() => {
    const checkPermission = async () => {
      const hasPermission = await locationService.hasPermissions();
      setPermissionStatus(
        hasPermission ? 'granted' : locationService.getPermissionStatus()
      );
    };

    if (isAvailable) {
      checkPermission();
    }
  }, [isAvailable]);

  /**
   * Request location permissions
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) {
      setError('Location services not available on this platform');
      setPermissionStatus('denied');
      return false;
    }

    try {
      const granted = await locationService.requestPermissions();
      setPermissionStatus(granted ? 'granted' : 'denied');

      if (!granted) {
        setError('Location permission denied');
      }

      return granted;
    } catch (err) {
      setError('Failed to request location permission');
      setPermissionStatus('denied');
      return false;
    }
  }, [isAvailable]);

  /**
   * Get current location with fallback strategies
   */
  const getCurrentLocation = useCallback(async (): Promise<void> => {
    if (!isAvailable) {
      setError('Location services not available on this platform');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const currentLocation = await locationService.getCurrentLocation();

      if (currentLocation) {
        setLocation(currentLocation);
        setError(null);
      } else {
        setError('Unable to retrieve location');
      }
    } catch (err) {
      setError('Failed to get location');
    } finally {
      setLoading(false);
    }
  }, [isAvailable]);

  /**
   * Get cached location
   */
  const getCached = useCallback((): LocationData | null => {
    return locationService.getCachedLocation();
  }, []);

  /**
   * Format location for display
   */
  const formatLocation = useCallback((loc: LocationData): string => {
    return locationService.formatLocation(loc);
  }, []);

  /**
   * Clear location state
   */
  const clearLocation = useCallback((): void => {
    setLocation(null);
    setError(null);
  }, []);

  return {
    location,
    loading,
    error,
    permissionStatus,
    hasPermission: permissionStatus === 'granted',
    isAvailable,
    requestPermission,
    getCurrentLocation,
    getCached,
    formatLocation,
    clearLocation,
  };
};
