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
import { ApiResponse, MapLocation, TravelData } from '@/types/map';
import { calculateDistance } from '@/helper/utiles';


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
// components/Map.tsx
const Map = () => {
    const { bookingId } = useLocalSearchParams();
    const [travelData, setTravelData] = useState<TravelData | null>(null);
    const [currentDestinationIndex, setCurrentDestinationIndex] = useState(0);
    const [completedDestinations, setCompletedDestinations] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // โหลดข้อมูลการเดินทาง
    const loadTravelData = useCallback(async () => {
        if (!bookingId) {
            setError('ไม่พบข้อมูลการจอง');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await api.get<ApiResponse>(`/api/navigate-map/${bookingId}`);
            
            if (response.data.success && response.data.data) {
                const { data } = response.data;
                setTravelData(data);

                // จัดการกับสถานที่ที่เสร็จสิ้นแล้ว
                const completedIds = data.destinations
                    .filter(dest => dest.isComplete)
                    .map(dest => dest.id);
                setCompletedDestinations(completedIds);

                // หาสถานที่ถัดไปที่ยังไม่เสร็จ
                const nextIncomplete = data.destinations
                    .findIndex(dest => !dest.isComplete);
                setCurrentDestinationIndex(nextIncomplete === -1 
                    ? data.destinations.length - 1 
                    : nextIncomplete);
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

    // อัพเดทสถานะเมื่อถึงจุดหมาย
    const handleDestinationComplete = async (destinationId: number) => {
        try {
            const result = await api.post<ApiResponse>(`/api/navigate-map/${bookingId}/complete`, {
                locationId: destinationId
            });

            if (result.data.success) {
                setCompletedDestinations(prev => [...prev, destinationId]);
                
                // เลื่อนไปจุดหมายถัดไป
                if (currentDestinationIndex < (travelData?.destinations.length || 0) - 1) {
                    setCurrentDestinationIndex(prev => prev + 1);
                }

                await loadTravelData(); // รีโหลดข้อมูลใหม่
            }
        } catch (error) {
            handleAxiosError(error, handleErrorMessage);
        }
    };

    // แปลงข้อมูลสำหรับ MapTracking component
    const transformDestinations = useCallback((): MapLocation[] => {
        if (!travelData) return [];
        
        return travelData.destinations.map(dest => ({
            id: dest.id,
            name: dest.location_name,
            scheduledTime: dest.scheduledTime,
            activity: dest.activity,
            latitude: dest.latitude,
            longitude: dest.longitude,
            address: dest.address,
            isComplete: completedDestinations.includes(dest.id),
            description: dest.description,
            type: dest.type
        }));
    }, [travelData, completedDestinations]);

    // Effects
    useEffect(() => {
        loadTravelData();
    }, [loadTravelData]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (error || !travelData) {
        return <ErrorScreen message={error || 'ไม่พบข้อมูล'} />;
    }

    return (
        <>
            <StatusBar style='light' />
            <Stack.Screen 
                options={{
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
                }} 
            />
            {/* <MapTracking
                destinations={transformDestinations()}
                currentDestinationIndex={currentDestinationIndex}
                onDestinationComplete={handleDestinationComplete}
                onLocationUpdate={(lat, lng) => {
                    // เช็คระยะทางกับจุดหมายปัจจุบัน
                    const currentDest = travelData.destinations[currentDestinationIndex];
                    if (!currentDest) return;

                    const distance = calculateDistance(
                        lat,
                        lng,
                        parseFloat(currentDest.latitude),
                        parseFloat(currentDest.longitude)
                    );

                    // ถ้าอยู่ในรัศมี 50 เมตร ถือว่าถึงแล้ว
                    if (distance <= 0.05 && !completedDestinations.includes(currentDest.id)) {
                        handleDestinationComplete(currentDest.id);
                    }
                }}
            /> */}
        </>
    );
};

export default Map;