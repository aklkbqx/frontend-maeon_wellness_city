import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, RefreshControl } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import tw from "twrnc";
import TextTheme from '@/components/TextTheme';
import { handleAxiosError, resizeImage } from '@/helper/my-lib';
import { useStatusBar } from '@/hooks/useStatusBar';
import api from '@/helper/api';
import { handleErrorMessage } from '@/helper/my-lib';
import useShowToast from '@/hooks/useShowToast';
import ProfileSection from '@/components/edit-account/ProfileSection';
import UserInfoSection from '@/components/edit-account/UserInfoSection';
import ActionButtons from '@/components/edit-account/ActionButtons';
import OverlayComponents from '@/components/edit-account/OverlayComponents';
import { Users } from '@/types/PrismaType';
import { FormDataInput } from '@/types/types';
import { useFetchMeContext } from '@/context/FetchMeContext';

interface PreparedImage {
    uri: string;
    type: string;
    name: string;
};

const AccountSetting: React.FC = () => {
    useStatusBar("dark-content");
    const scrollViewRef = useRef<ScrollView>(null);
    const [prepareProfileImage, setPrepareProfileImage] = useState<PreparedImage | null>(null);
    const [formDataInput, setFormDataInput] = useState<FormDataInput>({
        firstname: "", lastname: "", tel: "", currentPassword: "", newPassword: "", confirmPassword: ""
    });
    const [modalVisible, setModalVisible] = useState(false);
    const [loadingCancel, setLoadingCancel] = useState(false);
    const [passwordVisibility, setPasswordVisibility] = useState({
        currentPassword: false, newPassword: false, confirmPassword: false
    });
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const [imageLoading, setImageLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const {
        userData,
        initializeUserData,
        refreshUserData,
        profileImageUrl
    } = useFetchMeContext();

    const setDefaultUserData = useCallback((user: Users) => {
        setFormDataInput({
            firstname: user.firstname || '',
            lastname: user.lastname || '',
            tel: user.tel || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            initializeUserData();
        }, [initializeUserData])
    );

    useEffect(() => {
        if (userData) {
            setDefaultUserData(userData);
        }
    }, []);

    useEffect(() => {
        setPasswordsMatch(formDataInput.newPassword === formDataInput.confirmPassword);
    }, [formDataInput.newPassword, formDataInput.confirmPassword]);

    // คงฟังก์ชันการทำงานทั้งหมดเหมือนเดิม
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshUserData();
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, [refreshUserData]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImageLoading(true);
            const resizedImage = await resizeImage(result.assets[0].uri, 256, 256);
            await prepareImageForUpload(resizedImage.uri);
            setImageLoading(false);
        }
    };

    const prepareImageForUpload = async (uri: string) => {
        try {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (!fileInfo.exists) {
                throw new Error("File does not exist");
            }
            const fileName = `profileImage_${Date.now()}.jpg`;
            const preparedImage = {
                uri: fileInfo.uri,
                type: 'image/jpeg',
                name: fileName,
            };
            setPrepareProfileImage(preparedImage as any);
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message);
            });
        }
    };

    const handleSaveProfile = async () => {
        setModalVisible(true);
        if (formDataInput.newPassword !== formDataInput.confirmPassword) {
            useShowToast("error", "เกิดข้อผิดพลาด", "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน!");
            return;
        }

        setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: true }), 500);

        const formData = new FormData();
        formData.append('firstname', formDataInput.firstname);
        formData.append('lastname', formDataInput.lastname);
        formData.append('tel', formDataInput.tel);

        if (userData?.email) {
            formData.append('email', userData.email);
        }
        if (prepareProfileImage) {
            formData.append('profile_picture', prepareProfileImage as any);
        }

        if (formDataInput.currentPassword && formDataInput.newPassword) {
            formData.append('currentPassword', formDataInput.currentPassword);
            formData.append('newPassword', formDataInput.newPassword);
        }

        try {
            const response = await api.put("/api/users/profile", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            });

            if (response.data.success) {
                await refreshUserData();
                setPrepareProfileImage(null)
                setFormDataInput(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));

                setModalVisible(false);
                useShowToast("success", "บันทึกแล้ว", response.data.message);
            } else {
                useShowToast("error", "เกิดข้อผิดพลาด", response.data.message);
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message);
            });
        }
    };

    const handleCancel = async () => {
        setModalVisible(true);
        setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: true }), 500);
        setLoadingCancel(true);
        setPrepareProfileImage(null);
        await refreshUserData();
        if (userData) {
            setDefaultUserData(userData);
        }
        setLoadingCancel(false);
        setModalVisible(false);
    };

    const togglePasswordVisibility = (field: keyof typeof passwordVisibility) => {
        setPasswordVisibility(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleChangeText = (field: keyof FormDataInput, text: string) => {
        setFormDataInput(prev => ({ ...prev, [field]: text }));
    };

    const getInputStyle = (field: 'newPassword' | 'confirmPassword') => {
        let baseStyle = "bg-white border border-gray-200 rounded-xl p-4";
        if ((field === 'newPassword' || field === 'confirmPassword') && !passwordsMatch) {
            baseStyle += " border-red-300";
        }
        return tw`${baseStyle}`;
    };

    return (
        <>
            <KeyboardAvoidingView behavior="padding" style={tw`flex-1 bg-gray-50`} keyboardVerticalOffset={85}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    ref={scrollViewRef}
                    style={tw`flex-1`}
                    scrollEventThrottle={16}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[tw.color("blue-500") as string]}
                            tintColor={tw.color("blue-500") as string}
                        />
                    }
                >
                    {/* <View style={tw`bg-white px-4 pt-14 pb-4 border-b border-gray-200`}>
                        <View style={tw`flex-row items-center justify-between`}>
                            <TouchableOpacity
                                onPress={handleCancel}
                                style={tw`p-2 -ml-2`}
                            >
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                            <TextTheme font="Prompt-SemiBold" size="xl">แก้ไขโปรไฟล์</TextTheme>
                            <TouchableOpacity
                                onPress={handleSaveProfile}
                                disabled={modalVisible}
                                style={tw`bg-blue-500 py-2 px-4 rounded-xl ${modalVisible ? 'opacity-50' : ''}`}
                            >
                                <TextTheme style={tw`text-white`}>
                                    {modalVisible ? 'กำลังบันทึก...' : 'บันทึก'}
                                </TextTheme>
                            </TouchableOpacity>
                        </View>
                    </View> */}

                    <View style={tw`px-4 py-6`}>
                        <ProfileSection
                            imageLoading={imageLoading}
                            pickImage={pickImage}
                            profileImage={prepareProfileImage?.uri ? prepareProfileImage.uri : profileImageUrl}
                            userData={userData}
                        />

                        <View style={tw`bg-white rounded-2xl shadow-sm mt-6 p-4`}>
                            <UserInfoSection
                                formDataInput={formDataInput}
                                setFormDataInput={setFormDataInput}
                                userData={userData}
                            />
                        </View>

                        <View style={tw`bg-white rounded-2xl shadow-sm mt-6 p-4`}>
                            <View style={tw`flex-row items-center gap-2 mb-4`}>
                                <Ionicons name="lock-closed" size={20} style={tw`text-blue-500`} />
                                <TextTheme font="Prompt-SemiBold" size="lg">เปลี่ยนรหัสผ่าน</TextTheme>
                            </View>

                            <View style={tw`gap-4`}>
                                {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field, index) => (
                                    <View key={`${field}-${index}`} style={tw`relative`}>
                                        <TextInput
                                            style={[
                                                getInputStyle(field as 'newPassword' | 'confirmPassword'),
                                                { fontFamily: "Prompt-Regular" }
                                            ]}
                                            placeholder={
                                                field === 'currentPassword' ? 'รหัสผ่านเดิม' :
                                                    field === 'newPassword' ? 'รหัสผ่านใหม่' :
                                                        'ยืนยันรหัสผ่านอีกครั้ง'
                                            }
                                            placeholderTextColor="#9CA3AF"
                                            value={formDataInput[field]}
                                            onChangeText={(text) => handleChangeText(field, text)}
                                            autoCapitalize="none"
                                            secureTextEntry={!passwordVisibility[field]}
                                            textContentType="oneTimeCode"
                                        />
                                        {formDataInput[field] && (
                                            <TouchableOpacity
                                                onPress={() => togglePasswordVisibility(field)}
                                                style={tw`absolute right-4 top-4`}
                                            >
                                                <Ionicons
                                                    size={20}
                                                    name={!passwordVisibility[field] ? "eye" : "eye-off"}
                                                    style={tw`text-blue-500`}
                                                />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}

                                {!passwordsMatch && (
                                    <View style={tw`mt-1`}>
                                        <TextTheme style={tw`text-red-500 text-sm`}>
                                            รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน
                                        </TextTheme>
                                    </View>
                                )}
                            </View>
                        </View>

                        <ActionButtons
                            handleCancel={handleCancel}
                            handleSaveProfile={handleSaveProfile}
                            loadingCancel={loadingCancel}
                            modalVisible={modalVisible}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <OverlayComponents
                refreshing={refreshing}
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
            />
        </>
    );
};

export default AccountSetting;