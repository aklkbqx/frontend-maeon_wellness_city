import { router, Tabs, useFocusEffect, usePathname, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from "twrnc"
import { Avatar, TouchableOpacity, View } from 'react-native-ui-lib';
import * as Animatable from 'react-native-animatable';
import { useStatusBar } from '@/hooks/useStatusBar';
import TextTheme from '@/components/TextTheme';
import { FetchMeProvider, useFetchMeContext } from '@/context/FetchMeContext';
import React, { useCallback, useEffect } from 'react';
import { formatEmail } from '@/helper/my-lib';
import UserRoleBadge from '@/components/UserRoleBadge';
import { LinearGradient } from 'expo-linear-gradient';

const SkeletonLoader: React.FC<{ width: number; height: number; borderRadius: number }> = ({ width, height, borderRadius }) => {
    return (
        <Animatable.View animation={"flash"} iterationCount="infinite" duration={5000}>
            <View style={[tw`bg-slate-100`, { width, height, borderRadius }]} />
        </Animatable.View>
    )
}

function AdminLayout() {
    useStatusBar("dark-content");
    const { userData, profileImageUrl, isLoading, initializeUserData } = useFetchMeContext();

    const pathname = usePathname();
    const segments = useSegments();

    const fetchData = useCallback(async () => {
        await initializeUserData();
    }, [initializeUserData, pathname, segments]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    useEffect(() => {
        fetchData();
    }, [pathname, segments, fetchData]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <View style={tw`flex-row items-center gap-3`}>
                    <SkeletonLoader width={68} height={68} borderRadius={50} />
                    <View style={tw`flex-col gap-2`}>
                        <SkeletonLoader width={100} height={12} borderRadius={5} />
                        <SkeletonLoader width={128} height={10} borderRadius={5} />
                        <SkeletonLoader width={115} height={10} borderRadius={5} />
                    </View>
                </View>
            )
        }

        return (
            <View style={tw`flex-row items-center gap-3`}>
                <View style={tw` h-17 w-17 rounded-full bg-slate-200 justify-center items-center`}>
                    {userData && profileImageUrl ? (
                        <Avatar
                            size={63}
                            badgePosition='BOTTOM_RIGHT'
                            badgeProps={{ backgroundColor: String(tw`text-green-500`.color), size: 15, borderWidth: 1, borderColor: "white" }}
                            source={{ uri: profileImageUrl }}
                        />
                    ) : (
                        <Avatar
                            size={63}
                            source={require("@/assets/images/default-profile.jpg")}
                        />)
                    }
                </View>
                <View style={tw`flex-col`}>
                    {userData ? (
                        <View>
                            <View style={tw`flex-col`}>
                                <TextTheme font='Prompt-SemiBold' size='sm' color='slate-600' style={tw.style("w-[220px]")} >
                                    {userData?.firstname} {userData?.lastname}
                                </TextTheme>
                                <TextTheme size='xs' color='zinc-600'>
                                    {formatEmail(String(userData?.email))}
                                </TextTheme>
                            </View>
                            <View style={tw`flex-row`}>
                                <UserRoleBadge role={userData?.role} style={tw`mt-1`} />
                            </View>
                        </View>
                    ) : (null)}
                </View>
            </View>
        )
    }
    return (
        <Tabs screenOptions={{
            tabBarStyle: tw`bg-white border-t border-gray-200`,
            tabBarActiveTintColor: '#4F46E5',
            tabBarInactiveTintColor: '#6B7280',
        }}>
            <Tabs.Screen
                name="dashboard"
                options={{
                    headerShown: true,
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                    header: () => (
                        <LinearGradient colors={[
                            String(tw.color("rose-100")),
                            String(tw.color("slate-100"))
                        ]} style={tw`px-5 pb-5 pt-15`}>
                            <View style={tw`flex-row justify-between items-center`}>
                                {renderContent()}
                                <View style={tw`w-10 h-10`}>
                                    <TouchableOpacity onPress={() => router.navigate("/search")} style={tw`bg-white flex-row items-center rounded-xl p-1.5 shadow`}>
                                        <Ionicons size={24} name='search' style={tw`text-black`} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </LinearGradient>
                    )
                }}
            />
            <Tabs.Screen
                name="users"
                options={{
                    title: 'Users',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people-outline" size={size} color={color} />
                    ),
                }}
            />
            {/*
            <Tabs.Screen
                name="locations"
                options={{
                    title: 'Locations',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="location-outline" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="bookings"
                options={{
                    title: 'Bookings',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar-outline" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" size={size} color={color} />
                    ),
                }}
            /> */}
        </Tabs>
    );
}

const RootAdmin = () => {
    return (
        <FetchMeProvider>
            <AdminLayout />
        </FetchMeProvider>
    )
}

export default RootAdmin;