# React Native Location Skills

Claude Code skills for `@umituz/react-native-location` - Location services.

## Installation

```bash
npx skills add /Users/umituz/Desktop/github/umituz/apps/mobile/npm-packages/react-native-location/skills/SKILL.md -g
```

## Usage

Say: **"Setup location services in my app"**

## Features

- GPS location tracking
- Permission handling
- Reverse geocoding (coordinates → address)
- Location caching
- Background location updates
- Geofencing support

## Permissions Required

**When-in-use:** Required for foreground tracking
**Always:** Optional, for background tracking

## Hooks

- `useLocation` - Current location and tracking
- `useReverseGeocoding` - Convert coordinates to address
