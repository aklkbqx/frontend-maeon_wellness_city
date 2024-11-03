import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import tw from 'twrnc';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Loading from '@/components/Loading';
import TextTheme from '@/components/TextTheme';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    interpolate,
    useAnimatedRef,
    runOnJS,
} from 'react-native-reanimated';
import { TabController, View, TouchableOpacity } from 'react-native-ui-lib';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStatusBar } from '@/hooks/useStatusBar';
import api, { apiUrl } from '@/helper/api';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';
import * as Animatable from 'react-native-animatable';

interface BookingItem {
    people: number;
    start_date: string;
    end_date: string;
    booking_detail: {
        program_id: number;
        date: string;
    }[]
}

interface DaySchedule {
    day: number;
    title?: string;
    activities: {
        sequence: number;
        start_time: string;
        end_time: string;
        activity: string;
        description: string;
        location_id: number;
        location_name: string;
        location_type: string;
        cost?: number;
        included_in_total_price?: boolean;
        is_mandatory?: boolean;
        services?: string[];
    }[];
}

interface ProgramDetail {
    id: number;
    type: number;
    program_category: 'SHORT' | 'LONG';
    name: string;
    description: string;
    schedules: DaySchedule[];
    total_price: number;
    duration_days: number;
    status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
    wellness_dimensions?: string[];
    images?: string[];
}

interface ProgramTabsProps {
    programDetail: ProgramDetail;
    scrollY: Animated.SharedValue<number>;
}

const DetailProgramScreen: React.FC = () => {
    useStatusBar("light-content");
    const { programId, bookingData, dateSelected } = useLocalSearchParams();
    const [programDetail, setProgramDetail] = useState<ProgramDetail | null>(null);
    const [parseJsonBookingData, setParseJsonBookingData] = useState<BookingItem>(() => {
        try {
            return JSON.parse((bookingData as string) || '[]');
        } catch {
            handleErrorMessage('Failed to parse initial dates');
            return [];
        }
    });

    const fetchProgramFormId = useCallback(async () => {
        try {
            const response = await api.get<{ success: boolean; programs: ProgramDetail }>(`/api/programs/${parseInt(programId as string)}`);
            if (response.data.success) {
                setProgramDetail(response.data.programs);
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message);
            });
        }
    }, [programId]);

    useEffect(() => {
        fetchProgramFormId();
    }, [fetchProgramFormId]);

    const IMAGE_HEIGHT = 300;
    const IMAGE_WIDTH = '100%';
    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const imageAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: interpolate(
                        scrollY.value,
                        [-IMAGE_HEIGHT, 0, IMAGE_HEIGHT],
                        [-IMAGE_HEIGHT / 2, 0, IMAGE_HEIGHT * 0.75]
                    ),
                },
                {
                    scale: interpolate(
                        scrollY.value,
                        [-IMAGE_HEIGHT, 0, IMAGE_HEIGHT],
                        [2, 1, 1]
                    ),
                }
            ]
        };
    });

    const selectThisProgram = async () => {
        const updatedBookingData = {
            ...parseJsonBookingData,
            booking_detail: parseJsonBookingData.booking_detail.map(item =>
                item.date === dateSelected
                    ? {
                        ...item,
                        program_id: parseInt(programId as string)
                    }
                    : item
            )
        };

        try {
            await AsyncStorage.setItem('lastTravelItinerary', JSON.stringify(updatedBookingData));
            router.replace({
                pathname: "/user/travel-schedules",
                params: {
                    dataForBooking: JSON.stringify(updatedBookingData),
                    updatedAt: new Date().getTime()
                }
            });
        } catch (error) {
            handleErrorMessage("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
    };

    const handleShare = () => {
        // TODO: Implement share functionality
    }

    const handleFavorite = () => {
        // TODO: Implement favorite functionality  
    }

    if (!programDetail) {
        return (
            <View style={tw`flex-1 justify-center items-center`}>
                <Loading loading={true} />
            </View>
        );
    }

    const images = programDetail.images || [];
    const firstImageName = images.length > 0 ? images[0] : null;

    return (
        <View style={tw`flex-1 relative`}>
            <Stack.Screen options={{
                headerTransparent: true,
                headerShown: true,
                header: () => (
                    <View style={tw`w-full ios:pt-14 android:pt-7.5 pb-1 justify-between flex-row px-5 items-center gap-2`}>
                        <TouchableOpacity onPress={() => router.back()} style={tw`bg-black/60 p-2 rounded-full overflow-hidden`}>
                            <Ionicons name="chevron-back" size={24} color={tw.color('white')} />
                        </TouchableOpacity>
                        <View style={tw`flex-row items-center gap-5`}>
                            <TouchableOpacity onPress={handleShare} style={tw`bg-black/60 p-2 rounded-full overflow-hidden`}>
                                <Ionicons name="share-outline" size={24} color={tw.color('white')} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleFavorite} style={tw`bg-black/60 p-2 rounded-full overflow-hidden`}>
                                <Ionicons name="heart-outline" size={24} color={tw.color('white')} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )
            }} />

            <View style={tw`flex-1 bg-white pb-20`}>
                <Animated.ScrollView
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                >
                    {firstImageName && (
                        <Animated.Image
                            style={[{ height: IMAGE_HEIGHT, width: IMAGE_WIDTH }, imageAnimatedStyle]}
                            source={{ uri: `${apiUrl}/images/program_images/${firstImageName}` }}
                        />
                    )}
                    {programDetail && (
                        <ProgramTabs
                            programDetail={programDetail}
                            scrollY={scrollY}
                        />
                    )}
                </Animated.ScrollView>
                {/* {programDetail && (
                    <ProgramTabs
                        programDetail={programDetail}
                        scrollY={scrollY}
                        mainScrollEnabled={mainScrollEnabled}
                        mainScrollRef={mainScrollRef}
                    />
                )} */}

                <View style={tw`p-5 absolute bottom-2 left-0 right-0`}>
                    <TouchableOpacity onPress={selectThisProgram}>
                        <LinearGradient style={tw`rounded-2xl py-3 items-center`} colors={[String(tw.color("blue-500")), String(tw.color("blue-600"))]}>
                            <TextTheme font="Prompt-SemiBold" size="lg" style={tw`text-white`}>
                                เลือกโปรแกรมนี้
                            </TextTheme>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

        </View>
    );
};

