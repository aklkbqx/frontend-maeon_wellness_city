import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Linking, Platform, AppState } from 'react-native';
import { Button, Text, Card, Dialog, TouchableOpacity } from 'react-native-ui-lib';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import tw from 'twrnc';
import axios from 'axios';
import api from '@/helper/api';
import TextTheme from '@/components/TextTheme';
import { LogoMaeOn } from '@/components/SvgComponents';
import { LinearGradient } from 'expo-linear-gradient';

// TODO ทำการปรับปรุงหน้านี้ให้เสร็จสมบูรณ์ในภายหลังด้วย

interface VersionContextType {
    isChecking: boolean;
    needsUpdate: boolean;
    forceUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    checkUpdate: () => Promise<void>;
    skipUpdate: () => Promise<void>;
}

interface VersionResponse {
    success: boolean;
    data?: {
        needsUpdate: boolean;
        forceUpdate: boolean;
        latestVersion: string;
        storeUrl: string | null;
        releaseNotes: string | null;
    };
    error?: string;
}

const VersionContext = createContext<VersionContextType>({
    isChecking: false,
    needsUpdate: false,
    forceUpdate: false,
    currentVersion: '',
    latestVersion: '',
    checkUpdate: async () => { },
    skipUpdate: async () => { },
});

interface VersionCheckProviderProps {
    children: React.ReactNode;
}

