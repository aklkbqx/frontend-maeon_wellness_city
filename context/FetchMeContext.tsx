import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import api from '@/helper/api';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import { Users } from '@/types/PrismaType';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userTokenLogin } from '@/helper/my-lib';
import isEqual from 'lodash/isEqual';
import useRoleNavigation from '@/hooks/useRoleNavigation';
import { router } from 'expo-router';

// TODO optimize code 

interface UserContextType {
    userData: Users | null;
    setUserData: (data: Users | null) => void;
    profileImageUrl: string | null;
    isLoading: boolean;
    isLogin: boolean;
    initializeUserData: () => Promise<void>;
    refreshUserData: () => Promise<void>;
    logout: () => Promise<void>;
    checkLoginStatus: () => Promise<{ login: boolean }>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
    children: ReactNode;
}

export const FetchMeProvider: React.FC<UserProviderProps> = ({ children }) => {
    const roleNavigation = useRoleNavigation()

    const [userData, setUserData] = useState<Users | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLogin, setIsLogin] = useState<boolean>(false);

    const userDataRef = useRef<Users | null>(null);
    const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFetchingRef = useRef<boolean>(false);

    const fetchUserProfile = useCallback(async (profile: string) => {
        try {
            const res = await api.get(`/images/user_images/${profile}`);
            setProfileImageUrl(res.request.responseURL);
        } catch {
            setProfileImageUrl(null);
            handleErrorMessage("ไม่สามารถโหลดรูปภาพโปรไฟล์ได้");
        }
    }, []);

    const fetchUserData = useCallback(async () => {
        return new Promise<Users>((resolve, reject) =>
            api.get('/api/users/me')
                .then(response => {
                    resolve(response.data);
                }).catch(error => {
                    handleAxiosError(error, (message) => {
                        handleErrorMessage(message);
                        if (message === "authenticator fail") {
                            logout()
                        }
                    });
                    reject(error);
                })
        );
    }, []);

    const checkLoginStatus = useCallback(async () => {
        const token = await AsyncStorage.getItem(userTokenLogin);
        if (token) {
            setIsLogin(true);
            return { login: true };
        } else {
            setIsLogin(false);
            return { login: false };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post("/api/auth/logout");
            await AsyncStorage.removeItem(userTokenLogin);
            setUserData(null);
            userDataRef.current = null;
            setProfileImageUrl(null);
            setIsLogin(false);
        } catch (error) {
            await AsyncStorage.removeItem(userTokenLogin);
            setUserData(null);
            userDataRef.current = null;
            setProfileImageUrl(null);
            setIsLogin(false);
        } finally{
            router.replace("/logout");
        }
    }, []);

    const initializeUserData = useCallback(async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        loadingTimeoutRef.current = setTimeout(() => {
            if (isFetchingRef.current) {
                setIsLoading(true);
            }
        }, 2000);

        try {
            const { login } = await checkLoginStatus();
            if (login) {

                const newUserData = await fetchUserData();
                if (!isEqual(newUserData, userDataRef.current)) {
                    setUserData(newUserData);
                    userDataRef.current = newUserData;
                    // ลบการเรียก roleNavigation ออกจากที่นี่
                    // if (newUserData.role) {
                    //     roleNavigation(newUserData.role)
                    // }
                    if (newUserData?.profile_picture) {
                        await fetchUserProfile(newUserData.profile_picture);
                    }
                }
            } else {
                setUserData(null);
                userDataRef.current = null;
                setProfileImageUrl(null);
            }
        } catch (error) {
            console.error("Error initializing user data:", error);
            setUserData(null);
            userDataRef.current = null;
            setProfileImageUrl(null);
        } finally {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
            }
            setIsLoading(false);
            isFetchingRef.current = false;
        }
    }, [checkLoginStatus, fetchUserData, fetchUserProfile]);

    const refreshUserData = useCallback(async () => {
        await initializeUserData();
    }, [initializeUserData]);

    useEffect(() => {
        checkLoginStatus();
        return () => {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
        };
    }, [isLogin]);

    const value = {
        userData,
        setUserData,
        profileImageUrl,
        isLoading,
        isLogin,
        initializeUserData,
        refreshUserData,
        logout,
        checkLoginStatus,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useFetchMeContext = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useFetchMeContext must be used within a FetchMeProvider');
    }
    return context;
};