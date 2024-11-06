export interface Contact {
    tel?: string[];
    line_id?: string;
    email?: string;
    meeting_point?: {
        name: string;
        latitude: string;
        longitude: string;
    };
}
export interface DateInfo {
    text: string;
    start?: string;
    end?: string;
    pre_booking_days?: number;
    note?: string;
}
export interface Accommodation {
    id: number;
    location_id: number;
    description: string;
    address: string;
    subdistrict_id: number;
    contact: string;
    interest?: string;
    additional_services?: string;
    activites?: string;
    check_in?: string;
    check_out?: string;
    health?: string;
    date_info?: string;
    service_fee?: string;
    images?: string;
    created_at: Date;
    updated_at?: Date;
    locations: Locations;
    subdistricts: Subdistricts;
}

export interface Attractions {
    id: number;
    location_id: number;
    description?: string;
    address: string;
    subdistrict_id: number;
    contact: string;
    interest?: string;
    product?: string;
    activites?: string;
    health?: string;
    date_info?: string;
    service_fee?: string;
    images?: string;
    created_at: Date;
    updated_at?: Date;
    locations: Locations;
    subdistricts: Subdistricts;
}

export interface Bookings {
    id: number;
    user_id: number;
    booking_details: string;
    booking_date: Date;
    start_date: Date;
    end_date: Date;
    people: number;
    total_price: number;
    status: BookingsStatus;
    created_at?: Date;
    updated_at: Date;
    users: Users;
    payments?: Payments;
}

export interface LearningResources {
    id: number;
    location_id: number;
    description?: string;
    address: string;
    subdistrict_id: number;
    contact: string;
    interest?: string;
    product?: string;
    activites?: string;
    health?: string;
    time_per_cycle?: string;
    people_per_cycle?: string;
    cost?: string;
    pre_booking?: string;
    date_info?: string;
    images?: string;
    created_at: Date;
    updated_at?: Date;
    locations: Locations;
    subdistricts: Subdistricts;
}

export interface LocationTypes {
    id: number;
    name: string;
    created_at: Date;
    locations: Locations[];
}

export interface Locations {
    id: number;
    name: string;
    type: number;
    map?: string | { latitude: string; longitude: string; };
    time_slots?: string | string[];
    note?: string;
    owner_id?: number;
    isActive: boolean;
    created_at?: Date;
    updated_at?: Date;
    accommodation: Accommodation[];
    attractions: Attractions[];
    hospital: Hospital[];
    learning_resources: LearningResources[];
    location_types: LocationTypes;
    users?: Users;
    program_activities: ProgramActivities[];
    restaurant: Restaurant[];
}

export interface Payments {
    id: number;
    booking_id: number;
    payment_method?: PaymentsPaymentMethod;
    payment_data?: string;
    slip_image?: string;
    status: PaymentsStatus;
    transaction_id?: string;
    payment_date?: Date;
    created_at?: Date;
    updated_at: Date;
    bookings: Bookings;
}

export interface ProgramTypes {
    id: number;
    name: string;
    description: string;
    created_at?: Date;
    programs: Programs[];
}

export interface Programs {
    id: number;
    type: number;
    program_category: ProgramsProgramCategory;
    name: string;
    description: string;
    schedules: string;
    total_price: number;
    wellness_dimensions?: string;
    images?: string;
    created_by?: number;
    created_at?: Date;
    updated_at?: Date;
    duration_days?: number;
    status?: ProgramsStatus;
    program_activities: ProgramActivities[];
    program_types: ProgramTypes;
    users?: Users;
}

export interface ProgramActivities {
    id: number;
    program_id: number;
    start_time: Date;
    end_time: Date;
    activity: string;
    description: string;
    location_id: number;
    cost?: number;
    sequence: number;
    programs: Programs;
    locations: Locations;
}

export interface Restaurant {
    id: number;
    location_id: number;
    description: string;
    address: string;
    subdistrict_id: number;
    contact: string;
    Interesting_menu?: string;
    served_per_hour?: number;
    health?: string;
    date_info?: string;
    service_fee?: string;
    images?: string;
    created_at: Date;
    updated_at?: Date;
    locations: Locations;
    subdistricts: Subdistricts;
}

export interface SlipRemaining {
    id: number;
    count: number;
    updated_at: Date;
}

export interface Subdistricts {
    id: number;
    name: string;
    created_at?: Date;
    accommodation: Accommodation[];
    attractions: Attractions[];
    hospital: Hospital[];
    learning_resources: LearningResources[];
    restaurant: Restaurant[];
}

export interface Users {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    tel: string;
    profile_picture?: string;
    role?: UsersRole;
    usage_status?: UsersUsageStatus;
    status_last_update?: Date;
    account_status?: UsersAccountStatus;
    created_at?: Date;
    updated_at?: Date;
    bookings: Bookings[];
    locations: Locations[];
    notifications: Notifications[];
    programs: Programs[];
}

export interface Notifications {
    id: number;
    type: NotificationsType;
    title: string;
    body: string;
    data?: string;
    user_id: number;
    status: NotificationsStatus;
    created_at: Date;
    updated_at?: Date;
    is_deleted: boolean;
    users: Users;
}

export interface Hospital {
    id: number;
    location_id: number;
    description?: string;
    address?: string;
    subdistrict_id: number;
    contact?: string;
    activites?: string;
    health?: string;
    date_info?: string;
    coast?: number;
    images?: string;
    created_at: Date;
    updated_at: Date;
    locations: Locations;
    subdistricts: Subdistricts;
}

export enum PaymentsPaymentMethod {
    PROMPTPAY = 'PROMPTPAY',
    BANK_ACCOUNT_NUMBER = 'BANK_ACCOUNT_NUMBER'
}

export enum PaymentsStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
    PENDING_VERIFICATION = 'PENDING_VERIFICATION',
    REJECTED = 'REJECTED'
}

export enum BookingsStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED'
}

export enum UsersUsageStatus {
    OFFLINE = 'OFFLINE',
    ONLINE = 'ONLINE'
}

export enum UsersAccountStatus {
    DELETE = 'DELETE',
    ACTIVE = 'ACTIVE',
    SUSPEND = 'SUSPEND'
}

export enum UsersRole {
    user = 'user',
    admin = 'admin',
    hospital = 'hospital',
    restaurant = 'restaurant',
    attractions = 'attractions',
    learning_resources = 'learning_resources',
    accommodation = 'accommodation'
}

export enum NotificationsType {
    SYSTEM = 'SYSTEM',
    CHAT = 'CHAT',
    ORDER = 'ORDER',
    PAYMENT = 'PAYMENT',
    PROMOTION = 'PROMOTION',
    ANNOUNCEMENT = 'ANNOUNCEMENT',
    STATUS_UPDATE = 'STATUS_UPDATE',
    REMINDER = 'REMINDER'
}

export enum NotificationsStatus {
    UNREAD = 'UNREAD',
    READ = 'READ',
    ARCHIVED = 'ARCHIVED'
}

export enum ProgramsProgramCategory {
    SHORT = 'SHORT',
    LONG = 'LONG'
}

export enum ProgramsStatus {
    DRAFT = 'DRAFT',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED'
}