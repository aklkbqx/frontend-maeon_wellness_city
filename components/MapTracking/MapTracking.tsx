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
import { calculateForwardPosition, decodePolyline, formatDistance, generateRandomColors, calculateDistance } from '@/helper/utiles';
import RenderRouteDetails from './RenderRouteDetails';
import debounce from 'lodash/debounce';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { getTurnDirection } from './getTurnDirection';
import { Coordinate, LocationObject, MapTrackingProps, PlaceDestination, PlaceNames, RouteInfo } from '@/types/MapTracking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO ยังมีปัญหาอยู่กับ Polyline ในตำแหน่งปัจจุบันบ้าง และก็ส่วนของการอัพเดท Database เมื่อมีการไปถึงแล้ว

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MapMarker = require("@/assets/images/MapMarker.png");
const greenFlagIcon = require('@/assets/images/green-flag.png');
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const ARRIVAL_RADIUS = 100;
const COMPLETED_DESTINATIONS_KEY = 'completedDestinations';

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

const MapTracking: React.FC<MapTrackingProps> = ({ destinations }) => {
    const [location, setLocation] = useState<LocationObject | null>(null);
    const [isBottomSheetVisible, setIsBottomSheetVisible] = useState<boolean>(true);
    const [focusState, setFocusState] = useState<'off' | 'center' | 'forward'>('off');
    const [hasCenteredOnce, setHasCenteredOnce] = useState<boolean>(false);
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [placeNames, setPlaceNames] = useState<PlaceNames>({ start: "", destinations: [] });
    const [placeDestinations, setPlaceDestinations] = useState<PlaceDestination[]>([]);
    const [hasArrived, setHasArrived] = useState<boolean>(false);
    const [showLoading, setShowLoading] = useState<boolean>(false);
    const [polylines, setPolylines] = useState<{ coordinates: Coordinate[], color: string }[]>([]);
    const [showAllDestinations, setShowAllDestinations] = useState<boolean>(false);
    const [completedDestinations, setCompletedDestinations] = useState<number[]>([]);
    const [currentDestinationDistance, setCurrentDestinationDistance] = useState<number | null>(null);
    const [isProcessingArrival, setIsProcessingArrival] = useState<boolean>(false);
    const [isRouteUpdating, setIsRouteUpdating] = useState<boolean>(false);

    const watchPositionSubscription = useRef<Location.LocationSubscription | null>(null);
    const mapRef = useRef<MapView>(null);
    const bottomSheetRef = useRef<BottomSheet>(null);
    const prevLocationRef = useRef<LocationObject | null>(null);
    const prevPlaceDestinationsRef = useRef<PlaceDestination[] | null>(null);

    const snapPoints = useMemo(() => ['15%', '25%', '50%', '75%'], []);
    const animatedPosition = useRef(new Animated.Value(0)).current;

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

    const updateCurrentStep = useCallback(() => {
        if (!routeInfo || !location || !routeInfo.legs[0]) return;

        const leg = routeInfo.legs[0];
        let totalDistance = 0;
        for (let i = 0; i < leg.steps.length; i++) {
            const step = leg.steps[i];
            totalDistance += step.distanceMeters;

            const stepEndLocation = step.endLocation.latLng;
            const distanceToStepEnd = calculateDistance(
                location.coords.latitude,
                location.coords.longitude,
                stepEndLocation.latitude,
                stepEndLocation.longitude
            ) * 1000;

            if (distanceToStepEnd <= totalDistance) {
                setCurrentStepIndex(i);
                break;
            }
        }
    }, [routeInfo, location]);

    const startLocationTracking = useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('จำเป็นต้องมีการเข้าถึงตำแหน่งเพื่อใช้ฟีเจอร์นี้ โปรดเปิดใช้งานในการตั้งค่าของคุณ');
            }
            let initialLocation = await Location.getCurrentPositionAsync({});
            setLocation(initialLocation as LocationObject);
            updatePlaceName({
                latitude: initialLocation.coords.latitude,
                longitude: initialLocation.coords.longitude
            }, 'start');
            watchPositionSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 5000,
                    distanceInterval: 10,
                },
                ((newLocation: Location.LocationObject) => {
                    setLocation(newLocation as LocationObject);
                })
            );
        } catch (error) {
            handleErrorMessage(error);
        }
    }, []);

    const searchPlace = useCallback(async (keyword: string) => {
        try {
            const response = await axios.post(`https://places.googleapis.com/v1/places:searchText?languageCode=th`, {
                "textQuery": keyword
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
                    "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.priceLevel,places.location"
                },
            });
            if (response.data.places && response.data.places.length > 0) {
                return response.data.places[0];
            } else {
                throw new Error("ไม่สามารถค้นหาจุดหมายปลายทางได้");
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message, false);
            });
            return null;
        }
    }, []);

    const fetchOptimizedRoute = useCallback(async (start: Coordinate, destinations: Coordinate[]) => {
        setIsRouteUpdating(true);
        try {
            const response = await axios.post(`https://routes.googleapis.com/directions/v2:computeRoutes`,
                {
                    origin: {
                        location: {
                            latLng: start
                        }
                    },
                    destination: {
                        location: {
                            latLng: destinations[destinations.length - 1]
                        }
                    },
                    intermediates: destinations.slice(0, -1).map(dest => ({
                        location: {
                            latLng: dest
                        }
                    })),
                    travelMode: "DRIVE",
                    routingPreference: "TRAFFIC_AWARE",
                    computeAlternativeRoutes: false,
                    routeModifiers: {
                        avoidTolls: false,
                        avoidHighways: false,
                        avoidFerries: false
                    },
                    languageCode: "th",
                    units: "METRIC"
                }, {
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
                    "X-Goog-FieldMask": "*"
                },
            });
            if (response.data.routes && response.data.routes.length > 0) {
                const route = response.data.routes[0];
                const colors = generateRandomColors(route.legs.length);
                const newPolylines = route.legs.map((leg: any, index: number) => ({
                    coordinates: decodePolyline(leg.polyline.encodedPolyline),
                    color: colors[index]
                }));
                setPolylines(newPolylines);
                setRouteInfo(route);
                setCurrentStepIndex(0);
            } else {
                throw new Error("เกิดข้อผิดพลาดในการดึงข้อมูลเส้นทาง");
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message, false);
            });
        } finally {
            setIsRouteUpdating(false);
        }
    }, []);

    const updateCurrentPolyline = useCallback((currentLocation: Coordinate) => {
        setPolylines(prevPolylines => {
            if (prevPolylines.length === 0) return prevPolylines;

            const currentDestinationIndex = completedDestinations.length;
            const updatedPolylines = [...prevPolylines];
            const currentPolyline = updatedPolylines[currentDestinationIndex];

            if (currentPolyline) {
                const updatedCoordinates = [
                    currentLocation,
                    ...currentPolyline.coordinates.slice(1)
                ];
                updatedPolylines[currentDestinationIndex] = {
                    ...currentPolyline,
                    coordinates: updatedCoordinates
                };
            }

            return updatedPolylines;
        });
    }, [completedDestinations]);

    useEffect(() => {
        if (location && placeDestinations.length > 0) {
            const currentDestinationIndex = completedDestinations.length;
            if (currentDestinationIndex < placeDestinations.length) {
                const remainingDestinations = placeDestinations.slice(currentDestinationIndex);
                fetchOptimizedRoute(
                    { latitude: location.coords.latitude, longitude: location.coords.longitude },
                    remainingDestinations.map(dest => dest.location)
                );
            }
        }
    }, [location, placeDestinations, completedDestinations, fetchOptimizedRoute]);

    useEffect(() => {
        if (location) {
            updateCurrentPolyline({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
        }
    }, [location, updateCurrentPolyline]);

    const checkProximityToDestination = useCallback(async (currentLocation: LocationObject) => {
        if (!routeInfo || !placeDestinations.length || isProcessingArrival || isRouteUpdating) return;

        const currentDestinationIndex = completedDestinations.length;
        const currentDestination = placeDestinations[currentDestinationIndex];
        if (!currentDestination) return;

        const distance = calculateDistance(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude,
            currentDestination.location.latitude,
            currentDestination.location.longitude
        );

        if (distance * 1000 <= ARRIVAL_RADIUS) {
            setIsProcessingArrival(true);
            console.log(`Arrived at destination ${currentDestinationIndex}`);
            const updatedCompletedDestinations = [...completedDestinations, currentDestinationIndex];
            setCompletedDestinations(updatedCompletedDestinations);
            await saveCompletedDestinations(updatedCompletedDestinations);
            setCurrentStepIndex(0);
            setHasArrived(true);

            if (currentDestinationIndex < placeDestinations.length - 1) {
                setIsRouteUpdating(true);
                const nextDestinations = placeDestinations.slice(currentDestinationIndex + 1);
                await fetchOptimizedRoute(
                    { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude },
                    nextDestinations.map(dest => dest.location)
                );
                setHasArrived(false);
            }

            setTimeout(() => {
                setIsProcessingArrival(false);
                setIsRouteUpdating(false);
            }, 5000);
        }

        setCurrentDestinationDistance(distance * 1000);
    }, [routeInfo, placeDestinations, completedDestinations, fetchOptimizedRoute, isProcessingArrival, isRouteUpdating]);

    useEffect(() => {
        if (location && placeDestinations.length > 0) {
            const currentDestinationIndex = completedDestinations.length;
            if (currentDestinationIndex < placeDestinations.length) {
                const remainingDestinations = placeDestinations.slice(currentDestinationIndex);
                fetchOptimizedRoute(
                    { latitude: location.coords.latitude, longitude: location.coords.longitude },
                    remainingDestinations.map(dest => dest.location)
                );
            }
        }
    }, [location, placeDestinations, completedDestinations, fetchOptimizedRoute]);

    const updatePlaceName = useCallback(debounce(async (coordinate: Coordinate, type: 'start' | 'destination') => {
        try {
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                params: {
                    latlng: `${coordinate.latitude},${coordinate.longitude}`,
                    key: GOOGLE_MAPS_API_KEY,
                    language: "th"
                }
            });
            if (response.data.results && response.data.results.length > 0) {
                const formatted_address = response.data.results[0].formatted_address;
                if (type === 'start') {
                    setPlaceNames(prev => ({
                        ...prev,
                        start: formatted_address
                    }));
                }
            } else {
                if (type === 'start') {
                    setPlaceNames(prev => ({ ...prev, start: "ไม่พบชื่อสถานที่" }));
                }
            }
        } catch (error) {
            console.error("Error fetching place name:", error);
            if (type === 'start') {
                setPlaceNames(prev => ({ ...prev, start: "ไม่สามารถดึงข้อมูลชื่อสถานที่ได้" }));
            }
        }
    }, 500), []);

    const openGoogleMaps = useCallback((latitude: number, longitude: number) => {
        const url = Platform.select({
            ios: `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`,
            android: `google.navigation:q=${latitude},${longitude}&mode=d`
        });
        Linking.canOpenURL(url ?? "").then(supported => {
            if (supported) {
                Linking.openURL(url ?? "");
            } else {
                const browserUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
                Linking.openURL(browserUrl);
            }
        });
    }, []);

    const toggleFocus = useCallback(() => {
        setFocusState((prevState) => {
            switch (prevState) {
                case 'off':
                    setHasCenteredOnce(false);
                    return 'center';
                case 'center':
                    return 'forward';
                case 'forward':
                    return 'off';
                default:
                    return 'off';
            }
        });
    }, []);

    const updateMapView = useCallback(() => {
        if (location && mapRef.current) {
            const cameraConfig = {
                center: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                },
                pitch: 0,
                heading: 0,
                altitude: 500,
                zoom: Platform.OS !== "ios" ? 18 : 15,
            };

            switch (focusState) {
                case 'center':
                    mapRef.current.animateCamera(cameraConfig, { duration: 1000 });
                    break;
                case 'forward':
                    const forwardPosition = calculateForwardPosition(location);
                    mapRef.current.animateCamera({
                        ...cameraConfig,
                        center: forwardPosition,
                        pitch: 60,
                        heading: location.coords.heading || 0,
                        zoom: 18,
                    }, { duration: 1000 });
                    break;
                case 'off':
                    if (!hasCenteredOnce) {
                        zoomToCurrentRoute();
                        setHasCenteredOnce(true);
                    }
                    break;
            }
        }
    }, [location, focusState, hasCenteredOnce]);

    const handleMapMovement = useCallback(() => {
        if (focusState !== 'off' && !hasCenteredOnce) {
            // Do nothing
        } else {
            setFocusState('off');
            setHasCenteredOnce(true);
        }
    }, [focusState, hasCenteredOnce]);

    const renderMarkers = useCallback(() => {
        if (!placeDestinations.length) return null;

        if (showAllDestinations) {
            return placeDestinations.map((dest, index) => (
                <Marker
                    key={`marker-${index}-${completedDestinations.includes(index) ? 'completed' : 'current'}`}
                    coordinate={dest.location}
                    title={dest.displayName.text}
                    image={completedDestinations.includes(index) ? greenFlagIcon : MapMarker}
                >
                    <Callout>
                        <View style={tw`p-2`}>
                            <TextTheme font='Prompt-SemiBold'>{dest.displayName.text}</TextTheme>
                            <TextTheme>{placeNames.destinations[index]?.scheduledTime || 'เวลาไม่ระบุ'}</TextTheme>
                            <TextTheme>{completedDestinations.includes(index) ? 'เสร็จสิ้น' : 'ยังไม่ไป'}</TextTheme>
                        </View>
                    </Callout>
                </Marker>
            ));
        } else {
            const currentDestinationIndex = completedDestinations.length;
            return placeDestinations.map((dest, index) => {
                if (index <= currentDestinationIndex) {
                    return (
                        <Marker
                            key={`marker-${index}-${completedDestinations.includes(index) ? 'completed' : 'current'}`}
                            coordinate={dest.location}
                            title={dest.displayName.text}
                            image={completedDestinations.includes(index) ? greenFlagIcon : MapMarker}
                        >
                            <Callout>
                                <View style={tw`p-2`}>
                                    <TextTheme font='Prompt-SemiBold'>{dest.displayName.text}</TextTheme>
                                    <TextTheme>{placeNames.destinations[index]?.scheduledTime || 'เวลาไม่ระบุ'}</TextTheme>
                                    <TextTheme>
                                        {completedDestinations.includes(index) ? 'เสร็จสิ้น' :
                                            (index === currentDestinationIndex ? 'กำลังเดินทาง' : 'ยังไม่ไป')}
                                    </TextTheme>
                                </View>
                            </Callout>
                        </Marker>
                    );
                }
                return null;
            }).filter(marker => marker !== null);
        }
    }, [showAllDestinations, placeDestinations, placeNames, completedDestinations]);

    const renderPolylines = useCallback(() => {
        if (!polylines.length) return null;

        const currentDestinationIndex = completedDestinations.length;

        if (showAllDestinations) {
            return polylines.map((polyline, index) => (
                <React.Fragment key={`polyline-fragment-${index}`}>
                    <Polyline
                        key={`polyline-${index}`}
                        coordinates={polyline.coordinates}
                        strokeColor={index < currentDestinationIndex ? `${polyline.color}40` : polyline.color}
                        strokeWidth={5}
                    />
                    {polyline.coordinates.length > 0 && (
                        <Marker
                            key={`polyline-label-${index}`}
                            coordinate={polyline.coordinates[polyline.coordinates.length - 1]}
                            anchor={{ x: 0.5, y: 1 }}
                        >
                            <View style={tw`bg-white p-2 rounded-lg shadow-md z-99 opacity-80`}>
                                <TextTheme size="xs">{placeNames.destinations[index]?.displayName || 'ไม่ระบุชื่อ'}</TextTheme>
                                <TextTheme size="xs">{placeNames.destinations[index]?.scheduledTime || 'เวลาไม่ระบุ'}</TextTheme>
                            </View>
                        </Marker>
                    )}
                </React.Fragment>
            ));
        } else {
            const currentPolyline = polylines[currentDestinationIndex];
            if (!currentPolyline) return null;

            return (
                <React.Fragment key={`polyline-fragment-current`}>
                    <Polyline
                        key={`polyline-current`}
                        coordinates={currentPolyline.coordinates}
                        strokeColor={currentPolyline.color}
                        strokeWidth={5}
                    />
                    {currentPolyline.coordinates.length > 0 && (
                        <Marker
                            key={`polyline-label-current`}
                            coordinate={currentPolyline.coordinates[currentPolyline.coordinates.length - 1]}
                            anchor={{ x: 0.5, y: 1 }}
                        >
                            <View style={tw`bg-white p-2 rounded-lg shadow-md opacity-80`}>
                                <TextTheme size="xs">{placeNames.destinations[currentDestinationIndex]?.displayName || 'ไม่ระบุชื่อ'}</TextTheme>
                                <TextTheme size="xs">{placeNames.destinations[currentDestinationIndex]?.scheduledTime || 'เวลาไม่ระบุ'}</TextTheme>
                            </View>
                        </Marker>
                    )}
                </React.Fragment>
            );
        }
    }, [showAllDestinations, polylines, placeNames, completedDestinations]);


    const zoomToFitMarkers = useCallback(() => {
        if (mapRef.current && placeDestinations.length > 0) {
            const coordinates = placeDestinations.map(dest => dest.location);
            if (location) {
                coordinates.push({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
            }
            mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }
    }, [placeDestinations, location]);

    const zoomToCurrentRoute = useCallback(() => {
        if (mapRef.current && location && placeDestinations.length > 0) {
            const currentDestinationIndex = completedDestinations.length;
            const currentDestination = placeDestinations[currentDestinationIndex]?.location;
            if (currentDestination) {
                const coordinates = [
                    { latitude: location.coords.latitude, longitude: location.coords.longitude },
                    currentDestination
                ];
                mapRef.current.fitToCoordinates(coordinates, {
                    edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                    animated: true,
                });
            }
        }
    }, [location, placeDestinations, completedDestinations]);

    const toggleShowAllDestinations = useCallback(() => {
        setShowAllDestinations(prev => {
            const newValue = !prev;
            if (newValue) {
                zoomToFitMarkers();
            } else {
                zoomToCurrentRoute();
            }
            return newValue;
        });
    }, [zoomToFitMarkers, zoomToCurrentRoute]);

    const renderCurrentLocationInfo = useCallback(() => {
        if (hasArrived) {
            return (
                <Animated.View style={[tw`absolute left-4 right-4 mb-2`, floatingTextStyle, { bottom: SCREEN_HEIGHT * 0.25 }]}>
                    <View style={tw`bg-green-500 p-4 rounded-3xl shadow-md`}>
                        <TextTheme font='Prompt-SemiBold' size='lg' style={tw`text-white text-center`}>
                            มาถึงจุดหมายแล้ว!
                        </TextTheme>
                    </View>
                </Animated.View>
            );
        }
        if (!routeInfo || !routeInfo.legs[0] || !routeInfo.legs[0].steps[currentStepIndex]) {
            return null;
        }

        const currentStep = routeInfo.legs[0].steps[currentStepIndex];
        const distanceToNextTurn = (currentStep.distanceMeters / 1000);

        return (
            <Animated.View style={[tw`absolute left-4 right-4 mb-2`, floatingTextStyle, { bottom: SCREEN_HEIGHT * 0.25 }]}>
                <View style={tw`flex-col gap-2`}>
                    <View style={tw`flex-row justify-between`}>
                        <TouchableOpacity
                            style={tw`bg-blue-500 py-2 px-3 rounded-full flex-row gap-2 items-center justify-center`}
                            onPress={() => placeDestinations[placeDestinations.length - 1] && openGoogleMaps(placeDestinations[placeDestinations.length - 1].location.latitude, placeDestinations[placeDestinations.length - 1].location.longitude)}
                        >
                            <MaterialIcons name="map" size={24} color={String(tw.color("white"))} />
                            <TextTheme font='Prompt-SemiBold' size='sm' style={tw`text-white`}>แผนที่</TextTheme>
                        </TouchableOpacity>

                        <View style={tw`flex-row gap-2 items-center`}>
                            <TouchableOpacity style={tw`bg-white p-2 rounded-full shadow-lg z-99 mr-2`} onPress={toggleShowAllDestinations}>
                                <MaterialIcons
                                    name={showAllDestinations ? "visibility" : "visibility-off"}
                                    size={24}
                                    color={String(tw.color("blue-500"))}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={tw`bg-white p-2 rounded-full shadow-lg z-99 mr-2`} onPress={toggleFocus}>
                                <MaterialIcons
                                    name={focusState === 'off' ? "gps-not-fixed" : (focusState === 'center' ? "gps-fixed" : "navigation")}
                                    size={24}
                                    color={String(tw.color(focusState !== 'off' ? "blue-500" : "gray-500"))}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={tw`bg-white p-4 rounded-3xl shadow-md`}>
                        <View style={tw`flex-row items-center mb-4`}>
                            <FontAwesome5 name="map-marker-alt" size={24} color="red" />
                            <TextTheme style={tw`ml-3 flex-1`} size='sm'>
                                {placeNames.destinations[completedDestinations.length]?.displayName}
                            </TextTheme>
                        </View>
                        {currentStep && currentStep.navigationInstruction && (
                            <View style={tw`flex-row items-center`}>
                                {getTurnDirection(currentStep.navigationInstruction.maneuver, "icon")}
                                <View style={tw`ml-3 flex-1`}>
                                    <TextTheme size='sm' font='Prompt-SemiBold'>
                                        {currentStep.navigationInstruction.maneuver === "DEPART"
                                            ? `${getTurnDirection(currentStep.navigationInstruction.maneuver, "text")} ${formatDistance(distanceToNextTurn)}`
                                            : `${getTurnDirection(currentStep.navigationInstruction.maneuver, "text")} ใน ${formatDistance(distanceToNextTurn)}`}
                                    </TextTheme>
                                    <TextTheme size='sm' style={tw`text-gray-600`}>{currentStep.navigationInstruction.instructions}</TextTheme>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Animated.View>
        );
    }, [hasArrived, routeInfo, currentStepIndex, placeNames, placeDestinations, showAllDestinations, focusState, floatingTextStyle, openGoogleMaps, toggleFocus, completedDestinations]);

    useEffect(() => {
        const loadSavedDestinations = async () => {
            const saved = await loadCompletedDestinations();
            setCompletedDestinations(saved);
        };
        loadSavedDestinations();
    }, []);

    useEffect(() => {
        startLocationTracking();
        return () => {
            if (watchPositionSubscription.current) {
                watchPositionSubscription.current.remove();
            }
        };
    }, [startLocationTracking]);

    useEffect(() => {
        const fetchPlaces = async () => {
            const places = await Promise.all(destinations.map(dest => searchPlace(dest.keyword)));
            setPlaceDestinations(places.filter(place => place !== null));
            setPlaceNames(prev => ({
                ...prev,
                destinations: places.map((place, index) => ({
                    displayName: place?.displayName.text,
                    address: place?.formattedAddress,
                    scheduledTime: destinations[index].scheduledTime
                }))
            }));
        };
        fetchPlaces();
    }, [destinations, searchPlace]);

    useEffect(() => {
        if (location && placeDestinations.length > 0) {
            const isSignificantChange = (
                !prevLocationRef.current ||
                !prevPlaceDestinationsRef.current ||
                Math.abs(prevLocationRef.current.coords.latitude - location.coords.latitude) > 0.0001 ||
                Math.abs(prevLocationRef.current.coords.longitude - location.coords.longitude) > 0.0001 ||
                placeDestinations.some((dest, index) => {
                    const prevDest = prevPlaceDestinationsRef.current?.[index];
                    return !prevDest ||
                        Math.abs(prevDest.location.latitude - dest.location.latitude) > 0.0001 ||
                        Math.abs(prevDest.location.longitude - dest.location.longitude) > 0.0001;
                })
            );

            if (isSignificantChange) {
                fetchOptimizedRoute(
                    { latitude: location.coords.latitude, longitude: location.coords.longitude },
                    placeDestinations.map(dest => dest.location)
                );

                prevLocationRef.current = location;
                prevPlaceDestinationsRef.current = placeDestinations;
            }
        }
    }, [location, placeDestinations, fetchOptimizedRoute]);

    useEffect(() => {
        const updateLocationName = () => {
            if (location) {
                const isSignificantChange = (
                    !prevLocationRef.current ||
                    Math.abs(prevLocationRef.current.coords.latitude - location.coords.latitude) > 0.0001 ||
                    Math.abs(prevLocationRef.current.coords.longitude - location.coords.longitude) > 0.0001
                );

                if (isSignificantChange) {
                    updatePlaceName({ latitude: location.coords.latitude, longitude: location.coords.longitude }, 'start');
                    prevLocationRef.current = location;
                }
            }
        };

        updateLocationName();
    }, [location, updatePlaceName]);

    useEffect(() => {
        updateMapView();
    }, [focusState, location, updateMapView]);

    useEffect(() => {
        setTimeout(() => {
            setShowLoading(true);
        }, 1000);
    }, []);

    useEffect(() => {
        if (location && !isProcessingArrival && !isRouteUpdating) {
            checkProximityToDestination(location);
            updateCurrentStep();
        }
    }, [location, checkProximityToDestination, updateCurrentStep, isProcessingArrival, isRouteUpdating]);

    useEffect(() => {
        if (!showAllDestinations && !isProcessingArrival) {
            zoomToCurrentRoute();
        }
    }, [showAllDestinations, zoomToCurrentRoute, isProcessingArrival]);

    return (
        <>
            <StatusBar style='dark' />
            <Stack.Screen options={{
                headerShown: true,
                headerTitle: "",
                headerShadowVisible: false,
                gestureEnabled: false,
                headerTransparent: true,
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={tw`flex-row items-center bg-white rounded-full p-2`}>
                        <Ionicons name="chevron-back" size={24} color={tw.color('black')} />
                    </TouchableOpacity>
                )
            }} />
            <View style={tw`flex-1 justify-center items-center bg-white`}>
                {location && (
                    <MapView
                        ref={mapRef}
                        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                        initialRegion={{
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
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
                )}
                {renderCurrentLocationInfo()}
                {!isBottomSheetVisible && (
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
                    onChange={(index) => {
                        Animated.spring(animatedPosition, {
                            toValue: index,
                            useNativeDriver: true,
                        }).start();
                        setIsBottomSheetVisible(index !== -1);
                    }}
                    android_keyboardInputMode="adjustResize"
                    keyboardBlurBehavior="restore"
                    enableOverDrag={false}
                    enablePanDownToClose={true}
                    enableContentPanningGesture={false}
                >
                    <ScrollView style={tw`flex-1`}>
                        <RenderRouteDetails
                            routeInfo={routeInfo}
                            placeNames={placeNames}
                            currentStepIndex={currentStepIndex}
                            completedDestinations={completedDestinations}
                            currentDestinationDistance={currentDestinationDistance}
                        />
                    </ScrollView>
                </BottomSheet>
            </View>
        </>
    );
};

export default MapTracking;