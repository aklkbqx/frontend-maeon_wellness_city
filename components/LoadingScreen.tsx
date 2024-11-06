import { View } from "react-native"
import Loading from "./Loading"
import tw from "twrnc"
import TextTheme from "./TextTheme"

const LoadingScreen = () => {
    return (
        <View style={tw`flex-col flex-1 justify-center items-center`}>
            <View style={tw`bg-blue-500/10 rounded-xl p-3`}>
                <Loading loading />
                <TextTheme>กำลังโหลด...</TextTheme>
            </View>
        </View>
    )
}

export default LoadingScreen;