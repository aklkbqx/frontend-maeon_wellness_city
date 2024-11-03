import { TouchableOpacity } from 'react-native'
import React, { useCallback, useState } from 'react'
import { Href, router, Stack, useFocusEffect } from 'expo-router'
import TextTheme from '@/components/TextTheme'
import tw from "twrnc"
import { Ionicons } from '@expo/vector-icons'
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { formatEmail } from '@/helper/my-lib'
import { Avatar, View } from 'react-native-ui-lib'
import { useStatusBar } from '@/hooks/useStatusBar'
import { useFetchMeContext } from '@/context/FetchMeContext'

// TODO optimize image loading

const SkeletonLoader: React.FC<{ width: number; height: number; borderRadius: number }> = ({ width, height, borderRadius }) => {
    return (
        <Animatable.View animation={"flash"} iterationCount="infinite" duration={5000}>
            <View style={[tw`bg-slate-200`, { width, height, borderRadius }]} />
        </Animatable.View>
    )
}

const RootHome = () => {
    useStatusBar("dark-content");

    return (
        <Stack screenOptions={{
            headerTitleStyle: [tw`text-lg`, { fontFamily: "Prompt-SemiBold" }],
            headerTitleAlign: "center",
            animation: "fade",
        }}
        >
            <Stack.Screen name='index' options={{
                title: "",
                headerShown: false
            }} />
            <Stack.Screen name='search' options={{
                title: "ค้นหา",
                presentation: "card",
                headerLeft: () => (
                    <TouchableOpacity style={tw`flex-row items-center`} onPress={() => router.back()}>
                        <Ionicons size={25} name='chevron-down' />
                    </TouchableOpacity>
                ),
                headerStyle: tw`bg-gray-50`,
                animation: "fade_from_bottom",
                headerShadowVisible: false,
                headerShown: false,
            }} />
        </Stack>
    )
}

export default RootHome