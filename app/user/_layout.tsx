import React from 'react'
import { Stack } from 'expo-router'
import AppUsageStatusProvider from '@/context/AppUsageStatusProvider'
import { FetchMeProvider } from '@/context/FetchMeContext'
import { useRedirectByRole } from '@/hooks/useRedirectByRole'

const UserLayout = () => {
    const { isLoading } = useRedirectByRole(['user']);

    if (isLoading) {
        return null;
    }

    return (
        <AppUsageStatusProvider>
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
        </AppUsageStatusProvider>
    );
};

const RootUser = () => {
    return (
        <FetchMeProvider>
            <UserLayout />
        </FetchMeProvider>
    )
}

export default RootUser