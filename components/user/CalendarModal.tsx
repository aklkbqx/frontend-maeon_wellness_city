import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { TouchableOpacity, View, Modal } from 'react-native-ui-lib';
import { Calendar, DateData } from '@/helper/react-native-calendars-packageMod';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import TextTheme from '@/components/TextTheme';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import api from '@/helper/api';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import Loading from '@/components/Loading';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (bookingData: any) => void;
}

interface MarkedDates {
  [date: string]: {
    startingDay?: boolean;
    endingDay?: boolean;
    selected?: boolean;
    color: string;
    textColor: string;
  };
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  visible,
  onClose,
  onConfirm
}) => {
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [markType, setMarkType] = useState<string>("dot");
  const [loading, setLoading] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [todyDateState, setTodyDateState] = useState<string>('');
  const [shouldAnimate, setShouldAnimate] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [tempNumber, setTempNumber] = useState(numberOfPeople.toString());

  // เพิ่มฟังก์ชันสำหรับตรวจสอบและอัปเดตจำนวนคน
  const handleNumberInput = (value: string) => {
    const num = parseInt(value || '0');
    if (num > 0 && num <= 99) {
      setTempNumber(value);
      setNumberOfPeople(num);
    } else if (value === '') {
      setTempNumber('');
    }
  };

  const handleNumberOfPeopleChange = (increment: number) => {
    setNumberOfPeople(prevNumber => Math.max(1, prevNumber + increment));
  };

  const resetState = () => {
    setStartDate(null);
    setEndDate(null);
    setMarkType("dot");
    setMarkedDates({});
    setNumberOfPeople(1);
    setShouldAnimate(true); // รีเซ็ต animation state
  };
  const onDayPress = useCallback((day: DateData) => {
    if (!isDateSelectable(day.dateString)) {
      return;
    }

    if (startDate && startDate === day.dateString) {
      setStartDate(null);
      setEndDate(null);
      setMarkType("dot");
      // เมื่อยกเลิกการเลือกวัน เตรียม animation สำหรับการเลือกครั้งต่อไป
      setShouldAnimate(true);
    } else if (endDate && endDate === day.dateString) {
      setEndDate(null);
      setMarkType("dot");
    } else if (startDate && !endDate) {
      setMarkType("period");
      const start = new Date(startDate);
      const end = new Date(day.dateString);
      if (end < start) {
        setEndDate(startDate);
        setStartDate(day.dateString);
      } else {
        setEndDate(day.dateString);
      }
      // ไม่ต้องมี animation เมื่อเลือกวันที่สอง
      setShouldAnimate(false);
    } else {
      setMarkType("dot");
      setStartDate(day.dateString);
      setEndDate(null);
      // มี animation เมื่อเลือกวันแรก
      setShouldAnimate(true);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const newMarkedDates: MarkedDates = {};

    if (startDate) {
      newMarkedDates[startDate] = {
        startingDay: true,
        color: String(tw.color('blue-500')),
        textColor: 'white',
        selected: true,
      };

      if (endDate) {
        newMarkedDates[endDate] = {
          endingDay: true,
          color: String(tw.color('blue-600')),
          textColor: 'white',
          selected: true
        };

        let currentDate = new Date(startDate);
        const lastDate = new Date(endDate);
        while (currentDate < lastDate) {
          currentDate.setDate(currentDate.getDate() + 1);
          const dateString = currentDate.toISOString().split('T')[0];
          if (dateString !== endDate) {
            newMarkedDates[dateString] = {
              color: String(tw.color('blue-400')),
              textColor: 'white',
              selected: true,
            };
          }
        }
      }
    }

    setMarkedDates(newMarkedDates);
  }, [startDate, endDate]);

  const formatDataForBooking = () => {
    const bookingDetail = selectedDates.map(date => ({
      program_id: null,
      date: date.toISOString().split('T')[0]
    }));

    return {
      people: numberOfPeople,
      start_date: startDate,
      end_date: endDate || startDate,
      booking_detail: bookingDetail
    };
  };

  const handleConfirm = () => {
    if (startDate) {
      onConfirm(formatDataForBooking());
      resetState();
      onClose();
    }
  };

  const isDateSelectable = (dateString: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(dateString);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate > today;
  };

  const selectedDates = useMemo(() => {
    if (!startDate) return [];
    if (!endDate) return [new Date(startDate)];

    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    const lastDate = new Date(endDate);

    while (currentDate <= lastDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }, [startDate, endDate]);

  const renderHeader = (date: Date): React.ReactNode => {
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear() + 543;
    return (
      <TextTheme font='Prompt-SemiBold' size='lg' style={tw`text-blue-500`}>
        {`${month} ${year}`}
      </TextTheme>
    );
  };

  useEffect(() => {
    if (visible) {
      fetchThaiTime();
    }
  }, [visible]);

  const fetchThaiTime = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/datetime");
      if (response.data) {
        const formattedDateMinDate = response.data.split("T")[0];
        setTodyDateState(formattedDateMinDate);
      }
    } catch (error) {
      handleAxiosError(error, handleErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDateThaiTypeDate = (date: Date): string => {
    const day = date.getDate();
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  const displaySelectedDates = () => {
    if (selectedDates.length === 1) {
      return (
        <TextTheme font='Prompt-SemiBold' size='base' style={tw`text-gray-700`}>
          {formatDateThaiTypeDate(selectedDates[0])}
        </TextTheme>
      );
    } else if (selectedDates.length > 1) {
      const firstDate = selectedDates[0];
      const lastDate = selectedDates[selectedDates.length - 1];
      return (
        <TextTheme font='Prompt-SemiBold' size='base' style={tw`text-gray-700`}>
          {`${formatDateThaiTypeDate(firstDate)} ถึง ${formatDateThaiTypeDate(lastDate)}`}
        </TextTheme>
      );
    }
    return null;
  };

  const PeopleSelection = () => {

    const displayNumber = () => (
      <View style={tw`flex-row items-center`}>
        <TextTheme font="Prompt-SemiBold" size="xl" style={tw`text-gray-800`}>
          {numberOfPeople}
        </TextTheme>
        <MaterialCommunityIcons
          name="pencil"
          size={16}
          color={String(tw.color('blue-500'))}
          style={tw`ml-1`}
        />
      </View>
    );

    return (
      <View style={tw`flex-row items-center gap-3`}>
        <View style={tw`w-10 h-10 rounded-full bg-green-100 items-center justify-center`}>
          <MaterialCommunityIcons
            name="account-group"
            size={20}
            color={String(tw.color('green-600'))}
          />
        </View>
        <View style={tw`flex-1`}>
          <TextTheme font="Prompt-Regular" size="sm" style={tw`text-gray-500 mb-1`}>
            จำนวนผู้เข้าร่วม
          </TextTheme>
          <View style={tw`flex-row items-center gap-4`}>
            <TouchableOpacity
              onPress={() => handleNumberOfPeopleChange(-1)}
              style={tw`w-8 h-8 rounded-full ${numberOfPeople > 1 ? 'bg-blue-100' : 'bg-gray-100'} items-center justify-center`}
            >
              <MaterialCommunityIcons
                name="minus"
                size={20}
                color={numberOfPeople > 1 ? String(tw.color('blue-500')) : String(tw.color('gray-400'))}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={tw`min-w-[60px] flex-row items-center justify-center`}
            >
              {isEditing ? (
                <TextInput
                  value={tempNumber}
                  onChangeText={handleNumberInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  autoFocus
                  onBlur={() => {
                    setIsEditing(false);
                    if (tempNumber === '') {
                      setTempNumber('1');
                      setNumberOfPeople(1);
                    }
                  }}
                  style={[
                    tw`text-center text-gray-800 bg-gray-100 rounded-lg px-3 py-2 min-w-[60px]`,
                    { fontFamily: 'Prompt-SemiBold', fontSize: 18 }
                  ]}
                />
              ) : displayNumber()}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleNumberOfPeopleChange(1)}
              style={tw`w-8 h-8 rounded-full bg-blue-100 items-center justify-center`}
            >
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={String(tw.color('blue-500'))}
              />
            </TouchableOpacity>

            <TextTheme font="Prompt-Regular" style={tw`text-gray-500`}>
              คน
            </TextTheme>
          </View>
        </View>
      </View>
    );
  };

  const SummarySection = () => {
    return (
      <Animatable.View animation={shouldAnimate ? "fadeInUp" : undefined} duration={300}>
        <View style={tw`mt-4 bg-gray-50 rounded-2xl overflow-hidden`}>
          {/* Header Section */}
          <LinearGradient
            colors={[String(tw.color("blue-500")), String(tw.color("blue-600"))]}
            style={tw`p-4`}
          >
            <View style={tw`flex-row justify-between items-center`}>
              <View style={tw`flex-row items-center gap-2`}>
                <MaterialCommunityIcons name="calendar-range" size={24} color="white" />
                <TextTheme font="Prompt-SemiBold" size="lg" style={tw`text-white`}>
                  สรุปการจอง
                </TextTheme>
              </View>
              <View style={tw`bg-white/20 rounded-full px-3 py-1`}>
                <TextTheme font="Prompt-Medium" style={tw`text-white`}>
                  {selectedDates.length} วัน
                </TextTheme>
              </View>
            </View>
          </LinearGradient>

          {/* Date Details */}
          <View style={tw`p-4`}>
            <View style={tw`flex-row items-center gap-3 mb-4`}>
              <View style={tw`w-10 h-10 rounded-full bg-blue-100 items-center justify-center`}>
                <MaterialCommunityIcons
                  name="calendar-check"
                  size={20}
                  color={String(tw.color('blue-600'))}
                />
              </View>
              <View style={tw`flex-1`}>
                <TextTheme font="Prompt-Regular" size="sm" style={tw`text-gray-500 mb-1`}>
                  วันที่เลือก
                </TextTheme>
                {displaySelectedDates()}
              </View>
            </View>

            {/* People Selection */}
            <PeopleSelection />
          </View>

          {/* Confirm Button */}
          <View style={tw`bg-white border-t border-gray-100`}>
            <TouchableOpacity
              onPress={handleConfirm}
            >
              <LinearGradient
                colors={[String(tw.color("blue-500")), String(tw.color("blue-600"))]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={tw`p-4`}
              >
                <View style={tw`flex-row items-center justify-center gap-2`}>
                  <MaterialCommunityIcons name="check-circle" size={24} color="white" />
                  <TextTheme font="Prompt-SemiBold" size="lg" style={tw`text-white`}>
                    ยืนยันการจอง
                  </TextTheme>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animatable.View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent
    >
      <View style={tw`flex-1 bg-black bg-opacity-50`}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0} style={tw`flex-1`}>
          <Animatable.View
            animation="slideInUp"
            duration={300}
            style={tw`bg-white rounded-t-3xl mt-auto h-[90%]`}
          >
            {/* Header */}
            <View style={tw`flex-row justify-between items-center p-4 border-b border-gray-200`}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={String(tw.color('gray-500'))} />
              </TouchableOpacity>
              <TextTheme font="Prompt-SemiBold" size="xl">
                เลือกวันที่
              </TextTheme>
              <View style={tw`w-6`} />
            </View>

            {loading ? (
              <Loading loading={loading} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={tw`p-4`}>
                  <Calendar
                    onDayPress={onDayPress}
                    markedDates={markedDates}
                    renderHeader={renderHeader}
                    markingType={markType}
                    enableSwipeMonths
                    currentDate={todyDateState}
                    theme={{
                      backgroundColor: String(tw.color("white")),
                      calendarBackground: String(tw.color("white")),
                      textSectionTitleColor: String(tw.color("slate-400")),
                      selectedDayBackgroundColor: String(tw.color('blue-500')),
                      selectedDayTextColor: String(tw.color("white")),
                      todayTextColor: String(tw.color('blue-500')),
                      dayTextColor: String(tw.color("black")),
                      textDisabledColor: String(tw.color("slate-200")),
                      dotColor: String(tw.color('blue-500')),
                      selectedDotColor: String(tw.color("white")),
                      arrowColor: String(tw.color('blue-500')),
                      monthTextColor: String(tw.color('blue-500')),
                      indicatorColor: String(tw.color('blue-500')),
                      textDayFontFamily: 'Prompt-Regular',
                      textMonthFontFamily: 'Prompt-SemiBold',
                      textDayHeaderFontFamily: 'Prompt-Medium',
                    }}
                  />

                  {selectedDates.length > 0 && <SummarySection />}
                </View>
              </ScrollView>
            )}
          </Animatable.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default CalendarModal;