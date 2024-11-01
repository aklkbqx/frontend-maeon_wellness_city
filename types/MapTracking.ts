export interface Coordinate {
    latitude: number;
    longitude: number;
}

export interface LocationObject {
    coords: {
        latitude: number;
        longitude: number;
        altitude: number | null;
        accuracy: number;
        altitudeAccuracy: number | null;
        heading: number | null;
        speed: number | null;
    };
    timestamp: number;
}

export interface MapTrackingProps {
    destinations: {
        id: number
        keyword: string;
        scheduledTime: string;
        isComplete: boolean
    }[];
}
export interface PlaceDestination {
    formattedAddress: string,
    location: Coordinate,
    displayName: {
        text: string;
        languageCode: string;
    }
}

export interface RouteStep {
    distanceMeters: number;
    duration: string;
    polyline: {
        encodedPolyline: string
    };
    startLocation: {
        latLng: {
            latitude: number; longitude: number
        }
    };
    endLocation: {
        latLng: {
            latitude: number; longitude: number
        }
    };
    navigationInstruction: {
        maneuver: string;
        instructions: string;
    };
    localizedValues: {
        distance: {
            text: string;
        },
        staticDuration: {
            text: string;
        },
    };
    travelMode: string
}

export interface RouteInfo {
    legs: {
        distanceMeters: number;
        duration: string;
        steps: RouteStep[];
        startLocation: {
            latLng: Coordinate
        };
        endLocation: {
            latLng: Coordinate
        };
    }[];
    distanceMeters: number;
    duration: string;
    staticDuration: string;
    polyline: {
        encodedPolyline: string;
    };
    description: string;
}

export interface PlaceNames {
    start: string;
    destinations: {
        address?: string;
        displayName?: string;
        scheduledTime: string;
    }[];
}