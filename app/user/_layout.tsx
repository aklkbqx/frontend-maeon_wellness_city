import React from 'react'
import { Stack } from 'expo-router'
import { FetchMeProvider, useFetchMeContext } from '@/context/FetchMeContext'
import { useRedirectByRole } from '@/hooks/useRedirectByRole'
import NotificationProvider, { useNotification } from '@/context/NotificationProvider'
import Loading from '@/components/Loading'
import { View } from 'react-native'
import tw from "twrnc"
import TextTheme from '@/components/TextTheme'
import LoadingScreen from '@/components/LoadingScreen'

const UserLayout = () => {
    const { isLoading } = useRedirectByRole(['user']);

    if (isLoading) {
        return <LoadingScreen />
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