import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Dimensions, Animated, Platform, Linking, Image } from 'react-native';
import MapView, { Callout, Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import tw from "twrnc";
import { router, Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native-ui-lib';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import TextTheme from '@/components/TextTheme';
import { ScrollView } from 'react-native-gesture-handler';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import Loading from '../Loading';
import axios from 'axios';
import {
    calculateForwardPosition,
    decodePolyline,
    formatDistance,
    generateRandomColors,
    calculateDistance
} from '@/helper/utiles';
import RenderRouteDetails from './RenderRouteDetails';
import debounce from 'lodash/debounce';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { getTurnDirection } from './getTurnDirection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Coordinate,
    LocationObject,
    MapTrackingProps,
    Destination,
    RouteInfo,
    NavigationState,
    UIState,
    MapState
} from '@/types/MapTracking';

// Constants
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MapMarker = require("@/assets/images/MapMarker.png");
const greenFlagIcon = require('@/assets/images/green-flag.png');
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const ARRIVAL_RADIUS = 100;
const COMPLETED_DESTINATIONS_KEY = 'completedDestinations';

// Helper functions
const saveCompletedDestinations = async (completed: number[]) => {
    try {
        await AsyncStorage.setItem(COMPLETED_DESTINATIONS_KEY, JSON.stringify(completed));
    } catch (error) {
        console.error('Error saving completed destinations:', error);
    }
};

const loadCompletedDestinations = async (): Promise<number[]> => {
    try {
        const saved = await AsyncStorage.getItem(COMPLETED_DESTINATIONS_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Error loading completed destinations:', error);
        return [];
    }
};
// Main Map Tracking Component
const MapTracking: React.FC<MapTrackingProps> = ({ destinations }) => {
    // Navigation State
    const [navigationState, setNavigationState] = useState<NavigationState>({
        currentDestinationIndex: 0,
        completedDestinations: [],
        isProcessingArrival: false,
        isRouteUpdating: false,
        hasArrived: false,
        currentDestinationDistance: null
    });

    // UI State
    const [uiState, setUiState] = useState<UIState>({
        isBottomSheetVisible: true,
        focusState: 'off' as 'off' | 'center' | 'forward',
        hasCenteredOnce: false,
        showAllDestinations: false,
        showLoading: false
    });

    // Map State
    const [mapState, setMapState] = useState<MapState>({
        location: null,
        routeInfo: null,
        currentStepIndex: 0,
        polylines: [],
        placeNames: { start: "", destinations: [] }
    });

    // Refs
    const watchPositionSubscription = useRef<Location.LocationSubscription | null>(null);
    const mapRef = useRef<MapView>(null);
    const bottomSheetRef = useRef<BottomSheet>(null);
    const prevLocationRef = useRef<LocationObject | null>(null);
    const prevDestinationsRef = useRef<Destination[] | null>(null);

    // BottomSheet Configuration
    const snapPoints = useMemo(() => ['15%', '25%', '50%', '75%'], []);
    const animatedPosition = useRef(new Animated.Value(0)).current;

    // Memoized Styles
    const floatingTextStyle = useMemo(() => ({
        transform: [{
            translateY: animatedPosition.interpolate({
                inputRange: [0, 1, 2, 3],
                outputRange: [
                    Platform.OS === "ios" ? 80 : 60,
                    Platform.OS === "ios" ? 0 : -15,
                    Platform.OS === "ios" ? -SCREEN_HEIGHT * 0.25 : (-SCREEN_HEIGHT * 0.25) - 20,
                    Platform.OS === "ios" ? -SCREEN_HEIGHT * 0.5 : (-SCREEN_HEIGHT * 0.5) - 30
                ],
            }),
        }],
    }), [animatedPosition]);

    // State Update Functions
    const updateNavigationState = useCallback((updates: Partial<NavigationState>) => {
        setNavigationState(prev => ({ ...prev, ...updates }));
    }, []);

    const updateUIState = useCallback((updates: Partial<UIState>) => {
        setUiState(prev => ({ ...prev, ...updates }));
    }, []);

    const updateMapState = useCallback((updates: Partial<MapState>) => {
        setMapState(prev => ({ ...prev, ...updates }));
    }, []);

    // Loading State Management
    const startLoading = useCallback(() => {
        updateUIState({ showLoading: true });
    }, []);

    const stopLoading = useCallback(() => {
        updateUIState({ showLoading: false });
    }, []);

    // BottomSheet Management
    const handleBottomSheetChange = useCallback((index: number) => {
        Animated.spring(animatedPosition, {
            toValue: index,
            useNativeDriver: true,
        }).start();
        updateUIState({ isBottomSheetVisible: index !== -1 });
    }, [animatedPosition]);

    // Focus State Management
    const toggleFocus = useCallback(() => {
        setUiState(prev => {
            const newFocusState = prev.focusState === 'off' ? 'center'
                : prev.focusState === 'center' ? 'forward'
                    : 'off';

            if (newFocusState === 'off') {
                return { ...prev, focusState: newFocusState, hasCenteredOnce: true };
            } else if (newFocusState === 'center') {
                return { ...prev, focusState: newFocusState, hasCenteredOnce: false };
            }
            return { ...prev, focusState: newFocusState };
        });
    }, []);

    // Location Tracking
    const startLocationTracking = useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('จำเป็นต้องมีการเข้าถึงตำแหน่งเพื่อใช้ฟีเจอร์นี้');
            }

            const initialLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation
            });

            updateMapState({ location: initialLocation as LocationObject });

            watchPositionSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 5000,
                    distanceInterval: 10,
                },
                (newLocation: Location.LocationObject) => {
                    updateMapState({ location: newLocation as LocationObject });
                }
            );
        } catch (error) {
            handleErrorMessage(error);
        }
    }, []);

    // Route Optimization
    const fetchOptimizedRoute = useCallback(async (start: Coordinate, destinationPoints: Coordinate[]) => {
        updateNavigationState({ isRouteUpdating: true });
        try {
            const response = await axios.post(
                `https://routes.googleapis.com/directions/v2:computeRoutes`,
                {
                    origin: { location: { latLng: start } },
                    destination: {
                        location: {
                            latLng: destinationPoints[destinationPoints.length - 1]
                        }
                    },
                    intermediates: destinationPoints.slice(0, -1).map(dest => ({
                        location: { latLng: dest }
                    })),
                    travelMode: "DRIVE",
                    routingPreference: "TRAFFIC_AWARE",
                    languageCode: "th",
                    units: "METRIC"
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
                        "X-Goog-FieldMask": "*"
                    },
                }
            );

            if (response.data.routes?.[0]) {
                const route = response.data.routes[0];
                const colors = generateRandomColors(route.legs.length);
                const newPolylines = route.legs.map((leg: any, index: number) => ({
                    coordinates: decodePolyline(leg.polyline.encodedPolyline),
                    color: colors[index]
                }));

                updateMapState({
                    routeInfo: route,
                    polylines: newPolylines,
                    currentStepIndex: 0
                });
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message, false);
            });
        } finally {
            updateNavigationState({ isRouteUpdating: false });
        }
    }, []);

    // Location Updates
    const handleLocationUpdate = useCallback(() => {
        const { location } = mapState;
        const { completedDestinations, isProcessingArrival, isRouteUpdating } = navigationState;

        if (!location || isProcessingArrival || isRouteUpdating) return;

        const currentDestIndex = completedDestinations.length;
        if (currentDestIndex >= destinations.length) return;

        const currentDest = destinations[currentDestIndex];
        const distance = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            parseFloat(currentDest.latitude),
            parseFloat(currentDest.longitude)
        );

        updateNavigationState({ currentDestinationDistance: distance * 1000 });

        if (distance * 1000 <= ARRIVAL_RADIUS) {
            handleDestinationArrival(currentDestIndex, location);
        }
    }, [mapState, navigationState, destinations]);

    const handleDestinationArrival = useCallback(async (
        destinationIndex: number,
        currentLocation: LocationObject
    ) => {
        updateNavigationState({
            isProcessingArrival: true,
            hasArrived: true
        });

        const updatedCompletedDestinations = [
            ...navigationState.completedDestinations,
            destinationIndex
        ];

        await saveCompletedDestinations(updatedCompletedDestinations);

        updateNavigationState({
            completedDestinations: updatedCompletedDestinations,
            currentDestinationIndex: destinationIndex + 1
        });

        if (destinationIndex < destinations.length - 1) {
            const nextDestinations = destinations.slice(destinationIndex + 1);
            await fetchOptimizedRoute(
                {
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude
                },
                nextDestinations.map(dest => ({
                    latitude: parseFloat(dest.latitude),
                    longitude: parseFloat(dest.longitude)
                }))
            );
        }

        setTimeout(() => {
            updateNavigationState({
                isProcessingArrival: false,
                hasArrived: false
            });
        }, 5000);
    }, [navigationState, destinations, fetchOptimizedRoute]);

    // Map Camera Updates
    const updateMapView = useCallback(() => {
        if (!mapRef.current || !mapState.location) return;

        const cameraConfig = {
            center: {
                latitude: mapState.location.coords.latitude,
                longitude: mapState.location.coords.longitude,
            },
            pitch: 0,
            heading: mapState.location.coords.heading || 0,
            altitude: 500,
            zoom: Platform.OS === "ios" ? 15 : 18
        };

        switch (uiState.focusState) {
            case 'center':
                mapRef.current.animateCamera(cameraConfig, { duration: 1000 });
                break;
            case 'forward':
                const forwardPosition = calculateForwardPosition(mapState.location);
                mapRef.current.animateCamera({
                    ...cameraConfig,
                    center: forwardPosition,
                    pitch: 60,
                    zoom: 18
                }, { duration: 1000 });
                break;
            case 'off':
                if (!uiState.hasCenteredOnce) {
                    zoomToCurrentRoute();
                }
                break;
        }
    }, [mapState.location, uiState.focusState, uiState.hasCenteredOnce]);

    // Custom Components
    const CustomMarkerCallout = React.memo(({
        destination,
        isCompleted,
        isCurrent
    }: {
        destination: Destination;
        isCompleted: boolean;
        isCurrent: boolean;
    }) => (
        <Callout>
            <View style={tw`p-2`}>
                <TextTheme font='Prompt-SemiBold'>{destination.name}</TextTheme>
                <TextTheme>{destination.scheduledTime || 'เวลาไม่ระบุ'}</TextTheme>
                <TextTheme>
                    {isCompleted ? 'เสร็จสิ้น' : (isCurrent ? 'กำลังเดินทาง' : 'ยังไม่ไป')}
                </TextTheme>
            </View>
        </Callout>
    ));

    const LoadingOverlay = React.memo(() => (
        <LinearGradient
            colors={[
                String(tw.color("blue-700")),
                String(tw.color("blue-400")),
                String(tw.color("blue-500"))
            ]}
            style={tw`flex-1 justify-center items-center`}
        >
            <View style={tw`h-30 w-30 overflow-hidden justify-center items-center rounded-full mb-2`}>
                <Image
                    source={require("@/assets/images/location-loading.gif")}
                    style={[tw`w-50 h-50 rounded-full`, { objectFit: "cover" }]}
                />
            </View>
            <Loading loading={true} color='#fff' />
        </LinearGradient>
    ));

    // Map Components
    const renderMarkers = useCallback(() => {
        if (!destinations.length) return null;

        const visibleDestinations = uiState.showAllDestinations
            ? destinations
            : destinations.slice(0, navigationState.completedDestinations.length + 1);

        return visibleDestinations.map(destination => {
            const isCompleted = navigationState.completedDestinations.includes(destination.id);
            const isCurrent = destination.id === destinations[navigationState.currentDestinationIndex]?.id;

            return (
                <Marker
                    key={`marker-${destination.id}-${isCompleted}`}
                    coordinate={{
                        latitude: parseFloat(destination.latitude),
                        longitude: parseFloat(destination.longitude)
                    }}
                    title={destination.name}
                    image={isCompleted ? greenFlagIcon : MapMarker}
                >
                    <CustomMarkerCallout
                        destination={destination}
                        isCompleted={isCompleted}
                        isCurrent={isCurrent}
                    />
                </Marker>
            );
        });
    }, [destinations, navigationState, uiState.showAllDestinations]);

    const renderPolylines = useCallback(() => {
        const { polylines } = mapState;
        const { completedDestinations } = navigationState;
        if (!polylines.length) return null;

        if (uiState.showAllDestinations) {
            return polylines.map((polyline, index) => (
                <React.Fragment key={`polyline-fragment-${index}`}>
                    <Polyline
                        coordinates={polyline.coordinates}
                        strokeColor={index < completedDestinations.length
                            ? `${polyline.color}40`
                            : polyline.color
                        }
                        strokeWidth={5}
                    />
                    {polyline.coordinates.length > 0 && (
                        <Marker
                            coordinate={polyline.coordinates[polyline.coordinates.length - 1]}
                            anchor={{ x: 0.5, y: 1 }}
                        >
                            <View style={tw`bg-white p-2 rounded-lg shadow-md opacity-80`}>
                                <TextTheme size="xs">
                                    {destinations[index]?.name || 'ไม่ระบุชื่อ'}
                                </TextTheme>
                                <TextTheme size="xs">
                                    {destinations[index]?.scheduledTime || 'เวลาไม่ระบุ'}
                                </TextTheme>
                            </View>
                        </Marker>
                    )}
                </React.Fragment>
            ));
        }

        const currentIndex = completedDestinations.length;
        const currentPolyline = polylines[currentIndex];
        if (!currentPolyline) return null;

        return (
            <React.Fragment key="current-polyline">
                <Polyline
                    coordinates={currentPolyline.coordinates}
                    strokeColor={currentPolyline.color}
                    strokeWidth={5}
                />
                {currentPolyline.coordinates.length > 0 && (
                    <Marker
                        coordinate={currentPolyline.coordinates[currentPolyline.coordinates.length - 1]}
                        anchor={{ x: 0.5, y: 1 }}
                    >
                        <View style={tw`bg-white p-2 rounded-lg shadow-md opacity-80`}>
                            <TextTheme size="xs">
                                {destinations[currentIndex]?.name || 'ไม่ระบุชื่อ'}
                            </TextTheme>
                            <TextTheme size="xs">
                                {destinations[currentIndex]?.scheduledTime || 'เวลาไม่ระบุ'}
                            </TextTheme>
                        </View>
                    </Marker>
                )}
            </React.Fragment>
        );
    }, [mapState.polylines, navigationState.completedDestinations, uiState.showAllDestinations, destinations]);

    // Navigation Controls
    const NavigationControls = React.memo(() => (
        <View style={tw`flex-row justify-between items-center`}>
            <TouchableOpacity
                style={tw`bg-blue-500 py-2 px-3 rounded-full flex-row gap-2 items-center`}
                onPress={() => {
                    const lastDest = destinations[destinations.length - 1];
                    if (lastDest) {
                        openGoogleMaps(
                            parseFloat(lastDest.latitude),
                            parseFloat(lastDest.longitude)
                        );
                    }
                }}
            >
                <MaterialIcons name="map" size={24} color="white" />
                <TextTheme font='Prompt-SemiBold' size='sm' style={tw`text-white`}>
                    แผนที่
                </TextTheme>
            </TouchableOpacity>

            <View style={tw`flex-row gap-2`}>
                <TouchableOpacity
                    style={tw`bg-white p-2 rounded-full shadow-lg`}
                    onPress={() => updateUIState({
                        showAllDestinations: !uiState.showAllDestinations
                    })}
                >
                    <MaterialIcons
                        name={uiState.showAllDestinations ? "visibility" : "visibility-off"}
                        size={24}
                        color={String(tw.color("blue-500"))}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={tw`bg-white p-2 rounded-full shadow-lg`}
                    onPress={toggleFocus}
                >
                    <MaterialIcons
                        name={focusStateIcon}
                        size={24}
                        color={String(tw.color(uiState.focusState !== 'off' ? "blue-500" : "gray-500"))}
                    />
                </TouchableOpacity>
            </View>
        </View>
    ));

    const focusStateIcon = useMemo(() => {
        switch (uiState.focusState) {
            case 'off': return "gps-not-fixed";
            case 'center': return "gps-fixed";
            case 'forward': return "navigation";
        }
    }, [uiState.focusState]);

    // Main Render
    return (
        <>
            <StatusBar style='dark' />
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: "",
                    headerShadowVisible: false,
                    gestureEnabled: false,
                    headerTransparent: true,
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={tw`flex-row items-center bg-white rounded-full p-2`}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={24}
                                color={tw.color('black')}
                            />
                        </TouchableOpacity>
                    )
                }}
            />

            <View style={tw`flex-1 justify-center items-center bg-white`}>
                {mapState.location ? (
                    <MapView
                        ref={mapRef}
                        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                        initialRegion={{
                            latitude: mapState.location.coords.latitude,
                            longitude: mapState.location.coords.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        showsUserLocation={true}
                        showsMyLocationButton={false}
                        onPanDrag={handleMapMovement}
                        onRegionChangeComplete={handleMapMovement}
                        userInterfaceStyle='light'
                    >
                        {renderMarkers()}
                        {renderPolylines()}
                    </MapView>
                ) : (
                    <LoadingOverlay />
                )}

                {/* Navigation Info Overlay */}
                <Animated.View
                    style={[
                        tw`absolute left-4 right-4 mb-2`,
                        floatingTextStyle,
                        { bottom: SCREEN_HEIGHT * 0.25 }
                    ]}
                >
                    {navigationState.hasArrived ? (
                        <View style={tw`bg-green-500 p-4 rounded-3xl shadow-md`}>
                            <TextTheme
                                font='Prompt-SemiBold'
                                size='lg'
                                style={tw`text-white text-center`}
                            >
                                มาถึงจุดหมายแล้ว!
                            </TextTheme>
                        </View>
                    ) : (
                        <NavigationInfo
                            routeInfo={mapState.routeInfo}
                            currentStepIndex={mapState.currentStepIndex}
                            currentDestination={destinations[navigationState.currentDestinationIndex]}
                        />
                    )}
                </Animated.View>

                {/* Bottom Sheet */}
                {!uiState.isBottomSheetVisible && (
                    <TouchableOpacity
                        style={tw`absolute bottom-4 right-4 bg-blue-500 p-3 rounded-full shadow-lg`}
                        onPress={() => bottomSheetRef.current?.expand()}
                    >
                        <MaterialIcons name="info" size={24} color="white" />
                    </TouchableOpacity>
                )}

                <BottomSheet
                    ref={bottomSheetRef}
                    index={1}
                    snapPoints={snapPoints}
                    onChange={handleBottomSheetChange}
                    android_keyboardInputMode="adjustResize"
                    keyboardBlurBehavior="restore"
                    enableOverDrag={false}
                    enablePanDownToClose={true}
                    enableContentPanningGesture={false}
                >
                    <ScrollView style={tw`flex-1`}>
                        <RenderRouteDetails
                            routeInfo={mapState.routeInfo}
                            destinations={destinations}
                            currentStepIndex={mapState.currentStepIndex}
                            completedDestinations={navigationState.completedDestinations}
                            currentDestinationDistance={navigationState.currentDestinationDistance}
                        />
                    </ScrollView>
                </BottomSheet>
            </View>
        </>
    );
};

export default MapTracking;