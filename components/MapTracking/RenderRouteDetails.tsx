import { View } from "react-native-ui-lib";
import tw from "twrnc"
import TextTheme from "../TextTheme";
import Loading from "../Loading";
import { formatDistance, formatTimeDistance } from "@/helper/utiles";
import { FontAwesome5 } from "@expo/vector-icons";
import React, { useEffect, useState, useMemo } from "react";
import { getTurnDirection } from "./getTurnDirection";
import { PlaceNames, RouteInfo } from "@/types/MapTracking";

interface RenderRouteDetails_Type {
    routeInfo?: RouteInfo | null;
    placeNames: PlaceNames;
    currentStepIndex: number;
    completedDestinations: number[];
    currentDestinationDistance: number | null;
}

const RenderRouteDetails: React.FC<RenderRouteDetails_Type> = ({
    routeInfo,
    placeNames,
    currentStepIndex,
    completedDestinations,
    currentDestinationDistance
}) => {
    const [totalDistance, setTotalDistance] = useState<number>(0);
    const currentDestinationIndex = completedDestinations.length;

    useEffect(() => {
        if (routeInfo && routeInfo.distanceMeters) {
            setTotalDistance(routeInfo.distanceMeters / 1000);
        }
    }, [routeInfo]);

    const currentLeg = useMemo(() => {
        if (!routeInfo || !routeInfo.legs || routeInfo.legs.length === 0) return null;
        return routeInfo.legs[0];
    }, [routeInfo]);

    if (!currentLeg) {
        return (
            <View style={tw`p-4 justify-center items-center`}>
                <TextTheme>กำลังโหลดข้อมูลเส้นทาง...</TextTheme>
                <Loading loading={true} />
            </View>
        );
    }

    const remainingDistance = (currentLeg.distanceMeters || 0) / 1000;
    const totalDuration = currentLeg.duration ? Math.round(parseInt(currentLeg.duration.split("s")[0])) : 0;

    return (
        <View style={tw`px-4`}>
            <TextTheme style={tw`text-center pb-2`} font='Prompt-SemiBold' size='xl'>รายละเอียดการเดินทาง</TextTheme>
            <View style={tw`bg-white p-2 mb-4 rounded-lg border-b border-zinc-200`}>
                <View style={tw`flex-col mb-2`}>
                    <TextTheme font='Prompt-SemiBold' size='lg'>{formatTimeDistance(totalDuration)} ({formatDistance(remainingDistance)})</TextTheme>
                    <View style={tw`mt-2`}>
                        <TextTheme size='sm' font='Prompt-SemiBold'>
                            ระยะทางทั้งหมด: {formatDistance(totalDistance)}
                        </TextTheme>
                    </View>
                </View>
                <View style={tw`flex-row items-center mb-2`}>
                    <FontAwesome5 name="dot-circle" size={20} color="green" />
                    <TextTheme style={tw`ml-2 flex-shrink`} numberOfLines={1}>{placeNames.start || 'จุดเริ่มต้น'}</TextTheme>
                </View>
                {placeNames.destinations && placeNames.destinations.map((destination, index) => {
                    const isCompleted = completedDestinations.includes(index);
                    const isCurrent = index === currentDestinationIndex && !isCompleted;
                    return (
                        <View key={index} style={tw`flex-row items-start my-2 ${isCompleted ? 'bg-green-100' : isCurrent ? 'bg-blue-50' : 'bg-gray-100'} p-2 rounded-xl`}>
                            <View style={tw`${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-500'} p-2 rounded-full w-[8] h-[8] justify-center items-center`}>
                                <FontAwesome5 name={isCompleted ? "flag-checkered" : "map-marker-alt"} size={16} color="white" />
                            </View>
                            <View style={tw`flex-col gap-2 ml-2 flex-1`}>
                                <TextTheme numberOfLines={1} style={tw`${isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-700'}`}>
                                    {destination.displayName || 'ไม่ระบุชื่อ'}
                                </TextTheme>
                                <TextTheme numberOfLines={1} size="xs" style={tw`${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-600'}`}>
                                    {destination.address || 'ไม่ระบุที่อยู่'}
                                </TextTheme>
                                <TextTheme size="sm" font="Prompt-SemiBold" style={tw`${isCompleted ? 'text-green-500' : isCurrent ? 'text-blue-500' : 'text-gray-500'}`}>
                                    {isCompleted ? 'เสร็จสิ้น' : `เวลาที่กำหนด: ${destination.scheduledTime || 'ไม่ระบุ'}`}
                                </TextTheme>
                                {isCurrent && currentDestinationDistance !== null && (
                                    <TextTheme size="sm" style={tw`text-blue-500`}>
                                        ระยะห่าง: {formatDistance(currentDestinationDistance / 1000)}
                                    </TextTheme>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
            {currentLeg.steps && (
                <View style={tw`mb-4`}>
                    <TextTheme font='Prompt-SemiBold' size='lg' style={tw`mb-2`}>ขั้นตอนการนำทาง</TextTheme>
                    {currentLeg.steps.map((step, stepIndex) => {
                        if (!step.navigationInstruction) return null;
                        const isCompleted = stepIndex < currentStepIndex;
                        const isCurrent = stepIndex === currentStepIndex;
                        return (
                            <View key={`step-${stepIndex}`} style={tw`flex-row mb-2 rounded-xl ${isCompleted ? "bg-green-50" : isCurrent ? "bg-blue-50" : "bg-zinc-50"}`}>
                                <View style={tw`w-1/6 items-center justify-start pt-3`}>
                                    {getTurnDirection(step.navigationInstruction.maneuver, "icon")}
                                </View>
                                <View style={tw`w-5/6 ${isCompleted ? 'bg-green-100' : ""} p-2 rounded`}>
                                    <TextTheme font='Prompt-SemiBold' style={tw`${isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : ''}`}>
                                        {step.navigationInstruction.instructions}
                                    </TextTheme>
                                    <TextTheme size="sm" style={tw`${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-600'}`}>
                                        {formatDistance(step.distanceMeters / 1000)}
                                    </TextTheme>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}
            <View style={tw`pb-20`} />
        </View>
    );
};

export default RenderRouteDetails;