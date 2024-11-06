import { Stack } from "expo-router"

const RootAdminLocations = () => {
    return (
        <Stack screenOptions={{
            // headerShown: false
        }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="detail" />
        </Stack>
    )
}

export default RootAdminLocations