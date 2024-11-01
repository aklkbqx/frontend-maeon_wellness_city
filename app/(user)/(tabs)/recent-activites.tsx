import React, { useState, useCallback } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { View, TouchableOpacity, Badge, TabController } from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';
import tw from "twrnc";
import TextTheme from '@/components/TextTheme';
import { useStatusBar } from '@/hooks/useStatusBar';
import { useFetchMeContext } from '@/context/FetchMeContext';
import { router, Tabs, useFocusEffect } from 'expo-router';
import api from '@/helper/api';
import {
  formatDateThai,
  handleAxiosError,
  handleErrorMessage,
  formatDateRange
} from '@/helper/my-lib';
import { addCommas } from '@/helper/utiles';
import { Bookings, Payments } from '@/types/PrismaType';
import Loading from '@/components/Loading';
import * as Animatable from 'react-native-animatable';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Types and Interfaces
interface TabItem {
  label: string;
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  highlight?: boolean;
}

type BookingWithPayment = Bookings & { payment: Payments | null };

// Constants
const tabItems: TabItem[] = [
  {
    label: 'ที่ต้องดำเนินการ',
    key: 'PENDING',
    icon: 'time-outline'
  },
  {
    label: 'รายการทั้งหมด',
    key: 'ALL',
    icon: 'list-outline'
  }
];

// Utility Components
const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, highlight }) => (
  <View style={tw`flex-row gap-2`}>
    <Ionicons
      name={icon}
      size={18}
      color={highlight ? String(tw.color("blue-500")) : undefined}
    />
    <View style={tw`flex-1 flex-row gap-2`}>
      <TextTheme
        font="Prompt-Light"
        size="sm"
        color={highlight ? "blue-500" : undefined}
      >
        {label}:
      </TextTheme>
      <TextTheme
        numberOfLines={2}
        font={highlight ? "Prompt-Medium" : "Prompt-Light"}
        size="sm"
        color={highlight ? "blue-500" : undefined}
        style={tw`flex-row flex-wrap flex-1`}
      >
        {value}
      </TextTheme>
    </View>
  </View>
);

// Loading Skeleton Component
const BookingSkeletonLoader: React.FC = () => (
  <View style={tw`pt-2 px-2 mb-2`}>
    <Animatable.View
      animation="pulse"
      iterationCount="infinite"
      style={tw`p-4 border border-zinc-200 bg-white rounded-2xl shadow`}
    >
      <View style={tw`flex-row justify-between mb-4`}>
        <View style={tw`w-16 h-6 bg-slate-200 rounded-xl`} />
        <View style={tw`flex-row gap-2`}>
          <View style={tw`w-20 h-6 bg-slate-200 rounded-xl`} />
          <View style={tw`w-24 h-6 bg-slate-200 rounded-xl`} />
        </View>
      </View>
      <View style={tw`flex-col gap-3`}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={tw`flex-row items-center gap-2`}>
            <View style={tw`w-5 h-5 rounded-full bg-slate-200`} />
            <View style={tw`flex-1 h-4 bg-slate-200 rounded`} />
          </View>
        ))}
      </View>
      <View style={tw`h-12 bg-slate-200 rounded-xl mt-3`} />
    </Animatable.View>
  </View>
);

// Empty State Component
const NoBookings: React.FC = () => (
  <View style={tw`flex-1 justify-center items-center mt-20`}>
    <View style={tw`bg-slate-200 rounded-full p-4 mb-4`}>
      <Ionicons name="calendar-outline" size={50} style={tw`text-blue-500`} />
    </View>
    <View style={tw`items-center gap-1`}>
      <TextTheme font='Prompt-Medium' size='lg' style={tw`text-slate-600`}>
        ยังไม่มีรายการจอง
      </TextTheme>
      <TextTheme size='sm' style={tw`text-slate-500 text-center px-6`}>
        รายการจองของคุณจะแสดงที่นี่
      </TextTheme>
    </View>
  </View>
);

