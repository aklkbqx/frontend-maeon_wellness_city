// hooks/useRedirectByRole.ts
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useFetchMeContext } from '@/context/FetchMeContext';
import useShowToast from '@/hooks/useShowToast';

interface RoleConfig {
    path: string;
    message: {
        type: "success" | "error" | "info";
        title: string;
        description: string;
    };
}

const roleConfigs: Record<string, RoleConfig> = {
    admin: {
        path: '/admin/dashboard',
        message: {
            type: 'success',
            title: 'ยินดีต้อนรับ Admin',
            description: 'เข้าสู่ระบบผู้ดูแลระบบ'
        }
    },
    restaurant: {
        path: '/restaurant',
        message: {
            type: 'success',
            title: 'ยินดีต้อนรับ',
            description: 'เข้าสู่ระบบร้านอาหาร'
        }
    },
    // ... role อื่นๆ
};

export const useRedirectByRole = (allowedRoles: string[]) => {
    const { userData, isLogin, isLoading, initializeUserData } = useFetchMeContext();
    const showToast = useShowToast;

    useEffect(() => {
        const checkAndRedirect = async () => {
            await initializeUserData();

            if (!isLoading) {
                // กรณีที่เป็นหน้า user
                if (allowedRoles.includes('user')) {
                    // ถ้าไม่ได้ login หรือไม่มี role หรือเป็น user ให้อยู่หน้านี้ได้
                    if (!isLogin || !userData?.role || userData.role === 'user') {
                        return;
                    }

                    // ถ้ามี role อื่น ให้ redirect ไปตาม role นั้น
                    const config = roleConfigs[userData.role];
                    if (config) {
                        router.replace(config.path);
                        showToast(
                            config.message.type,
                            config.message.title,
                            config.message.description
                        );
                    }
                    return;
                }

                if (!isLogin || !userData) {
                    router.replace('/auth/login');
                    return;
                }

                if (!allowedRoles.includes(String(userData.role))) {
                    router.replace('/auth/unauthorized');
                }
            }
        };

        checkAndRedirect();
    }, [isLoading, isLogin, userData, allowedRoles]);

    return { isLoading };
};