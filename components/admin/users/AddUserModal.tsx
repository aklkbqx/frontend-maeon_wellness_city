import React, { useState } from 'react';
import { View, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Dialog, TouchableOpacity } from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import TextTheme from '@/components/TextTheme';
import { UsersRole } from '@/types/PrismaType';

interface AddUserDialogProps {
    isVisible: boolean;
    onClose: () => void;
    onSubmit: (userData: CreateUserData) => Promise<void>;
    isLoading?: boolean;
}

export interface CreateUserData {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    confirmPassword: string;
    tel: string;
    role: UsersRole;
}

const roleOptions: Array<{ label: string; value: UsersRole }> = [
    {
        label: 'ผู้ใช้งานทั่วไป',
        value: 'user' as UsersRole
    },
    {
        label: 'ผู้ดูแลระบบ',
        value: 'admin' as UsersRole
    },
    {
        label: 'โรงพยาบาล',
        value: 'hospital' as UsersRole
    },
    {
        label: 'ร้านอาหาร',
        value: 'restaurant' as UsersRole
    },
    {
        label: 'สถานที่ท่องเที่ยว',
        value: 'attractions' as UsersRole
    },
    {
        label: 'แหล่งเรียนรู้',
        value: 'learning_resources' as UsersRole
    },
    {
        label: 'ที่พัก',
        value: 'accommodation' as UsersRole
    }
];

