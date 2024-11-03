import React, { useState, useCallback, useEffect } from 'react';
import { ScrollView, TouchableOpacity, View, RefreshControl, Image, FlatList } from 'react-native';
import { Carousel } from 'react-native-ui-lib';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { router } from 'expo-router';
import tw from 'twrnc';

import { useStatusBar } from '@/hooks/useStatusBar';
import { useFetchMeContext } from '@/context/FetchMeContext';
import TextTheme from '@/components/TextTheme';
import { Avatar } from 'react-native-ui-lib';
import { formatEmail } from '@/helper/my-lib';
import api from '@/helper/api';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import CalendarModal from '@/components/user/CalendarModal';
import Loading from '@/components/Loading';


interface LocationType {
    id: string;
    name: string;
}

interface TourItem {
    name: string;
    description: string;
    image: string;
}

interface CategoryButtonProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    color: string;
    onPress: () => void;
}

interface PopularPlaceProps extends TourItem {
    onPress: () => void;
}

const getIconName = (name: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch (name) {
        case "สถานที่ท่องเที่ยว": return "map-marker";
        case "ที่พัก": return "bed";
        case "แหล่งเรียนรู้": return "school";
        case "ร้านอาหารและของฝาก": return "store";
        default: return "map-marker-question";
    }
};

const getIconColor = (index: number): string => {
    const colors = ["rose", "sky", "purple", "amber", "fuchsia"];
    return colors[index % colors.length];
};

const popularTours: TourItem[] = [
    {
        name: 'หมู่บ้านแม่กำปอง',
        description: 'บ้านแม่กำปอง หมู่บ้านที่ซ่อนตัวอยู่ในหุบเขา เนื่องจากภูมิประเทศส่วนใหญ่เป็นดอนและมีความสูงกว่าระดับน้ำทะเลถึง 1,300 เมตร',
        image: 'https://cms.dmpcdn.com/travel/2021/07/29/31b47440-f028-11eb-8217-8759e1bcd621_webp_original.jpg'
    },
    {
        name: 'น้ําตกแม่กำปอง',
        description: 'น้ำตกที่สวยงามท่ามกลางธรรมชาติ',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtxcron-Jb7a_3RiMyunIzxmAtGXE5GHzxYA&s'
    },
    // ... add more tours as needed
];

