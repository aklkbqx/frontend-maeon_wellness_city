
import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import TextTheme from '@/components/TextTheme';
import { NotificationsType, NotificationsStatus, PaymentsStatus, Notifications } from '@/types/PrismaType';
import api from '@/helper/api';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import useShowToast from '@/hooks/useShowToast';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

// Types
interface NotificationData {
    bookingId?: number;
    paymentId?: number;
    userId?: number;
    status?: PaymentsStatus;
    amount?: number;
    redirectUrl?: string;
}

interface NotificationItemProps {
    notification: Notifications;
    onPress: () => void;
    onAction?: (action: string) => Promise<void>;
}

interface FilterTabProps {
    label: string;
    isActive: boolean;
    count: number;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
}

type TabType = 'all' | 'unread' | NotificationsType;

interface FilterTabsData {
    id: TabType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}

// Utility functions
const getNotificationTypeStyles = (type: NotificationsType) => {
    switch (type) {
        case 'PAYMENT':
            return {
                bgColor: 'bg-green-100',
                icon: 'cash-outline',
                iconColor: String(tw.color('green-500'))
            };
        case 'ORDER':
            return {
                bgColor: 'bg-blue-100',
                icon: 'cart-outline',
                iconColor: String(tw.color('blue-500'))
            };
        case 'STATUS_UPDATE':
            return {
                bgColor: 'bg-orange-100',
                icon: 'refresh-outline',
                iconColor: String(tw.color('orange-500'))
            };
        case 'SYSTEM':
            return {
                bgColor: 'bg-gray-100',
                icon: 'settings-outline',
                iconColor: String(tw.color('gray-500'))
            };
        case 'CHAT':
            return {
                bgColor: 'bg-purple-100',
                icon: 'chatbubble-outline',
                iconColor: String(tw.color('purple-500'))
            };
        case 'PROMOTION':
            return {
                bgColor: 'bg-yellow-100',
                icon: 'pricetag-outline',
                iconColor: String(tw.color('yellow-500'))
            };
        case 'ANNOUNCEMENT':
            return {
                bgColor: 'bg-red-100',
                icon: 'megaphone-outline',
                iconColor: String(tw.color('red-500'))
            };
        case 'REMINDER':
            return {
                bgColor: 'bg-indigo-100',
                icon: 'alarm-outline',
                iconColor: String(tw.color('indigo-500'))
            };
        default:
            return {
                bgColor: 'bg-gray-100',
                icon: 'notifications-outline',
                iconColor: String(tw.color('gray-500'))
            };
    }
};

