import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert, AppState, Linking, AppStateStatus, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { wsUrl } from '@/helper/api';
import { NotificationData } from '@/types/notifications';
import { handleErrorMessage, userTokenLogin } from '@/helper/my-lib';
import useShowToast from '@/hooks/useShowToast';
import { useFetchMeContext } from '@/context/FetchMeContext';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';

export const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';
export const BACKGROUND_FETCH_TASK = 'BACKGROUND_FETCH_TASK';
const NOTIFICATION_CHANNEL_ID = 'default';

export const setupNotificationChannel = async () => {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            sound: 'default',
            enableLights: true,
            enableVibrate: true,
        });
    }
};

export const setupNotificationHandler = () => {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
        }),
    });
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
    if (!Constants.isDevice) {
        return false;
    }

    let finalStatus = null;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return false;
    }

    return true;
};

enum BackgroundFetchResult {
    NoData = 1,
    NewData = 2,
    Failed = 3
}

export const registerBackgroundFetchAsync = async () => {
    try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
            minimumInterval: 60 * 15,
            stopOnTerminate: false,
            startOnBoot: true,
        });
    } catch (err) {
        console.error("Task Register failed:", err);
    }
};

export const unregisterBackgroundFetchAsync = async () => {
    try {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    } catch (err) {
        console.error("Task Unregister failed:", err);
    }
};

export const scheduleNotification = async (
    title: string,
    body: string,
    data?: any,
    options: Partial<Notifications.NotificationRequestInput> = {}
) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
            ...options,
        },
        trigger: null,
    });
};

export const setBadgeCount = async (count: number) => {
    await Notifications.setBadgeCountAsync(count);
};

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    const token = await AsyncStorage.getItem(userTokenLogin);
    if (!token) {
        return BackgroundFetchResult.NoData;
    }

    try {
        return BackgroundFetchResult.NewData;
    } catch (error) {
        return BackgroundFetchResult.Failed;
    }
});

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
    if (error) {
        console.error('Background notification task error:', error);
        return;
    }

    if (data) {
        const { title, body, payload } = data as any;
        await scheduleNotification(title, body, payload);
    }
});

export const checkBackgroundFetchStatus = async () => {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    return { status, isRegistered };
};

export const handleNotificationResponse = (
    response: Notifications.NotificationResponse,
    navigate: (screen: string, params?: any) => void
) => {
    const data = response.notification.request.content.data;

    if (data?.link) {
        navigate(data.link, data.params);
    }
};

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

interface NotificationContextType {
    isEnabled: boolean;
    permissionStatus: string;
    toggleNotifications: () => Promise<void>;
    requestPermission: () => Promise<string>;
    sendWebSocketNotification: (data: NotificationData) => void;
    sendNotification: (title: string, body: string, data?: any) => Promise<void>;
    openAppSettings: () => void;
    disconnectWebSocket: () => void;
    isLoading: boolean;
    error: string | null;
    wsConnected: boolean;
    reconnect: () => void;
    badgeCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { userData, isLogin, refreshUserData } = useFetchMeContext();
    const appState = useRef(AppState.currentState);

    // Refs
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // States
    const [isEnabled, setIsEnabled] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [badgeCount, setBadgeCountState] = useState(0);
    const [jwtToken, setJwtToken] = useState<string | null>(null);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const initializeNotifications = async () => {
        try {
            await setupNotificationChannel();
            setupNotificationHandler();
            const hasPermission = await requestNotificationPermissions();
            setPermissionStatus(hasPermission ? 'granted' : 'denied');
            const token = await AsyncStorage.getItem(userTokenLogin);
            if (token) {
                setUserToken(token);
            }
        } catch (err) {
            console.error('Error initializing notifications:', err);
        }
    };

