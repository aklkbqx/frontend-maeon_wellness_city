import { Stack } from "expo-router"
import { View } from "react-native-ui-lib"
import tw from "twrnc"

const RootAdminLocations = () => {
    return (
        <Stack>
            <Stack.Screen name="index" options={{
                header: () => (
                    <View style={tw`bg-white border-b border-gray-200`}>
                        <View style={tw`px-4 pt-14 pb-4`}>
                            <View style={tw`flex-row justify-between items-center mb-4`}>
                                <View style={tw`bg-slate-200 rounded-xl w-30 p-4`} />
                                <View style={tw`bg-slate-200 w-30 p-5 rounded-xl flex-row items-center`} />
                            </View>

                            <View style={tw`flex-row items-center gap-3`}>
                                <View style={tw`bg-slate-200 flex-1 p-5 rounded-xl`} />
                                <View style={tw`bg-slate-200 w-25 p-5 rounded-xl`} />
                            </View>
                        </View>
                    </View>
                )
            }} />
            <Stack.Screen name="detail" options={{
                headerShown: false
            }} />
        </Stack>
    )
}

export default RootAdminLocations