// Components
const FilterTab: React.FC<FilterTabProps> = ({ label, isActive, count, icon, onPress }) => (
    <TouchableOpacity
        style={tw`
            px-4 py-2 rounded-xl
            ${isActive ? 'bg-indigo-100' : 'bg-white'}
            border border-gray-200
        `}
        onPress={onPress}
    >
        <View style={tw`flex-row items-center gap-2`}>
            <Ionicons
                name={icon}
                size={20}
                color={isActive ? tw.color('indigo-600') : tw.color('gray-500')}
            />
            <TextTheme
                style={tw`${isActive ? 'text-indigo-600' : 'text-gray-600'}`}
            >
                {label}
            </TextTheme>
            <View style={tw`
                px-2 py-0.5 rounded-full
                ${isActive ? 'bg-indigo-500' : 'bg-gray-200'}
            `}>
                <TextTheme
                    size="xs"
                    style={tw`${isActive ? 'text-white' : 'text-gray-600'}`}
                >
                    {count}
                </TextTheme>
            </View>
        </View>
    </TouchableOpacity>
);

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress, onAction }) => {
    const [isLoading, setIsLoading] = useState(false);
    const notificationData: NotificationData = notification.data ? JSON.parse(notification.data) : {};
    const styles = getNotificationTypeStyles(notification.type);

    const handleAction = async (action: string) => {
        if (onAction) {
            try {
                setIsLoading(true);
                await onAction(action);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const renderActionButtons = () => {
        if (isLoading) {
            return (
                <View style={tw`mt-2`}>
                    <ActivityIndicator color={tw.color('indigo-600')} />
                </View>
            );
        }

        switch (notification.type) {
            case 'PAYMENT':
                if (notificationData.status === 'PENDING_VERIFICATION') {
                    return (
                        <View style={tw`flex-row gap-2 mt-2`}>
                            <TouchableOpacity
                                style={tw`bg-green-500 px-3 py-2 rounded-lg flex-row items-center`}
                                onPress={() => handleAction('approve')}
                                disabled={isLoading}
                            >
                                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                                <TextTheme style={tw`text-white ml-1`}>ยืนยันการชำระเงิน</TextTheme>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={tw`bg-red-500 px-3 py-2 rounded-lg flex-row items-center`}
                                onPress={() => handleAction('reject')}
                                disabled={isLoading}
                            >
                                <Ionicons name="close-circle-outline" size={20} color="white" />
                                <TextTheme style={tw`text-white ml-1`}>ปฏิเสธ</TextTheme>
                            </TouchableOpacity>
                        </View>
                    );
                }
                return null;

            case 'ORDER':
                return (
                    <View style={tw`flex-row gap-2 mt-2`}>
                        <TouchableOpacity
                            style={tw`bg-indigo-500 px-3 py-2 rounded-lg flex-row items-center`}
                            onPress={() => handleAction('confirm_booking')}
                            disabled={isLoading}
                        >
                            <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                            <TextTheme style={tw`text-white ml-1`}>ยืนยันการจอง</TextTheme>
                        </TouchableOpacity>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <TouchableOpacity
            style={tw`bg-white p-4 rounded-xl shadow-sm border border-gray-100`}
            onPress={onPress}
        >
            <View style={tw`flex-row justify-between items-start`}>
                <View style={tw`flex-row items-center gap-3`}>
                    <View style={tw`
                        w-10 h-10 rounded-full 
                        ${styles.bgColor}
                        justify-center items-center
                    `}>
                        <Ionicons
                            name={styles.icon}
                            size={24}
                            color={styles.iconColor}
                        />
                    </View>
                    <View style={tw`flex-1`}>
                        <TextTheme font="Prompt-Medium" size="base">
                            {notification.title}
                        </TextTheme>
                        <TextTheme size="sm" style={tw`text-gray-500 mt-1`}>
                            {notification.body}
                        </TextTheme>
                        <TextTheme size="xs" style={tw`text-gray-400 mt-1`}>
                            {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: th
                            })}
                        </TextTheme>
                    </View>
                </View>
                <View style={tw`
                    w-3 h-3 rounded-full
                    ${notification.status === 'UNREAD' ? 'bg-red-500' :
                        notification.status === 'READ' ? 'bg-gray-300' : 'bg-green-500'}
                `} />
            </View>
            {renderActionButtons()}
        </TouchableOpacity>
    );
};

// Main Component
export default function NotificationsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [notifications, setNotifications] = useState<Notifications[]>([]);

    const filterTabs: FilterTabsData[] = [
        { id: 'all', label: 'ทั้งหมด', icon: 'notifications-outline' },
        { id: 'unread', label: 'ยังไม่อ่าน', icon: 'mail-unread-outline' },
        { id: 'PAYMENT', label: 'การชำระเงิน', icon: 'cash-outline' },
        { id: 'ORDER', label: 'คำสั่งซื้อ', icon: 'cart-outline' },
        { id: 'STATUS_UPDATE', label: 'อัพเดทสถานะ', icon: 'refresh-outline' },
        { id: 'SYSTEM', label: 'ระบบ', icon: 'settings-outline' }
    ];

    const fetchNotifications = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/notifications/admin');
            if (response.data.success) {
                setNotifications(response.data.notifications);
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message);
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleNotificationAction = async (notificationId: number, action: string) => {
        try {
            const notification = notifications.find(n => n.id === notificationId);
            if (!notification) return;

            const notificationData: NotificationData = notification.data ? JSON.parse(notification.data) : {};

            switch (action) {
                case 'approve':
                    if (notificationData.paymentId) {
                        await api.put(`/api/payments/${notificationData.paymentId}/verify`, {
                            status: 'PAID'
                        });
                        useShowToast('success', 'สำเร็จ', 'ยืนยันการชำระเงินเรียบร้อย');
                    }
                    break;

                case 'reject':
                    if (notificationData.paymentId) {
                        await api.put(`/api/payments/${notificationData.paymentId}/verify`, {
                            status: 'REJECTED'
                        });
                        useShowToast('success', 'สำเร็จ', 'ปฏิเสธการชำระเงินเรียบร้อย');
                    }
                    break;

                case 'confirm_booking':
                    if (notificationData.bookingId) {
                        await api.put(`/api/bookings/${notificationData.bookingId}/status`, {
                            status: 'CONFIRMED'
                        });
                        useShowToast('success', 'สำเร็จ', 'ยืนยันการจองเรียบร้อย');
                    }
                    break;
            }

            await fetchNotifications();

        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message);
            });
        }
    };

    const getFilteredNotifications = () => {
        switch (activeTab) {
            case 'unread':
                return notifications.filter(n => n.status === 'UNREAD');
            case 'all':
                return notifications;
            default:
                return notifications.filter(n => n.type === activeTab);
        }
    };

    const markAsRead = async (notificationId: number) => {
        try {
            await api.put(`/api/notifications/${notificationId}/read`);
            await fetchNotifications();
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message);
            });
        }
    };

    const computeTabCounts = () => {
        return filterTabs.map(tab => ({
            ...tab,
            count: tab.id === 'all'
                ? notifications.length
                : tab.id === 'unread'
                    ? notifications.filter(n => n.status === 'UNREAD').length
                    : notifications.filter(n => n.type === tab.id).length
        }));
    };

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            <Stack.Screen options={{
                headerTitle: "การแจ้งเตือน",
                headerTitleStyle: {
                    fontFamily: "Prompt-SemiBold",
                    fontSize: 18
                },
                headerShadowVisible: false
            }} />

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={tw`border-b border-gray-200 bg-white`}
                contentContainerStyle={tw`p-4`}
            >
                {computeTabCounts().map((tab) => (
                    <View key={tab.id} style={tw`mr-2`}>
                        <FilterTab
                            label={tab.label}
                            icon={tab.icon}
                            isActive={activeTab === tab.id}
                            count={tab.count}
                            onPress={() => setActiveTab(tab.id)}
                        />
                    </View>
                ))}
            </ScrollView>

            {/* Summary Section - แสดงสรุปจำนวนการแจ้งเตือนที่ต้องดำเนินการ */}
            <View style={tw`px-4 py-3 bg-white border-b border-gray-200`}>
                <View style={tw`flex-row justify-between items-center`}>
                    <View style={tw`flex-row items-center gap-2`}>
                        <View style={tw`w-2 h-2 rounded-full bg-red-500`} />
                        <TextTheme style={tw`text-gray-600`}>
                            รอดำเนินการ
                        </TextTheme>
                        <View style={tw`
                            px-2 py-0.5 rounded-full bg-red-50
                            border border-red-100
                        `}>
                            <TextTheme style={tw`text-red-600`}>
                                {notifications.filter(n => n.status === 'UNREAD').length}
                            </TextTheme>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={tw`flex-row items-center gap-1`}
                        onPress={() => {
                            // Implement mark all as read
                            notifications
                                .filter(n => n.status === 'UNREAD')
                                .forEach(n => markAsRead(n.id));
                        }}
                    >
                        <Ionicons
                            name="checkmark-done-outline"
                            size={20}
                            color={String(tw.color('indigo-600'))}
                        />
                        <TextTheme style={tw`text-indigo-600`}>
                            อ่านทั้งหมด
                        </TextTheme>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Notifications List */}
            <FlatList
                data={getFilteredNotifications()}
                renderItem={({ item }) => (
                    <NotificationItem
                        notification={item}
                        onPress={async () => {
                            if (item.status === 'UNREAD') {
                                await markAsRead(item.id);
                            }

                            // Handle navigation based on notification type
                            const data: NotificationData = item.data ? JSON.parse(item.data) : {};

                            switch (item.type) {
                                case 'PAYMENT':
                                    if (data.paymentId) {
                                        router.push(`/admin/payments/${data.paymentId}`);
                                    }
                                    break;

                                case 'ORDER':
                                    if (data.bookingId) {
                                        router.push(`/admin/bookings/${data.bookingId}`);
                                    }
                                    break;

                                case 'STATUS_UPDATE':
                                    if (data.redirectUrl) {
                                        router.push(data.redirectUrl);
                                    }
                                    break;

                                // Add more cases for other notification types
                                default:
                                    // For notifications without specific navigation
                                    break;
                            }
                        }}
                        onAction={(action) => handleNotificationAction(item.id, action)}
                    />
                )}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={tw`p-4`}
                ItemSeparatorComponent={() => <View style={tw`h-2`} />}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={fetchNotifications}
                        colors={[String(tw.color('indigo-600'))]}
                        tintColor={String(tw.color('indigo-600'))}
                    />
                }
                ListEmptyComponent={() => (
                    <View style={tw`flex-1 items-center justify-center py-8`}>
                        {isLoading ? (
                            <ActivityIndicator color={String(tw.color('indigo-600'))} />
                        ) : (
                            <>
                                <Ionicons
                                    name="notifications-off-outline"
                                    size={48}
                                    color={tw.color('gray-400')}
                                />
                                <TextTheme style={tw`text-gray-500 mt-2`}>
                                    {activeTab === 'unread'
                                        ? 'ไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน'
                                        : 'ไม่มีการแจ้งเตือน'}
                                </TextTheme>
                            </>
                        )}
                    </View>
                )}
            />
        </View>
    );
}

// Add translations for date-fns (optional)
// import { th } from 'date-fns/locale';
// import { formatDistanceToNow } from 'date-fns';

// const formatThaiDate = (date: Date) => {
//     return formatDistanceToNow(date, {
//         addSuffix: true,
//         locale: th
//     });
// };

// // Add loading indicator component (optional)
// import { ActivityIndicator } from 'react-native';

// // Add types for notification actions (optional)
// type NotificationActionType = 'approve' | 'reject' | 'confirm_booking';
// ```