const ProfileHeader: React.FC = () => {
    const { userData, profileImageUrl, isLoading, initializeUserData } = useFetchMeContext();

    return (
        <View style={tw`px-5 py-3`}>
            <TouchableOpacity
                style={tw`flex-row items-center gap-3`}
                disabled={userData ? false : true}
                onPress={() => router.navigate("/pages/edit-account")}
            >
                <View style={tw`h-16 w-16 rounded-full bg-slate-200 justify-center items-center shadow-sm`}>
                    {userData && profileImageUrl ? (
                        <Avatar
                            size={60}
                            badgePosition='BOTTOM_RIGHT'
                            badgeProps={{
                                backgroundColor: String(tw`text-green-500`.color),
                                size: 12,
                                borderWidth: 2,
                                borderColor: "white"
                            }}
                            source={{ uri: profileImageUrl }}
                        />
                    ) : (
                        <Avatar
                            size={60}
                            source={require("@/assets/images/default-profile.jpg")}
                        />
                    )}
                </View>

                <View style={tw`flex-1`}>
                    <TextTheme size='sm' font='Prompt-Bold' color='white'>ยินดีต้อนรับ</TextTheme>
                    {userData ? (
                        <>
                            <TextTheme font='Prompt-SemiBold' size='sm' color='slate-100'>
                                {userData?.firstname} {userData?.lastname}
                            </TextTheme>
                            <TextTheme size='xs' color='slate-200'>
                                {formatEmail(String(userData?.email))}
                            </TextTheme>
                        </>
                    ) : (
                        <View style={tw`flex-row gap-2 mt-1`}>
                            <TouchableOpacity
                                onPress={() => router.navigate("/auth/register")}
                                style={tw`bg-blue-500 px-3 py-1.5 rounded-full`}
                            >
                                <TextTheme size='sm' color='white'>ลงทะเบียน</TextTheme>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => router.navigate("/auth/login")}
                                style={tw`bg-white border border-blue-500 px-3 py-1.5 rounded-full`}
                            >
                                <TextTheme size='sm' color='blue-500'>เข้าสู่ระบบ</TextTheme>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    onPress={() => router.navigate("/user/home/search")}
                    style={tw`p-2 bg-white rounded-full shadow-sm`}
                >
                    <Ionicons name="search" size={24} color={String(tw.color('blue-500'))} />
                </TouchableOpacity>
            </TouchableOpacity>
        </View>
    );
};


const CategoryButton: React.FC<CategoryButtonProps> = ({ icon, label, color, onPress }) => (
    <Animatable.View animation="fadeIn" style={tw`px-2 mb-4`}>
        <TouchableOpacity onPress={onPress} style={tw`items-center`}>
            <LinearGradient
                colors={[String(tw.color('white')), String(tw.color(`${color}-50`))]}>
                <View style={tw`aspect-square rounded-2xl p-4 shadow-sm border border-${color}-100`}>
                    <View style={tw`flex-1 justify-center items-center`}>
                        <MaterialCommunityIcons name={icon} size={32} color={String(tw.color(`${color}-500`))} />
                    </View>
                </View>
            </LinearGradient>
            <TextTheme size='xs' style={tw`text-center mt-2 text-gray-700`}>{label}</TextTheme>
        </TouchableOpacity>
    </Animatable.View>
);


const PopularPlace: React.FC<{
    image: string;
    name: string;
    description: string;
    onPress: () => void;
}> = ({ image, name, description, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        style={tw`bg-white rounded-2xl shadow-sm overflow-hidden mb-4`}
    >
        <Image source={{ uri: image }} style={tw`w-full h-40`} />
        <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={tw`absolute bottom-0 left-0 right-0 p-4`}
        >
            <TextTheme font="Prompt-SemiBold" size="lg" style={tw`text-white mb-1`}>
                {name}
            </TextTheme>
            <TextTheme size="sm" style={tw`text-gray-200`} numberOfLines={2}>
                {description}
            </TextTheme>
        </LinearGradient>
    </TouchableOpacity>
);

const HomeScreen: React.FC = () => {
    useStatusBar("dark-content");
    const [refreshing, setRefreshing] = useState(false);
    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);
    const [loading, setLoading] = useState(true);
    const { refreshUserData } = useFetchMeContext();

    // Handle refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([
            refreshUserData(),
            fetchLocationTypes()
        ]);
        setRefreshing(false);
    }, []);

    // Fetch location types
    const fetchLocationTypes = async () => {
        try {
            const response = await api.get("/api/locations/types");
            if (response.data.success) {
                setLocationTypes(response.data.location_type);
            }
        } catch (error) {
            handleAxiosError(error, handleErrorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocationTypes();
    }, []);

    // Handle calendar confirmation
    const handleCalendarConfirm = (bookingData: any) => {
        router.navigate({
            pathname: '/user/travel-schedules/',
            params: {
                dataForBooking: JSON.stringify(bookingData)
            }
        });
    };

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[String(tw.color("blue-500"))]}
                        tintColor={String(tw.color("blue-500"))}
                    />
                }
            >
                <LinearGradient
                    colors={[String(tw.color("blue-500")), String(tw.color("blue-600"))]}
                    style={tw`mt-15 rounded-3xl mx-4`}
                >
                    <ProfileHeader />
                </LinearGradient>

                <View style={tw`px-5 py-3`}>
                    <TextTheme font="Prompt-Bold" size="2xl" style={tw`text-gray-900 mb-2`}>
                        เที่ยวแม่ออน
                    </TextTheme>
                    <TextTheme size="base" style={tw`text-gray-600 mb-4`}>
                        ค้นพบประสบการณ์ท่องเที่ยวที่น่าประทับใจ
                    </TextTheme>

                    <TouchableOpacity
                        onPress={() => setIsCalendarVisible(true)}
                        style={tw`bg-blue-500 p-4 rounded-xl shadow-sm`}
                    >
                        <View style={tw`flex-row items-center justify-between`}>
                            <View style={tw`flex-row items-center gap-3`}>
                                <MaterialCommunityIcons name="calendar-check" size={24} color="white" />
                                <TextTheme font="Prompt-SemiBold" style={tw`text-white`}>
                                    เริ่มจองทริปของคุณ
                                </TextTheme>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Categories */}
                {!loading && (
                    <View style={tw`px-5`}>
                        <View style={tw`flex-row justify-between items-center mb-4`}>
                            <TextTheme font="Prompt-Bold" size="lg">หมวดหมู่</TextTheme>
                            <TouchableOpacity style={tw`flex-row items-center gap-1`}>
                                <TextTheme color="blue-500">ดูทั้งหมด</TextTheme>
                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={20}
                                    color={String(tw.color("blue-500"))}
                                />
                            </TouchableOpacity>
                        </View>
                        <View style={tw``}>
                            {/* {locationTypes.map((type, index) => {
                                return (
                                    <CategoryButton
                                        key={type.id}
                                        icon={getIconName(type.name)}
                                        label={type.name}
                                        color={getIconColor(index)}
                                        onPress={() => console.log(type.name)}
                                    />
                                )
                            })} */}
                        </View>
                    </View>
                )}

                {/* Popular Places */}
                <View style={tw`px-5 mt-6`}>
                    <TextTheme font="Prompt-Bold" size="lg" style={tw`mb-4`}>
                        แนะนำสำหรับคุณ
                    </TextTheme>
                    {popularTours.map((tour, index) => (
                        <PopularPlace
                            key={index}
                            {...tour}
                            onPress={() => console.log(tour.name)}
                        />
                    ))}
                </View>

                <View style={tw`h-20`} />
            </ScrollView>

            <CalendarModal
                visible={isCalendarVisible}
                onClose={() => setIsCalendarVisible(false)}
                onConfirm={handleCalendarConfirm}
            />
        </View>
    );
};

export default HomeScreen;