import { router } from 'expo-router';
import useShowToast from './useShowToast';

interface RoleConfig {
    path: string;
    message: {
        type: "success" | "error" | "info";
        title: string;
        description: string;
    };
}

const useRoleNavigation = () => {
    const roleConfigs: Record<string, RoleConfig> = {
        user: {
            path: '/(home)',
            message: {
                type: 'success',
                title: 'ยินดีต้อนรับ',
                description: 'เข้าสู่ระบบสำหรับผู้ใช้ทั่วไป'
            }
        },
        admin: {
            path: '/(admin)/dashboard',
            message: {
                type: 'success',
                title: 'ยินดีต้อนรับ Admin',
                description: 'เข้าสู่ระบบผู้ดูแลระบบ'
            }
        },
        restaurant: {
            path: '/',
            message: {
                type: 'success',
                title: 'ยินดีต้อนรับ',
                description: 'เข้าสู่ระบบร้านอาหาร'
            }
        },
        attractions: {
            path: '/(attractions)/',
            message: {
                type: 'success',
                title: 'ยินดีต้อนรับ',
                description: 'เข้าสู่ระบบสถานที่ท่องเที่ยว'
            }
        },
        learning_resources: {
            path: '/',
            message: {
                type: 'success',
                title: 'ยินดีต้อนรับ',
                description: 'เข้าสู่ระบบแหล่งเรียนรู้'
            }
        },
        hospital: {
            path: '/',
            message: {
                type: 'success',
                title: 'ยินดีต้อนรับ',
                description: 'เข้าสู่ระบบโรงพยาบาล'
            }
        }
    };

    const navigate = (role: string) => {
        const config = roleConfigs[role];

        if (config) {
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

    return navigate;
};

export default useRoleNavigation;