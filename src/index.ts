/**
 * Location Domain - Barrel Export
 *
 * Global infrastructure domain for device location services and geolocation
 *
 * Features:
 * - Current location retrieval with GPS
 * - Location permission management (iOS/Android)
 * - 15-minute location caching for performance
 * - Reverse geocoding (coordinates → address)
 * - Multi-tier accuracy fallback (High → Balanced → Cached)
 * - Platform-aware (iOS/Android only, no web support)
 * - Silent failures (no console logging)
 *
 * Dependencies:
 * - expo-location (GPS and permissions API)
 * - AsyncStorage (cache persistence)
 *
 * USAGE:
 * ```typescript
 * // Recommended: Use hook in components
 * import { useLocation } from '@umituz/react-native-location';
 *
 * const MyComponent = () => {
 *   const {
 *     location,
 *     loading,
 *     hasPermission,
 *     requestPermission,
 *     getCurrentLocation,
 *     formatLocation,
 *   } = useLocation();
 *
 *   useEffect(() => {
 *     // Auto-fetch on mount
 *     getCurrentLocation();
 *   }, []);
 *
 *   if (loading) return <LoadingIndicator />;
 *
 *   return (
 *     <View>
 *       {location && (
 *         <>
 *           <Text>Location: {formatLocation(location)}</Text>
 *           <Text>Lat: {location.latitude}</Text>
 *           <Text>Lng: {location.longitude}</Text>
 *           {location.accuracy && (
 *             <Text>Accuracy: {location.accuracy.toFixed(0)}m</Text>
 *           )}
 *         </>
 *       )}
 *       <AtomicButton onPress={getCurrentLocation}>
 *         Refresh Location
 *       </AtomicButton>
 *     </View>
 *   );
 * };
 *
 * // Alternative: Use service directly (for non-component code)
 * import { locationService } from '@umituz/react-native-location';
 *
 * const location = await locationService.getCurrentLocation();
 * if (location) {
 *   console.log(locationService.formatLocation(location));
 * }
 * ```
 *
 * PLATFORM SUPPORT:
 * - ✅ iOS: Full support (GPS, permissions, geocoding)
 * - ✅ Android: Full support (GPS, permissions, geocoding)
 * - ❌ Web: Not supported (returns null)
 *
 * PERMISSION FLOW:
 * 1. Check: hasPermissions() → true/false
 * 2. Request: requestPermissions() → true/false
 * 3. Retrieve: getCurrentLocation() → LocationData | null
 *
 * FALLBACK STRATEGY:
 * 1. High accuracy GPS (15s timeout)
 * 2. Balanced accuracy GPS (8s timeout)
 * 3. Cached location (15min cache)
 * 4. null (no location available)
 *
 * CACHING:
 * - Duration: 15 minutes
 * - Storage: AsyncStorage (@location_cache)
 * - Auto-refresh: On getCurrentLocation() if expired
 */

// Domain Entities
export type {
  LocationData,
  LocationPermissionStatus,
  CachedLocation,
  LocationCacheConfig,
  LocationRetrievalConfig,
  ILocationService,
} from './domain/entities/Location';
export { LocationAccuracy, LOCATION_CONSTANTS } from './domain/entities/Location';

// Infrastructure Services
export { locationService } from './infrastructure/services/LocationService';

// Presentation Hooks
export { useLocation } from './presentation/hooks/useLocation';
export type { UseLocationReturn } from './presentation/hooks/useLocation';