const AddUserDialog: React.FC<AddUserDialogProps> = ({
    isVisible,
    onClose,
    onSubmit,
    isLoading = false
}) => {
    const [formData, setFormData] = useState<CreateUserData>({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        confirmPassword: '',
        tel: '',
        role: 'user' as UsersRole
    });
    const [errors, setErrors] = useState<Partial<Record<keyof CreateUserData, string>>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof CreateUserData, string>> = {};

        if (!formData.firstname) newErrors.firstname = 'กรุณากรอกชื่อ';
        if (!formData.lastname) newErrors.lastname = 'กรุณากรอกนามสกุล';
        if (!formData.email) {
            newErrors.email = 'กรุณากรอกอีเมล';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
        }
        if (!formData.tel) {
            newErrors.tel = 'กรุณากรอกเบอร์โทรศัพท์';
        } else if (!/^\d{10}$/.test(formData.tel)) {
            newErrors.tel = 'เบอร์โทรศัพท์ไม่ถูกต้อง';
        }
        if (!formData.password) {
            newErrors.password = 'กรุณากรอกรหัสผ่าน';
        } else if (formData.password.length < 6) {
            newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            await onSubmit(formData);
            setFormData({
                firstname: '',
                lastname: '',
                email: '',
                password: '',
                confirmPassword: '',
                tel: '',
                role: 'user' as UsersRole
            });
        }
    };

    const handleClose = () => {
        setFormData({
            firstname: '',
            lastname: '',
            email: '',
            password: '',
            confirmPassword: '',
            tel: '',
            role: 'user' as UsersRole
        });
        setErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
        onClose();
    };

    const inputStyle = (error: string | undefined) => {
        return [tw`bg-white border rounded-xl px-4 py-3`, error ? tw`border-red-300` : tw`border-gray-200`, { fontFamily: 'Prompt-Regular' }]
    }

    return (
        <Dialog
            visible={isVisible}
            onDialogDismissed={handleClose}
        >
            <View style={tw`h-full w-full justify-center items-center`}>
                <View style={tw`bg-white rounded-2xl h-[85%] max-w-md mx-auto w-full`}>

                    {/* Header */}
                    <View style={tw`flex-row justify-between items-center p-4 border-b border-gray-200`}>
                        <TextTheme font="Prompt-SemiBold" size="xl">
                            เพิ่มสมาชิกใหม่
                        </TextTheme>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={tw`p-4`}>
                            {/* ชื่อ */}
                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-2`}>ชื่อ</TextTheme>
                                <TextInput
                                    value={formData.firstname}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, firstname: text }))}
                                    placeholder="กรอกชื่อ"
                                    placeholderTextColor="#9CA3AF"
                                    style={inputStyle(errors.firstname)}
                                />
                                {errors.firstname && (
                                    <TextTheme style={tw`text-red-500 text-sm mt-1`}>{errors.firstname}</TextTheme>
                                )}
                            </View>

                            {/* นามสกุล */}
                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-2`}>นามสกุล</TextTheme>
                                <TextInput
                                    value={formData.lastname}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, lastname: text }))}
                                    placeholder="กรอกนามสกุล"
                                    placeholderTextColor="#9CA3AF"
                                    style={inputStyle(errors.lastname)}
                                />
                                {errors.lastname && (
                                    <TextTheme style={tw`text-red-500 text-sm mt-1`}>{errors.lastname}</TextTheme>
                                )}
                            </View>

                            {/* อีเมล */}
                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-2`}>อีเมล</TextTheme>
                                <TextInput
                                    value={formData.email}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                                    placeholder="example@email.com"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="email-address"
                                    style={inputStyle(errors.email)}
                                />
                                {errors.email && (
                                    <TextTheme style={tw`text-red-500 text-sm mt-1`}>{errors.email}</TextTheme>
                                )}
                            </View>

                            {/* เบอร์โทรศัพท์ */}
                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-2`}>เบอร์โทรศัพท์</TextTheme>
                                <TextInput
                                    value={formData.tel}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, tel: text }))}
                                    placeholder="0xxxxxxxxx"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    style={inputStyle(errors.tel)}
                                />
                                {errors.tel && (
                                    <TextTheme style={tw`text-red-500 text-sm mt-1`}>{errors.tel}</TextTheme>
                                )}
                            </View>

                            {/* รหัสผ่าน */}
                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-2`}>รหัสผ่าน</TextTheme>
                                <View style={tw`relative`}>
                                    <TextInput
                                        value={formData.password}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                                        placeholder="กรอกรหัสผ่าน"
                                        placeholderTextColor="#9CA3AF"
                                        secureTextEntry={!showPassword}
                                        style={inputStyle(errors.password)}
                                        textContentType='oneTimeCode'
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={tw`absolute right-4 top-3`}
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-off" : "eye"}
                                            size={24}
                                            color="#6B7280"
                                        />
                                    </TouchableOpacity>
                                </View>
                                {errors.password && (
                                    <TextTheme style={tw`text-red-500 text-sm mt-1`}>{errors.password}</TextTheme>
                                )}
                            </View>

                            {/* ยืนยันรหัสผ่าน */}
                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-2`}>ยืนยันรหัสผ่าน</TextTheme>
                                <View style={tw`relative`}>
                                    <TextInput
                                        value={formData.confirmPassword}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                                        placeholder="กรอกรหัสผ่านอีกครั้ง"
                                        placeholderTextColor="#9CA3AF"
                                        secureTextEntry={!showConfirmPassword}
                                        style={inputStyle(errors.confirmPassword)}
                                        textContentType='oneTimeCode'
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={tw`absolute right-4 top-3`}
                                    >
                                        <Ionicons
                                            name={showConfirmPassword ? "eye-off" : "eye"}
                                            size={24}
                                            color="#6B7280"
                                        />
                                    </TouchableOpacity>
                                </View>
                                {errors.confirmPassword && (
                                    <TextTheme style={tw`text-red-500 text-sm mt-1`}>{errors.confirmPassword}</TextTheme>
                                )}
                            </View>

                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-1 text-gray-700`}>
                                    ประเภทผู้ใช้
                                </TextTheme>
                                <View style={tw`bg-white border border-gray-200 rounded-xl overflow-hidden`}>
                                    {roleOptions.map((option, index) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={tw`
                                            flex-row items-center justify-between p-3
                                            ${index !== roleOptions.length - 1 ? 'border-b border-gray-100' : ''}
                                            ${formData.role === option.value ? 'bg-indigo-50' : ''}
                                        `}
                                            onPress={() => setFormData(prev => ({ ...prev, role: option.value }))}
                                        >
                                            <TextTheme style={tw`
                                            ${formData.role === option.value ? 'text-indigo-600' : 'text-gray-700'}
                                        `}>
                                                {option.label}
                                            </TextTheme>
                                            {formData.role === option.value && (
                                                <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={tw`p-4 border-t border-gray-200`}>
                        <TouchableOpacity
                            style={tw`bg-indigo-600 py-3 rounded-xl ${isLoading ? 'opacity-50' : ''}`}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            <TextTheme
                                font="Prompt-SemiBold"
                                style={tw`text-white text-center`}
                            >
                                {isLoading ? 'กำ ลังบันทึก...' : 'เพิ่มสมาชิก'}
                            </TextTheme>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Dialog >
    );
};

export default AddUserDialog;