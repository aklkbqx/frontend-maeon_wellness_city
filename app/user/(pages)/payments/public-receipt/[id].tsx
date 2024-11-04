import React, { useEffect, useState } from 'react';
import { ScrollView, View, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import tw from 'twrnc';
import TextTheme from '@/components/TextTheme';
import { Ionicons } from '@expo/vector-icons';
import { addCommas } from '@/helper/utiles';
import QRCode from 'react-native-qrcode-svg';
import api from '@/helper/api';
import { formatDateThai } from '@/helper/my-lib';
import { LogoMaeOn } from '@/components/SvgComponents';

interface BookingPrograms {
    program_id: number;
    program_name: string;
    date: string;
    schedules: string;
}

interface Activity {
    sequence: number;
    start_time: string;
    end_time: string;
    activity: string;
    description: string;
    location_id: number;
    location_name: string;
    location_type: string;
    cost: number;
    included_in_total_price: boolean;
    is_mandatory?: boolean;
    services?: string[];
    locations?: Array<{
        id: number;
        name: string;
        type: string;
    }>;
    note?: string;
}

interface Schedule {
    day: number;
    title: string;
    activities: Activity[];
}

interface PublicReceipt {
    id: number;
    booking_date: string;
    start_date: string;
    end_date: string;
    people: number;
    total_price: string;
    status: string;
    booking_details: BookingPrograms[];
    user: {
        firstname: string;
        lastname: string;
    };
    payment: {
        id: number;
        payment_date: string;
        status: string;
        transaction_id: string;
    };
}

const PublicReceiptScreen: React.FC = () => {
    const { id } = useLocalSearchParams();
    const [receipt, setReceipt] = useState<PublicReceipt | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                const response = await api.get(`/api/bookings/public-booking/${id}`);
                if (response.data.success) {
                    setReceipt(response.data.data);
                } else {
                    setError('ไม่พบข้อมูลการจอง');
                }
            } catch (err) {
                setError('ไม่พบใบเสร็จที่คุณต้องการ หรือลิงก์อาจหมดอายุ');
            } finally {
                setLoading(false);
            }
        };

        fetchReceipt();
    }, [id]);

    if (loading) {
        return (
            <View style={tw`flex-1 justify-center items-center bg-white`}>
                <TextTheme>กำลังโหลด...</TextTheme>
            </View>
        );
    }

    if (error || !receipt) {
        return (
            <View style={tw`flex-1 justify-center items-center bg-white p-6`}>
                <Ionicons name="warning-outline" size={48} style={tw`text-red-500 mb-4`} />
                <TextTheme style={tw`text-center text-red-500`}>{error}</TextTheme>
            </View>
        );
    }

    const renderActivities = (program: BookingPrograms) => {
        try {
            const schedules: Schedule[] = JSON.parse(program.schedules);
            return schedules.map((schedule, scheduleIndex) => (
                <View key={scheduleIndex} style={tw`mt-4`}>
                    <TextTheme font="Prompt-Medium" style={tw`text-gray-800 mb-2`}>
                        {schedule.title}
                    </TextTheme>
                    {schedule.activities.map((activity, activityIndex) => (
                        <View key={activityIndex} style={tw`ml-4 mb-3`}>
                            <View style={tw`flex-row items-start`}>
                                <View style={tw`w-2 h-2 rounded-full bg-emerald-500 mt-2 mr-2`} />
                                <View style={tw`flex-1`}>
                                    <TextTheme font="Prompt-Medium" size="sm">
                                        {activity.activity}
                                    </TextTheme>
                                    <TextTheme size="xs" style={tw`text-gray-500 mt-1`}>
                                        {activity.description}
                                    </TextTheme>
                                    <View style={tw`flex-row items-center mt-1`}>
                                        <Ionicons name="time-outline" size={14} style={tw`text-gray-400 mr-1`} />
                                        <TextTheme size="xs" style={tw`text-gray-500`}>
                                            {activity.start_time.substring(0, 5)} - {activity.end_time.substring(0, 5)}
                                        </TextTheme>
                                    </View>
                                    <View style={tw`flex-row items-center mt-1`}>
                                        <Ionicons name="location-outline" size={14} style={tw`text-gray-400 mr-1`} />
                                        <TextTheme size="xs" style={tw`text-gray-500`}>
                                            {activity.location_name}
                                        </TextTheme>
                                    </View>
                                    {activity.services && activity.services.length > 0 && (
                                        <View style={tw`flex-row flex-wrap gap-1 mt-1`}>
                                            {activity.services.map((service, serviceIndex) => (
                                                <View key={serviceIndex} style={tw`bg-gray-100 px-2 py-1 rounded-full`}>
                                                    <TextTheme size="xs" style={tw`text-gray-600`}>
                                                        {service}
                                                    </TextTheme>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                    {activity.cost > 0 && (
                                        <TextTheme size="xs" style={tw`text-emerald-600 mt-1`}>
                                            ฿{addCommas(activity.cost)}
                                            {activity.included_in_total_price &&
                                                <TextTheme size="xs" style={tw`text-gray-400`}> (รวมในแพ็คเกจ)</TextTheme>
                                            }
                                        </TextTheme>
                                    )}
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            ));
        } catch (e) {
            return null;
        }
    };

    return (
        <ScrollView style={tw`flex-1 bg-white`}>
            {/* Header */}
            <View style={tw`bg-emerald-500 pt-16 pb-12 px-6 rounded-b-3xl`}>
                <View style={tw`items-center`}>
                    <LogoMaeOn width={80} height={80} fill={String(tw.color("blue-500"))} style={tw`z-10`} />
                    <TextTheme font="Prompt-SemiBold" size="2xl" style={tw`text-white mb-2`}>
                        ใบเสร็จรับเงิน
                    </TextTheme>
                    <TextTheme style={tw`text-white/90`}>
                        Mae On Wellness
                    </TextTheme>
                </View>
            </View>

            <View style={tw`px-6 -mt-6`}>
                {/* Payment Details */}
                <View style={tw`bg-white rounded-2xl shadow-lg p-5 mb-6`}>
                    <View style={tw`flex-row items-center justify-between mb-4 pb-4 border-b border-gray-100`}>
                        <View style={tw`flex-row items-center`}>
                            <Ionicons name="receipt-outline" size={24} style={tw`text-emerald-500 mr-2`} />
                            <TextTheme font="Prompt-Medium">รายละเอียดการชำระเงิน</TextTheme>
                        </View>
                        <TextTheme style={tw`text-emerald-500`}>#{receipt.payment.id}</TextTheme>
                    </View>

                    <View style={tw`space-y-3`}>
                        <View style={tw`flex-row justify-between`}>
                            <TextTheme style={tw`text-gray-500`}>ชื่อลูกค้า</TextTheme>
                            <TextTheme font="Prompt-Medium">
                                {receipt.user.firstname} {receipt.user.lastname}
                            </TextTheme>
                        </View>

                        <View style={tw`flex-row justify-between`}>
                            <TextTheme style={tw`text-gray-500`}>วันที่ชำระเงิน</TextTheme>
                            <TextTheme font="Prompt-Medium">
                                {formatDateThai(receipt.payment.payment_date)}
                            </TextTheme>
                        </View>

                        <View style={tw`flex-row justify-between items-center`}>
                            <TextTheme style={tw`text-gray-500`}>สถานะ</TextTheme>
                            <View style={tw`bg-emerald-100 px-3 py-1 rounded-full`}>
                                <TextTheme size="xs" style={tw`text-emerald-600`}>
                                    {receipt.payment.status}
                                </TextTheme>
                            </View>
                        </View>

                        <View style={tw`flex-col mt-4`}>
                            <TextTheme style={tw`text-gray-500 mb-2`}>รหัสอ้างอิงการชำระเงิน</TextTheme>
                            <View style={tw`items-center`}>
                                <QRCode
                                    value={receipt.payment.transaction_id}
                                    size={120}
                                    backgroundColor="white"
                                />
                                <TextTheme size="xs" style={tw`mt-2 text-gray-500`}>
                                    {receipt.payment.transaction_id}
                                </TextTheme>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Booking Details */}
                <View style={tw`bg-white rounded-2xl shadow-lg p-5 mb-6`}>
                    <View style={tw`flex-row items-center mb-4 pb-4 border-b border-gray-100`}>
                        <Ionicons name="calendar-outline" size={24} style={tw`text-emerald-500 mr-2`} />
                        <TextTheme font="Prompt-Medium">รายละเอียดการจอง</TextTheme>
                    </View>

                    <View style={tw`space-y-3`}>
                        {receipt.booking_details.map((program, index) => (
                            <View key={index}>
                                <TextTheme font="Prompt-Medium" style={tw`text-gray-800`}>
                                    {program.program_name}
                                </TextTheme>
                                {renderActivities(program)}
                            </View>
                        ))}

                        <View style={tw`pt-4 mt-4 border-t border-gray-100`}>
                            <View style={tw`flex-row justify-between items-center`}>
                                <TextTheme style={tw`text-gray-500`}>จำนวนผู้เข้าร่วม</TextTheme>
                                <TextTheme font="Prompt-Medium">{receipt.people} คน</TextTheme>
                            </View>

                            <View style={tw`flex-row justify-between items-center mt-2`}>
                                <TextTheme style={tw`text-gray-500`}>วันที่เดินทาง</TextTheme>
                                <TextTheme font="Prompt-Medium">
                                    {formatDateThai(receipt.start_date)}
                                    {receipt.end_date && ` - ${formatDateThai(receipt.end_date)}`}
                                </TextTheme>
                            </View>

                            <View style={tw`flex-row justify-between items-center mt-4 pt-4 border-t border-gray-100`}>
                                <TextTheme font="Prompt-Medium" style={tw`text-gray-700`}>ยอดรวมทั้งหมด</TextTheme>
                                <TextTheme font="Prompt-SemiBold" size="xl" style={tw`text-emerald-600`}>
                                    ฿{addCommas(receipt.total_price)}
                                </TextTheme>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

export default PublicReceiptScreen;