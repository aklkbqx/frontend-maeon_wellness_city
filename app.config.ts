import { ExpoConfig, ConfigContext } from '@expo/config';
import { apiUrl } from './helper/api';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'MaeOn Wellness City',
    slug: 'maeonwellnesscity',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'maeonwellness',
    userInterfaceStyle: 'automatic',

    splash: {
        image: './assets/images/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff'
    },

    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.maeonwellnesscity',
        config: {
            googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            usesNonExemptEncryption: false
        },
        buildNumber: '1',
        infoPlist: {
            NSLocationWhenInUseUsageDescription: "แอพนี้ต้องการเข้าถึงตำแหน่งของคุณเพื่อแสดงตำแหน่งปัจจุบันบนแผนที่",
            NSLocationAlwaysAndWhenInUseUsageDescription: "แอพนี้ต้องการเข้าถึงตำแหน่งของคุณเพื่อติดตามเส้นทาง",
            UIBackgroundModes: [
                'location',
                'fetch',
                'remote-notification',
                'processing',
                'background-fetch'
            ],
            // เพิ่มการตั้งค่าสำหรับการแจ้งเตือน
            NSCameraUsageDescription: "แอพนี้ต้องการเข้าถึงกล้องเพื่อถ่ายรูปหลักฐานการชำระเงิน",
            NSPhotoLibraryUsageDescription: "แอพนี้ต้องการเข้าถึงคลังรูปภาพเพื่อเลือกรูปหลักฐานการชำระเงิน",
        },
        associatedDomains: [
            "applinks:maeonwellnesscity.com",
            "applinks:*.maeonwellnesscity.com"
        ]
    },
    android: {
        package: 'com.maeonwellnesscity',
        adaptiveIcon: {
            foregroundImage: './assets/images/adaptive-icon.png',
            backgroundColor: '#ffffff'
        },
        config: {
            googleMaps: {
                apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            },
        },
        permissions: [
            "ACCESS_FINE_LOCATION",
            "ACCESS_COARSE_LOCATION",
            "RECEIVE_BOOT_COMPLETED",
            "WAKE_LOCK",
            "FOREGROUND_SERVICE",
            "POST_NOTIFICATIONS",
            "NOTIFICATIONS",
            "CAMERA",
            "READ_EXTERNAL_STORAGE",
            "WRITE_EXTERNAL_STORAGE",
            "SCHEDULE_EXACT_ALARM",
            "USE_EXACT_ALARM"
        ],
        intentFilters: [
            {
                action: "VIEW",
                autoVerify: true,
                data: [
                    {
                        scheme: "https",
                        host: "*.maeonwellnesscity.com",
                        pathPrefix: "/receipt"
                    },
                    {
                        scheme: "maeonwellness",
                        host: "receipt"
                    }
                ],
                category: [
                    "BROWSABLE",
                    "DEFAULT"
                ]
            }
        ]
    },
    plugins: [
        "expo-router",
        [
            "expo-notifications",
            {
                icon: "./assets/images/adaptive-icon.png",
                color: "#ffffff",
                androidMode: "default",
                androidCollapsedTitle: "#{unread_notifications} การแจ้งเตือนใหม่",
                iosDisplayInForeground: true,
                androidChannelId: "default",
                androidImportance: "max",
                androidShowBadge: true,
                androidVibrate: [0, 250, 250, 250],
                androidSound: true
            }
        ],
        "expo-background-fetch",
        [
            "expo-location",
            {
                "locationAlwaysAndWhenInUsePermission": "แอพนี้ต้องการเข้าถึงตำแหน่งของคุณเพื่อติดตามเส้นทาง",
                "locationAlwaysPermission": "แอพนี้ต้องการเข้าถึงตำแหน่งของคุณเพื่อติดตามเส้นทาง",
                "locationWhenInUsePermission": "แอพนี้ต้องการเข้าถึงตำแหน่งของคุณเพื่อแสดงตำแหน่งปัจจุบันบนแผนที่",
                "isIosBackgroundLocationEnabled": true,
                "isAndroidBackgroundLocationEnabled": true
            }
        ]
    ],
    extra: {
        apiUrl: process.env.EXPO_PUBLIC_API_URL,
        eas: {
            projectId: "4d6e92ff-508b-4a8d-822d-4b24cf5f494a"
        }
    },
    updates: {
        url: 'https://u.expo.dev/4d6e92ff-508b-4a8d-822d-4b24cf5f494a',
        fallbackToCacheTimeout: 0,
        enabled: true,
        checkAutomatically: 'ON_LOAD'
    },
    runtimeVersion: "1.0.0"
});