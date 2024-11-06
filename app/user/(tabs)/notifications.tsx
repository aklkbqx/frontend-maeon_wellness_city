import React, { useState, useCallback, useEffect } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { View, Colors, Drawer, TouchableOpacity, Badge, TabController } from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';
import tw from "twrnc";
import TextTheme from '@/components/TextTheme';
import { useStatusBar } from '@/hooks/useStatusBar';
import { useFetchMeContext } from '@/context/FetchMeContext';
import { router, Tabs, useFocusEffect } from 'expo-router';
import api from '@/helper/api';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import {
  notifications,
  notifications_type,
  notifications_status,
  NotificationResponse,
  NotificationActionResponse
} from '@/types/notifications';
import {
  getNotificationTypeLabel,
  getNotificationColor,
  formatNotificationTimestamp,
  getNotificationIcon
} from '@/helper/utiles';
import Loading from '@/components/Loading';
import { isNull } from 'lodash';
import * as Animatable from 'react-native-animatable';

const tabItems = [
  {
    label: 'ที่ยังไม่ได้อ่าน',
    key: 'UNREAD',
    icon: 'notifications'
  },
  {
    label: 'อ่านแล้ว',
    key: 'READ',
    icon: 'checkmark-circle'
  }
];

const NotificationItem: React.FC<{
  item: notifications;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
}> = ({ item, onRead, onDelete }) => {
  const data = JSON.parse(String(item.data));
  const pressNotification = () => {
    if (!isNull(data)) {
      router.navigate(data.link);
      onRead(item.id)
    }
  }
  return (
    <>
      <View style={tw`pt-2 px-2`}>
        <Drawer
          rightItems={[{
            text: 'ลบ',
            background: String(tw.color("red-500")),
            onPress: () => onDelete(item.id),
          }]}
          leftItem={item.status === notifications_status.UNREAD ? {
            text: 'อ่านแล้ว',
            background: String(tw.color(getNotificationColor(item.type).replace('bg-', ''))),
            onPress: () => onRead(item.id)
          } : undefined}
          style={tw`rounded-2xl border border-zinc-200 shadow bg-white relative`}
        >
          <TouchableOpacity
            style={[
              tw`p-4 bg-white`,
              item.status === notifications_status.READ && tw`bg-zinc-100`
            ]}
            onPress={pressNotification}
            disabled={!data}
          >
            <View style={tw`flex-row gap-2 items-center`}>
              <View style={tw`${getNotificationColor(item.type)} p-2 rounded-full`}>
                <Ionicons
                  name={getNotificationIcon(item.type)}
                  size={24}
                  color="white"
                />
              </View>
              <View style={tw`flex-1`}>
                <View style={tw`flex-row items-center justify-between`}>
                  <Badge
                    labelStyle={{ fontFamily: "Prompt-Regular" }}
                    label={getNotificationTypeLabel(item.type)}
                    size={16}
                    backgroundColor={String(tw.color(getNotificationColor(item.type).replace('bg-', '')))}
                  />
                  {item.status === notifications_status.READ && (
                    <Badge label='อ่านแล้ว' size={16} backgroundColor={Colors.green30} labelStyle={{ fontFamily: "Prompt-Regular" }} />
                  )}
                </View>
                <TextTheme font='Prompt-Medium'>{item.title}</TextTheme>
                <TextTheme font='Prompt-Light' size='sm' numberOfLines={2}>{item.body}</TextTheme>
                <TextTheme font='Prompt-Light' size='xs' style={tw`text-gray-500 mt-1`}>
                  {formatNotificationTimestamp(item.created_at)}
                </TextTheme>
              </View>
            </View>
          </TouchableOpacity>
        </Drawer>
      </View >
    </>
  );
};

const NotificationSkeletonLoader = () => (
  <View style={tw`pt-2 px-2 mb-1`}>
    <Animatable.View
      animation="pulse"
      iterationCount="infinite"
      style={tw`p-4 border border-zinc-200 bg-white rounded-2xl shadow`}
    >
      <View style={tw`flex-row gap-4 items-center`}>
        <View style={tw`w-15 h-15 bg-slate-200 rounded-full`} />
        <View style={tw`flex-1`}>
          <View style={tw`flex-row justify-between mb-4`}>
            <View style={tw`w-15 h-5 bg-slate-200 rounded-xl`} />
            <View style={tw`w-15 h-5 bg-slate-200 rounded-xl`} />
          </View>
          <View style={tw`flex-col gap-2`}>
            <View style={tw`h-4 bg-slate-200 rounded w-50`} />
            <View style={tw`h-4 bg-slate-200 rounded w-30`} />
            <View style={tw`h-4 bg-slate-200 rounded w-20`} />
          </View>
        </View>
      </View>
    </Animatable.View>
  </View>
);


