import React, { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, } from 'react-native';
import { Card, Colors, Dialog, PanningProvider, RadioButton, RadioGroup, TouchableOpacity, View } from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import TextTheme from '@/components/TextTheme';
import { BankIcon, MoneyReport } from '@/components/SvgComponents';
import { useStatusBar } from '@/hooks/useStatusBar';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { formatDateThai, formatPhoneNumber, handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import useShowToast from '@/hooks/useShowToast';
import Loading from '@/components/Loading';
import api from '@/helper/api';
import { addCommas } from '@/helper/utiles';
import PaymentQRCode from '@/components/payment/PaymentQRCode';
import { useFetchMeContext } from '@/context/FetchMeContext';
import Toast from "react-native-toast-message";
import { BANK_RECEIVER } from '@/constants/payments';
import { useNotification } from '@/context/NotificationProvider';
import { Payments, Users } from '@/types/PrismaType';
import { notifications_type } from '@/types/notifications';

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

type PaymentMethod = "PROMPTPAY" | "BANK_ACCOUNT_NUMBER";

const paymentMethodOptions: PaymentMethod[] = ["PROMPTPAY", "BANK_ACCOUNT_NUMBER"];

const Payment = () => {
    useStatusBar("dark-content");
    const { bookingId } = useLocalSearchParams();
    const { userData } = useFetchMeContext()
    const { sendWebSocketNotification, wsConnected, reconnect } = useNotification();

    // states
    const [bookingData, setBookingData] = useState<BookingItem | null>(null);
    const [payment, setPayment] = useState<Payments | null>(null);
    const [dialogPaymentOption, setDialogPaymentOption] = useState<boolean>(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [onSelectPaymentMethod, setOnSelectPaymentMethod] = useState<PaymentMethod | null>(null);
    const [showQRCode, setShowQRCode] = useState(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [loading2, setLoading2] = useState<boolean>(false);
    const [isConfirming, setIsConfirming] = useState<boolean>(false);
    const [resetSlip, setResetSlip] = useState<boolean>(false);

    const fetchBookingData = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const response = await api.get(`/api/bookings/my-booking/${id}`);
            if (response.data.success) {
                setBookingData(response.data.data);
            }
        } catch (error) {
            handleAxiosError(error || "ไม่สามารถโหลดข้อมูลการจองของคุณได้ กรุณาลองใหม่อีกครั้ง", (message) => {
                handleErrorMessage(message);
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPaymentData = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const response = await api.get(`/api/payments/${id}`);
            if (response.data.success) {
                setPayment(response.data.payments)
                setPaymentMethod(response.data.payments.payment_method)
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
            if (bookingId) {
                fetchBookingData(parseInt(bookingId as string));
                fetchPaymentData(parseInt(bookingId as string))
            } else {
                handleErrorMessage("ไม่พบการจองของคุณกรุณาทำการจองใหม่อีกครั้ง", true);
            }
        }, [])
    );

    const selectPaymentMethod = (item: PaymentMethod) => {
        setOnSelectPaymentMethod(item);
    };

    const choosePaymentMethod = async () => {
        Toast.hide()
        try {
            const response = await api.put("/api/payments/initiate-payment", {
                booking_id: parseInt(bookingId as string),
                payment_method: paymentMethod
            });
            if (response.data.success) {
                useShowToast("success", "สำเร็จ", "เปลี่ยนการชำระเงินแล้ว")
            } else {
                handleErrorMessage(response.data.message || "ไม่สามารถเลือกการชำระเงินได้");
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message);
            });
        } finally {
            setTimeout(() => {
                Toast.hide()
            }, 1000)
        }
    }

    const confirmPaymentMethod = useCallback(async () => {
        setDialogPaymentOption(false);
        if (onSelectPaymentMethod) {
            setPaymentMethod(onSelectPaymentMethod);
            if (paymentMethod) {
                choosePaymentMethod();
            }
        }
    }, [onSelectPaymentMethod, paymentMethod]);

    useEffect(() => {
        if (!dialogPaymentOption) {
            setOnSelectPaymentMethod(null);
        }
    }, [dialogPaymentOption]);

    const handlePayment = async () => {
        setLoading2(true);
        if (!paymentMethod) {
            handleErrorMessage("กรุณาเลือกวิธีการชำระเงิน", true);
            return;
        }

        try {
            setTimeout(() => {
                setLoading2(false);
                setTimeout(() => {
                    setShowQRCode(true);
                }, 1000)
            }, 1000)
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message);
            });
        }
    };

    const handleConfirmPayment = async (slipImage: string) => {
        setIsConfirming(true);
        useShowToast("info", "กรุณารอ", "กำลังตรวจสอบการชำระเงินของคุณ...");
        try {
            const formData = new FormData();
            formData.append('booking_id', bookingData?.id.toString() as string);
            formData.append('slip', {
                uri: slipImage,
                type: 'image/jpeg',
                name: 'slip.jpg',
            } as any);

            const response = await api.post("/api/payments/confirm-payment", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.resetSlip) {
                setLoading2(false);
                setIsConfirming(false)
                Toast.hide()
                setTimeout(() => {
                    setResetSlip(true)
                    useShowToast("info", "กรุณารอ..", response.data.message);
                }, 100)
                try {
                    const resetResponse = await api.post("/api/payments/reset-slip-check-count", null, {
                        timeout: 60000
                    });

                    if (resetResponse.data.success) {
                        await handleConfirmPayment(slipImage);
                    } else {
                        throw new Error(resetResponse.data.message);
                    }
                } catch (error) {
                    handleErrorMessage(`ไม่สามารถ reset credit ได้ (${error}) กรุณาแจ้งเจ้าหน้าที่`);
                } finally {
                    setLoading2(false);
                }
                return;
            } else {
                if (response.data.success) {
                    Toast.hide();
                    if (userData?.id && bookingData) {
                        const notificationData = {
                            type: notifications_type.PAYMENT,
                            title: "ชำระเงินสำเร็จ",
                            body: `การชำระเงินของคุณสำเร็จแล้ว จำนวน ฿${addCommas(bookingData.total_price)} บาท`,
                            receive: {
                                userId: userData.id,
                                all: false,
                                role: "admin"
                            },
                            data: {
                                link: {
                                    pathname: `/payments/success`,
                                    params: {
                                        bookingId: bookingData.id
                                    }
                                }
                            }
                        };
                        if (!wsConnected) {
                            reconnect();
                            sendWebSocketNotification(notificationData);
                        } else {
                            sendWebSocketNotification(notificationData);
                        }
                    }

                    setShowQRCode(false);
                    setIsConfirming(false);

                    router.navigate({
                        pathname: "/user/payments/success",
                        params: {
                            bookingId
                        }
                    });
                } else {
                    handleErrorMessage(response.data.message || "ไม่สามารถยืนยันการชำระเงินได้ กรุณาลองใหม่อีกครั้ง");
                }
            }

        } catch (error) {
            setIsConfirming(false);
            handleAxiosError(error, (message) => {
                handleErrorMessage(message);
            });
        }
    };

    const renderPaymentMethod = (method: PaymentMethod) => {
        switch (method) {
            case "PROMPTPAY":
                return (
                    <>
                        <Image source={require("@/assets/images/icon-thaiqr.png")} style={[tw`w-7 h-8`, { objectFit: "cover" }]} />
                        <TextTheme size='sm'>QR Code พร้อมเพย์ (Prompt Pay)</TextTheme>
                    </>
                );
            case "BANK_ACCOUNT_NUMBER":
                return (
                    <>
                        <BankIcon width={23} height={23} fill={String(tw.color("blue-500"))} style={tw`mr-1`} />
                        <TextTheme size='sm'>โอนผ่านเลขบัญชี ({BANK_RECEIVER.account.bank})</TextTheme>
                    </>
                );
        }
    };

    if (loading) {
        return (
            <View style={tw`flex-1 justify-center items-center`}>
                <Loading loading={loading} />
            </View>
        );
    }

    return (
        <View style={tw`flex-1`}>
            <ScrollView style={tw`flex-1 bg-gray-50`} contentContainerStyle={tw`pb-32`}>
                <View padding-16>
                    <Card marginB-16 style={tw`bg-white rounded-xl`}>
                        <View row spread centerV padding-16>
                            <View style={tw`flex-row gap-2 items-center`}>
                                <Ionicons name='person' size={22} style={tw`text-blue-500`} />
                                <View style={tw`flex-col`}>
                                    <TextTheme font='Prompt-Medium' size='xl'>ข้อมูลการจอง</TextTheme>
                                </View>
                            </View>
                        </View>
                        <View style={tw`p-5 pt-0`}>
                            <View style={tw`border border-zinc-200 p-3 rounded-xl`}>
                                <View style={tw`flex-row`}>
                                    <View style={tw`flex-1 pr-2`}>
                                        <View style={tw`mb-2`}>
                                            <TextTheme style={tw`text-gray-500 text-xs mb-1`}>ชื่อ-นามสกุล</TextTheme>
                                            <TextTheme size='xs'>{userData?.firstname} {userData?.lastname}</TextTheme>
                                        </View>
                                        <View>
                                            <TextTheme style={tw`text-gray-500 text-xs mb-1`}>วันที่</TextTheme>
                                            <TextTheme size='xs'>{`${bookingData && formatDateThai(bookingData.start_date)} ถึง \n${bookingData && formatDateThai(bookingData.end_date)}`}</TextTheme>
                                        </View>
                                    </View>
                                    <View style={tw`flex-1 pl-2`}>
                                        <View style={tw`mb-2`}>
                                            <TextTheme style={tw`text-gray-500 text-xs mb-1`}>เบอร์โทรศัพท์</TextTheme>
                                            <TextTheme size='xs'>{userData && formatPhoneNumber(userData.tel)}</TextTheme>
                                        </View>
                                        <View>
                                            <TextTheme style={tw`text-gray-500 text-xs mb-1`}>จำนวนคน</TextTheme>
                                            <TextTheme size='xs'>{bookingData?.people} คน</TextTheme>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </Card>

                    <Card marginB-16>
                        <View padding-16>
                            <View style={tw`flex-row justify-between items-center`}>
                                <View style={tw`flex-row gap-2 items-center`}>
                                    <MoneyReport width={20} height={20} fill={String(tw.color("blue-500"))} />
                                    <TextTheme font='Prompt-Medium' size='xl'>สรุปการชำระเงิน</TextTheme>
                                </View>
                            </View>
                            <TextTheme font='Prompt-Regular' size='sm' color='zinc-900' style={tw`mt-2`}>โปรแกรมท่องเที่ยว</TextTheme>
                            {bookingData?.booking_details.map((program, index) => {
                                return (
                                    <View style={tw`flex-row justify-between w-full`} key={`program-${index}`}>
                                        <TextTheme font='Prompt-Light' size='xs' color='zinc-500' style={tw`w-60`}>- {program.program_name}</TextTheme>
                                        <TextTheme font='Prompt-Regular' size='xs' color='zinc-800' style={tw``}>฿{bookingData?.total_price && addCommas(bookingData?.total_price)}</TextTheme>
                                    </View>
                                )
                            })}
                            <View style={tw`flex-row justify-between border-t border-zinc-200 pt-2 mt-2`}>
                                <TextTheme font='Prompt-SemiBold' size='sm' color='zinc-500'>รวมการชำระเงิน</TextTheme>
                                <TextTheme font='Prompt-SemiBold'>฿{bookingData?.total_price && addCommas(bookingData?.total_price)} บาท</TextTheme>
                            </View>
                        </View>
                    </Card>

                    <TouchableOpacity onPress={() => setDialogPaymentOption(true)}>
                        <Card>
                            <View row centerV padding-16>
                                {paymentMethod ? renderPaymentMethod(paymentMethod) : (
                                    <>
                                        <Ionicons name="wallet" size={24} color={Colors.blue30} />
                                        <TextTheme marginL-8>เลือกช่องทางการชำระเงิน</TextTheme>
                                    </>
                                )}
                                <View flex right>
                                    <Ionicons name="chevron-forward" size={24} />
                                </View>
                            </View>
                        </Card>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Dialog
                visible={dialogPaymentOption}
                panDirection={PanningProvider.Directions.DOWN}
                onDismiss={() => setDialogPaymentOption(false)}
                overlayBackgroundColor="rgba(0, 0, 0, 0.5)"
            >
                <View style={tw`rounded-xl overflow-hidden`}>
                    <View style={tw`bg-white border-b border-zinc-100 p-5 pb-3 flex-row items-center justify-between`}>
                        <View style={tw`flex-row gap-2 items-center`}>
                            <Ionicons name="wallet" size={24} color={Colors.blue30} />
                            <TextTheme>ช่องทางการชำระเงิน</TextTheme>
                        </View>
                        <TouchableOpacity onPress={() => setDialogPaymentOption(false)} style={tw``}>
                            <Ionicons name="close" size={30} color={tw.color('blue-500')} />
                        </TouchableOpacity>
                    </View>

                    <View style={tw`bg-white`}>
                        <RadioGroup initialValue={onSelectPaymentMethod || paymentMethod || undefined}>
                            {paymentMethodOptions.map((item, index) => (
                                <TouchableOpacity
                                    key={`keyPaymentMethod-${index}`}
                                    onPress={() => selectPaymentMethod(item)}
                                    style={tw`border-b border-zinc-100 py-3 px-5 flex-row justify-between items-center`}
                                >
                                    <View style={tw`flex-1 flex-row items-center`}>
                                        {renderPaymentMethod(item)}
                                    </View>
                                    <RadioButton
                                        value={item}
                                        color={String(tw.color("blue-500"))}
                                        selected={item === "PROMPTPAY"}
                                        onPress={() => selectPaymentMethod(item)}
                                    />
                                </TouchableOpacity>
                            ))}
                        </RadioGroup>
                    </View>

                    <View style={tw`flex-row justify-between p-2 gap-2 bg-white`}>
                        <TouchableOpacity onPress={() => setDialogPaymentOption(false)} style={tw`flex-1 bg-zinc-200 rounded-xl justify-center flex-row p-2`}>
                            <TextTheme>ยกเลิก</TextTheme>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={confirmPaymentMethod} style={tw`flex-1 bg-blue-500 rounded-xl justify-center flex-row p-2`}>
                            <TextTheme style={tw`text-white`}>ยืนยันการเลือก</TextTheme>
                        </TouchableOpacity>
                    </View>
                </View>
            </Dialog>

            <View style={[tw`absolute bottom-0 pb-5 left-0 right-0 bg-white shadow-lg`, styles.bottomContainer]}>
                <View padding-16 row spread centerV>
                    <View>
                        <TextTheme size='lg' color="zinc-700">ยอดรวมทั้งหมด</TextTheme>
                        <TextTheme size='xl' font='Prompt-SemiBold' color='blue-500'>฿{bookingData?.total_price && addCommas(bookingData?.total_price)} บาท</TextTheme>
                    </View>
                    <TouchableOpacity
                        onPress={handlePayment}
                        style={tw`p-3 px-5 ${paymentMethod ? 'bg-blue-500' : 'bg-gray-300'} rounded-3xl flex-row gap-2 items-center`}
                        disabled={!paymentMethod}
                    >
                        <Ionicons name='cash' size={20} style={tw`text-white`} />
                        <TextTheme color='white'>ชำระเงิน</TextTheme>
                    </TouchableOpacity>
                </View>
            </View>


            <Dialog
                visible={showQRCode}
                overlayBackgroundColor="rgba(0, 0, 0, 0.5)"
                onDismiss={() => setShowQRCode(false)}
            >
                <View style={tw`bg-white rounded-xl`}>
                    {showQRCode && (
                        <PaymentQRCode
                            bookingId={parseInt(bookingId as string)}
                            paymentMethod={paymentMethod as PaymentMethod}
                            onClose={() => setShowQRCode(false)}
                            onConfirmPayment={handleConfirmPayment}
                            isConfirming={isConfirming}
                            resetSlip={resetSlip}
                        />
                    )}
                </View>
            </Dialog>

            {loading2 && <Loading loading={loading2} type='full' />}
        </View>
    );
};

const styles = StyleSheet.create({
    bottomContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
});

export default Payment;