    // Load settings from storage
    const loadSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
            if (savedSettings) {
                const { isEnabled: savedIsEnabled } = JSON.parse(savedSettings);
                setIsEnabled(savedIsEnabled);
            }
        } catch (err) {
            console.error('Error loading settings:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Save settings to storage
    const saveSettings = async (newIsEnabled: boolean) => {
        try {
            await AsyncStorage.setItem(
                NOTIFICATION_SETTINGS_KEY,
                JSON.stringify({ isEnabled: newIsEnabled })
            );
        } catch (err) {
            console.error('Error saving settings:', err);
        }
    };

    // Check if user should receive notification
    const checkShouldNotify = (data: NotificationData, user: any): boolean => {
        if (!user) return false;

        if (data.receive.all) return true;

        if (data.receive.userId) {
            if (Array.isArray(data.receive.userId)) {
                if (data.receive.userId.includes(user.id)) return true;
            } else if (data.receive.userId === user.id) {
                return true;
            }
        }

        if (data.receive.role) {
            if (Array.isArray(data.receive.role)) {
                if (data.receive.role.includes(user.role)) return true;
            } else if (data.receive.role === user.role) {
                return true;
            }
        }

        return false;
    };

    const getToken = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem(userTokenLogin);
            console.log('Token retrieved:', token ? 'Yes' : 'No');
            setJwtToken(token);
            return token;
        } catch (err) {
            console.error('Error getting token:', err);
            return null;
        }
    }, []);

    const connectWebSocket = useCallback(async () => {
        if (!isInitialized) {
            console.log('Not initialized yet, skipping WebSocket connection');
            return;
        }
        if (!isLogin) {
            console.log('Not logged in, skipping WebSocket connection');
            return;
        }
        if (!userData) {
            console.log('No user data, skipping WebSocket connection');
            return;
        }
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        try {
            const websocketURL = `${wsUrl}/api/ws/notification?token=${userToken}`;
            console.log('Attempting to connect WebSocket:', websocketURL);

            socketRef.current = new WebSocket(websocketURL);

            socketRef.current.onopen = () => {
                console.log('WebSocket Connected Successfully');
                setWsConnected(true);
                setError(null);
            };

            socketRef.current.onmessage = async (event) => {
                try {
                    const response = JSON.parse(event.data);
                    console.log('Received message:', response);
                    if (response.success === false) {
                        console.error('WebSocket error:', response.message);
                        return;
                    }
                    if (response === 'pong') {
                        console.log('Received heartbeat response');
                        return;
                    }

                    const data = response;
                    if (!data.type || !data.title || !data.body || !data.receive) {
                        console.error('Invalid notification format:', data);
                        return;
                    }

                    const shouldNotify = (
                        (Array.isArray(data.receive.userId) && data.receive.userId.includes(userData?.id)) ||
                        data.receive.userId === userData?.id ||
                        data.receive.all ||
                        (Array.isArray(data.receive.role) && data.receive.role.includes(String(userData.role))) ||
                        data.receive.role === userData?.role
                    );

                    if (shouldNotify && isEnabled) {
                        await scheduleNotification(data.title, data.body, data.data);
                    }
                } catch (err) {
                    console.error('Error processing message:', err);
                }
            };

            socketRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('WebSocket connection error');
                setWsConnected(false);
            };

            socketRef.current.onclose = () => {
                console.log('WebSocket disconnected');
                setWsConnected(false);
                if (isLogin && userData) {
                    console.log('Scheduling reconnection...');
                    reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
                }
            };

        } catch (err) {
            console.error('Error connecting to WebSocket:', err);
            setError('Failed to connect to notification service');
            setWsConnected(false);
        }
    }, [isInitialized, isLogin, userData, isEnabled, userToken]);

    // Toggle notifications
    const toggleNotifications = async () => {
        if (isEnabled) {
            Alert.alert(
                "เตือน",
                "ต้องการที่จะปิดการแจ้งเตือนใช่หรือไม่\nหากคุณปิดการรับแจ้งเตือน คุณจะไม่ได้รับการแจ้งเตือนทั้งหมด",
                [
                    { text: "ยกเลิก", style: "cancel" },
                    {
                        text: "ปิดการแจ้งเตือน",
                        style: "destructive",
                        onPress: async () => {
                            await unregisterBackgroundFetchAsync();
                            setIsEnabled(false);
                            await saveSettings(false);
                            useShowToast("info", "ปิดการแจ้งเตือน", "ปิดการแจ้งเตือนเรียบร้อยแล้ว!");
                        }
                    }
                ]
            );
        } else {
            const hasPermission = await requestNotificationPermissions();
            if (hasPermission) {
                Alert.alert(
                    "เตือน",
                    "ต้องการที่จะเปิดการแจ้งเตือนใช่หรือไม่\nเปิดการแจ้งเตือนเพื่อรับข้อมูลและการแจ้งเตือนทั้งหมด",
                    [
                        { text: "ยกเลิก", style: "cancel" },
                        {
                            text: "เปิดการแจ้งเตือน",
                            onPress: async () => {
                                await registerBackgroundFetchAsync();
                                setIsEnabled(true);
                                await saveSettings(true);
                                useShowToast("success", "เปิดการแจ้งเตือน", "เปิดการแจ้งเตือนเรียบร้อยแล้ว!");
                            }
                        }
                    ]
                );
            }
        }
    };

    // Send notification via WebSocket
    const sendWebSocketNotification = useCallback((data: NotificationData) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            handleErrorMessage('ไม่สามารถเชื่อมต่อกับระบบแจ้งเตือน กรุณาลองใหม่อีกครั้ง');
            return;
        }

        try {
            socketRef.current.send(JSON.stringify(data));
        } catch (err) {
            console.error('Error sending WebSocket notification:', err);
            handleErrorMessage('เกิดข้อผิดพลาดในการส่งการแจ้งเตือน');
        }
    }, []);

    // Send local notification
    const sendNotification = async (title: string, body: string, data?: any) => {
        if (!isEnabled) {
            handleErrorMessage('การแจ้งเตือนถูกปิดอยู่');
            return;
        }

        if (permissionStatus !== 'granted') {
            Alert.alert(
                'ไม่ได้รับสิทธิ์',
                'ไม่ได้รับสิทธิ์ในการแสดงการแจ้งเตือน คุณต้องการเปิดการตั้งค่าเพื่อเปิดการแจ้งเตือนหรือไม่?',
                [
                    { text: 'ไม่', style: 'cancel' },
                    { text: 'ใช่', onPress: () => Linking.openSettings() }
                ]
            );
            return;
        }

        try {
            await scheduleNotification(title, body, data);
            setBadgeCountState(prev => prev + 1);
            await setBadgeCount(badgeCount + 1);
        } catch (err) {
            console.error('Error sending notification:', err);
            handleErrorMessage('เกิดข้อผิดพลาดในการส่งการแจ้งเตือน');
        }
    };

    // Disconnect WebSocket
    const disconnectWebSocket = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        setWsConnected(false);
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    }, []);

    const initialize = async () => {
        try {
            console.log('Initializing...');
            setIsLoading(true);

            // โหลดการตั้งค่าการแจ้งเตือน
            await loadSettings();

            // ตั้งค่าการแจ้งเตือน
            await initializeNotifications();

            // เมื่อเสร็จสิ้นการ initialize
            setIsInitialized(true);
        } catch (error) {
            console.error('Initialization error:', error);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        initialize();
    }, []);

    useEffect(() => {
        if (!isInitialized) return;

        if (isLogin && userData) {
            console.log('User data loaded, connecting WebSocket...');
            connectWebSocket();
        } else {
            disconnectWebSocket();
        }
    }, [isInitialized, isLogin, userData]);

    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active' &&
                isInitialized &&
                isLogin &&
                userData
            ) {
                console.log('App came to foreground, reconnecting...');
                connectWebSocket();
            }
            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [isInitialized, isLogin, userData]);

    useEffect(() => {
        const initializeToken = async () => {
            if (isLogin) {
                console.log('User is logged in, getting token...');
                await getToken();
            } else {
                console.log('User is not logged in, clearing token');
                setJwtToken(null);
                disconnectWebSocket();
            }
        };

        initializeToken();
    }, [isLogin]);

    useEffect(() => {
        const initializeWebSocket = async () => {
            if (isLogin && jwtToken && userData) {
                console.log('All requirements met, connecting to WebSocket...');
                await connectWebSocket();
            } else {
                if (!isLogin) console.log('Not logged in');
                if (!jwtToken) console.log('No JWT token');
                if (!userData) console.log('No user data');
                disconnectWebSocket();
            }
        };

        initializeWebSocket();

        // Cleanup
        return () => {
            disconnectWebSocket();
        };
    }, [isLogin, jwtToken, userData]);

    useEffect(() => {
        initializeNotifications();
        loadSettings();

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                refreshUserData();
                connectWebSocket();
            }
            appState.current = nextAppState;
        });

        const notificationSubscription = Notifications.addNotificationResponseReceivedListener(
            (response) => handleNotificationResponse(response, router.navigate)
        );

        return () => {
            subscription.remove();
            notificationSubscription.remove();
            disconnectWebSocket();
        };
    }, []);

    useEffect(() => {
        if (isLogin) {
            getToken();
        } else {
            setJwtToken(null);
        }
    }, [isLogin]);

    useEffect(() => {
        if (isLogin && jwtToken) {
            connectWebSocket();
        } else {
            disconnectWebSocket();
        }
    }, [isLogin, jwtToken]);

    useFocusEffect(
        useCallback(() => {
            setBadgeCountState(0);
            setBadgeCount(0);
        }, [])
    );


    const contextValue = useMemo(() => ({
        isEnabled,
        permissionStatus,
        toggleNotifications,
        requestPermission: async () => {
            const status = await requestNotificationPermissions();
            setPermissionStatus(status ? 'granted' : 'denied');
            return status ? 'granted' : 'denied';
        },
        sendWebSocketNotification,
        sendNotification,
        openAppSettings: () => Linking.openSettings(),
        disconnectWebSocket,
        isLoading,
        error,
        wsConnected,
        reconnect: connectWebSocket,
        badgeCount
    }), [
        isEnabled,
        permissionStatus,
        isLoading,
        error,
        wsConnected,
        badgeCount,
        sendWebSocketNotification,
        disconnectWebSocket,
        connectWebSocket
    ]);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationProvider;