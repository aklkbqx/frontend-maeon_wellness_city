import React from 'react';
import TextTheme, { sizeText } from './TextTheme';
import { Ionicons } from '@expo/vector-icons';
import tw from "twrnc"
import { LinearGradient } from 'expo-linear-gradient';

interface userRoleType {
    role: string | null | undefined;
    size?: sizeText;
    style?: object;
}

const UserRoleBadge: React.FC<userRoleType> = ({ role, size = "sm", style }) => {
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

    const tailwindStyle = "py-1 px-3 rounded-3xl flex-row items-center justify-center"
    const badgeProps = getBadgeProps(role);
    const combinedStyles = style
        ? [tw.style(tailwindStyle), style]
        : tw.style(tailwindStyle);
    const color = [String(tw.color(`${badgeProps.color}-400`)), String(tw.color(`${badgeProps.color}-500`))]

    return (
        <LinearGradient colors={color} style={[combinedStyles, tw.style("flex-row gap-1 items-center")]}>
            <Ionicons color={"white"} size={18} name={badgeProps.icon as any} style={tw.style("mb-0.5")} />
            <TextTheme color='white' font='Prompt-SemiBold' size={size} children={badgeProps.role} />
        </LinearGradient>
    );

}

export default UserRoleBadge;