export default DetailProgramScreen;

const ActivityCard: React.FC<{ activity: any; isLast: boolean }> = ({ activity, isLast }) => (
    <View style={tw`px-5 py-4 bg-white ${!isLast ? 'border-b border-gray-100' : ''}`}>
        {/* Time and Location */}
        <View style={tw`flex-row items-center justify-between mb-3`}>
            <View style={tw`flex-row items-center gap-2`}>
                <View style={tw`w-10 h-10 rounded-full bg-blue-50 items-center justify-center`}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color={String(tw.color('blue-500'))} />
                </View>
                <TextTheme font="Prompt-Medium" size="base" style={tw`text-blue-500`}>
                    {`${activity.start_time.slice(0, 5)} - ${activity.end_time.slice(0, 5)}`}
                </TextTheme>
            </View>
            {activity.location_name && (
                <View style={tw`flex-row items-center gap-1`}>
                    <MaterialCommunityIcons name="map-marker" size={16} color={String(tw.color('gray-500'))} />
                    <TextTheme size="sm" style={tw`text-gray-500`}>
                        {activity.location_name}
                    </TextTheme>
                </View>
            )}
        </View>

        {/* Activity Title and Description */}
        <View style={tw`ml-12`}>
            <TextTheme font="Prompt-SemiBold" size="lg" style={tw`mb-2`}>
                {activity.activity}
            </TextTheme>
            <TextTheme style={tw`text-gray-600 mb-3`}>
                {activity.description}
            </TextTheme>

            {/* Services Tags */}
            {activity.services && (
                <View style={tw`flex-row flex-wrap gap-2`}>
                    {activity.services.map((service: string, index: number) => (
                        <View key={index} style={tw`bg-blue-50 rounded-full px-3 py-1`}>
                            <TextTheme size="xs" style={tw`text-blue-600`}>{service}</TextTheme>
                        </View>
                    ))}
                </View>
            )}
        </View>
    </View>
);

