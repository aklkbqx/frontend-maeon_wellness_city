import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { FetchMeProvider, useFetchMeContext } from '@/context/FetchMeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userTokenLogin } from '@/helper/my-lib';
import LoadingScreen from '@/components/LoadingScreen';

interface RoleConfig {
    path: string;
}

const roleConfigs: Record<string, RoleConfig> = {
    admin: {
        path: '/admin/dashboard'
    },
    restaurant: {
        path: '/restaurant'
    },
    attractions: {
        path: '/attractions'
    },
    learning_resources: {
        path: '/learning_resources'
    },
    hospital: {
        path: '/hospital'
    }
};

function RootRedirect() {
    const { userData, isLoading, initializeUserData } = useFetchMeContext();
    const [isChecking, setIsChecking] = useState(true);
    const [shouldRedirectToHome, setShouldRedirectToHome] = useState(false);

    useEffect(() => {
        async function checkAuth() {
            try {
                const token = await AsyncStorage.getItem(userTokenLogin);

                if (token) {
                    // มี token ให้ดึงข้อมูล user
                    await initializeUserData();
                } else {
                    // ไม่มี token ให้ไปหน้า home
                    setShouldRedirectToHome(true);
                }
            } catch (error) {
                console.error("Error checking auth:", error);
                setShouldRedirectToHome(true);
            } finally {
                setIsChecking(false);
            }
        }

        checkAuth();
    }, []);

    if (isChecking || isLoading) {
        return <LoadingScreen />
    }

    if (shouldRedirectToHome) {
        return <Redirect href="/user/home" />;
    }

    if (userData?.role && roleConfigs[userData.role]) {
        return <Redirect href={roleConfigs[userData.role].path} />;
    }

    return <Redirect href="/user/home" />;
}

export default function IndexRootApp() {
    // return (
    //     <FetchMeProvider>
    //         <RootRedirect />
    //     </FetchMeProvider>
    // );
    return (
        <Redirect href="task" />
    );
}