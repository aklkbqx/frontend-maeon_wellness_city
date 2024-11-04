import React from 'react'
import { Stack } from 'expo-router'
import { FetchMeProvider, useFetchMeContext } from '@/context/FetchMeContext'
import { useRedirectByRole } from '@/hooks/useRedirectByRole'
import NotificationProvider, { useNotification } from '@/context/NotificationProvider'
import Loading from '@/components/Loading'
import { View } from 'react-native'
import tw from "twrnc"
import TextTheme from '@/components/TextTheme'

const UserLayout = () => {
    const { isLoading } = useRedirectByRole(['user']);

    if (isLoading ) {
        return (
            <View style={tw`flex-col flex-1 justify-center items-center`}>
                <View style={tw`bg-blue-500/10 rounded-xl p-3`}>
                    <Loading loading />
                    <TextTheme>กำลังโหลด...</TextTheme>
                </View>
            </View>
        );
    }
    return (
        <Stack>
            <Stack.Screen
                name="(tabs)"
                options={{
                    headerShown: false,
                    gestureEnabled: false
                }}
            />
            <Stack.Screen
                name="(pages)"
                options={{
                    headerShown: false,
                    gestureEnabled: false
                }}
            />
        </Stack>
    );
};

const RootUser = () => {
    return (
        <FetchMeProvider>
            <NotificationProvider>
                <UserLayout />
            </NotificationProvider>
        </FetchMeProvider>
    )
}

export default RootUser