// Booking Status List Item Component
// Booking Status List Item Component
const BookingStatusListItem: React.FC<{
  booking: Bookings;
  payment: Payments | null;
  index: number;
}> = ({ booking, payment, index }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);


  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  // เช็คว่าถึงวันเดินทางหรือยัง
  const isTravelDate = () => {
    const today = new Date();
    const startDate = new Date(booking.start_date);
    return today >= startDate;
  };

  // เช็คว่าจ่ายเงินแล้วหรือยัง
  const isPaid = payment?.status === 'PAID';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-500';
      case 'CONFIRMED': return 'bg-green-500';
      case 'CANCELLED': return 'bg-red-500';
      case 'COMPLETED': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'รอดำเนินการ';
      case 'CONFIRMED': return 'ยืนยันแล้ว';
      case 'CANCELLED': return 'ยกเลิกแล้ว';
      case 'COMPLETED': return 'สำเร็จ';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-500';
      case 'PAID': return 'bg-green-500';
      case 'FAILED': return 'bg-red-500';
      case 'REFUNDED': return 'bg-orange-500';
      case 'PENDING_VERIFICATION': return 'bg-gray-500';
      case 'REJECTED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'รอชำระเงิน';
      case 'PAID': return 'ชำระแล้ว';
      case 'FAILED': return 'ล้มเหลว';
      case 'REFUNDED': return 'คืนเงินแล้ว';
      case 'PENDING_VERIFICATION': return 'กำลังตรวจสอบ';
      case 'REJECTED': return 'ถูกปฏิเสธ';
      default: return status;
    }
  };

  const navigateToMap = () => {
    router.navigate({ pathname: "/map", params: { bookingId: booking.id } });
  };

  const navigateToPayment = () => {
    router.navigate({ pathname: "/payments", params: { bookingId: booking.id } });
  };

  const navigateToReceipt = () => {
    router.navigate({ pathname: "/payments/success", params: { bookingId: booking.id } });
  };

  const handleCancel = () => {
    // TODO: Implement cancel booking logic
    console.log('Cancel booking:', booking.id);
  };

  const handleContact = () => {
    // TODO: Implement contact logic
    console.log('Contact support for booking:', booking.id);
  };

  return (
    <View style={tw`pt-2 px-2`}>
      <View style={[
        tw`bg-white rounded-2xl border border-zinc-200 shadow relative overflow-hidden`,
      ]}>
        {/* Main Content */}
        <View style={tw`p-4`}>
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <View style={tw`flex-row items-center gap-2`}>
              <Badge
                label={`#${index}`}
                size={20}
                labelStyle={{ fontFamily: "Prompt-Regular" }}
                backgroundColor={String(tw.color("blue-500"))}
              />
              <View style={tw`flex-row gap-2`}>
                <Badge
                  label={getStatusText(booking.status)}
                  labelStyle={{ fontFamily: "Prompt-Regular" }}
                  size={16}
                  backgroundColor={String(tw.color(getStatusColor(booking.status).replace('bg-', '')))}
                />
                {payment?.status && (
                  <Badge
                    label={getPaymentStatusText(payment.status)}
                    labelStyle={{ fontFamily: "Prompt-Regular" }}
                    size={16}
                    backgroundColor={String(tw.color(getPaymentStatusColor(payment.status).replace('bg-', '')))}
                  />
                )}
              </View>
            </View>
            {!isTravelDate() && (
              <TouchableOpacity
                style={tw`flex-row justify-center items-center bg-slate-100 w-10 h-10 rounded-full`}
                onPress={toggleExpand}
              >
                <Animatable.View
                  duration={300}
                  style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                >
                  <Ionicons name='chevron-down' size={25} style={tw`text-blue-500`} />
                </Animatable.View>
              </TouchableOpacity>
            )}
          </View>

          <View style={tw`flex-col gap-2`}>
            <InfoRow
              icon="calendar"
              label="จองวันที่"
              value={formatDateThai(String(booking.booking_date))}
            />
            <InfoRow
              icon="car"
              label="เริ่ม"
              value={formatDateRange(String(booking.start_date), String(booking.end_date))}
            />
            <InfoRow
              icon="people"
              label="จำนวน"
              value={`${booking.people} คน`}
            />
            <InfoRow
              icon="cash"
              label="ราคารวม"
              value={`${addCommas(booking.total_price)} บาท`}
              highlight
            />
          </View>

          {isTravelDate() && (
            <View style={tw`flex-col gap-2 w-full`}>
              <TouchableOpacity
                style={tw`flex-1 bg-blue-500 flex-row gap-2 justify-center items-center rounded-xl p-3
                  active:bg-blue-600`}
                onPress={navigateToMap}
              >
                <FontAwesome5 name="map-marker-alt" size={18} color="white" />
                <TextTheme color="white" size='sm' font="Prompt-Medium">แผนที่</TextTheme>
              </TouchableOpacity>
              <View style={tw`flex-row gap-2 mt-3`}>
                <TouchableOpacity
                  style={tw`flex-1 bg-green-500 flex-row gap-2 justify-center items-center rounded-xl p-3
                  active:bg-green-600`}
                  onPress={navigateToReceipt}
                >
                  <Ionicons name="receipt" size={18} color="white" />
                  <TextTheme color="white" size='sm' font="Prompt-Medium">ใบเสร็จ</TextTheme>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`flex-1 bg-amber-500 flex-row gap-2 justify-center items-center rounded-xl p-3
                  active:bg-amber-600`}
                  onPress={handleContact}
                >
                  <Ionicons name="chatbubble" size={18} color="white" />
                  <TextTheme color="white" size='sm' font="Prompt-Medium">ติดต่อ</TextTheme>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Collapsible Content */}
        {!isTravelDate() && isExpanded && (
          <View style={tw`bg-slate-50 border-t border-zinc-200 p-4`}>
            <View style={tw`flex-row gap-2`}>
              {!isPaid ? (
                <View style={tw`flex-col gap-2 w-full`}>
                  <TouchableOpacity
                    style={tw`flex-1 bg-blue-500 flex-row gap-2 justify-center items-center rounded-xl p-3
                      active:bg-blue-600`}
                    onPress={navigateToPayment}
                  >
                    <Ionicons name="card" size={18} color="white" />
                    <TextTheme color="white" size='sm' font="Prompt-Medium">จ่ายเงิน</TextTheme>
                  </TouchableOpacity>
                  <View style={tw`flex-row gap-2`}>
                    <TouchableOpacity
                      style={tw`flex-1 bg-red-500 flex-row gap-2 justify-center items-center rounded-xl p-3
                      active:bg-red-600`}
                      onPress={handleCancel}
                    >
                      <Ionicons name="close-circle" size={18} color="white" />
                      <TextTheme color="white" size='sm' font="Prompt-Medium">ยกเลิก</TextTheme>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={tw`flex-1 bg-amber-500 flex-row gap-2 justify-center items-center rounded-xl p-3
                      active:bg-amber-600`}
                      onPress={handleContact}
                    >
                      <Ionicons name="chatbubble" size={18} color="white" />
                      <TextTheme color="white" size='sm' font="Prompt-Medium">ติดต่อ</TextTheme>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={tw`flex-col gap-2 w-full`}>
                  <View style={tw`flex-row gap-2`}>
                    <TouchableOpacity
                      style={tw`flex-1 bg-blue-500 flex-row gap-2 justify-center items-center rounded-xl p-3
                      active:bg-blue-600`}
                      onPress={navigateToMap}
                    >
                      <FontAwesome5 name="map-marker-alt" size={18} color="white" />
                      <TextTheme color="white" size='sm' font="Prompt-Medium">แผนที่</TextTheme>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={tw`flex-1 bg-green-500 flex-row gap-2 justify-center items-center rounded-xl p-3
                      active:bg-green-600`}
                      onPress={navigateToReceipt}
                    >
                      <Ionicons name="receipt" size={18} color="white" />
                      <TextTheme color="white" size='sm' font="Prompt-Medium">ใบเสร็จ</TextTheme>
                    </TouchableOpacity>
                  </View>
                  <View style={tw`flex-row gap-2`}>
                    <TouchableOpacity
                      style={tw`flex-1 bg-red-500 flex-row gap-2 justify-center items-center rounded-xl p-3
                      active:bg-red-600`}
                      onPress={handleCancel}
                    >
                      <Ionicons name="close-circle" size={18} color="white" />
                      <TextTheme color="white" size='sm' font="Prompt-Medium">ยกเลิก</TextTheme>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={tw`flex-1 bg-amber-500 flex-row gap-2 justify-center items-center rounded-xl p-3
                      active:bg-amber-600`}
                      onPress={handleContact}
                    >
                      <Ionicons name="chatbubble" size={18} color="white" />
                      <TextTheme color="white" size='sm' font="Prompt-Medium">ติดต่อ</TextTheme>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

// Main Activity Component
const Activity: React.FC = () => {
  useStatusBar("dark-content");
  const { isLogin } = useFetchMeContext();
  const [bookingData, setBookingData] = useState<BookingWithPayment[] | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);

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
    setIsLoading(true);
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
    } finally {
      setIsLoading(false)
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setIsLoading(true);
    await fetchAllData();
    setRefreshing(false);
    setIsLoading(false)
  }, [fetchAllData]);

  useFocusEffect(useCallback(() => {
    if (isLogin) {
      fetchAllData();
    }
  }, [isLogin]))



  const renderPendingTab = (bookings: BookingWithPayment[]) => {
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED')
      .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());

    const pendingBookings = bookings.filter(b => b.status === 'PENDING')
      .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());

    if (confirmedBookings.length === 0 && pendingBookings.length === 0) {
      return <NoBookings />;
    }

    return (
      <>
        {confirmedBookings.length > 0 && (
          <View>
            <View style={tw`flex-row items-center gap-2 mt-4 mb-2 px-2`}>
              <FontAwesome5
                name="car"
                size={16}
                color={String(tw.color("green-500"))}
              />
              <TextTheme
                font='Prompt-Medium'
                size='lg'
                color="green-500"
              >
                กำลังเดินทาง
              </TextTheme>
            </View>
            {confirmedBookings.map((booking) => (
              <BookingStatusListItem
                key={booking.id}
                booking={booking}
                payment={booking.payment}
                index={booking.id}
              />
            ))}
          </View>
        )}

        {pendingBookings.length > 0 && (
          <View>
            <View style={tw`flex-row items-center gap-2 mt-4 mb-2 px-2`}>
              <Ionicons
                name="time-outline"
                size={20}
                color={String(tw.color("amber-500"))}
              />
              <TextTheme
                font='Prompt-Medium'
                size='lg'
                color="amber-500"
              >
                รอดำเนินการ
              </TextTheme>
            </View>
            {pendingBookings.map((booking) => (
              <BookingStatusListItem
                key={booking.id}
                booking={booking}
                payment={booking.payment}
                index={booking.id}
              />
            ))}
          </View>
        )}
        <View style={tw`pb-30`} />
      </>
    );
  };

  const renderAllTab = (bookings: BookingWithPayment[]) => {
    const statusOrder = ['CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'];

    if (bookings.length === 0) {
      return <NoBookings />;
    }

    return (
      <>
        {statusOrder.map(currentStatus => {
          let bookingsForStatus = bookings.filter(
            booking => booking.status === currentStatus
          );

          if (currentStatus === 'CONFIRMED') {
            bookingsForStatus = bookingsForStatus
              .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime())
              .sort((a, b) => ((a.payment?.status === 'PAID' ? 1 : 0) - (b.payment?.status === 'PAID' ? 1 : 0)));
          } else {
            bookingsForStatus = bookingsForStatus
              .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());
          }

          if (bookingsForStatus.length === 0) return null;

          return (
            <View key={currentStatus}>
              <View style={tw`flex-row items-center gap-2 mt-4 mb-2 px-2`}>
                {currentStatus === 'CONFIRMED' && (
                  <FontAwesome5
                    name="car"
                    size={16}
                    color={String(tw.color("green-500"))}
                  />
                )}
                {currentStatus === 'PENDING' && (
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={String(tw.color("amber-500"))}
                  />
                )}
                {currentStatus === 'COMPLETED' && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={String(tw.color("blue-500"))}
                  />
                )}
                {currentStatus === 'CANCELLED' && (
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={String(tw.color("red-500"))}
                  />
                )}
                <TextTheme
                  font='Prompt-Medium'
                  size='lg'
                  color={
                    currentStatus === 'CONFIRMED' ? "green-500" :
                      currentStatus === 'PENDING' ? "amber-500" :
                        currentStatus === 'COMPLETED' ? "blue-500" :
                          currentStatus === 'CANCELLED' ? "red-500" : undefined
                  }
                >
                  {currentStatus === 'CONFIRMED' && 'กำลังเดินทาง'}
                  {currentStatus === 'PENDING' && 'รอดำเนินการ'}
                  {currentStatus === 'COMPLETED' && 'สำเร็จ'}
                  {currentStatus === 'CANCELLED' && 'ยกเลิกแล้ว'}
                </TextTheme>
              </View>
              {bookingsForStatus.map((booking) => (
                <BookingStatusListItem
                  key={booking.id}
                  booking={booking}
                  payment={booking.payment}
                  index={booking.id}
                />
              ))}
            </View>
          );
        })}
        <View style={tw`pb-30`} />
      </>
    );
  };

  const renderBookings = (status: string) => {
    if (!bookingData) return null;

    const isBookingWithPayment = (booking: any): booking is BookingWithPayment => {
      return booking &&
        typeof booking === 'object' &&
        'id' in booking &&
        'status' in booking;
    };

    if (status === 'PENDING') {
      const relevantBookings = (bookingData ?? []).filter(booking =>
        isBookingWithPayment(booking) &&
        (booking.status === 'PENDING' || booking.status === 'CONFIRMED')
      );
      return renderPendingTab(relevantBookings);
    }

    const filteredBookings = (bookingData ?? []).filter(isBookingWithPayment);
    return renderAllTab(filteredBookings);
  };

  if (!isLogin) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-slate-100 mb-10`}>
        <View style={tw`flex-col gap-2`}>
          <TextTheme>ยังไม่มีสถานะการเดินทางของคุณ</TextTheme>
          <View style={tw`flex-row items-center gap-2`}>
            <TextTheme>กรุณาทำการ</TextTheme>
            <TouchableOpacity
              onPress={() => {
                router.navigate({
                  pathname: "/login",
                  params: { backToPage: "/recent-activites" }
                });
              }}
            >
              <TextTheme
                font='Prompt-SemiBold'
                color='blue-500'
                style={tw`underline`}
              >
                เข้าสู่ระบบ
              </TextTheme>
            </TouchableOpacity>
            <TextTheme>ของคุณ</TextTheme>
          </View>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-slate-100`}>
        <Loading loading={isLoading} style={tw`my-5`} />
        {[...Array(4)].map((_, i) => (
          <BookingSkeletonLoader key={i} />
        ))}
      </View>
    );
  }

  return (
    <>
      <Tabs.Screen
        options={{
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
        }}
      />
      <View style={tw`flex-1 bg-slate-100`}>
        <TabController
          asCarousel
          items={tabItems.map(item => ({
            label: item.label,
            leadingAccessory: (
              <>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={String(tw.color("blue-500"))}
                  style={tw`mr-2`}
                />
                {(bookingData ?? [])?.filter(b =>
                  item.key === 'ALL' ? true :
                    item.key === 'PENDING' ? (b.status === 'PENDING' || b.status === 'CONFIRMED') :
                      b.status === item.key
                ).length > 0 && (
                    <View style={tw`w-4 h-4 absolute top-1 right-6 bg-red-500 rounded-full flex-row items-center justify-center`}>
                      <TextTheme font='Prompt-Light' size='xs' color='white' style={tw`mt-0.5`}>
                        {(bookingData ?? []).filter(b =>
                          item.key === 'ALL' ? true :
                            item.key === 'PENDING' ? (b.status === 'PENDING' || b.status === 'CONFIRMED') :
                              b.status === item.key
                        ).length}
                      </TextTheme>
                    </View>
                  )}
              </>
            )
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
          <TabController.PageCarousel style={tw`mt-12`}>
            {tabItems.map((tab, index) => (
              <TabController.TabPage key={tab.key} index={index}>
                <View style={tw`flex-1`}>
                  <ScrollView
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[String(tw.color("blue-500"))]}
                        tintColor={String(tw.color("blue-500"))}
                      />
                    }
                  >
                    {renderBookings(tab.key)}
                  </ScrollView>
                </View>
              </TabController.TabPage>
            ))}
          </TabController.PageCarousel>
        </TabController>
      </View>
    </>
  );
};

export default Activity;