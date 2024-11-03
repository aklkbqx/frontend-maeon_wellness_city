import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Share, Platform, ScrollView, View } from 'react-native';
import { TouchableOpacity } from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import tw from 'twrnc';
import { formatDateThai, handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import { addCommas } from '@/helper/utiles';
import TextTheme from '@/components/TextTheme';
import Loading from '@/components/Loading';
import api from '@/helper/api';
import { Payments, Users } from '@/types/PrismaType';
import { useFetchMeContext } from '@/context/FetchMeContext';
import { useStatusBar } from '@/hooks/useStatusBar';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import useShowToast from '@/hooks/useShowToast';
import * as FileSystem from 'expo-file-system';

// TODO ทำ Deep Link

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

interface BookingPrograms {
  program_id: number;
  program_name: string;
  schedules: string
}

interface BookingItem {
  id: number;
  user_id: number;
  booking_date: string;
  start_date: string;
  end_date: string;
  people: number;
  total_price: string;
  status: string;
  payment_status: string;
  booking_details: BookingPrograms[]
}

const PaymentHeader = () => (
  <View style={tw`bg-emerald-500 pt-16 pb-12 px-6 rounded-b-3xl`}>
    <View style={tw`items-center`}>
      <View style={tw`w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-4`}>
        <Ionicons name="checkmark" size={50} color="white" />
      </View>
      <TextTheme font="Prompt-SemiBold" size="2xl" style={tw`text-white mb-2`}>
        ชำระเงินสำเร็จ
      </TextTheme>
      <TextTheme style={tw`text-white/90`}>
        ขอบคุณที่ใช้บริการ
      </TextTheme>
    </View>
  </View>
);

const PaymentDetails: React.FC<{
  booking: BookingItem
  payment: Payments;
  userData: Users
}> = ({ payment, booking, userData }) => {
  if (!payment || !booking || !userData) {
    return;
  }
  return (
    <View style={tw`bg-white rounded-2xl shadow-lg p-5 mb-6`}>
      <View style={tw`flex-row items-center justify-between mb-4 pb-4 border-b border-gray-100`}>
        <View style={tw`flex-row items-center`}>
          <Ionicons name="receipt-outline" size={24} style={tw`text-emerald-500 mr-2`} />
          <TextTheme font="Prompt-Medium">รายละเอียดการชำระเงิน</TextTheme>
        </View>
        <TextTheme style={tw`text-emerald-500`}>#{payment.id}</TextTheme>
      </View>

      <View style={tw`flex-row justify-between`}>
        <TextTheme style={tw`text-gray-500`}>วันที่ชำระเงิน</TextTheme>
        <TextTheme font="Prompt-Medium">{formatDateThai(String(payment.payment_date))}</TextTheme>
      </View>
      <View style={tw`flex-row justify-between items-center`}>
        <TextTheme style={tw`text-gray-500`}>สถานะ</TextTheme>
        <View style={tw`bg-emerald-100 px-3 py-1 rounded-full`}>
          <TextTheme size='xs' style={tw`text-emerald-600`}>{payment.status}</TextTheme>
        </View>
      </View>
      <View style={tw`flex-col`}>
        <TextTheme style={tw`text-gray-500`}>ตรวจสอบชำระเงิน</TextTheme>
        <View style={tw`flex-row justify-start`}>
          <QRCode
            value={payment?.transaction_id}
            size={100}
            logoBackgroundColor="white"
            logoBorderRadius={5}
            backgroundColor="white"
            color="black"
          />
        </View>
      </View>
    </View>
  )
}


const ProgramSchedule: React.FC<{ booking: BookingItem }> = ({ booking }) => {
  if (!booking) {
    return;
  }
  return (
    <View style={tw`bg-white rounded-2xl shadow-lg p-5 mb-6`}>
      <View style={tw`flex-row items-center mb-4 pb-4 border-b border-gray-100`}>
        <Ionicons name="calendar-outline" size={24} style={tw`text-emerald-500 mr-2`} />
        <View style={tw`flex-1`}>
          <TextTheme>
            รายละเอียดโปรแกรมการจอง
          </TextTheme>
        </View>
      </View>

      <View style={tw`flex-1`}>
        {booking.booking_details.map((program, index) => {
          return (
            <TextTheme key={`program-${index}`} font="Prompt-Medium" style={tw`text-gray-800`}>
              - {program.program_name}
            </TextTheme>
          )
        })}

      </View>
      <View style={tw`flex-row justify-between items-center p-2 pb-0`}>
        <TextTheme font="Prompt-Medium" style={tw`text-gray-700`}>ยอดรวมทั้งหมด</TextTheme>
        <TextTheme font="Prompt-SemiBold" size="xl" style={tw`text-emerald-600`}>
          ฿{addCommas(booking.total_price)}
        </TextTheme>
      </View>
    </View>
  );
};

const ActionButtons: React.FC<{
  onShare: () => void;
  onBack: () => void;
  isSharing?: boolean;
}> = ({ onShare, onBack, isSharing }) => (
  <View style={tw`flex-col gap-2 mb-8`}>
    <TouchableOpacity
      onPress={onShare}
      disabled={isSharing}
      style={tw`flex-row items-center justify-center bg-gray-100 rounded-xl py-4`}
    >
      {isSharing ? (
        <Loading loading={isSharing} />
      ) : (
        <Ionicons name="share-outline" size={20} style={tw`text-gray-600 mr-2`} />
      )}
      <TextTheme style={tw`text-gray-600`}>
        {isSharing ? 'กำลังแชร์...' : 'แชร์ใบเสร็จ'}
      </TextTheme>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={onBack}
      style={tw`bg-emerald-500 rounded-xl py-4`}
    >
      <TextTheme font="Prompt-SemiBold" style={tw`text-white text-center`}>
        กลับสู่หน้าหลัก
      </TextTheme>
    </TouchableOpacity>
  </View>
);

// หน้าหลัก
const PaymentSuccessScreen: React.FC = () => {
  useStatusBar("light-content")
  const { bookingId } = useLocalSearchParams();
  const { userData } = useFetchMeContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [payment, setPayment] = useState<Payments | null>(null);
  const receiptRef = useRef<View>(null);

  const booking_id = useMemo(() => {
    try {
      return parseInt(bookingId as string);
    } catch {
      handleErrorMessage('มีข้อผิดพลาดบางอย่างเกิดขึ้น');
      return;
    }
  }, [bookingId]);

  const fetchBooking = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/bookings/my-booking/${id}`);
      if (response.data.success) {
        setBooking(response.data.data);
      }
    } catch (error) {
      handleAxiosError(error || "ไม่สามารถโหลดข้อมูลการจองของคุณได้ กรุณาลองใหม่อีกครั้ง", (message) => {
        handleErrorMessage(message);
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPayment = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/payments/${id}`);
      if (response.data.success) {
        setPayment(response.data.payments)
      }

    } catch (error) {
      handleAxiosError(error, (message) => {
        handleErrorMessage(message);
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (booking_id) {
        fetchBooking(booking_id);
        fetchPayment(booking_id)
      } else {
        handleErrorMessage("ไม่พบการจองของคุณกรุณาทำการจองใหม่อีกครั้ง", true);
      }
    }, [])
  );

  const handleShare = useCallback(async () => {
    if (!payment || !booking) {
      return;
    }

    try {
      let receiptContent = `🏥 Mae On Wellness - ใบเสร็จรับเงิน\n\n`;
      receiptContent += `📋 ข้อมูลการชำระเงิน\n`;
      receiptContent += `หมายเลขการจอง: #${booking.id}\n`;
      receiptContent += `หมายเลขชำระเงิน: #${payment.transaction_id}\n`;
      receiptContent += `วันที่ชำระเงิน: ${formatDateThai(String(payment.payment_date))}\n`;
      receiptContent += `สถานะ: ${payment.status}\n\n`;

      receiptContent += `💼 ข้อมูลการจอง\n`;
      receiptContent += `ชื่อผู้จอง: ${userData?.firstname} ${userData?.lastname}\n`;
      receiptContent += `จำนวนผู้เข้าร่วม: ${booking.people} คน\n`;
      receiptContent += `วันที่เดินทาง: ${booking.booking_details.length > 1
        ? `${formatDateThai(booking.start_date)} ถึง ${formatDateThai(booking.end_date)}`
        : formatDateThai(booking.start_date)}\n\n`;

      booking.booking_details.forEach((program) => {
        receiptContent += `📅 ${program.program_name}\n`;
      });

      // receiptContent += `\n📱 กดดูใบเสร็จในแอพ:\n${deepLink}\n`;
      // receiptContent += `🌐 กดดูใบเสร็จออนไลน์:\n${webLink}\n\n`;
      receiptContent += `Mae On Wellness ขอบคุณที่ใช้บริการ 🙏`;


      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        handleErrorMessage('ต้องการสิทธิ์ในการเข้าถึงคลังรูปภาพ!');
        await Share.share({ message: receiptContent });
        return;
      }

      if (receiptRef.current) {
        try {
          const filename = `receipt-${Date.now()}.jpg`;
          const filepath = `${FileSystem.cacheDirectory}${filename}`;

          const base64Image = await captureRef(receiptRef.current, {
            format: 'jpg',
            quality: 1,
            result: 'base64',
          });

          await FileSystem.writeAsStringAsync(filepath, base64Image, {
            encoding: FileSystem.EncodingType.Base64,
          });

          try {
            const asset = await MediaLibrary.createAssetAsync(filepath);
            await MediaLibrary.createAlbumAsync('Mae On Wellness', asset, false);
            await FileSystem.deleteAsync(filepath, { idempotent: true });
            await Share.share({
              message: receiptContent
            });
            useShowToast('success', "สำเร็จ", 'บันทึกใบเสร็จลงในแกลลอรี่แล้ว');
          } catch (error) {
            await FileSystem.deleteAsync(filepath, { idempotent: true });
            throw error;
          }
        } catch (error) {
          console.error('Capture error:', error);
          await Share.share({ message: receiptContent });
        }
      } else {
        console.error('Receipt ref is null');
        await Share.share({ message: receiptContent });
      }

    } catch (error) {
      console.error('Share error:', error);
      handleErrorMessage('เกิดข้อผิดพลาดในการแชร์ใบเสร็จ');
    }
  }, [booking, payment, userData]);

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <Loading loading={loading} />
      </View>
    );
  }

  return (
    <ScrollView style={tw`flex-1 bg-white`}>
      <View
        ref={receiptRef}
        collapsable={false}
        style={tw`bg-white`}
      >
        <PaymentHeader />
        <View style={tw`px-6 -mt-6`}>
          {(booking && payment && userData) ? (
            <PaymentDetails
              booking={booking}
              payment={payment}
              userData={userData}
            />
          ) : null}
          {booking && <ProgramSchedule booking={booking} />}
        </View>
      </View>

      <View style={tw`px-6`}>
        <ActionButtons
          onShare={handleShare}
          onBack={() => router.replace('/user/recent-activites')}
          isSharing={loading}
        />
      </View>
    </ScrollView>
  );
};

export default PaymentSuccessScreen;