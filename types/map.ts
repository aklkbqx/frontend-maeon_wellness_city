// types/map.ts

export interface TimeInfo {
    time: string;
    note: string;
}

export interface RelatedLocation {
    id: number;
    name: string;
    type: string;
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
    locations?: RelatedLocation[];
    note?: string;
    id: number;
    name: string;
    latitude: string;
    longitude: string;
    scheduledTime: string;
    address: string;
    type: string;
}

export interface TravelSummary {
    totalActivities: number;
    completedActivities: number;
    startTime: string;
    endTime: string;
    totalCost: number;
    mandatoryActivities: number;
}

export interface TravelData {
    startInfo: TimeInfo;
    endInfo: TimeInfo;
    destinations: Destination[];
    summary: TravelSummary;
}

export interface ApiResponse {
    success: boolean;
    data: TravelData;
    message?: string;
}

// สำหรับ MapTracking Component
export interface MapLocation {
    id: number;
    name: string;
    scheduledTime: string;
    activity: string;
    latitude: string;
    longitude: string;
    address: string;
    isComplete: boolean;
    description: string;
    type: string;
}

export interface MapTrackingProps {
    destinations: MapLocation[];
    currentDestinationIndex: number;
    onDestinationComplete: (id: number) => void;
    onLocationUpdate: (latitude: number, longitude: number) => void;
}

// สำหรับ Route Info จาก Google Maps API
export interface RouteStep {
    distanceMeters: number;
    navigationInstruction: {
        maneuver: string;
        instructions: string;
    };
    endLocation: {
        latLng: {
            latitude: number;
            longitude: number;
        }
    };
}

export interface RouteLeg {
    steps: RouteStep[];
    duration: string;
    distanceMeters: number;
}

export interface RouteInfo {
    legs: RouteLeg[];
    distanceMeters: number;
}