const NoNotifications = () => (
  <View style={tw`flex-1 justify-center mt-20 items-center`}>
    <View style={tw`bg-slate-200 rounded-full p-4 mb-4`}>
      <Ionicons name="notifications-off-outline" size={50} style={tw`text-blue-500`} />
    </View>
    <View style={tw`items-center gap-1`}>
      <TextTheme font='Prompt-Medium' size='lg' style={tw`text-slate-600`}>
        คุณยังไม่มีการแจ้งเตือน
      </TextTheme>
      <TextTheme size='sm' style={tw`text-slate-500 text-center px-6`}>
        การแจ้งเตือนของคุณจะแสดงที่นี่
      </TextTheme>
    </View>
  </View>
);

const renderNotifications = (
  notifications: notifications[],
  readStatus: 'READ' | 'UNREAD',
  onRead: (id: number) => void,
  onDelete: (id: number) => void
) => {
  if (!notifications || notifications.length === 0) {
    return <NoNotifications />;
  }

  // กรองการแจ้งเตือนตามสถานะการอ่าน
  const filteredNotifications = notifications.filter(item => item.status === readStatus);

  if (filteredNotifications.length === 0) {
    return (
      <View style={tw`flex-1 justify-center items-center mt-20`}>
        <View style={tw`bg-slate-200 rounded-full p-4 mb-4`}>
          <Ionicons
            name={readStatus === 'UNREAD' ? "notifications" : "checkmark-circle"}
            size={50}
            style={tw`text-blue-500`}
          />
        </View>
        <TextTheme font='Prompt-Medium' size='lg' style={tw`text-slate-600`}>
          {readStatus === 'UNREAD'
            ? 'ไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน'
            : 'ไม่มีการแจ้งเตือนที่อ่านแล้ว'
          }
        </TextTheme>
      </View>
    );
  }

  const typeOrder = [
    notifications_type.SYSTEM,
    notifications_type.PAYMENT,
    notifications_type.STATUS_UPDATE,
    notifications_type.ANNOUNCEMENT,
    notifications_type.CHAT,
    notifications_type.ORDER,
    notifications_type.PROMOTION,
    notifications_type.REMINDER
  ];

  // หาการแจ้งเตือนล่าสุดของแต่ละประเภท
  const getLatestTimestamp = (notifications: notifications[], type: notifications_type) => {
    const typeNotifications = notifications.filter(n => n.type === type);
    if (typeNotifications.length === 0) return 0;

    return Math.max(...typeNotifications.map(n => {
      if (readStatus === 'UNREAD') {
        return new Date(n.created_at).getTime();
      }
      return n.updated_at ?
        new Date(n.updated_at).getTime() :
        new Date(n.created_at).getTime();
    }));
  };

  // เรียงประเภทตามเวลาล่าสุดของแต่ละประเภท
  const sortedTypes = [...typeOrder].sort((a, b) => {
    const latestA = getLatestTimestamp(filteredNotifications, a);
    const latestB = getLatestTimestamp(filteredNotifications, b);
    return latestB - latestA;
  }).filter(type =>
    filteredNotifications.some(notification => notification.type === type)
  );

  // เรียงการแจ้งเตือนในแต่ละประเภทตามเวลา
  const sortNotifications = (notifications: notifications[]) => {
    return [...notifications].sort((a, b) => {
      if (readStatus === 'UNREAD') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      const timeA = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime();
      const timeB = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime();
      return timeB - timeA;
    });
  };

  return (
    <>
      {sortedTypes.map(currentType => {
        const notificationsForType = filteredNotifications.filter(
          notification => notification.type === currentType
        );

        if (notificationsForType.length === 0) return null;

        // เรียงการแจ้งเตือนในแต่ละประเภทตามเวลา
        const sortedNotifications = sortNotifications(notificationsForType);

        return (
          <View key={currentType}>
            <TextTheme font='Prompt-Medium' size='lg' style={tw`mt-2 px-2`}>
              {getNotificationTypeLabel(currentType)}
            </TextTheme>
            {sortedNotifications.map((notification, index) => (
              <NotificationItem
                key={`keyNotificationItem-${index}`}
                item={notification}
                onRead={onRead}
                onDelete={onDelete}
              />
            ))}
          </View>
        );
      })}
      <View style={tw`pb-30`} />
    </>
  );
};

