---
name: setup-react-native-location
description: Sets up location services for React Native apps with GPS tracking, permissions, geocoding, and caching. Triggers on: Setup location, install location services, GPS tracking, useLocation, geolocation, reverse geocoding, location permissions.
---

# Setup React Native Location

Comprehensive setup for `@umituz/react-native-location` - Device location services with GPS, permissions, and geocoding.

## Overview

This skill handles everything needed to integrate location services into your React Native or Expo app:
- Package installation and updates
- Location permissions setup
- GPS tracking
- Reverse geocoding
- Location caching
- Background location updates

## Quick Start

Just say: **"Setup location services in my app"** and this skill will handle everything.

**Features Included:**
- GPS location tracking
- Permission handling
- Reverse geocoding (address from coordinates)
- Location caching
- Background location updates
- Geofencing support

## When to Use

Invoke this skill when you need to:
- Install @umituz/react-native-location
- Set up GPS tracking
- Add location permissions
- Implement reverse geocoding
- Add geofencing features
- Track user location

## Step 1: Analyze the Project

### Check package.json

```bash
cat package.json | grep "@umituz/react-native-location"
npm list @umituz/react-native-location
```

### Detect Project Type

```bash
cat app.json | grep -q "expo" && echo "Expo" || echo "Bare RN"
```

## Step 2: Install Package

### Install or Update

```bash
npm install @umituz/react-native-location@latest
```

### Install Dependencies

```bash
# Expo projects
npx expo install expo-location

# Bare React Native
npm install react-native-geolocation-service
```

## Step 3: Configure Permissions

### For Expo (app.json/app.config.js)

Add to your app config:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location.",
          "locationWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location while using the app."
        }
      ]
    }
  }
}
```

### For Bare React Native

**iOS (ios/ProjectName/Info.plist):**

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use your location while using the app.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use your location in the background.</string>
```

**Android (android/app/src/main/AndroidManifest.xml):**

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

## Step 4: Use Location Hook

### Get Current Location

```typescript
import { useLocation } from '@umituz/react-native-location';

export function LocationScreen() {
  const {
    location,
    isLoading,
    error,
    requestPermission,
    getCurrentLocation,
  } = useLocation({
    enableBackground: false,
    distanceFilter: 10, // meters
  });

  const handleGetLocation = async () => {
    const hasPermission = await requestPermission();
    if (hasPermission) {
      await getCurrentLocation();
    }
  };

  return (
    <View>
      {location && (
        <Text>
          Latitude: {location.coords.latitude}
          Longitude: {location.coords.longitude}
        </Text>
      )}

      {isLoading && <ActivityIndicator />}

      <Button title="Get Location" onPress={handleGetLocation} />
    </View>
  );
}
```

### Watch Location Changes

```typescript
import { useLocation } from '@umituz/react-native-location';

export function TrackingScreen() {
  const { location, startWatching, stopWatching } = useLocation({
    enableBackground: true,
    distanceFilter: 5, // Update every 5 meters
    updateInterval: 1000, // Or every 1 second
  });

  useEffect(() => {
    startWatching();

    return () => {
      stopWatching();
    };
  }, []);

  return (
    <View>
      <Text>
        Tracking: {location?.coords.latitude}, {location?.coords.longitude}
      </Text>
    </View>
  );
}
```

## Step 5: Reverse Geocoding

### Get Address from Coordinates

```typescript
import { useReverseGeocoding } from '@umituz/react-native-location';

export function GeocodingScreen() {
  const { reverseGeocode, isLoading, error } = useReverseGeocoding();

  const getAddress = async (latitude: number, longitude: number) => {
    try {
      const address = await reverseGeocode(latitude, longitude);
      console.log('Address:', address);
      // { street, city, state, country, postalCode, formattedAddress }
      return address;
    } catch (err) {
      console.error('Geocoding failed:', err);
    }
  };

  return (
    <Button
      title="Get Address"
      onPress={() => getAddress(37.7749, -122.4194)}
      disabled={isLoading}
    />
  );
}
```

## Step 6: Verify Setup

### Run the App

```bash
npx expo start
# or
npx react-native run-ios
```

### Verification Checklist

- ✅ Package installed
- ✅ Permissions configured
- ✅ Location access works
- ✅ GPS coordinates accurate
- ✅ Reverse geocoding works
- ✅ Background updates work (if enabled)

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Missing permissions | Add location permissions to app.json or Info.plist/AndroidManifest |
| Not requesting permission | Always call requestPermission() before getting location |
| Background not working | Enable "always" permission and background location |
| Geocoding fails | Check internet connection (requires online API) |
| Draining battery | Increase distanceFilter and updateInterval |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Permission denied"** | User denied permission - prompt to enable in settings |
| **"Location timeout"** | GPS signal weak - try again outdoors or near window |
| **"Geocoding failed"** | Check internet connection, API may be down |
| **"Background not working"** | Enable background location permission and capabilities |
| **"High battery usage"** | Increase distanceFilter and decrease update frequency |

## Summary

After setup, provide:

1. ✅ Package version installed
2. ✅ Permissions configured
3. ✅ Location tracking working
4. ✅ Reverse geocoding working
5. ✅ Verification status

---

**Compatible with:** @umituz/react-native-location@latest
**Platforms:** React Native (Expo & Bare)
**Permissions:** Required (location when-in-use, always optional for background)
**API:** Uses native location services and geocoding APIs
