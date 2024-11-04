import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, BackHandler } from 'react-native';
import { Dialog, Image, PanningProvider } from 'react-native-ui-lib';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TextTheme from '@/components/TextTheme';
import tw from 'twrnc';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { formatDateThai, handleAxiosError } from '@/helper/my-lib';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useShowToast from '@/hooks/useShowToast';
import api from '@/helper/api';
import { handleErrorMessage } from '@/helper/my-lib';
import { useStatusBar } from '@/hooks/useStatusBar';
import Loading from '@/components/Loading';
import { useFetchMeContext } from '@/context/FetchMeContext';

// Types & Interfaces
interface Activity {
  sequence: number;
  start_time: string;
  end_time: string;
  activity: string;
  description: string;
  location_id: number;
  location_name: string;
  location_type: string;
  cost?: number;
  included_in_total_price?: boolean;
  is_mandatory?: boolean;
  services?: string[];
}

interface DaySchedule {
  day: number;
  title?: string;
  activities: Activity[];
}

interface Program {
  id: number;
  type: number;
  program_category: 'SHORT' | 'LONG';
  name: string;
  description: string;
  schedules: DaySchedule[];
  total_price: number;
  duration_days: number;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  wellness_dimensions?: string[];
  images?: string[];
}

interface BookingDetail {
  program_id: number;
  date: string;
}

interface BookingItem {
  people: number;
  start_date: string;
  end_date: string;
  booking_detail: BookingDetail[];
}

interface DateItemProps {
  item: BookingDetail;
  index: number;
  onPress: () => void;
  onDetailsPress: (programId: number) => void;
  isLast: boolean;
  length: number;
  bookingData: BookingItem;
}

// Utility Components
const EmptyState: React.FC = () => (
  <View style={tw`mt-4 items-center`}>
    <TextTheme style={tw`text-center text-gray-500`}>
      ไม่มีข้อมูลการจองในขณะนี้
    </TextTheme>
  </View>
);

interface BookingButtonProps {
  enabled: boolean;
  onPress: () => void;
  bookingData: BookingItem;
  totalPrice: number;
}

interface BookingButtonProps {
  enabled: boolean;
  onPress: () => void;
  bookingData: BookingItem;
  totalPrice: number;
}

