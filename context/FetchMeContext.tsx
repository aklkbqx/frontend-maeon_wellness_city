import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import api from '@/helper/api';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import { Users } from '@/types/PrismaType';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userTokenLogin } from '@/helper/my-lib';
import isEqual from 'lodash/isEqual';
import { router } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

api.defaults.timeout = 15000;

// TODO optimize code 

const withRetry = async (fn: () => Promise<any>, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); // exponential backoff
        }
    }
};
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
    const [userData, setUserData] = useState<Users | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLogin, setIsLogin] = useState<boolean>(false);
    const [isConnected, setIsConnected] = useState<boolean>(true);

    const userDataRef = useRef<Users | null>(null);
    const loadingTimeoutRef = useRef<any>(null);
    const isFetchingRef = useRef<boolean>(false);


    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected ?? false);
        });

        return () => unsubscribe();
    }, []);


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
        if (!isConnected) {
            throw new Error("ไม่มีการเชื่อมต่ออินเทอร์เน็ต");
        }

        return withRetry(async () => {
            try {
                const response = await api.get('/api/users/me');
                return response.data;
            } catch (error) {
                handleAxiosError(error, (message) => {
                    if (message === "authenticator fail") {
                        logout();
                    }
                });
                throw error;
            }
        });
    }, [isConnected]);

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
        } finally {
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