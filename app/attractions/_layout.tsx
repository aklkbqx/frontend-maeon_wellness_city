import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, Tabs, useFocusEffect } from 'expo-router';
import tw from "twrnc"
import { tabbarStyle } from '@/context/TabBarContext';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { TouchableOpacity } from 'react-native-gesture-handler';
import TextTheme from '@/components/TextTheme';
import { Avatar } from 'react-native-ui-lib';
import { formatEmail } from '@/helper/my-lib';
import { useStatusBar } from '@/hooks/useStatusBar';
import UserRoleBadge from '@/components/UserRoleBadge';
import { FetchMeProvider, useFetchMeContext } from '@/context/FetchMeContext';

const SkeletonLoader: React.FC<{ width: number; height: number; borderRadius: number }> = ({ width, height, borderRadius }) => {
    return (
        <Animatable.View animation={"flash"} iterationCount="infinite" duration={5000}>
            <View style={[tw`bg-gray-50`, { width, height, borderRadius }]} />
        </Animatable.View>
    )
}

function TabsAttractions() {
    useStatusBar("dark-content");
    const { userData, profileImageUrl, isLoading, initializeUserData } = useFetchMeContext();

    useFocusEffect(
        React.useCallback(() => {
            initializeUserData();
        }, [initializeUserData])
    );

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
        <Tabs
            screenOptions={{
                tabBarLabelStyle: { fontFamily: "Prompt-Regular" },
                tabBarActiveTintColor: String(tw.color("rose-500")),
                tabBarInactiveTintColor: String(tw.color("rose-400")),
                tabBarActiveBackgroundColor: `${tw`text-rose-50`.color}`,
                tabBarItemStyle: tw`rounded-[5] m-[7px]`,
                headerShadowVisible: true,
                tabBarStyle: [tabbarStyle],
                headerTitleStyle: [tw`text-lg`, { fontFamily: "Prompt-SemiBold" }],
            }}
            safeAreaInsets={{ bottom: 0, left: 0, right: 0, top: 0 }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    headerShown: true,
                    title: 'หน้าแรก',
                    tabBarIcon: ({ color, focused }) => <Ionicons size={24} name={focused ? 'home' : 'home-outline'} color={color} />,
                    header: () => (
                        <LinearGradient colors={[
                            String(tw.color("rose-100")),
                            String(tw.color("slate-100"))
                        ]} style={tw`px-5 pb-5 pt-15`}>
                            <View style={tw`flex-row justify-between items-center`}>
                                {renderContent()}
                                <View style={tw`w-10 h-10`}>
                                    <TouchableOpacity onPress={() => router.navigate("/user/search")} style={tw`bg-white flex-row items-center rounded-xl p-1.5 shadow`}>
                                        <Ionicons size={24} name='search' style={tw`text-black`} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </LinearGradient>
                    )
                }}
            />
            <Tabs.Screen name="Manage"
                options={{
                    headerShown: true,
                    title: 'จัดการ',
                    tabBarIcon: ({ color, focused }) => <Ionicons size={24} name={focused ? 'list-sharp' : 'list-outline'} color={color} />,
                }}
            />
            <Tabs.Screen name="Notifications"
                options={{
                    headerShown: true,
                    title: 'แจ้งเตือน',
                    tabBarIcon: ({ color, focused }) => <Ionicons size={24} name={focused ? 'notifications' : 'notifications-outline'} color={color} />,
                }}
            />
            <Tabs.Screen name="Account"
                options={{
                    headerShown: true,
                    title: 'บัญชี',
                    tabBarIcon: ({ color, focused }) => <Ionicons size={24} name={focused ? 'person' : 'person-outline'} color={color} />,
                }}
            />
        </Tabs>
    );
}

const RootAttractions = () => {
    return (
        <FetchMeProvider>
            <TabsAttractions />
        </FetchMeProvider>
    )
}

export default RootAttractions;