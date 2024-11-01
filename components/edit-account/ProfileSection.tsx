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
                    style={[tw.style("w-32 h-32 rounded-full border-2 border-zinc-300"), { objectFit: "cover" }]}
                    source={{ uri: profileImage }}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                />
            );
        } else {
            return (
                <View style={tw.style("w-32 h-32 rounded-full border-2 border-zinc-300 justify-center items-center bg-gray-200")}>
                    <Ionicons name="person-outline" size={40} color={String(tw.color("gray-400"))} />
                    <TextTheme size="xs" font="Prompt-Regular" style={tw.style("mt-2 text-center")}>
                        {imageError ? "รูปภาพหายไป" : "เลือกรูปภาพ"}
                    </TextTheme>
                </View>
            );
        }
    };

    const renderUserInfo = () => {
        if (!userData) return null;

        return (
            <View style={tw.style("flex-col justify-center items-center")}>
                <View style={tw.style("flex-col mt-2 items-center")}>
                    <TextTheme size='sm' font='Prompt-Regular'>
                        {userData.firstname} {userData.lastname}
                    </TextTheme>
                    <TextTheme size='sm' font='Prompt-Regular'>
                        {userData.email}
                    </TextTheme>
                </View>
                {userData.role && <UserRoleBadge role={userData.role} style={tw`mt-2`} />}
            </View>
        );
    };

    return (
        <View style={tw.style("my-2 flex-col items-center")}>
            <TouchableOpacity onPress={pickImage} style={tw.style("relative")}>
                {renderProfileImage()}
                {imageLoading && (
                    <View style={tw.style("absolute inset-0 justify-center items-center bg-black bg-opacity-50 rounded-full")}>
                        <Loading loading={imageLoading} color={String(tw.color("white"))} />
                    </View>
                )}
                <View style={tw.style("absolute bottom-2 right-[-5px]")}>
                    <View style={tw.style("relative p-4.5 bg-zinc-300 border-2 border-white rounded-full justify-center items-center")}>
                        <Ionicons size={25} name='camera' style={tw.style("text-white absolute top-1.2 left-1.5")} />
                    </View>
                </View>
            </TouchableOpacity>
            {renderUserInfo()}
        </View>
    );
};

export default ProfileSection;