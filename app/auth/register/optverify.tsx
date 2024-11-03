import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import tw from 'twrnc';
import TextTheme from '@/components/TextTheme';
import api from '@/helper/api';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import useShowToast from '@/hooks/useShowToast';
import { saveTokenAndLogin } from '@/helper/my-lib';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const OTPInput: React.FC<{ onOtpChange: (otp: string) => void }> = ({ onOtpChange }) => {
    const [otp, setOtp] = useState<string>('');
    const inputRef = useRef<TextInput>(null);

    const handleOtpChange = (value: string) => {
        const newOtp = value.replace(/[^0-9]/g, '').slice(0, 6);
        setOtp(newOtp);
        onOtpChange(newOtp);
    };

    const handlePress = () => {
        inputRef.current?.focus();
    };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={1} style={tw`w-full`}>
            <View style={tw`flex-row justify-between gap-1 `}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                    <View key={index} style={tw`w-12 h-12 flex-1 border-2 border-gray-200 rounded-2xl justify-center items-center`}>
                        <TextTheme size="xl">{otp[index] || ''}</TextTheme>
                    </View>
                ))}
            </View>
            <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={handleOtpChange}
                keyboardType="number-pad"
                style={tw`absolute opacity-0 h-12 w-full`}
                maxLength={6}
                cursorColor={"#fff"}
            />
        </TouchableOpacity>
    );
};



const OTPVerification: React.FC = () => {
    const { phone, backToPage } = useLocalSearchParams<{ phone: string; backToPage: any }>();

    const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [countDown, setCountDown] = useState<number>(0)
    const [modalVisible, setModalVisible] = useState<boolean>(false);

    const contDownRef = useRef<ReturnType<typeof setTimeout>>();
    const inputRefs = useRef<TextInput[]>([]);

    const isOTPComplete = otp.filter(digit => digit !== '').length === 6;

    useEffect(() => {
        if (countDown > 0) {
            contDownRef.current = setTimeout(() => {
                setCountDown(prev => prev - 1);
            }, 1000)
        }
        return () => {
            if (contDownRef.current) {
                clearTimeout(contDownRef.current)
            }
        }
    }, [countDown])

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    useEffect(() => {
        if (otp) {
            setError(null);
        }
    }, [otp])

    const handleOtpChange = (newOtp: string) => {
        setOtp(newOtp.split(''));
    };

    const handleVerifyOTP = async () => {
        setLoading(true);
        setModalVisible(true);
        const otpString = otp.join('');
        try {
            const response = await api.post('/api/auth/verify-otp', { phone, otp: otpString });
            if (response.data.success) {
                const { token } = response.data;
                await saveTokenAndLogin(token);
                useShowToast("success", "สำเร็จ!", "ยืนยัน OTP เรียบร้อยแล้ว");
                setTimeout(() => {
                    if (backToPage) {
                        router.navigate(backToPage as any);
                    } else {
                        router.replace("/user/home");
                    }
                    useShowToast("success", "สำเร็จ!", "เข้าสู่ระบบสำเร็จแล้ว");
                }, 1500)
            } else {
                throw new Error(response.data.error || 'เกิดข้อผิดพลาดในการยืนยัน OTP');
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                setError(message)
                handleErrorMessage(message);
            });
            setModalVisible(false);
        } finally {
            setLoading(false);
            setModalVisible(false);
        }
    };

    const handleResendOTP = async () => {
        if (countDown > 0) return;
        try {
            await api.post('/api/auth/resend-otp', { phone });
            useShowToast("success", "ส่ง OTP ใหม่แล้ว", "กรุณาตรวจสอบ SMS ของคุณ");
            setCountDown(30)
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message);
            });
        }
    };

    return (
        <>
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <BlurView intensity={20} style={tw`flex-1 items-center justify-center`}>
                    <View style={tw`flex-row items-center gap-2`}>
                        <ActivityIndicator size="large" color={`${tw`text-blue-600`.color}`} />
                    </View>
                </BlurView>
            </Modal>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={tw`flex-1`}
            >
                <LinearGradient style={tw`flex-1`} colors={[String(tw.color("blue-500")), String(tw.color("blue-600")), String(tw.color("blue-900"))]}>

                    <ScrollView contentContainerStyle={tw`flex-grow justify-center items-center p-4`}>
                        <View style={tw`bg-white p-6 rounded-5 border-2 border-blue-400 w-full max-w-sm`}>
                            <TextTheme size="2xl" font="Prompt-Bold" style={tw`text-center mb-4`}>
                                ยืนยัน OTP
                            </TextTheme>
                            <TextTheme size='lg' style={tw`text-center`}>
                                กรุณากรอกรหัส OTP ที่ส่ง SMS ไปยังเบอร์ {phone}
                            </TextTheme>
                            {error && (
                                <View style={tw`flex-row justify-center`}>
                                    <TextTheme style={tw`text-red-500`}>
                                        {error}
                                    </TextTheme>
                                </View>
                            )}
                            <View style={tw`flex-row justify-between mt-4`}>
                                <OTPInput onOtpChange={handleOtpChange} />
                            </View>
                            <TouchableOpacity
                                onPress={handleVerifyOTP}
                                disabled={loading || !isOTPComplete}
                                style={tw`bg-blue-600 py-3 mt-5 rounded-2xl ${(loading || !isOTPComplete) ? 'opacity-50' : ''}`}
                            >
                                <TextTheme color="white" size="lg" font="Prompt-SemiBold" style={tw`text-center`}>
                                    {loading ? 'กำลังตรวจสอบ...' : 'ยืนยัน OTP'}
                                </TextTheme>
                            </TouchableOpacity>
                            <View style={tw`flex-col items-center mt-4`}>
                                <TextTheme size='sm' style={tw`text-center text-slate-500`}>
                                    หากไม่ได้รับข้อความ
                                </TextTheme>
                            </View>

                            <TouchableOpacity onPress={handleResendOTP} style={tw`mb-2`}
                                disabled={countDown > 0}
                            >
                                <TextTheme color="blue-600" style={tw`text-center underline ${countDown > 0 ? "opacity-50" : ""}`}>
                                    ส่ง OTP อีกครั้ง {countDown > 0 ? `(${countDown})` : null}
                                </TextTheme>
                            </TouchableOpacity>

                            <View style={tw`flex-row justify-center mt-2`}>
                                <TouchableOpacity onPress={() => router.back()} style={tw`flex-row justify-center items-center`}>
                                    <Ionicons name='chevron-back' size={20} color={`${tw`text-blue-600`.color}`} />
                                    <TextTheme color="blue-600">
                                        ย้อนกลับ
                                    </TextTheme>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </LinearGradient>
            </KeyboardAvoidingView>
        </>
    );
};

export default OTPVerification;