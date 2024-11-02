import { ExpoConfig, ConfigContext } from '@expo/config';

const packageMaeon = "com.maeonwellnesscity";

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'MaeOn Wellness City',
    slug: 'maeonwellnesscity',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'maeonwellnesscity',
    userInterfaceStyle: 'automatic',

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
            }
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
        }
    },
    web: {
        bundler: 'metro',
        output: "static",
        favicon: "./assets/images/favicon.png"
    },
    plugins: [
        "expo-router"
    ]
});