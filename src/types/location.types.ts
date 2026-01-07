import * as Location from "expo-location";

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface LocationAddress {
    city?: string | null;
    region?: string | null;
    country?: string | null;
    street?: string | null;
    formattedAddress?: string | null;
}

export interface LocationData {
    coords: Coordinates;
    timestamp: number;
    address?: LocationAddress;
}

export interface LocationError {
    code: string;
    message: string;
}

export interface CachedLocationData {
    location: LocationData;
    timestamp: number;
}

export type DistanceUnit = "km" | "miles" | "meters";

export type LocationErrorCode =
    | "PERMISSION_DENIED"
    | "LOCATION_UNAVAILABLE"
    | "TIMEOUT"
    | "CACHE_ERROR"
    | "UNKNOWN_ERROR";

export interface LocationConfig {
    accuracy?: Location.Accuracy;
    timeout?: number;
    enableCache?: boolean;
    cacheKey?: string;
    cacheDuration?: number;
    withAddress?: boolean;
    distanceFilter?: number;
}

export const DEFAULT_LOCATION_CONFIG: LocationConfig = {
    accuracy: Location.Accuracy.Balanced,
    timeout: 10000,
    enableCache: true,
    cacheKey: "default",
    cacheDuration: 300000,
    withAddress: true,
    distanceFilter: 10,
};

export type LocationCallback = (location: LocationData) => void;
export type LocationErrorCallback = (error: LocationError) => void;

export interface LocationWatcherOptions {
    accuracy?: Location.Accuracy;
    distanceFilter?: number;
    timeout?: number;
}

export class LocationErrorImpl extends Error implements LocationError {
    code: LocationErrorCode;

    constructor(code: LocationErrorCode, message: string) {
        super(message);
        this.name = "LocationError";
        this.code = code;
    }
}
