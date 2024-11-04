import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TouchableOpacity, Image } from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import TextTheme from '@/components/TextTheme';
import QRCodeGenerator, { QRCodeGeneratorHandle } from '@/components/payment/QRCodeGenerator';
import api from '@/helper/api';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import * as ImagePicker from 'expo-image-picker';
import Loading from '../Loading';
import * as MediaLibrary from 'expo-media-library';
import { View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import useShowToast from '@/hooks/useShowToast';
import { copyToClipboard } from '@/helper/utiles';
import { BANK_RECEIVER, PROMPTPAY_ID, PROMPTPAY_RECEIVER } from '@/constants/payments';

interface PaymentQRCodeProps {
    bookingId: number;
    paymentMethod: string;
    onClose: () => void;
    onConfirmPayment: (slipImage: string) => Promise<void>;
    isConfirming: boolean;
    error: string | null;
    setError: any
}

const PaymentQRCode: React.FC<PaymentQRCodeProps> = ({
    bookingId,
    paymentMethod,
    onClose,
    onConfirmPayment,
    isConfirming,
    error,
    setError
}) => {
    const [qrCodeData, setQrCodeData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [slipImage, setSlipImage] = useState<string | null>(null);
    const qrCodeGeneratorRef = useRef<QRCodeGeneratorHandle>(null);

    const fetchQRCode = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.put("/api/payments/initiate-payment", {
                booking_id: bookingId,
                payment_method: paymentMethod
            });
            if (response.data.success) {
                setQrCodeData(response.data.data.qr_code);
            } else {
                handleErrorMessage(response.data.message || "ไม่สามารถสร้าง QR Code ได้");
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message);
            });
        } finally {
            setIsLoading(false);
        }
    }, [bookingId, paymentMethod]);

    useEffect(() => {
        fetchQRCode();
    }, [fetchQRCode]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            if (error) {
                setError(null)
            }
            setSlipImage(result.assets[0].uri);
        }
    };

    const saveQRCode = async () => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                handleErrorMessage('ต้องการสิทธิ์ในการเข้าถึงคลังรูปภาพ!');
                return;
            }
            const filePath = await qrCodeGeneratorRef.current?.generateAndSaveQRCode();
            if (!filePath) {
                throw new Error('ไม่สามารถสร้าง QR Code ได้');
            }

            try {
                const asset = await MediaLibrary.createAssetAsync(filePath);
                await MediaLibrary.createAlbumAsync('BNKQR', asset, false);
                await FileSystem.deleteAsync(filePath, { idempotent: true });

                useShowToast("success", 'บันทึก QR Code สำเร็จ!', "");
            } catch (error) {
                await FileSystem.deleteAsync(filePath, { idempotent: true });
                throw error;
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message);
            });
        }
    };

    const renderReceiverInfo = () => {
        if (paymentMethod !== 'PROMPTPAY') {
            return (
                <View style={tw`mt-4 bg-slate-50 p-4 rounded-xl`}>
                    <View style={tw`flex-row justify-between items-center mb-2`}>
                        <TextTheme size='sm' style={tw`text-gray-500`}>ธนาคาร</TextTheme>
                        <TextTheme size='sm' font='Prompt-Medium'>{BANK_RECEIVER.account.bank}</TextTheme>
                    </View>
                    <View style={tw`flex-row justify-between items-center mb-2`}>
                        <TextTheme size='sm' style={tw`text-gray-500`}>เลขบัญชี</TextTheme>
                        <TouchableOpacity
                            onPress={() => copyToClipboard(BANK_RECEIVER.account.value)}
                            style={tw`flex-row items-center gap-1`}
                        >
                            <TextTheme size='sm' font='Prompt-Medium'>{BANK_RECEIVER.account.value}</TextTheme>
                            <Ionicons name="copy-outline" size={16} color={tw.color('blue-500')} />
                        </TouchableOpacity>
                    </View>
                    <View style={tw`flex-row justify-between items-center mb-2`}>
                        <TextTheme size='sm' style={tw`text-gray-500`}>ชื่อผู้รับ (TH)</TextTheme>
                        <TextTheme size='sm' font='Prompt-Medium'>{BANK_RECEIVER.displayName.th}</TextTheme>
                    </View>
                    <View style={tw`flex-row justify-between items-center`}>
                        <TextTheme size='sm' style={tw`text-gray-500`}>ชื่อผู้รับ (EN)</TextTheme>
                        <TextTheme size='sm' font='Prompt-Medium'>{BANK_RECEIVER.displayName.eng}</TextTheme>
                    </View>
                </View>
            );
        }
    };

    return (
        <View style={tw`relative`}>
            <View style={tw`p-4`}>
                {paymentMethod === 'PROMPTPAY' ? (
                    <>
                        {isLoading ? (
                            <View style={tw`flex-col justify-center items-center p-5 gap-2`}>
                                <TextTheme>กำลังโหลด QR Code...</TextTheme>
                                <Loading loading />
                            </View>
                        ) : qrCodeData ? (
                            <>
                                <QRCodeGenerator
                                    ref={qrCodeGeneratorRef}
                                    data={qrCodeData}
                                    size={200}
                                    logo={require("@/assets/images/icon-thaiqr.png")}
                                    promptpayNumber={PROMPTPAY_ID}
                                    displayName={PROMPTPAY_RECEIVER.displayName}
                                />
                                <View style={tw``}>
                                    <TouchableOpacity
                                        onPress={saveQRCode}
                                        style={tw`rounded-xl flex-row gap-2 items-center justify-center mt-2`}
                                    >
                                        <Ionicons name='download' size={20} style={tw`text-blue-500`} />
                                        <TextTheme style={tw`text-blue-500 text-center`}>บันทึกรูป QR Code</TextTheme>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <TextTheme>ไม่สามารถสร้าง QR Code ได้</TextTheme>
                        )}
                    </>
                ) : (
                    <View style={tw`flex-row justify-center`}>
                        <Image source={require("@/assets/images/Krung-Thai-Bank.png")}
                            style={[tw`h-10`, { objectFit: "contain" }]} />
                    </View>
                )}
                {renderReceiverInfo()}

                <View style={tw`mt-4`}>
                    {slipImage && (
                        <View style={tw`flex-row justify-center`}>
                            <Image source={{ uri: slipImage }}
                                style={[tw`w-30 h-30 rounded-sm mb-2 border border-zinc-200`, { objectFit: "cover" }]} />
                        </View>
                    )}
                    {error && (
                        <View style={tw`flex-row justify-center`}>
                            <TextTheme color='red-500'>{error}</TextTheme>
                        </View>
                    )}
                    <View style={tw`flex-row gap-2 items-center`}>
                        <TouchableOpacity
                            onPress={pickImage}
                            style={tw`bg-blue-500 flex-1 rounded-xl py-2 flex-row gap-2 items-center justify-center`}
                        >
                            <Ionicons name='image' size={20} color="white" />
                            <TextTheme style={tw`text-white text-center`}>อัพโหลดสลิป</TextTheme>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => slipImage && onConfirmPayment(slipImage)}
                            style={tw`flex-1 bg-green-500 rounded-xl py-2 flex-row gap-2 items-center justify-center
                                ${!slipImage ? "opacity-50" : ""}`}
                            disabled={!slipImage || isConfirming}
                        >
                            {isConfirming ?
                                <Loading loading={isConfirming} size='small' color='white' /> :
                                <Ionicons name='checkmark-circle' size={20} color="white" />
                            }
                            <TextTheme style={tw`text-white text-center`}>
                                {isConfirming ? "กำลังยืนยัน..." : "ยืนยันชำระเงิน"}
                            </TextTheme>
                        </TouchableOpacity>
                    </View>
                </View>


                <TouchableOpacity onPress={onClose} style={tw`mt-4 absolute top-0 right-3`}>
                    <Ionicons name="close-circle" size={30} color={tw.color('red-500')} />
                </TouchableOpacity>
            </View>


            {isConfirming && (
                <View style={tw`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center`}>
                    <Loading loading={true} size='large' color='white' />
                    <TextTheme style={tw`text-white mt-4`}>กำลังยืนยันการชำระเงิน...</TextTheme>
                </View>
            )}
        </View>
    );
};

export default PaymentQRCode;