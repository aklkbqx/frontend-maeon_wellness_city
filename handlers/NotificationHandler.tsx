// handlers/NotificationHandler.tsx
import { NotificationType } from '@/context/NotificationProvider';
import { router } from 'expo-router';

export const handleNotificationPress = (notification: any) => {
    const { type, data } = notification.data;

    switch (type) {
        case NotificationType.CHAT:
            if (data?.chatId) {
                router.push(`/chat/${data.chatId}`);
            }
            break;
        case NotificationType.ORDER:
            if (data?.orderId) {
                router.push(`/orders/${data.orderId}`);
            }
            break;
        case NotificationType.PAYMENT:
            if (data?.paymentId) {
                router.push(`/payments/${data.paymentId}`);
            }
            break;
        case NotificationType.ANNOUNCEMENT:
        case NotificationType.PROMOTION:
            if (data?.link) {
                router.push(data.link);
            }
            break;
        // เพิ่ม case อื่นๆ ตามต้องการ
    }
};