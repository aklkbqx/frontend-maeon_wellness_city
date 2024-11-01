import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import tw from 'twrnc';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import { Ionicons } from '@expo/vector-icons';
import Loading from '@/components/Loading';
import TextTheme from '@/components/TextTheme';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    interpolate,
} from 'react-native-reanimated';
import { TabController, View, TouchableOpacity } from 'react-native-ui-lib';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStatusBar } from '@/hooks/useStatusBar';
import api, { apiUrl } from '@/helper/api';
import { ScrollView } from 'react-native';

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
                pathname: "/travel-schedules",
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

            <View style={tw`flex-1`}>
                <Animated.ScrollView
                    style={tw`flex-1`}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                    stickyHeaderIndices={[1]}
                    contentContainerStyle={tw`pb-20`}
                    nestedScrollEnabled
                    scrollEnabled
                >
                    {firstImageName && (
                        <Animated.Image
                            style={[{ height: IMAGE_HEIGHT, width: IMAGE_WIDTH }, imageAnimatedStyle]}
                            source={{ uri: `${apiUrl}/images/program_images/${firstImageName}` }}
                        />
                    )}
                    {programDetail && <ProgramTabs programDetail={programDetail} scrollY={scrollY} />}
                </Animated.ScrollView>

                <View style={tw`p-4 absolute bottom-2 left-0 right-0`}>
                    <TouchableOpacity onPress={selectThisProgram}>
                        <LinearGradient style={tw`rounded-2xl py-3 items-center`} colors={[String(tw.color("blue-400")), String(tw.color("blue-500"))]}>
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


const ProgramTabs: React.FC<{ programDetail: ProgramDetail; scrollY: Animated.SharedValue<number> }> = ({ programDetail, scrollY }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [items] = useState([
        { label: 'ภาพรวม', key: 'overview' },
        { label: 'รายละเอียด', key: 'details' }
    ]);

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
            <ScrollView style={tw`flex-1 bg-white`}>
                <View style={tw`pt-3 px-5`}>
                    <TextTheme font="Prompt-Bold" size="xl" style={tw`mb-2`}>{programDetail.name}</TextTheme>
                    <TextTheme font="Prompt-Regular" size="base" style={tw`mb-4`}>{programDetail.description}</TextTheme>
                </View>

                {Object.entries(schedulesByDay).map(([dayKey, schedules]) => (
                    <View key={dayKey} style={tw``}>
                        <View style={tw`py-3 px-5 bg-gray-100`}>
                            <TextTheme font="Prompt-Bold" size="lg">Day {schedules[0].day}</TextTheme>
                        </View>

                        {schedules.map((schedule) => (
                            <React.Fragment key={schedule.day}>
                                {schedule.activities.map((activity, index) => (
                                    <View key={index} style={tw`px-5 py-3 border-b border-gray-200 bg-white`}>
                                        <View style={tw`flex-row items-start justify-between`}>
                                            <View style={tw`w-3/4`}>
                                                <TextTheme font="Prompt-Medium" size="base">
                                                    {`${activity.start_time.slice(0, 5)} - ${activity.end_time.slice(0, 5)}`}
                                                </TextTheme>
                                                <TextTheme font="Prompt-Medium" size="lg" style={tw`mb-1`}>
                                                    {activity.activity}
                                                </TextTheme>
                                            </View>
                                            <TextTheme font="Prompt-Regular" size="base" style={tw`text-gray-500`}>
                                                {activity.location_name}
                                            </TextTheme>
                                        </View>

                                        <TextTheme font="Prompt-Regular" size="sm" style={tw`text-gray-600`}>
                                            {activity.description}
                                        </TextTheme>

                                        {activity.services && (
                                            <View style={tw`mt-2 flex-row flex-wrap`}>
                                                {activity.services.map((service: string, index: number) => (
                                                    <View key={index} style={tw`bg-blue-100 rounded-full px-2 py-1 mr-2 mb-2`}>
                                                        <TextTheme font="Prompt-Regular" size="sm" style={tw`text-blue-600`}>{service}</TextTheme>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </React.Fragment>
                        ))}
                    </View>
                ))}
            </ScrollView>
        );
    };

    const renderDetails = () => {
        const programType = programDetail.type === 1 ? 'โปรแกรมระยะสั้น' : 'โปรแกรมระยะยาว';
        const wellnessDimensions = programDetail.wellness_dimensions?.join(', ') || '-';

        return (
            <View style={tw`flex-1 bg-white p-5`}>
                <TextTheme font="Prompt-Medium" size="lg" style={tw`mb-2`}>ประเภทโปรแกรม</TextTheme>
                <TextTheme font="Prompt-Regular" size="base" style={tw`mb-4`}>{programType}</TextTheme>
                <TextTheme font="Prompt-Medium" size="lg" style={tw`mb-2`}>ระยะเวลา</TextTheme>
                <TextTheme font="Prompt-Regular" size="base" style={tw`mb-4`}>{programDetail.duration_days} วัน</TextTheme>
                <TextTheme font="Prompt-Medium" size="lg" style={tw`mb-2`}>มิติสุขภาวะ</TextTheme>
                <TextTheme font="Prompt-Regular" size="base" style={tw`mb-4`}>{wellnessDimensions}</TextTheme>
            </View>
        );
    };

    return (
        <View>
            <View style={tw`flex-1 rounded-t-2xl overflow-hidden absolute top-[-5]`}>
                <TabController
                    asCarousel
                    items={items}
                    initialIndex={selectedIndex}
                    onChangeIndex={(index) => setSelectedIndex(index)}
                >
                    <TabController.TabBar
                        labelStyle={{ fontFamily: "Prompt-Regular" }}
                        selectedLabelStyle={{ fontFamily: "Prompt-Regular" }}
                        selectedLabelColor={String(tw.color("blue-500"))}
                        selectedIconColor={String(tw.color("blue-500"))}
                        iconColor={String(tw.color("blue-500"))}
                        indicatorStyle={tw`bg-blue-500 h-0.5 rounded-full`}
                    />
                    <TabController.PageCarousel>
                        <TabController.TabPage index={0} lazy>
                            {renderOverview()}
                        </TabController.TabPage>
                        <TabController.TabPage index={1} lazy>
                            {renderDetails()}
                        </TabController.TabPage>
                    </TabController.PageCarousel>
                </TabController>
            </View>
        </View>
    );
};