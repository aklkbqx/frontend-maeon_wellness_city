import React, { useCallback, useEffect, useState } from 'react'
import { router, Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import tw from "twrnc"
import { TabBarProvider, tabbarStyle, useTabBar } from '@/context/TabBarContext'
import useShowToast from '@/hooks/useShowToast'
import { useFetchMeContext } from '@/context/FetchMeContext'
import * as Animatable from 'react-native-animatable';
import { TouchableOpacity, View } from 'react-native-ui-lib'
import TextTheme from '@/components/TextTheme'
import { NotificationResponse, notifications } from '@/types/notifications'
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib'
import api from '@/helper/api'
import { Bookings, Payments } from '@/types/PrismaType'

type BookingWithPayment = Bookings & { payment: Payments | null };

const TabNavigator = () => {
  const { tabBarStyle } = useTabBar();
  const { isLogin } = useFetchMeContext();
  const [notifications, setNotifications] = useState<notifications[]>([]);
  const [bookingData, setBookingData] = useState<BookingWithPayment[] | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isLogin) return;
    try {
      const response = await api.get<NotificationResponse>('/api/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      handleAxiosError(error, handleErrorMessage);
    }
  }, [isLogin]);

  const fetchBookingData = async (): Promise<Bookings[] | null> => {
    try {
      const response = await api.get("/api/bookings");
      if (response.data.success && response.data.bookings) {
        return response.data.bookings;
      }
      return null;
    } catch (error) {
      handleAxiosError(error, (message) => {
        handleErrorMessage(message);
      });
      return null;
    }
  };

  const fetchPaymentData = async (bookingId: number): Promise<Payments | null> => {
    try {
      const response = await api.get(`/api/payments/${bookingId}`);
      if (response.data.success && response.data.payments) {
        return response.data.payments;
      }
      return null;
    } catch (error) {
      handleAxiosError(error, (message) => {
        handleErrorMessage(message);
      });
      return null;
    }
  };

  const fetchAllData = useCallback(async () => {
    try {
      const bookings = await fetchBookingData();
      if (bookings) {
        const bookingsWithPayments = await Promise.all(
          bookings.map(async (booking) => {
            const payment = await fetchPaymentData(booking.id);
            return { ...booking, payment };
          })
        );
        setBookingData(bookingsWithPayments);
      } else {
        setBookingData([]);
      }
    } catch (error) {
      handleAxiosError(error, (message) => {
        handleErrorMessage(message);
      });
      setBookingData([]);
    }
  }, []);

  useEffect(() => {
    if (isLogin) {
      fetchAllData();
      fetchNotifications();
    }
  }, [isLogin])

  return (
    <>
      <Tabs screenOptions={{
        tabBarLabelStyle: { fontFamily: "Prompt-Regular" },
        tabBarStyle: tabBarStyle,
        tabBarActiveTintColor: String(tw.color("blue-500")),
        tabBarInactiveTintColor: String(tw.color("blue-400")),
        tabBarActiveBackgroundColor: `${tw`text-blue-50`.color}`,
        tabBarItemStyle: tw`rounded-[5] m-[7px]`,
        headerShadowVisible: true,
      }}
        safeAreaInsets={{ bottom: 0, left: 0, right: 0, top: 0 }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            headerShown: false,
            title: 'หน้าแรก',
            tabBarIcon: ({ color, focused }) => <Ionicons size={24} name={focused ? 'home' : 'home-outline'} color={color} />,
          }}
        />
        <Tabs.Screen
          name="recent-activites"
          options={{
            headerShown: true,
            headerTitle: "รายการล่าสุดของฉัน",
            title: 'รายการล่าสุด',
            tabBarIcon: ({ color, focused }) => (
              <View style={tw`relative`}>
                {bookingData &&
                  bookingData.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED').length > 0 && (
                    <View style={tw`w-5 h-5 bg-red-500 rounded-full items-center justify-center absolute z-9 top-[-2] right-[-2]`}>
                      <TextTheme size='xs' color='white' style={tw`mt-0.5`}>
                        {bookingData.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED').length}
                      </TextTheme>
                    </View>
                  )}
                <Ionicons
                  size={24}
                  name={focused ? 'calendar' : 'calendar-outline'}
                  color={color}
                />
              </View>
            ),
            headerTitleStyle: [tw`text-black text-xl`, { fontFamily: "Prompt-SemiBold" }],
            headerTitleAlign: "center",
            headerStyle: [tw`android:h-20 ios:h-24 bg-white android:border-b android:border-zinc-200`],
            headerShadowVisible: false
          }}
          listeners={{
            tabPress: async (e) => {
              if (!isLogin) {
                e.preventDefault();
                router.navigate({ pathname: "/login", params: { backToPage: "/recent-activites" } })
                useShowToast("info", "", "กรุณาทำการเข้าสู่ระบบก่อน!");
              }
            }
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            headerShown: true,
            headerTitle: "แจ้งเตือนของฉัน",
            title: 'แจ้งเตือน',
            headerTitleStyle: [tw`text-black text-xl`, { fontFamily: "Prompt-SemiBold" }],
            headerTitleAlign: "left",
            headerStyle: [tw`android:h-20 ios:h-24 bg-white android:border-b android:border-zinc-200`],
            headerShadowVisible: false,
            // headerRight: () => (
            //   <Animatable.View style={tw`relative mr-5`} animation={"pulse"} iterationCount={"infinite"}>
            //     <View style={tw`w-5 h-5 bg-red-500 rounded-full items-center justify-center absolute z-9 top-[-2] right-[-2]`}>
            //       <TextTheme size='xs' color='white' style={tw`mt-0.5`}>5</TextTheme>
            //     </View>
            //     <TouchableOpacity style={tw`bg-slate-200 rounded-full p-2`}>
            //       <Ionicons name='chatbubble' color={String(tw.color("blue-500"))} size={20} />
            //     </TouchableOpacity>
            //   </Animatable.View>
            // ),
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
          }}
          listeners={{
            tabPress: async (e) => {
              if (!isLogin) {
                e.preventDefault();
                router.navigate({ pathname: "/login", params: { backToPage: "/notifications" } })
                useShowToast("info", "", "กรุณาทำการเข้าสู่ระบบก่อน!");
              }
            }
          }}
        />
        <Tabs.Screen
          name="my-account"
          options={{
            headerShown: true,
            headerTitle: "จัดการบัญชี",
            title: 'บัญชี',
            tabBarIcon: ({ color, focused }) => <Ionicons size={24} name={focused ? 'person' : 'person-outline'} color={color} />,
            headerTitleStyle: [tw`text-black text-xl`, { fontFamily: "Prompt-SemiBold" }],
            headerTitleAlign: "center",
            headerStyle: [tw`android:h-20 ios:h-24 bg-white android:border-b android:border-zinc-200`],
            headerShadowVisible: false
          }}
        />
      </Tabs>
    </>
  )
}

const RootHome = () => {
  return (
    <TabBarProvider defaultStyle={tabbarStyle}>
      <TabNavigator />
    </TabBarProvider>
  );
};

export default RootHome
