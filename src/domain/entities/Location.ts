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
