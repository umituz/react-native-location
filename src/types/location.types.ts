import * as Location from "expo-location";

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface LocationAddress {
    city: string | null;
    region: string | null;
    country: string | null;
    street: string | null;
    formattedAddress: string | null;
}

export interface LocationData {
    coords: Coordinates;
    timestamp: number;
    address?: LocationAddress;
}

export type LocationErrorCode =
    | "PERMISSION_DENIED"
    | "TIMEOUT"
    | "UNKNOWN_ERROR";

export interface LocationError {
    code: LocationErrorCode;
    message: string;
}

export type DistanceUnit = "km" | "miles" | "meters";

export interface LocationConfig {
    accuracy?: Location.Accuracy;
    timeout?: number;
    enableCache?: boolean;
    cacheKey?: string;
    cacheDuration?: number;
    withAddress?: boolean;
}

export interface LocationWatcherOptions {
    accuracy?: Location.Accuracy;
    distanceInterval?: number;
    timeInterval?: number;
}
