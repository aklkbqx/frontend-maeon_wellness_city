// hooks/useAdminNotifications.ts
import { useState, useCallback } from 'react';
import api from '@/helper/api';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import useShowToast from './useShowToast';
import { Notifications, PaymentsStatus } from '@/types/PrismaType';

export const useAdminNotifications = () => {
    const [notifications, setNotifications] = useState<Notifications[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/admin/notifications');
            if (response.data.success) {
                console.log(response.data);
                setNotifications(response.data.notifications);
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message)
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const markAsRead = useCallback(async (notificationId: number) => {
        try {
            const response = await api.put(`/api/admin/notifications/mark-read/${notificationId}`);
            if (response.data.success) {
                await fetchNotifications();
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message)
            });
        }
    }, [fetchNotifications]);

    const markAllAsRead = useCallback(async () => {
        try {
            const response = await api.put('/api/admin/notifications/mark-all-read');
            if (response.data.success) {
                useShowToast('success', 'สำเร็จ', 'อัพเดทสถานะการแจ้งเตือนทั้งหมดแล้ว');
                await fetchNotifications();
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message)
            });
        }
    }, [fetchNotifications]);

    const verifyPayment = useCallback(async (paymentId: number, status: PaymentsStatus) => {
        try {
            const response = await api.put(`/api/admin/notifications/verify-payment/${paymentId}`, {
                status
            });
            if (response.data.success) {
                useShowToast('success', 'สำเร็จ', response.data.message);
                await fetchNotifications();
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message)
            });
        }
    }, [fetchNotifications]);

    const confirmBooking = useCallback(async (bookingId: number) => {
        try {
            const response = await api.put(`/api/admin/notifications/confirm-booking/${bookingId}`);
            if (response.data.success) {
                useShowToast('success', 'สำเร็จ', response.data.message);
                await fetchNotifications();
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message)
            });
        }
    }, [fetchNotifications]);

    return {
        notifications,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        verifyPayment,
        confirmBooking
    };
};