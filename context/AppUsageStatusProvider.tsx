import api from '@/helper/api';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import { useFocusEffect } from 'expo-router';
import { createContext, ReactNode, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useFetchMeContext } from './FetchMeContext';

const AppUsageStatusContext = createContext<undefined>(undefined)

const AppUsageStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const appState = useRef(AppState.currentState);
    const { isLogin } = useFetchMeContext()

    const updateUserStatus = async (status: string) => {
        try {
            await api.put(`/api/users/update-user-status/${status}`);
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message);
            });
        }
    }

    useEffect(() => {
        if (!isLogin) return;

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                updateUserStatus("ONLINE");
            } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
                updateUserStatus("OFFLINE");
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };

    }, [isLogin]);

    useFocusEffect(
        useCallback(() => {
            if (isLogin) {
                updateUserStatus("ONLINE");
            }
        }, [isLogin])
    );

    return (
        <AppUsageStatusContext.Provider value={undefined}>
            {children}
        </AppUsageStatusContext.Provider>
    )
};

export default AppUsageStatusProvider;