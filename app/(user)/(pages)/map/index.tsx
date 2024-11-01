import React, { useEffect, useState, useCallback } from 'react';
import { Image } from 'react-native';
import { View, TouchableOpacity } from 'react-native-ui-lib';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import tw from "twrnc";
import MapTracking from '@/components/MapTracking/MapTracking';
import api from '@/helper/api';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import Loading from '@/components/Loading';
import TextTheme from '@/components/TextTheme';

// API Response Types
interface ApiDestination {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    scheduledTime: string;
    address: string;
    isComplete: boolean;
}

interface ApiTravelData {
    startInfo: {
        time: string;
        note: string;
    };
    endInfo: {
        time: string;
        note: string;
    };
    destinations: ApiDestination[];
}

interface ApiResponse {
    success: boolean;
    data: ApiTravelData;
    message?: string;
}

// Component Types (matching MapTracking props requirements)
interface MapDestination {
    id: number;
    keyword: string; // Maps to 'name' from API
    scheduledTime: string;
    isComplete: boolean;
    latitude: number;
    longitude: number;
    address: string;
}

// API Services
const mapApi = {
    fetchTravelData: async (bookingId: number): Promise<ApiResponse> => {
        try {
            const response = await api.get(`/api/navigate-map/${bookingId}`);
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch travel data');
        }
    },

    updateDestinationStatus: async (bookingId: number, destinationId: number): Promise<ApiResponse> => {
        try {
            const response = await api.post(`/api/navigate-map/${bookingId}/complete`, {
                destinationId
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to update destination status');
        }
    }
};

// Loading Screen Component
const LoadingScreen = () => (
    <LinearGradient
        colors={[String(tw.color("blue-700")), String(tw.color("blue-400")), String(tw.color("blue-500"))]}
        style={tw`flex-1 justify-center items-center`}
    >
        <View style={tw`h-30 w-30 overflow-hidden justify-center items-center rounded-full mb-2`}>
            <Image
                source={require("@/assets/images/location-loading.gif")}
                style={[tw`w-50 h-50 rounded-full`, { objectFit: "cover" }]}
            />
        </View>
        <View style={tw`flex-col gap-2`}>
            <Loading loading={true} color='#fff' />
        </View>
    </LinearGradient>
);

// Error Screen Component
const ErrorScreen = ({ message }: { message: string }) => (
    <View style={tw`flex-1 justify-center items-center p-4`}>
        <Ionicons name="warning-outline" size={48} color={tw.color('red-500')} />
        <TextTheme style={tw`text-center mt-4`}>{message}</TextTheme>
        <TouchableOpacity
            onPress={() => router.back()}
            style={tw`mt-4 bg-blue-500 px-6 py-2 rounded-full`}
        >
            <TextTheme style={tw`text-white`}>กลับ</TextTheme>
        </TouchableOpacity>
    </View>
);

// Main Map Component
const Map = () => {
    const { bookingId } = useLocalSearchParams();
    const [travelData, setTravelData] = useState<ApiTravelData | null>(null);
    const [currentDestinationIndex, setCurrentDestinationIndex] = useState(0);
    const [completedDestinations, setCompletedDestinations] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadTravelData = useCallback(async () => {
        if (!bookingId) {
            setError('ไม่พบข้อมูลการจอง');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await mapApi.fetchTravelData(parseInt(bookingId as string));
            if (response.success && response.data) {
                setTravelData(response.data);
                const completedIds = response.data.destinations
                    .filter((dest: ApiDestination) => dest.isComplete)
                    .map((dest: ApiDestination) => dest.id);
                setCompletedDestinations(completedIds);
                const nextIncompleteIndex = response.data.destinations
                    .findIndex((dest: ApiDestination) => !dest.isComplete);
                setCurrentDestinationIndex(nextIncompleteIndex === -1 ?
                    response.data.destinations.length - 1 : nextIncompleteIndex);
            } else {
                throw new Error(response.message || 'ไม่สามารถโหลดข้อมูลได้');
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                setError(message);
                handleErrorMessage(message);
            });
        } finally {
            setIsLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        loadTravelData();
    }, [loadTravelData]);

    const handleDestinationComplete = async (destinationId: number) => {
        try {
            const result = await mapApi.updateDestinationStatus(
                parseInt(bookingId as string),
                destinationId
            );

            if (result.success) {
                setCompletedDestinations(prev => [...prev, destinationId]);

                if (currentDestinationIndex < (travelData?.destinations.length || 0) - 1) {
                    setCurrentDestinationIndex(prev => prev + 1);
                }
            } else {
                handleErrorMessage('ไม่สามารถอัพเดทสถานะได้');
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message);
            });
        }
    };

    const checkDestinationDistance = (userLat: number, userLng: number, destLat: number, destLng: number) => {
        const R = 6371e3;
        const φ1 = userLat * Math.PI / 180;
        const φ2 = destLat * Math.PI / 180;
        const Δφ = (destLat - userLat) * Math.PI / 180;
        const Δλ = (destLng - userLng) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const handleLocationUpdate = useCallback((latitude: number, longitude: number) => {
        if (!travelData || currentDestinationIndex >= travelData.destinations.length) return;

        const currentDest = travelData.destinations[currentDestinationIndex];
        const distance = checkDestinationDistance(
            latitude,
            longitude,
            currentDest.latitude,
            currentDest.longitude
        );

        if (distance <= 50 && !completedDestinations.includes(currentDest.id)) {
            handleDestinationComplete(currentDest.id);
        }
    }, [travelData, currentDestinationIndex, completedDestinations]);

    if (isLoading) {
        return (
            <>
                <StatusBar style='light' />
                <Stack.Screen options={{
                    headerShown: true,
                    headerTitle: "",
                    headerTransparent: true,
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={tw`flex-row items-center bg-white rounded-full p-2`}
                        >
                            <Ionicons name="chevron-back" size={24} color={tw.color('black')} />
                        </TouchableOpacity>
                    )
                }} />
                <LoadingScreen />
            </>
        );
    }

    if (error || !travelData) {
        return (
            <>
                <StatusBar style='light' />
                <Stack.Screen options={{
                    headerShown: true,
                    headerTitle: "",
                    headerTransparent: true
                }} />
                <ErrorScreen message={error || 'ไม่พบข้อมูล'} />
            </>
        );
    }

    // Transform API destinations to match MapTracking component requirements
    const destinations: MapDestination[] = travelData.destinations.map((dest: ApiDestination) => ({
        id: dest.id,
        keyword: dest.name, // Map 'name' to required 'keyword'
        scheduledTime: dest.scheduledTime,
        isComplete: completedDestinations.includes(dest.id),
        latitude: dest.latitude,
        longitude: dest.longitude,
        address: dest.address
    }));

    return (
        <>
            <StatusBar style='light' />
            <Stack.Screen options={{
                headerShown: true,
                headerTitle: "",
                headerTransparent: true,
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={tw`flex-row items-center bg-white rounded-full p-2`}
                    >
                        <Ionicons name="chevron-back" size={24} color={tw.color('black')} />
                    </TouchableOpacity>
                )
            }} />
            <MapTracking
                destinations={destinations}
                currentDestinationIndex={currentDestinationIndex}
                onDestinationComplete={handleDestinationComplete}
                onLocationUpdate={handleLocationUpdate}
            />
        </>
    );
};

export default Map;