const BookingButton: React.FC<BookingButtonProps> = ({
  enabled,
  onPress,
  bookingData,
  totalPrice = 0
}) => {
  // Calculate final price based on number of people
  const finalPrice = totalPrice * (bookingData?.people || 1);

  return (
    <View style={tw`p-5 bg-white shadow-lg border-t border-gray-100`}>
      {/* Summary Container */}
      <View style={tw`mb-3 p-3 bg-gray-50 rounded-xl`}>
        {/* Date Range */}
        <View style={tw`flex-row items-center justify-between mb-2 gap-2`}>
          <TextTheme font="Prompt-Medium" size="sm" style={tw`text-gray-600`}>
            ระยะเวลา
          </TextTheme>
          <TextTheme font="Prompt-Regular" size="sm">
            {formatDateThai(bookingData?.start_date)} - {formatDateThai(bookingData?.end_date)}
          </TextTheme>
        </View>

        {/* Number of People */}
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <TextTheme font="Prompt-Medium" size="sm" style={tw`text-gray-600`}>
            จำนวนผู้เข้าร่วม (ราคาเพิ่มตามจำนวน)
          </TextTheme>
          <TextTheme font="Prompt-Regular" size="sm">
            {bookingData?.people || 0} คน
          </TextTheme>
        </View>

        {/* Total Price */}
        <View style={tw`flex-row items-center justify-between pt-2 border-t border-gray-200`}>
          <TextTheme font="Prompt-Medium" size="base" style={tw`text-gray-700`}>
            ยอดรวมทั้งหมด
          </TextTheme>
          <TextTheme font="Prompt-SemiBold" size="lg" style={tw`text-green-600`}>
            {finalPrice.toLocaleString()} บาท
          </TextTheme>
        </View>
      </View>

      {/* Book Button */}
      <TouchableOpacity
        style={tw`${enabled ? 'opacity-100' : 'opacity-50'}`}
        disabled={!enabled}
        onPress={onPress}
      >
        <LinearGradient
          style={tw`rounded-xl py-3.5 items-center`}
          colors={[String(tw.color("blue-500")), String(tw.color("blue-600"))]}
        >
          <TextTheme font="Prompt-SemiBold" size="lg" style={tw`text-white`}>
            ดำเนินการจอง
          </TextTheme>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const BlurredImage: React.FC<{
  image: number;
  blurAmount: number
}> = ({ image, blurAmount = 5 }) => (
  <View style={tw`relative`}>
    <Image source={image} style={tw`w-full h-full`} />
    <BlurView intensity={blurAmount} tint="regular" style={tw`absolute inset-0`} />
  </View>
);

const ProgramSelectMenu: React.FC<{
  onSelect: (programtypeId: number) => void
}> = ({ onSelect }) => {
  const programSelectMenu = [
    { image: require("@/assets/images/main-program.png"), text: "โปรแกรมการท่องเที่ยวหลัก", id: 1 },
    { image: require("@/assets/images/custom-program.png"), text: "เลือกการท่องเที่ยวด้วยตนเอง", id: 3 },
  ];

  return (
    <View style={tw`flex-col gap-5 justify-center items-center`}>
      {programSelectMenu.map(({ image, text, id }, index) => (
        <TouchableOpacity
          key={`menu-${index}`}
          style={tw`bg-slate-500 rounded-xl w-[214px] h-[175px] overflow-hidden relative`}
          onPress={() => onSelect(id)}
        >
          <BlurredImage image={image} blurAmount={5} />
          <View style={tw`absolute inset-0 bg-blue-600 bg-opacity-30 justify-center items-center`}>
            <TextTheme font='Prompt-SemiBold' color='white' size='xl' style={tw`text-center px-3`}>
              {text}
            </TextTheme>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const DateItem: React.FC<DateItemProps> = ({
  item,
  index,
  onPress,
  onDetailsPress,
  isLast,
  length,
  bookingData
}) => {
  const [programData, setProgramData] = useState<Program | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProgram = async () => {
    if (item.program_id) {
      setLoading(true);
      try {
        const response = await api.get(`/api/programs/${item.program_id}`);
        // console.log('Program response:', response.data);
        if (response.data.success && response.data.programs) {
          setProgramData(response.data.programs);
        }
      } catch (error) {
        console.error('Error fetching program:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProgram();
  }, [item.program_id]);

  if (loading) {
    return (
      <View style={tw`flex-row items-start mb-4`}>
        <View style={tw`w-8 h-8 rounded-full bg-blue-500 items-center justify-center mr-4`}>
          <TextTheme font="Prompt-SemiBold" size="lg" style={tw`text-white`}>
            {index + 1}
          </TextTheme>
        </View>
        {!isLast && (
          <View style={[tw`bg-blue-500 w-2 absolute left-3 opacity-50`, { height: 42, top: 30 }]} />
        )}
        <View style={tw`flex-1`}>
          <Animatable.View animation="pulse" easing="ease" iterationCount="infinite">
            <View style={tw`bg-white border border-gray-200 rounded-2xl p-3 mx-2`}>
              <Loading loading={true} />
            </View>
          </Animatable.View>
        </View>
      </View>
    );
  }

  return (
    <View style={tw`flex-row items-start mb-4`}>
      <View style={tw`w-8 h-8 rounded-full bg-blue-500 items-center justify-center mr-4 z-10`}>
        <TextTheme font="Prompt-SemiBold" size="lg" style={tw`text-white`}>
          {index + 1}
        </TextTheme>
      </View>
      {!isLast && (
        <View
          style={[
            tw`bg-blue-500 w-2 absolute left-3 opacity-50`,
            { height: programData ? 120 : 42, top: 30 }
          ]}
        />
      )}
      <View style={tw`flex-1`}>
        <Animatable.View animation={programData ? "" : "pulse"} easing="ease" iterationCount="infinite" duration={1500}>
          <TouchableOpacity
            onPress={onPress}
            style={tw`bg-white border ${programData ? "border-blue-400 mx-2" : 'border-gray-200 mx-2'} rounded-2xl p-3`}
          >
            <View style={tw`flex-row justify-between items-center`}>
              <TextTheme font="Prompt-SemiBold" size="lg" style={tw`text-black`}>
                {formatDateThai(item.date)}
              </TextTheme>

              {programData ? (
                <TextTheme font="Prompt-Medium" size="xs" style={tw`text-gray-600`}>
                  {programData.schedules[0].activities[0].start_time.slice(0, 5)} - {programData.schedules[0].activities[programData.schedules[0].activities.length - 1].end_time.slice(0, 5)}
                </TextTheme>
              ) : (
                <View style={tw`bg-yellow-100 px-2 py-1 rounded-full`}>
                  <TextTheme font='Prompt-Light' size='xs' style={tw`text-yellow-700`}>เลือกโปรแกรม</TextTheme>
                </View>
              )}
            </View>

            {item.program_id && programData && (
              <View style={tw`flex-col mt-2`}>
                <TextTheme font="Prompt-Regular" size="sm" style={tw`text-gray-500`}>
                  {programData.type === 1 ? 'โปรแกรมระยะสั้น' : 'โปรแกรมระยะยาว'}
                </TextTheme>
                <View style={tw`flex-row gap-2 justify-between items-center mt-2`}>
                  <View style={tw`flex-row gap-2`}>
                    <TouchableOpacity onPress={() => onDetailsPress(programData.id)} style={tw`flex-row justify-center`}>
                      <TextTheme font="Prompt-SemiBold" size="sm" style={tw`text-blue-500`}>
                        รายละเอียด
                      </TextTheme>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onPress} style={tw`flex-row justify-center`}>
                      <TextTheme font="Prompt-SemiBold" size="sm" style={tw`text-amber-500`}>
                        เปลี่ยน
                      </TextTheme>
                    </TouchableOpacity>
                  </View>
                  <TextTheme size='sm' font="Prompt-SemiBold" style={tw`text-green-600`}>
                    {programData.total_price.toLocaleString()} บาท
                  </TextTheme>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </View>
  );
};

const TravelItineraryScreen: React.FC = () => {
  useStatusBar("dark-content");
  const { dataForBooking } = useLocalSearchParams();
  const { isLogin } = useFetchMeContext();
  const [dialoglVisible, setDialoglVisible] = useState(false);
  const [dateSelected, setDateSelected] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [programsData, setProgramsData] = useState<Record<number, Program>>({});
  const [totalPrice, setTotalPrice] = useState(0);

  const [bookingData, setBookingData] = useState<BookingItem>(() => {
    try {
      const data = JSON.parse((dataForBooking as string) || '[]');
      // console.log('Initial booking data:', data); // Debug log
      return data;
    } catch (error) {
      console.error('Error parsing initial booking data:', error);
      handleErrorMessage('มีข้อผิดพลาดในการโหลดข้อมูล');
      return {
        people: 0,
        start_date: '',
        end_date: '',
        booking_detail: []
      };
    }
  });

  const handleBackPress = useCallback(() => {
    Alert.alert(
      "เตือน",
      "แน่ใจไหมที่จะย้อนกลับ การจัดเวลาการท่องเที่ยวทั้งหมดของคุณจะหายไป",
      [
        { text: "ยกเลิก" },
        {
          text: "ตกลง",
          onPress: async () => {
            await AsyncStorage.removeItem('lastTravelItinerary');
            router.back();
          }
        },
      ]
    );
    return true;
  }, []);

  useFocusEffect(
    useCallback(() => {
      BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      const restoreState = async () => {
        try {
          const lastItinerary = await AsyncStorage.getItem('lastTravelItinerary');
          if (lastItinerary) {
            const parsedData = JSON.parse(lastItinerary);
            // console.log('Restored booking data:', parsedData); // Debug log
            setBookingData(parsedData);
          }
        } catch (error) {
          console.error('Error restoring state:', error);
          handleErrorMessage('มีข้อผิดพลาดในการโหลดข้อมูล');
        }
      };

      restoreState();
      return () => BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    }, [handleBackPress])
  );

  const selectedTypeProgram = useCallback((programtypeId: number) => {
    setDialoglVisible(false);
    if (programtypeId === 1 || programtypeId === 2) {
      router.navigate({
        pathname: '/user/main-program',
        params: {
          bookingData: JSON.stringify(bookingData),
          dateSelected
        },
      });
    } else if (programtypeId === 3) {
      router.navigate({
        pathname: '/user/custom-program/category',
        params: {
          bookingData: JSON.stringify(bookingData),
          dateSelected
        },
      });
    } else {
      handleErrorMessage('ไม่รู้จักประเภทของโปรแกรม');
    }
  }, [bookingData, dateSelected]);

  const handleProceedBooking = async () => {
    setLoading(true);
    try {
      if (!isLogin) {
        await AsyncStorage.setItem('lastTravelItinerary', JSON.stringify(bookingData));
        router.navigate({
          pathname: '/auth/login',
          params: {
            backToPage: "/user/travel-schedules"
          }
        });
        useShowToast("info", "คำแนะนำ", "กรุณาเข้าสู่ระบบก่อนทำการจอง");
        return;
      }

      const response = await api.post("/api/bookings/start-booking", bookingData);
      if (response.data.success) {
        if (await AsyncStorage.getItem('lastTravelItinerary')) {
          await AsyncStorage.removeItem('lastTravelItinerary');
          router.navigate({
            pathname: '/user/payments',
            params: {
              bookingId: response.data.booking_id
            }
          });
        }
      }
    } catch (error) {
      console.error('Booking error:', error);
      handleErrorMessage("ไม่สามารถดำเนินการจองได้ในขณะนี้ โปรดลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleProgramDetail = useCallback((programId: number) => {
    router.push({
      pathname: '/main-program/details',
      params: {
        programId: programId.toString(),
        bookingData: JSON.stringify(bookingData),
        preview: '1'
      }
    });
  }, [bookingData]);

  useEffect(() => {
    if (!dialoglVisible) {
      setDateSelected("");
    }
  }, [dialoglVisible]);

  useEffect(() => {
    const loadBookingData = async () => {
      try {
        if (dataForBooking) {
          const parsedData = JSON.parse(dataForBooking as string);
          // console.log('Loading new booking data:', parsedData); // Debug log
          setBookingData(parsedData);
          await AsyncStorage.setItem('lastTravelItinerary', dataForBooking as string);
        }
      } catch (error) {
        console.error('Error loading booking data:', error);
        handleErrorMessage('มีข้อผิดพลาดในการโหลดข้อมูล');
      }
    };

    loadBookingData();
  }, [dataForBooking]);

  const handleProgramSelection = useCallback((date: string) => {
    setDateSelected(date);
    setDialoglVisible(true);
  }, []);


  useEffect(() => {
    const calculateTotalPrice = async () => {
      let total = 0;
      for (const detail of bookingData.booking_detail) {
        if (detail.program_id) {
          try {
            // ถ้ายังไม่มีข้อมูลโปรแกรมใน state ให้ดึงข้อมูลใหม่
            if (!programsData[detail.program_id]) {
              const response = await api.get(`/api/programs/${detail.program_id}`);
              if (response.data.success && response.data.programs) {
                setProgramsData(prev => ({
                  ...prev,
                  [detail.program_id]: response.data.programs
                }));
                total += response.data.programs.total_price;
              }
            } else {
              // ถ้ามีข้อมูลแล้วให้ใช้จาก state
              total += programsData[detail.program_id].total_price;
            }
          } catch (error) {
            console.error('Error fetching program:', error);
          }
        }
      }
      setTotalPrice(total);
    };

    calculateTotalPrice();
  }, [bookingData.booking_detail, programsData]);

  return (
    <View style={tw`flex-1 relative bg-gray-50`}>
      {loading && <Loading loading={loading} type='full' />}

      <ScrollView style={tw`flex-1 px-4`}>
        <View style={tw`mb-6 mt-5 relative`}>
          {bookingData.booking_detail?.length > 0 ? (
            bookingData.booking_detail.map((item, index) => (
              <DateItem
                key={`${item.date}-${index}`}
                item={item}
                index={index}
                onPress={() => handleProgramSelection(item.date)}
                onDetailsPress={handleProgramDetail}
                isLast={index === bookingData.booking_detail.length - 1}
                length={bookingData.booking_detail.length}
                bookingData={bookingData}
              />
            ))
          ) : (
            <EmptyState />
          )}
        </View>
      </ScrollView>

      <BookingButton
        enabled={bookingData.booking_detail?.every(date => date.program_id)}
        onPress={handleProceedBooking}
        bookingData={bookingData}
        totalPrice={totalPrice}
      />

      {/* <View style={tw`p-4 mb-2`}>
        <TouchableOpacity
          style={tw`${bookingData.booking_detail?.every(date => date.program_id) ? 'opacity-100' : 'opacity-50'}`}
          disabled={!bookingData.booking_detail?.every(date => date.program_id)}
          onPress={handleProceedBooking}
        >
          <LinearGradient
            style={tw`rounded-2xl py-3 items-center`}
            colors={[String(tw.color("blue-400")), String(tw.color("blue-500"))]}
          >
            <TextTheme font="Prompt-SemiBold" size="lg" style={tw`text-white`}>
              ดำเนินการจอง
            </TextTheme>
          </LinearGradient>
        </TouchableOpacity>
      </View> */}

      <Dialog
        visible={dialoglVisible}
        panDirection={PanningProvider.Directions.DOWN}
        onDismiss={() => setDialoglVisible(false)}
        overlayBackgroundColor="rgba(0, 0, 0, 0.5)"
      >
        <View style={tw`rounded-2xl overflow-hidden`}>
          <View style={tw`border-b border-zinc-200 p-4 bg-white`}>
            <View style={tw`flex-row items-center justify-between`}>
              <Ionicons name="close" size={30} color={tw.color('blue-500/0')} style={tw`opacity-0`} />
              <TextTheme font="Prompt-SemiBold" size="xl">
                เลือกรูปแบบท่องเที่ยว
              </TextTheme>
              <TouchableOpacity onPress={() => setDialoglVisible(false)}>
                <Ionicons name="close" size={30} color={tw.color('blue-500')} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={tw`p-5 bg-slate-50`}>
            <ProgramSelectMenu onSelect={selectedTypeProgram} />
          </View>
        </View>
      </Dialog>
    </View>
  );
};

export default TravelItineraryScreen;