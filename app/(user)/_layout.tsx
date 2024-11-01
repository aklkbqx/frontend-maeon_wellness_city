import React from 'react'
import { Stack } from 'expo-router'
import AppUsageStatusProvider from '@/context/AppUsageStatusProvider'
import NotificationProvider from '@/context/NotificationProvider'
import { FetchMeProvider } from '@/context/FetchMeContext'

const RootUser = () => {
    return (
        <FetchMeProvider>
            <NotificationProvider>
                <AppUsageStatusProvider>
                    <Stack>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
                        <Stack.Screen name="(pages)" options={{ headerShown: false, gestureEnabled: false }} />
                    </Stack>
                </AppUsageStatusProvider>
            </NotificationProvider>
        </FetchMeProvider>
    )
}

export default RootUser