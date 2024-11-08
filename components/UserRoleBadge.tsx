import React from 'react';
import TextTheme, { sizeText } from './TextTheme';
import { Ionicons } from '@expo/vector-icons';
import tw from "twrnc"
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native-ui-lib';

interface userRoleType {
    role: string | null | undefined;
    size?: sizeText;
    style?: object;
}

const UserRoleBadge: React.FC<userRoleType> = ({ role, size = "xs", style }) => {
    const getBadgeProps = (role: any) => {
        switch (role) {
            case 'user':
                return {
                    color: 'blue',
                    role: 'ผู้ใช้งานทั่วไป',
                    icon: "person",
                };
            case 'admin':
                return {
                    color: 'indigo',
                    role: 'แอดมิน ผู้ดูแลระบบ',
                    icon: "person",
                };
            case 'restaurant':
                return {
                    color: 'amber',
                    role: 'เจ้าของร้านอาหาร',
                    icon: "person",
                };
            case 'accommodation':
                return {
                    color: 'sky',
                    role: 'เจ้าของที่พักและโรงแรม',
                    icon: "person",
                };
            case 'attractions':
                return {
                    color: 'rose',
                    role: 'เจ้าของสถานที่ท่องเที่ยว',
                    icon: "person",
                };
            case 'learning_resources':
                return {
                    color: 'purple',
                    role: 'เจ้าของแหล่งเรียนรู้',
                    icon: "person",
                };
            case 'hospital':
                return {
                    color: 'teal',
                    role: 'โรงพยาบาล',
                    icon: "person",
                };
            default:
                return {
                    color: '',
                    role: 'ไม่ระบุสถานะ',
                    icon: "person",
                };
        }
    };

    const badgeProps = getBadgeProps(role);
    const tailwindStyle = `py-1 px-2 rounded-2xl flex-row items-center justify-center bg-${badgeProps.color}-500`
    const combinedStyles = style
        ? [tw.style(tailwindStyle), style]
        : tw.style(tailwindStyle);

    return (
        <View style={tw`flex-row`}>
            <View style={[combinedStyles, tw.style("flex-row gap-1 items-center")]}>
                <Ionicons color={"white"} size={15} name={badgeProps.icon as keyof typeof Ionicons.glyphMap} style={tw.style("mb-0.5")} />
                <TextTheme color='white' font='Prompt-SemiBold' size={size} children={badgeProps.role} />
            </View>
        </View>
    );

}

export default UserRoleBadge;
