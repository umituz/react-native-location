# @umituz/react-native-location

Device location services for React Native with GPS, permissions, caching, and reverse geocoding.

## Installation

```bash
npm install @umituz/react-native-location
```

## Peer Dependencies

- `react` >= 18.2.0
- `react-native` >= 0.74.0
- `expo-location` *
- `@react-native-async-storage/async-storage` *

## Features

- ✅ Current location retrieval with GPS
- ✅ Location permission management (iOS/Android)
- ✅ 15-minute location caching for performance
- ✅ Reverse geocoding (coordinates → address)
- ✅ Multi-tier accuracy fallback (High → Balanced → Cached)
- ✅ Platform-aware (iOS/Android only, no web support)

## Usage

### Using Hook (Recommended)

```typescript
import { useLocation } from '@umituz/react-native-location';

const MyComponent = () => {
  const {
    location,
    loading,
    hasPermission,
    requestPermission,
    getCurrentLocation,
    formatLocation,
  } = useLocation();

  useEffect(() => {
    // Auto-fetch on mount
    getCurrentLocation();
  }, []);

  if (loading) return <LoadingIndicator />;

  return (
    <View>
      {location && (
        <>
          <Text>Location: {formatLocation(location)}</Text>
          <Text>Lat: {location.latitude}</Text>
          <Text>Lng: {location.longitude}</Text>
          {location.accuracy && (
            <Text>Accuracy: {location.accuracy.toFixed(0)}m</Text>
          )}
        </>
      )}
      <Button onPress={getCurrentLocation}>
        Refresh Location
      </Button>
    </View>
  );
};
```

### Using Service Directly

```typescript
import { locationService } from '@umituz/react-native-location';

// Check permission
const hasPermission = await locationService.hasPermissions();

// Request permission if needed
if (!hasPermission) {
  const granted = await locationService.requestPermissions();
}

// Get current location
const location = await locationService.getCurrentLocation();
if (location) {
  console.log(locationService.formatLocation(location));
}
```

## Platform Support

- ✅ iOS: Full support (GPS, permissions, geocoding)
- ✅ Android: Full support (GPS, permissions, geocoding)
- ❌ Web: Not supported (returns null)

## Permission Flow

1. Check: `hasPermissions()` → true/false
2. Request: `requestPermissions()` → true/false
3. Retrieve: `getCurrentLocation()` → LocationData | null

## Fallback Strategy

1. High accuracy GPS (15s timeout)
2. Balanced accuracy GPS (8s timeout)
3. Cached location (15min cache)
4. null (no location available)

## Caching

- Duration: 15 minutes
- Storage: AsyncStorage
- Auto-refresh: On `getCurrentLocation()` if expired

## Hooks

- `useLocation()` - Main hook for location operations

## Services

- `locationService` - Direct service access for location operations

## License

MIT

