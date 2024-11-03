import React, { useState } from "react";
import tw from "twrnc";
import { Image, TouchableOpacity, View } from "react-native";
import TextTheme from "../TextTheme";
import { Ionicons } from "@expo/vector-icons";
import UserRoleBadge from "../UserRoleBadge";
import Loading from "../Loading";
import { Users } from "@/types/PrismaType";

interface ProfileSectionProps {
    pickImage: () => void;
    imageLoading: boolean;
    userData: Users | null;
    profileImage: string | null;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ pickImage, imageLoading, userData, profileImage }) => {
    const [imageError, setImageError] = useState(false);

    const handleImageLoad = () => {
        setImageError(false);
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const renderProfileImage = () => {
        if (profileImage && !imageError) {
            return (
                <Image
                    style={[
                        tw.style(
                            "w-28 h-28 rounded-full",
                            "border-4 border-white"
                        ),
                        {
                            objectFit: "cover",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                        }
                    ]}
                    source={{ uri: profileImage }}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                />
            );
        } else {
            return (
                <View style={tw.style(
                    "w-28 h-28 rounded-full",
                    "border-4 border-white",
                    "justify-center items-center",
                    "bg-gray-50",
                    "shadow-lg"
                )}>
                    <Ionicons
                        name="person-outline"
                        size={44}
                        color={String(tw.color("gray-400"))}
                    />
                    <TextTheme
                        size="xs"
                        font="Prompt-Regular"
                        style={tw.style("mt-1 text-center text-gray-500")}
                    >
                        {imageError ? "รูปภาพหายไป" : "เลือกรูปภาพ"}
                    </TextTheme>
                </View>
            );
        }
    };

    const renderUserInfo = () => {
        if (!userData) return null;

        return (
            <View style={tw.style("flex-col justify-center items-center mt-1")}>
                <View style={tw.style("flex-col items-center gap-0.5")}>
                    <TextTheme size='lg' font='Prompt-SemiBold' style={tw`text-gray-800`}>
                        {userData.firstname} {userData.lastname}
                    </TextTheme>
                    <TextTheme size='sm' font='Prompt-Regular' style={tw`text-gray-500`}>
                        {userData.email}
                    </TextTheme>
                </View>
                {userData.role && (
                    <View style={tw`mt-2`}>
                        <UserRoleBadge role={userData.role} />
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={tw.style("flex-col items-center")}>
            <TouchableOpacity
                onPress={pickImage}
                style={tw.style(
                    "relative",
                    "rounded-full",
                    "shadow-lg",
                )}
                activeOpacity={0.9}
            >
                {renderProfileImage()}
                {imageLoading && (
                    <View style={tw.style(
                        "absolute inset-0",
                        "justify-center items-center",
                        "bg-black/50",
                        "rounded-full"
                    )}>
                        <Loading loading={imageLoading} color={String(tw.color("white"))} />
                    </View>
                )}
                <View style={tw.style("absolute -right-1 bottom-0")}>
                    <View style={tw.style(
                        "bg-blue-500",
                        "w-10 h-10",
                        "rounded-full",
                        "justify-center items-center",
                        "border-4 border-white",
                        "shadow-lg"
                    )}>
                        <Ionicons
                            size={20}
                            name='camera'
                            color="white"
                        />
                    </View>
                </View>
            </TouchableOpacity>
            {renderUserInfo()}
        </View>
    );
};

export default ProfileSection;