export const VersionCheckProvider: React.FC<VersionCheckProviderProps> = ({
    children
}) => {
    const [isChecking, setIsChecking] = useState(true);
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(false);
    const [latestVersion, setLatestVersion] = useState('');
    const [storeUrl, setStoreUrl] = useState<string | null>(null);
    const [releaseNotes, setReleaseNotes] = useState<string | null>(null);

    const currentVersion = Constants.expoConfig?.version ?? '1.0.0';

    const checkUpdate = async (): Promise<void> => {
        try {
            setIsChecking(true);

            // const skipVersion = await AsyncStorage.getItem('skipVersion');

            const { data: result } = await api.post<VersionResponse>('/api/check-version', {
                platform: Platform.OS,
                currentVersion,
            });

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to check version');
            }

            const {
                needsUpdate: needsUpdateNew,
                forceUpdate: forceUpdateNew,
                latestVersion: latestVersionNew,
                storeUrl: storeUrlNew,
                releaseNotes: releaseNotesNew
            } = result.data;

            // if (skipVersion === latestVersionNew && !forceUpdateNew) {
            //     setNeedsUpdate(false);
            //     setForceUpdate(false);
            // } else {
            //     setNeedsUpdate(needsUpdateNew);
            //     setForceUpdate(forceUpdateNew);
            // }

            setNeedsUpdate(needsUpdateNew);
            setForceUpdate(forceUpdateNew);

            setLatestVersion(latestVersionNew);
            setStoreUrl(storeUrlNew);
            setReleaseNotes(releaseNotesNew);

        } catch (error) {
            console.error('Version check failed:', error);
            if (axios.isAxiosError(error)) {
                console.error('Axios error:', error.response?.data);
            }
            // setNeedsUpdate(false);
            // setForceUpdate(false);
        } finally {
            setIsChecking(false);
        }
    };

    const skipUpdate = async (): Promise<void> => {
        try {
            if (!forceUpdate) {
                await AsyncStorage.setItem('skipVersion', latestVersion);
                // setNeedsUpdate(false);
            }
        } catch (error) {
            console.error('Error skipping update:', error);
        }
    };

    const openStore = (): void => {
        if (storeUrl) {
            Linking.openURL(storeUrl);
        }
    };

    useEffect(() => {
        checkUpdate();

        // const subscription = AppState.addEventListener('change', (nextAppState) => {
        //     if (nextAppState === 'active') {
        //         checkUpdate();
        //     }
        // });

        // return () => {
        //     subscription.remove();
        // };
    }, []);

    // if (isChecking) {
    //     return (
    //         <View style={tw`flex-1 justify-center items-center`}>
    //             <Text style={tw`text-gray-600`}>กำลังตรวจสอบการอัพเดท...</Text>
    //         </View>
    //     );
    // }

    return (
        <>
            <VersionContext.Provider
                value={{
                    isChecking,
                    needsUpdate,
                    forceUpdate,
                    currentVersion,
                    latestVersion,
                    checkUpdate,
                    skipUpdate,
                }}
            >
                {needsUpdate ? (
                    <View style={tw`flex-1`}>
                        <LinearGradient
                            colors={[
                                String(tw.color("blue-400")),
                                String(tw.color("blue-800"))
                            ]}
                            style={tw`flex-1 justify-center items-center px-6`}
                        >
                            <View style={tw`z-10 w-full max-w-md bg-white rounded-3xl p-8 shadow-xl`}>
                                <View style={tw`absolute -top-5 left-1/2 -ml-16`}>
                                    <View style={tw`bg-blue-500 px-6 py-2 rounded-full shadow-lg`}>
                                        <TextTheme font='Prompt-Medium' style={tw`text-white text-sm`}>
                                            v{latestVersion}
                                        </TextTheme>
                                    </View>
                                </View>

                                <View style={tw`items-center mb-6`}>
                                    <View style={tw`w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-4`}>
                                        <LogoMaeOn
                                            fill="#3B82F6"
                                            width={50}
                                            height={50}
                                        />
                                    </View>
                                </View>

                                <View style={tw`mb-8`}>
                                    <TextTheme
                                        style={tw`text-2xl mb-3 text-center text-gray-800`}
                                        font='Prompt-Bold'
                                    >
                                        {forceUpdate ? 'อัพเดทสำคัญ!' : 'มีเวอร์ชั่นใหม่พร้อมใช้งาน'}
                                    </TextTheme>

                                    <View style={tw`flex-row justify-center items-center mb-4`}>
                                        <View style={tw`items-center px-4`}>
                                            <TextTheme style={tw`text-sm text-gray-500 mb-1`}>
                                                เวอร์ชั่นปัจจุบัน
                                            </TextTheme>
                                            <View style={tw`bg-gray-100 px-3 py-1 rounded-full`}>
                                                <TextTheme font='Prompt-Medium' style={tw`text-gray-700`}>
                                                    {currentVersion}
                                                </TextTheme>
                                            </View>
                                        </View>

                                        <View style={tw`mx-2`}>
                                            <TextTheme style={tw`text-gray-300 text-2xl`}>→</TextTheme>
                                        </View>

                                        <View style={tw`items-center px-4`}>
                                            <TextTheme style={tw`text-sm text-gray-500 mb-1`}>
                                                เวอร์ชั่นใหม่
                                            </TextTheme>
                                            <View style={tw`bg-blue-50 px-3 py-1 rounded-full`}>
                                                <TextTheme font='Prompt-Medium' style={tw`text-blue-600`}>
                                                    {latestVersion}
                                                </TextTheme>
                                            </View>
                                        </View>
                                    </View>

                                    {releaseNotes && (
                                        <View style={tw`bg-gray-50 p-4 rounded-xl mb-2`}>
                                            <TextTheme
                                                style={tw`text-sm text-gray-600 text-center`}
                                            >
                                                {releaseNotes}
                                            </TextTheme>
                                        </View>
                                    )}
                                </View>

                                <View style={tw`gap-3`}>
                                    <TouchableOpacity
                                        onPress={openStore}
                                        style={tw`bg-blue-500 py-4 px-6 rounded-xl shadow-md`}
                                    >
                                        <TextTheme
                                            font='Prompt-SemiBold'
                                            style={tw`text-white text-center`}
                                        >
                                            {forceUpdate ? 'อัพเดทเดี๋ยวนี้' : 'อัพเดทแอพ'}
                                        </TextTheme>
                                    </TouchableOpacity>

                                    {!forceUpdate && (
                                        <TouchableOpacity
                                            onPress={skipUpdate}
                                            style={tw`py-4 px-6`}
                                        >
                                            <TextTheme
                                                font='Prompt-Medium'
                                                style={tw`text-gray-500 text-center`}
                                            >
                                                ข้ามไปก่อน
                                            </TextTheme>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {forceUpdate && (
                                    <TextTheme
                                        style={tw`text-xs text-red-500 text-center mt-4`}
                                        font='Prompt-Medium'
                                    >
                                        * จำเป็นต้องอัพเดทเพื่อใช้งานต่อ
                                    </TextTheme>
                                )}
                            </View>
                        </LinearGradient>
                    </View>
                ) : children}
            </VersionContext.Provider>
        </>
    );
};

export const useVersionCheck = () => useContext(VersionContext);