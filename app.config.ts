import { ExpoConfig, ConfigContext } from '@expo/config';

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
                'background-fetch',
                'background-processing',
            ],
            NSCameraUsageDescription: "แอพนี้ต้องการเข้าถึงกล้องเพื่อถ่ายรูปหลักฐานการชำระเงิน",
            NSPhotoLibraryUsageDescription: "แอพนี้ต้องการเข้าถึงคลังรูปภาพเพื่อเลือกรูปหลักฐานการชำระเงิน",
            BGTaskSchedulerPermittedIdentifiers: [
                "com.maeonwellnesscity.BACKGROUND_FETCH_TASK",
                "com.maeonwellnesscity.BACKGROUND_NOTIFICATION_TASK"
            ],
            NSAppTransportSecurity: {
                NSAllowsArbitraryLoads: true,
                NSAllowsArbitraryLoadsInWebContent: true,
                NSAllowsLocalNetworking: true
            },
            UIRequiredDeviceCapabilities: [
                "location-services",
                "telephony",
                "wifi",
                "armv7"
            ],
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
                apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
            }
        },
        permissions: [
            'ACCESS_COARSE_LOCATION',
            'ACCESS_FINE_LOCATION',
            'ACCESS_BACKGROUND_LOCATION',
            'CAMERA',
            'READ_EXTERNAL_STORAGE',
            'WRITE_EXTERNAL_STORAGE'
        ],
        softwareKeyboardLayoutMode: "pan",
        allowBackup: true,
        versionCode: 1
    },
    web: {
        bundler: 'metro'
    },
    plugins: [
        "expo-router",
        [
            "expo-notifications",
            {
                icon: "./assets/images/adaptive-icon.png",
                color: "#ffffff",
                // sounds: ['./assets/sounds/notification.wav'],
                mode: "production",
                androidMode: "default",
                androidCollapsedTitle: "#{unread_notifications} การแจ้งเตือนใหม่",
                iosDisplayInForeground: true,
                androidChannelId: "default",
                androidImportance: "max",
                androidShowBadge: true,
                androidVibrate: [0, 250, 250, 250],
                androidSound: true,
                androidAllowWhileIdle: true,
                androidPriority: "max",
            }
        ],
        [
            "expo-background-fetch",
            {
                startOnBoot: true,
                minimumInterval: 60, // เพิ่มเป็น 60 วินาที
                stopOnTerminate: false,
                enableHeadless: true,
                requiresCharging: false,
                requiresDeviceIdle: false,
                requiresBatteryNotLow: false,
                requiresStorageNotLow: false
            }
        ],
        "expo-task-manager",
        [
            "expo-location",
            {
                "locationAlwaysAndWhenInUsePermission": "แอพนี้ต้องการเข้าถึงตำแหน่งของคุณเพื่อติดตามเส้นทาง",
                "locationAlwaysPermission": "แอพนี้ต้องการเข้าถึงตำแหน่งของคุณเพื่อติดตามเส้นทาง",
                "locationWhenInUsePermission": "แอพนี้ต้องการเข้าถึงตำแหน่งของคุณเพื่อแสดงตำแหน่งปัจจุบันบนแผนที่",
                "isIosBackgroundLocationEnabled": true,
                "isAndroidBackgroundLocationEnabled": true
            }
        ],
        [
            "expo-build-properties",
            {
                ios: {
                    deploymentTarget: "13.4",
                    useFrameworks: "static",
                    bundleType: "framework"
                }
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