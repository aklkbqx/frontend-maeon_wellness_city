import { Avatar, TouchableOpacity, View } from "react-native-ui-lib";
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TextTheme from "../TextTheme";
import tw from "twrnc";
import { router } from "expo-router";
import { formatEmail, formatPhoneNumber } from "@/helper/my-lib";
import { Users } from "@/types/PrismaType";

interface ProfileType {
    profileImageUrl: string | null;
    userData: Users | null;
    loading: boolean;
}

const ProfileSection: React.FC<ProfileType> = ({ profileImageUrl, userData, loading }) => {
    return (
        <View style={tw`relative`}>
            {/* Background Gradient */}
            <LinearGradient
                colors={[String(tw.color("slate-200")), String(tw.color("slate-200"))]}
                style={tw`absolute top-0 left-0 right-0 h-32 rounded-t-3xl`}
            />
            
            <View style={tw`p-5 pt-8`}>
                <View style={tw`flex-row items-center gap-4 bg-white rounded-2xl p-4 shadow-md`}>
                    {/* Profile Image */}
                    <View style={tw`relative`}>
                        <View style={tw`w-[90px] h-[90px] rounded-full bg-gray-100 shadow-lg overflow-hidden border-4 border-white`}>
                            {(userData && profileImageUrl) ? (
                                <Avatar
                                    size={90}
                                    source={{ uri: profileImageUrl }}
                                />
                            ) : (
                                <Avatar
                                    size={90}
                                    source={require("@/assets/images/default-profile.jpg")}
                                />
                            )}
                        </View>
                        {userData && (
                            <View style={tw`absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white`} />
                        )}
                    </View>

                    {/* Profile Info */}
                    {userData ? (
                        <TouchableOpacity 
                            onPress={() => router.navigate("/pages/edit-account")} 
                            style={tw`flex-1`}
                        >
                            <View style={tw`flex-col gap-1`}>
                                <TextTheme size='xl' font="Prompt-SemiBold">
                                    {userData.firstname} {userData.lastname}
                                </TextTheme>
                                <View style={tw`flex-row items-center gap-2`}>
                                    <MaterialCommunityIcons name="email-outline" size={16} color="#6B7280" />
                                    <TextTheme size='sm' color='slate-600'>
                                        {formatEmail(userData.email)}
                                    </TextTheme>
                                </View>
                                <View style={tw`flex-row items-center gap-2`}>
                                    <MaterialCommunityIcons name="phone-outline" size={16} color="#6B7280" />
                                    <TextTheme size='sm' color='slate-600'>
                                        {formatPhoneNumber(userData.tel)}
                                    </TextTheme>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={tw`flex-row items-center gap-3`}>
                            <TouchableOpacity 
                                onPress={() => router.navigate({
                                    pathname: "/auth/register",
                                    params: { backToPage: "/user/my-account" }
                                })}
                                style={tw`bg-blue-500 px-4 py-2 rounded-full`}
                            >
                                <TextTheme font="Prompt-SemiBold" size="lg" style={tw`text-white`}>
                                    ลงทะเบียน
                                </TextTheme>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => router.navigate({
                                    pathname: "/auth/login",
                                    params: { backToPage: "/user/my-account" }
                                })}
                                style={tw`bg-white border border-blue-500 px-4 py-2 rounded-full`}
                            >
                                <TextTheme font="Prompt-SemiBold" size="lg" style={tw`text-blue-500`}>
                                    เข้าสู่ระบบ
                                </TextTheme>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

export default ProfileSection