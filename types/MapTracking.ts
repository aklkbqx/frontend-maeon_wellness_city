export interface Coordinate {
    latitude: string | number;
    longitude: string | number;
}

export interface LocationObject {
    coords: {
        latitude: number;
        longitude: number;
        heading?: number;
    };
}

export interface Destination {
    sequence: number;
    start_time: string;
    end_time: string;
    activity: string;
    description: string;
    location_id: number;
    location_name: string;
    location_type: string;
    cost: number;
    included_in_total_price: boolean;
    is_mandatory?: boolean;
    isComplete: boolean;
    services?: string[];
    locations?: {
        id: number;
        name: string;
        type: string;
    }[];
    note?: string;
    id: number;
    name: string;
    latitude: string;
    longitude: string;
    scheduledTime: string;
    address: string;
    type: string;
}

export interface PlaceNames {
    start: string;
    destinations: Array<{
        displayName: string;
        address?: string;
        scheduledTime?: string;
    }>;
}

// แทนที่ PlaceDestination ด้วย Destination interface ที่มาจาก API
export type PlaceDestination = Destination;

export interface MapTrackingProps {
    destinations: Destination[];
    currentDestinationIndex: number;
    onDestinationComplete: (id: number) => void;
    onLocationUpdate: (latitude: number, longitude: number) => void;
}