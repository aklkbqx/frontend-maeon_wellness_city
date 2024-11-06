import React, { useState, useEffect } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import tw from "twrnc"
import ProfileSection from '@/components/my-account/ProfileSection';
import MenuSection from '@/components/my-account/MenuSection';
import { useFocusEffect } from 'expo-router';
import { useStatusBar } from '@/hooks/useStatusBar';
import Loading from '@/components/Loading';
import TextTheme from '@/components/TextTheme';
import * as Application from 'expo-application';
import { useFetchMeContext } from '@/context/FetchMeContext';
import LoadingScreen from '@/components/LoadingScreen';

const MyAccount: React.FC = () => {
    useStatusBar("dark-content");
    const { userData, profileImageUrl, isLoading, initializeUserData } = useFetchMeContext();
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [appVersion, setAppVersion] = useState<string>('');

    useEffect(() => {
        const getDisplayVersion = () => {
            const version = Application.nativeApplicationVersion;
            const build = Application.nativeBuildVersion;
            if (__DEV__) {
                return `${version}-dev (${build})`;
            }
            return `${version}`;
        };

        setAppVersion(getDisplayVersion());
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            initializeUserData();
        }, [initializeUserData])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await initializeUserData();
        setRefreshing(false);
    };

    if (isLoading) {
        return <LoadingScreen />
    }

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[String(tw`text-blue-500`.color)]}
                        tintColor={String(tw`text-blue-500`.color)}
                    />
                }
            >
                <View style={[tw`flex-1 shadow pb-5 web:pb-5 rounded-3xl m-2 bg-white mb-5`]}>
                    <ProfileSection loading={isLoading} profileImageUrl={profileImageUrl} userData={userData} />
                    <View style={tw`border-b-8 border-zinc-200`} />
                    {userData ? <MenuSection title="บัญชีของฉัน" type="account" userData={userData} /> : null}
                    {userData && <MenuSection title="การตั้งค่า" type="setting" userData={userData} />}
                </View>
                <View style={tw`flex-row justify-center mb-20`}>
                    <TextTheme style={tw`text-slate-500`}>Version: {appVersion}</TextTheme>
                </View>
                <View style={tw`android:mb-10 ios:mb-5`} />
            </ScrollView>
        </View>
    );
};

export default MyAccount;