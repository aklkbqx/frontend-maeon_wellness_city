import React from 'react'
import { Stack } from 'expo-router'

const RootReceipt = () => {
    return (
        <Stack>
            <Stack.Screen name='[id]' options={{ headerShown: false, gestureEnabled: false }} />
        </Stack>
    )
}

export default RootReceipt