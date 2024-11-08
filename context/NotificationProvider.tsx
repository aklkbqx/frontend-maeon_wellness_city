import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert, AppState, Linking, AppStateStatus, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wsUrl } from '@/helper/api';
import { NotificationData } from '@/types/notifications';
import { handleErrorMessage, userTokenLogin } from '@/helper/my-lib';
import useShowToast from '@/hooks/useShowToast';
import { useFetchMeContext } from '@/context/FetchMeContext';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';

const BACKGROUND_FETCH_TASK = 'background-fetch';
const NOTIFICATION_CHANNEL_ID = 'default';
const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

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

export const scheduleNotification = async (
    data: NotificationData,
    options: Partial<Notifications.NotificationRequestInput> = {}
) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: data.title,
            body: data.body,
            data: data.data,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
            ...options,
        },
        trigger: null,
    });
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


interface NotificationContextType {
    isEnabled: boolean;
    permissionStatus: string;
    toggleNotifications: () => Promise<void>;
    requestPermission: () => Promise<string>;
    sendWebSocketNotification: (data: NotificationData) => void;
    sendNotification: (data: NotificationData) => Promise<void>;
    openAppSettings: () => void;
    disconnectWebSocket: () => void;
    isLoading: boolean;
    error: string | null;
    wsConnected: boolean;
    reconnect: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};


TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {
        const token = await AsyncStorage.getItem(userTokenLogin);
        const notificationEnabled = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);

        if (!token || !notificationEnabled) {
            return;
        }

        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            return;
        }

        const ws = new WebSocket(`${wsUrl}/api/ws/notification?token=${token}`);
        return new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                ws.close();
                resolve();
            }, 25000);

            ws.onmessage = async (event) => {
                try {
                    const response = JSON.parse(event.data);
                    if (response.success === false) {
                        return;
                    }

                    const data = response;
                    if (!data.type || !data.title || !data.body || !data.receive) {
                        return;
                    }

                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: data.title,
                            body: data.body,
                            data: data.data,
                            sound: 'default',
                            priority: Notifications.AndroidNotificationPriority.HIGH,
                        },
                        trigger: null,
                    });

                    clearTimeout(timeout);
                    ws.close();
                    resolve();
                } catch (error) {
                    console.error('Background task error:', error);
                }
            };

            ws.onerror = () => {
                clearTimeout(timeout);
                ws.close();
                resolve();
            };
        });
    } catch (error) {
        console.error('Background fetch task error:', error);
    }
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { userData, isLogin } = useFetchMeContext();
    const appState = useRef(AppState.currentState);

    // Refs
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // States
    const [isEnabled, setIsEnabled] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const registerBackgroundFetch = async () => {
        try {
            const backgroundFetchOptions: BackgroundFetch.BackgroundFetchOptions = {
                minimumInterval: 60,
                stopOnTerminate: false,
                startOnBoot: true,
            };

            if (Platform.OS === 'android') {
                await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, backgroundFetchOptions);
            } else {
                await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, backgroundFetchOptions);
            }
        } catch (err) {
            console.error("Background fetch registration failed:", err);
        }
    };

    const setupNotifications = async () => {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
                sound: 'default',
                enableLights: true,
                enableVibrate: true,
                // แก้ไข AndroidNotificationLockscreenVisibility เป็น AndroidNotificationVisibility
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                showBadge: true,
            });
        }

        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            }),
        });

        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
            // console.log('Notification received:', notification);
        });

        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data?.link) {
                router.push(data.link);
            }
        });

        return () => {
            Notifications.removeNotificationSubscription(notificationListener);
            Notifications.removeNotificationSubscription(responseListener);
        };
    };

    const cleanupWebSocket = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (socketRef.current) {
            socketRef.current.onopen = null;
            socketRef.current.onclose = null;
            socketRef.current.onerror = null;
            socketRef.current.onmessage = null;
            socketRef.current = null;
        }

        setWsConnected(false);
    }, []);

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
    const connectWebSocket = useCallback(async () => {
        if (!isInitialized || !isLogin || !userData || !userToken || !isEnabled) {
            return;
        }
        // const networkState = await NetInfo.fetch();
        // if (!networkState.isConnected) {
        //     console.log('No network connection available');
        //     setError('No network connection');
        //     return;
        // }

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            return;
        }
        try {
            if (!wsUrl) {
                throw new Error("WebSocket URL not found");
            }
            const websocketURL = `${wsUrl}/api/ws/notification?token=${userToken}`;
            const ws = new WebSocket(websocketURL);
            socketRef.current = ws;

            socketRef.current.onopen = () => {
                console.log('WebSocket Connected Successfully');
                setWsConnected(true);
                setError(null);
            };

            socketRef.current.onmessage = async (event) => {
                try {
                    const response = JSON.parse(event.data);

                    if (!response.success && response.message) {
                        if (response.message.includes('authentication')) {
                            console.log('Authentication error - refreshing token');
                            disconnectWebSocket();
                            return;
                        }
                        return;
                    }

                    const data = response;
                    if (!data.type || !data.title || !data.body || !data.receive) {
                        console.log('Invalid notification format:', data);
                        return;
                    }

                    const shouldNotify = data.receive?.all === true ||
                        (Array.isArray(data.receive?.userId) && data.receive.userId.includes(userData?.id)) ||
                        data.receive?.userId === userData?.id ||
                        (Array.isArray(data.receive?.role) && data.receive.role.includes(String(userData.role))) ||
                        data.receive?.role === userData?.role;

                    if (shouldNotify && isEnabled) {
                        await scheduleNotification(data);
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

            socketRef.current.onclose = (event) => {
                console.log('WebSocket Disconnected ');
                setWsConnected(false);
            };

        } catch (err) {
            console.error('Error connecting to WebSocket:', err);
            setError('Failed to connect to notification service');
            setWsConnected(false);
        }
    }, [isInitialized, isLogin, isEnabled, userToken, userData]);

    useEffect(() => {
        if (isLogin && userData && isEnabled && !wsConnected) {
            console.log('reconnecting....');
            reconnectTimeoutRef.current = setTimeout(connectWebSocket, 1000);
        }
    }, [isEnabled, isLogin, userData, wsConnected])

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
                            setIsEnabled(false);
                            await saveSettings(false);
                            await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
                            useShowToast("info", "ปิดการแจ้งเตือน", "ปิดการแจ้งเตือนเรียบร้อยแล้ว!");
                            disconnectWebSocket();
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
                                setIsEnabled(true);
                                await saveSettings(true);
                                await registerBackgroundFetch();
                                useShowToast("success", "เปิดการแจ้งเตือน", "เปิดการแจ้งเตือนเรียบร้อยแล้ว!");
                            }
                        }
                    ]
                );
            }
        }
    };

    const sendWebSocketNotification = useCallback(async (data: NotificationData) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            handleErrorMessage('ไม่สามารถเชื่อมต่อกับระบบแจ้งเตือน กรุณาลองใหม่อีกครั้ง');
            return;
        }

        try {
            socketRef.current.send(JSON.stringify(data));
            await sendNotification(data)
        } catch (err) {
            console.error('Error sending WebSocket notification:', err);
            handleErrorMessage('เกิดข้อผิดพลาดในการส่งการแจ้งเตือน');
        }
    }, []);

    const sendNotification = async (data: NotificationData) => {
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
            await scheduleNotification(data);
        } catch (err) {
            console.error('Error sending notification:', err);
            handleErrorMessage('เกิดข้อผิดพลาดในการส่งการแจ้งเตือน');
        }
    };

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

    const initializeNotifications = useCallback(async () => {
        try {
            await setupNotificationChannel();
            setupNotificationHandler();
            const hasPermission = await requestNotificationPermissions();
            setPermissionStatus(hasPermission ? 'granted' : 'denied');
            if (hasPermission) {
                setIsEnabled(true);
                await saveSettings(true);
            }
            const token = await AsyncStorage.getItem(userTokenLogin);
            if (token) {
                setUserToken(token);
            }
        } catch (err) {
            console.error('Error initializing notifications:', err);
        }
    }, [])

    const initialize = useCallback(async () => {
        try {
            setIsLoading(true);
            await loadSettings();
            await setupNotifications();
            await initializeNotifications();
            const permissionResult = await requestNotificationPermissions();
            const token = await AsyncStorage.getItem(userTokenLogin);
            if (token) {
                setUserToken(token);
            }
            if (permissionResult) {
                await registerBackgroundFetch();
                setIsEnabled(true);
                await saveSettings(true);
            }
            setIsInitialized(true);
        } catch (error) {
            console.error('Initialization error:', error);
            setError('Failed to initialize notifications');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        initialize();
    }, []);

    // useEffect(() => {
    //     const checkAndUpdateToken = async () => {
    //         try {
    //             const token = await AsyncStorage.getItem(userTokenLogin);
    //             if (token) {
    //                 setUserToken(token);
    //             } else {
    //                 setUserToken(null);
    //             }
    //         } catch (error) {
    //             console.error('Error checking token:', error);
    //         }
    //     };

    //     checkAndUpdateToken();
    // }, [isLogin]);

    useEffect(() => {
        if (isInitialized) {
            if (isLogin && isEnabled && userData) {
                connectWebSocket();
            } else {
                disconnectWebSocket();
            }
        }
    }, [isInitialized, isLogin, userData, isEnabled]);

    useEffect(() => {
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                if (isInitialized && isLogin && userData && isEnabled) {
                    await connectWebSocket();
                }
            } else if (nextAppState.match(/inactive|background/)) {
                cleanupWebSocket();
                if (isEnabled) {
                    await registerBackgroundFetch();
                }
            }
            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => {
            subscription.remove();
        };
    }, [isInitialized, isLogin, userData, isEnabled]);

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
    }), [
        isEnabled,
        permissionStatus,
        isLoading,
        error,
        wsConnected,
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