const Notifications: React.FC = () => {
  useStatusBar("dark-content");
  const { isLogin } = useFetchMeContext();
  const [notifications, setNotifications] = useState<notifications[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [isShowChat, setIsShowChat] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    if (!isLogin) return;

    setIsLoading(true);
    try {
      const response = await api.get<NotificationResponse>('/api/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      handleAxiosError(error, (message) => {
        handleErrorMessage(message)
      })
    } finally {
      setIsLoading(false);
    }
  }, [isLogin]);

  useFocusEffect(useCallback(() => {
    if (isLogin) {
      fetchNotifications();
    }
  }, [isLogin]))

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const response = await api.put<NotificationActionResponse>(`/api/notifications/${id}/read`);
      if (response.data.success) {
        setNotifications(prev =>
          prev.map(item =>
            item.id === id ? { ...item, status: notifications_status.READ } : item
          )
        );
      }
    } catch (error) {
      handleAxiosError(error, (message) => {
        handleErrorMessage(message)
    })
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await api.delete(`/api/notifications/${id}`);
      if (response.data.success) {
        setNotifications(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      handleAxiosError(error, (message) => {
        handleErrorMessage(message)
    })
    }
  };


  if (!isLogin) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <TextTheme>กรุณาเข้าสู่ระบบเพื่อดูการแจ้งเตือน</TextTheme>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-gray-50`}>
        <Loading loading={isLoading} style={tw`my-5`} />
        {[...Array(4)].map((_, i) => (
          <NotificationSkeletonLoader key={i} />
        ))}
      </View>
    );
  }


  return (
    <>
      <Tabs.Screen options={{
        headerRight: () => (
          <Animatable.View style={tw`relative mr-5`} animation={"pulse"} iterationCount={"infinite"}>
            <View style={tw`w-5 h-5 bg-red-500 rounded-full items-center justify-center absolute z-9 top-[-2] right-[-2]`}>
              <TextTheme size='xs' color='white' style={tw`mt-0.5`}>5</TextTheme>
            </View>
            <TouchableOpacity style={tw`bg-slate-200 rounded-full p-2`}>
              <Ionicons name='chatbubble' color={String(tw.color("blue-500"))} size={20} />
            </TouchableOpacity>
          </Animatable.View>
        ),
        tabBarIcon: ({ color, focused }) => (
          <View style={tw`relative`}>
            {notifications.filter(val => val.status === "UNREAD").length > 0 ?
              <View style={tw`w-5 h-5 bg-red-500 rounded-full items-center justify-center absolute z-9 top-[-2] right-[-2]`}>
                <TextTheme size='xs' color='white' style={tw`mt-0.5`}>{notifications.filter(val => val.status === "UNREAD").length}</TextTheme>
              </View>
              : null}
            <Ionicons size={24} name={focused ? 'notifications' : 'notifications-outline'} color={color} />
          </View>
        ),
      }} />
      <View style={tw`flex-1 bg-gray-50`}>
        <TabController
          asCarousel
          items={tabItems.map(item => ({
            label: `${item.label}`,
            leadingAccessory: notifications.filter(n => n.status === item.key).length > 0 ?
              (<>
                <Ionicons
                  name={item.key === 'UNREAD' ? 'notifications' : 'mail-open'}
                  size={20}
                  color={String(tw.color("blue-500"))}
                  style={tw`mr-2`}
                />
                <View style={tw`w-4 h-4 absolute top-1 right-8 bg-red-500 rounded-full flex-row items-center justify-center`}>
                  <TextTheme font='Prompt-Light' size='xs' color='white' style={tw`ml-0.2 mt-0.4`}>{notifications.filter(n => n.status === item.key).length}</TextTheme>
                </View>
              </>) : <></>
          }))}
          initialIndex={selectedTab}
          onChangeIndex={setSelectedTab}
        >
          <TabController.TabBar
            containerStyle={tw`absolute`}
            labelStyle={{ fontFamily: "Prompt-Regular" }}
            selectedLabelStyle={{ fontFamily: "Prompt-Regular" }}
            selectedLabelColor={String(tw.color("blue-500"))}
            selectedIconColor={String(tw.color("blue-500"))}
            iconColor={String(tw.color("blue-500"))}
            indicatorStyle={tw`bg-blue-500 h-0.5 rounded-full`}
          />
          <TabController.PageCarousel style={tw`mt-12`} scrollEnabled={false}>
            {tabItems.map((tab, index) => (
              <TabController.TabPage key={tab.key} index={index}>
                <ScrollView
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
                      colors={[String(tw.color("blue-500"))]}
                      tintColor={String(tw.color("blue-500"))}
                    />
                  }
                >
                  {renderNotifications(
                    notifications,
                    tab.key as 'READ' | 'UNREAD',
                    handleMarkAsRead,
                    handleDelete
                  )}
                  <View style={tw`pb-30`} />
                </ScrollView>
              </TabController.TabPage>
            ))}
          </TabController.PageCarousel>
        </TabController>
      </View>
    </>
  );
};

export default Notifications;