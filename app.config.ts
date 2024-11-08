import { ExpoConfig, ConfigContext } from '@expo/config';

const packageMaeon = "com.maeonwellnesscity";

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'Mae-On Wellness City',
    slug: 'maeonwellnesscity',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'maeonwellnesscity',
    userInterfaceStyle: 'automatic',
    owner: "akalak",
    platforms: ["android", "ios"],
    splash: {
        image: './assets/images/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff'
    },

    ios: {
        supportsTablet: true,
        bundleIdentifier: packageMaeon,
        config: {
            googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            usesNonExemptEncryption: false
        },
        infoPlist: {
            NSAppTransportSecurity: {
                NSAllowsArbitraryLoads: true,
                NSAllowsArbitraryLoadsInWebContent: true,
                NSAllowsLocalNetworking: true
            },
            UIBackgroundModes: [
                "remote-notification",
                "processing",
                "location",
                "fetch"
            ],
            BGTaskSchedulerPermittedIdentifiers: [
                'background-fetch'
            ]
        }
    },
    android: {
        package: packageMaeon,
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
            'NOTIFICATIONS',
            'WAKE_LOCK',
            'FOREGROUND_SERVICE'
        ]
    },
    web: {
        bundler: 'metro',
        output: "static",
        favicon: "./assets/images/favicon.png"
    },
    plugins: [
        "expo-router",
        [
            "expo-notifications",
            {
                "icon": "./assets/images/notification-icon.png",
                "color": "#ffffff",
                "defaultChannel": "default",
                // "sounds": [
                //     "./local/assets/notification-sound.wav",
                //     "./local/assets/notification-sound-other.wav"
                // ]
            }
        ],
        [
            "expo-background-fetch",
            {
                "startOnBoot": true
            }
        ]
    ],
    extra: {
        eas: {
            projectId: "e618907e-863c-4568-aded-55af832e836f"
        }
    }
});