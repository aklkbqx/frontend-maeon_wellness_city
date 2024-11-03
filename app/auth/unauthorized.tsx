import React from 'react';
import { View } from 'react-native';
import { Text, Button, Colors, Typography } from 'react-native-ui-lib';
import { router } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useRole } from '@/context/RoleProvider';

const UnauthorizedPage = () => {
    const { currentRole } = useRole();

    const handleNavigateHome = () => {
        if (currentRole) {
            switch (currentRole) {
                case 'admin':
                    router.replace('/admin/dashboard');
                    break;
                case 'user':
                    router.replace('/user/home');
                    break;
                case 'restaurant':
                    router.replace('/');
                    break;
                case 'attractions':
                    router.replace('/attractions');
                    break;
                case 'learning_resources':
                case 'hospital':
                    router.replace('/');
                    break;
                default:
                    router.replace('/');
            }
        } else {
            router.replace('/auth/login');
        }
    };

    return (
        <View style={tw`flex-1 items-center justify-center p-4 bg-gray-50`}>
            <View style={tw`bg-white p-6 rounded-lg shadow-md max-w-md w-full items-center`}>
                {/* Icon Container */}
                <View style={tw`mb-4 p-3 bg-red-100 rounded-full`}>
                    <Ionicons name='alert'
                        size={40}
                        color="#EF4444" // red-500
                    />
                </View>

                {/* Title */}
                <Text
                    text60L
                    style={tw`text-gray-800 mb-2 text-center`}
                >
                    ไม่มีสิทธิ์เข้าถึง
                </Text>

                {/* Description */}
                <Text
                    text70
                    style={tw`text-gray-600 mb-6 text-center`}
                >
                    คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบหากคิดว่านี่เป็นข้อผิดพลาด
                </Text>

                {/* Buttons Container */}
                <View style={tw`w-full space-y-3`}>
                    <Button
                        label="กลับไปหน้าหลัก"
                        backgroundColor="#2563EB" // blue-600
                        style={tw`w-full rounded-lg`}
                        labelStyle={tw`font-semibold`}
                        onPress={handleNavigateHome}
                    />

                    <Button
                        label="ย้อนกลับ"
                        backgroundColor="#E5E7EB" // gray-200
                        labelStyle={tw`text-gray-700 font-semibold`}
                        style={tw`w-full rounded-lg`}
                        onPress={() => router.back()}
                    />
                </View>
            </View>
        </View>
    );
};

Colors.loadColors({
    primaryColor: '#2563EB',
    secondaryColor: '#E5E7EB',
    textColor: '#1F2937',
    errorColor: '#EF4444',
});

Typography.loadTypographies({
    heading: { fontSize: 24, fontWeight: '600' },
    subheading: { fontSize: 16, fontWeight: '400' },
});

export default UnauthorizedPage;