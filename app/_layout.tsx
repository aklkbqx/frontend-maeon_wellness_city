import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useNavigation } from 'expo-router';
import 'react-native-reanimated';
import FontLoader from '@/components/FontLoader';
import Toast from 'react-native-toast-message';
import { BackHandler, Platform } from 'react-native';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { InternetProvider } from '@/context/InternetProvider';
import { RoleProvider } from '@/context/RoleProvider';

export default function RootLayout() {
  const navigation = useNavigation()

  useEffect(() => {
    const preventGoingBack = () => {
      return true
    }
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const currentRoute = e.data.action.target?.split('-')[0]
      if (currentRoute === 'index' || currentRoute === 'selectdatatime') {
        e.preventDefault()
      }
    })

    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', preventGoingBack)
    }

    return () => {
      if (Platform.OS === 'android') {
        BackHandler.removeEventListener('hardwareBackPress', preventGoingBack)
      }
      unsubscribe()
    }
  }, [navigation])

  return (
    <FontLoader>
      <ThemeProvider value={DefaultTheme}>
        <GestureHandlerRootView>
          <InternetProvider>
            <RoleProvider>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false, gestureEnabled: false }} />
                <Stack.Screen name="pages" options={{ headerShown: false, animation: "fade_from_bottom" }} />
                <Stack.Screen name="auth" options={{ headerShown: false, animation: "slide_from_bottom", presentation: "modal" }} />
                <Stack.Screen name="user" options={{ headerShown: false, gestureEnabled: false }} />
                <Stack.Screen name="admin" options={{ headerShown: false, gestureEnabled: false }} />
                <Stack.Screen name="attractions" options={{ headerShown: false, gestureEnabled: false }} />
                <Stack.Screen name="logout" options={{ headerShown: false, gestureEnabled: false }} />
                <Stack.Screen name="+not-found" />
                <Stack.Screen name="error-page" options={{ headerShown: false }} />
                <Stack.Screen name="connection-error" options={{ headerShown: false, gestureEnabled: false }} />
              </Stack>
            </RoleProvider>
            <Toast />
          </InternetProvider>
        </GestureHandlerRootView>
      </ThemeProvider>
    </FontLoader>
  );
}