const ProgramTabs: React.FC<ProgramTabsProps> = ({
    programDetail,
    scrollY,
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const renderOverview = () => {
        const schedulesByDay = useMemo(() => {
            return programDetail.schedules.reduce((acc, schedule) => {
                const dayKey = `day${schedule.day}`;
                if (!acc[dayKey]) {
                    acc[dayKey] = [];
                }
                acc[dayKey].push(schedule);
                return acc;
            }, {} as Record<string, typeof programDetail.schedules>);
        }, [programDetail.schedules]);

        return (
            <View style={tw`flex-1`}>
                {/* Program Header */}
                <View style={tw`bg-white p-5 mb-2`}>
                    <View style={tw`flex-row items-center gap-2 mb-2`}>
                        <View style={tw`px-3 py-1 bg-blue-100 rounded-full`}>
                            <TextTheme size="sm" style={tw`text-blue-600`}>
                                {programDetail.type === 1 ? 'โปรแกรมระยะสั้น' : 'โปรแกรมระยะยาว'}
                            </TextTheme>
                        </View>
                        <View style={tw`px-3 py-1 bg-green-100 rounded-full`}>
                            <TextTheme size="sm" style={tw`text-green-600`}>
                                {programDetail.duration_days} วัน
                            </TextTheme>
                        </View>
                    </View>

                    <TextTheme font="Prompt-Bold" size="xl" style={tw`mb-3`}>
                        {programDetail.name}
                    </TextTheme>

                    <TextTheme style={tw`text-gray-600 leading-6`}>
                        {programDetail.description}
                    </TextTheme>

                    <View style={tw`mt-4 p-4 bg-gray-50 rounded-xl`}>
                        <View style={tw`flex-row justify-between items-center`}>
                            <TextTheme font="Prompt-Medium">ราคาโปรแกรม</TextTheme>
                            <TextTheme font="Prompt-Bold" size="xl" style={tw`text-green-600`}>
                                {programDetail.total_price.toLocaleString()} บาท
                            </TextTheme>
                        </View>
                    </View>
                </View>

                <View style={tw`bg-white`}>
                    <View style={tw`px-5 py-4 border-b border-gray-100`}>
                        <TextTheme font="Prompt-Bold" size="lg">กำหนดการ</TextTheme>
                    </View>

                    {Object.entries(schedulesByDay).map(([dayKey, schedules]) => (
                        <View key={dayKey}>
                            <View style={tw`px-5 py-3 bg-gray-50`}>
                                <TextTheme font="Prompt-SemiBold" style={tw`text-gray-600`}>
                                    วันที่ {schedules[0].day}
                                </TextTheme>
                            </View>

                            {schedules.map((schedule) => (
                                <View key={schedule.day}>
                                    {schedule.activities.map((activity, index) => (
                                        <ActivityCard
                                            key={index}
                                            activity={activity}
                                            isLast={index === schedule.activities.length - 1}
                                        />
                                    ))}
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderDetails = () => {
        const details = [
            {
                icon: 'clock-outline' as keyof typeof MaterialCommunityIcons.glyphMap,
                title: 'ประเภทโปรแกรม' as keyof typeof MaterialCommunityIcons.glyphMap,
                value: programDetail.type === 1 ? 'โปรแกรมระยะสั้น' : 'โปรแกรมระยะยาว',
                color: 'blue'
            },
            {
                icon: 'calendar-range' as keyof typeof MaterialCommunityIcons.glyphMap,
                title: 'ระยะเวลา',
                value: `${programDetail.duration_days} วัน`,
                color: 'green'
            },
            {
                icon: 'heart-pulse' as keyof typeof MaterialCommunityIcons.glyphMap,
                title: 'มิติสุขภาวะ',
                value: programDetail.wellness_dimensions?.join(', ') || '-',
                color: 'rose'
            }
        ];

        return (
            <View style={tw`flex-1 bg-gray-50`}>
                <View style={tw`p-5`}>
                    {details.map((detail, index) => (
                        <Animatable.View
                            key={index}
                            animation="fadeInUp"
                            delay={index * 100}
                            style={tw`bg-white rounded-xl p-4 mb-4 shadow-sm`}
                        >
                            <View style={tw`flex-row items-center gap-3 mb-2`}>
                                <View style={tw`w-10 h-10 rounded-full bg-${detail.color}-50 items-center justify-center`}>
                                    <MaterialCommunityIcons
                                        name={detail.icon}
                                        size={24}
                                        color={String(tw.color(`${detail.color}-500`))}
                                    />
                                </View>
                                <TextTheme font="Prompt-Medium" size="base">
                                    {detail.title}
                                </TextTheme>
                            </View>
                            <TextTheme style={tw`ml-13 text-gray-600`}>
                                {detail.value}
                            </TextTheme>
                        </Animatable.View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <View style={tw`flex-1 bg-white -mt-6 rounded-t-3xl overflow-hidden`}>
            {/* TabController section */}
            <TabController
                asCarousel
                items={[
                    { label: 'ภาพรวม' },
                    { label: 'ข้อมูลเพิ่มเติม' }
                ]}
                initialIndex={selectedIndex}
                onChangeIndex={setSelectedIndex}
            >
                <TabController.TabBar
                    backgroundColor="white"
                    labelStyle={{ fontFamily: "Prompt-Regular" }}
                    selectedLabelStyle={{ fontFamily: "Prompt-SemiBold" }}
                    selectedLabelColor={String(tw.color("blue-500"))}
                    indicatorStyle={tw`bg-blue-500 h-1 rounded-full`}
                />

                <TabController.PageCarousel>
                    <TabController.TabPage index={0}>
                        {renderOverview()}
                    </TabController.TabPage>
                    <TabController.TabPage index={1}>
                        {renderDetails()}
                    </TabController.TabPage>
                </TabController.PageCarousel>
            </TabController>
        </View>
    );
};