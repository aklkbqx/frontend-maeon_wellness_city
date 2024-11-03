import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { router } from 'expo-router';
import useShowToast from '@/hooks/useShowToast';
import { useFetchMeContext } from './FetchMeContext';

interface RoleConfig {
    path: string;
    message: {
        type: "success" | "error" | "info";
        title: string;
        description: string;
    };
}

interface RoleContextType {
    currentRole: string | null;
    setRole: (role: string) => void;
    clearRole: () => void;
    checkAccess: (allowedRoles: string[]) => boolean;
}

interface RoleProviderProps {
    children: ReactNode;
}

const roleConfigs: Record<string, RoleConfig> = {
    user: {
        path: '/user/home',
        message: {
            type: 'success',
            title: 'ยินดีต้อนรับ',
            description: 'เข้าสู่ระบบสำหรับผู้ใช้ทั่วไป'
        }
    },
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
    attractions: {
        path: '/attractions',
        message: {
            type: 'success',
            title: 'ยินดีต้อนรับ',
            description: 'เข้าสู่ระบบสถานที่ท่องเที่ยว'
        }
    },
    learning_resources: {
        path: '/learning_resources',
        message: {
            type: 'success',
            title: 'ยินดีต้อนรับ',
            description: 'เข้าสู่ระบบแหล่งเรียนรู้'
        }
    },
    hospital: {
        path: '/hospital',
        message: {
            type: 'success',
            title: 'ยินดีต้อนรับ',
            description: 'เข้าสู่ระบบโรงพยาบาล'
        }
    }
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
    const [currentRole, setCurrentRole] = useState<string | null>(null);

    const setRole = (role: string) => {
        const config = roleConfigs[role];

        if (config) {
            setCurrentRole(role);
            router.replace(config.path);
            useShowToast(
                config.message.type,
                config.message.title,
                config.message.description
            );
        } else {
            console.log('Unknown role');
            useShowToast(
                'error',
                'เกิดข้อผิดพลาด',
                'ไม่พบประเภทผู้ใช้งาน'
            );
        }
    };

    const clearRole = () => {
        setCurrentRole(null);
        router.replace('/auth/login');
    };

    const checkAccess = (allowedRoles: string[]): boolean => {
        return currentRole ? allowedRoles.includes(currentRole) : false;
    };

    return (
        <RoleContext.Provider value={{ currentRole, setRole, clearRole, checkAccess }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
};

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles
}) => {
    const { userData, isLogin, isLoading, initializeUserData } = useFetchMeContext();
    const showToast = useShowToast;

    useEffect(() => {
        initializeUserData();
    }, []);

    // รอข้อมูลโหลดเสร็จก่อน
    if (isLoading) {
        return null; // หรือจะใส่ loading component ก็ได้
    }

    useEffect(() => {
        if (!isLoading) {
            if (allowedRoles.includes('user')) {
                if (!isLogin || !userData?.role || userData.role === 'user') {
                    return;
                }

                const roleConfig = roleConfigs[userData.role];
                if (roleConfig) {
                    router.replace(roleConfig.path);
                    showToast(
                        'info',
                        'นำทางอัตโนมัติ',
                        'กำลังนำทางไปยังหน้าที่เหมาะสมกับบทบาทของคุณ'
                    );
                }
                return;
            }

            if (!isLogin || !userData) {
                router.replace('/auth/login');
                showToast(
                    'error',
                    'ไม่สามารถเข้าถึงได้',
                    'กรุณาเข้าสู่ระบบ'
                );
                return;
            }

            if (!allowedRoles.includes(String(userData.role))) {
                router.replace('/auth/unauthorized');
                showToast(
                    'error',
                    'ไม่มีสิทธิ์เข้าถึง',
                    'คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้'
                );
            }
        }
    }, [isLoading, isLogin, userData, allowedRoles]);

    // เงื่อนไขการแสดง children
    if (allowedRoles.includes('user')) {
        // สำหรับหน้า user ให้แสดงถ้า:
        // 1. ไม่ได้ login หรือ
        // 2. ไม่มี role หรือ
        // 3. role เป็น user
        if (!isLogin || !userData?.role || userData.role === 'user') {
            return <>{children}</>;
        }
    } else {
        // สำหรับหน้าอื่นๆ ให้แสดงถ้า:
        // 1. login แล้ว และ
        // 2. มี role ที่ตรงกับ allowedRoles
        if (isLogin && userData?.role && allowedRoles.includes(userData.role)) {
            return <>{children}</>;
        }
    }

    // รอการ redirect
    return null;
};