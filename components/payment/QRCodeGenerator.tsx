import React, { useRef, useImperativeHandle } from 'react';
import { View, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import TextTheme from '@/components/TextTheme';
import tw from "twrnc";
import * as FileSystem from 'expo-file-system';
import { TouchableOpacity } from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';
import { copyToClipboard } from '@/helper/utiles';
import { PROMPTPAY_ID, PROMPTPAY_RECEIVER } from '@/constants/payments';

interface QRCodeGenerator_Type {
    data: string;
    size: number;
    logo: number;
    promptpayNumber: string;
    displayName: {
        th: string;
        eng: string
    };
}

export interface QRCodeGeneratorHandle {
    toDataURL: () => Promise<string>;
    generateAndSaveQRCode: () => Promise<string>;
}

const QRCodeGenerator = React.forwardRef<QRCodeGeneratorHandle, QRCodeGenerator_Type>(
    ({ data, size = 200, logo, promptpayNumber, displayName }, ref) => {
        const qrCodeContainerRef = useRef<View>(null);

        useImperativeHandle(ref, () => ({
            toDataURL: async () => {
                if (!qrCodeContainerRef.current) {
                    throw new Error('QR Code container reference is not available');
                }

                try {
                    const base64Image = await captureRef(qrCodeContainerRef.current, {
                        format: 'png',
                        quality: 1,
                        result: 'base64',
                    });
                    return base64Image;
                } catch (error) {
                    console.error('Error generating QR code image:', error);
                    throw error;
                }
            },
            generateAndSaveQRCode: async () => {
                if (!qrCodeContainerRef.current) {
                    throw new Error('QR Code container reference is not available');
                }

                try {
                    const filename = `promptpay-${Date.now()}.png`;
                    const filepath = `${FileSystem.cacheDirectory}${filename}`;
                    const base64Image = await captureRef(qrCodeContainerRef.current, {
                        format: 'png',
                        quality: 1,
                        result: 'base64',
                    });
                    await FileSystem.writeAsStringAsync(filepath, base64Image, {
                        encoding: FileSystem.EncodingType.Base64,
                    });

                    return filepath;
                } catch (error) {
                    console.error('Error saving QR code image:', error);
                    throw error;
                }
            }
        }));

        return (
            <View
                ref={qrCodeContainerRef}
                style={tw`items-center justify-center bg-white rounded-xl flex-col gap-2`}
            >
                <Image source={require("@/assets/images/PromptPay-logo.png")} style={[tw`h-10`, { objectFit: "contain" }]} />
                <QRCode
                    value={data}
                    size={size}
                    logo={logo}
                    logoSize={size * 0.2}
                    logoBackgroundColor="white"
                    logoBorderRadius={5}
                    backgroundColor="white"
                    color="black"
                />
                {(promptpayNumber || displayName) && (
                    <View style={tw`mt-2 bg-slate-50 p-4 rounded-xl w-full `}>
                        <View style={tw`flex-row justify-between items-center mb-2`}>
                            <TextTheme size='sm' style={tw`text-gray-500`}>เบอร์พร้อมเพย์:</TextTheme>
                            <TouchableOpacity
                                onPress={() => copyToClipboard(PROMPTPAY_ID)}
                                style={tw`flex-row items-center gap-1`}
                            >
                                <TextTheme size='sm' font='Prompt-Medium'>{PROMPTPAY_ID}</TextTheme>
                                <Ionicons name="copy-outline" size={16} color={tw.color('blue-500')} />
                            </TouchableOpacity>
                        </View>
                        <View style={tw`flex-row justify-between items-center mb-2`}>
                            <TextTheme size='sm' style={tw`text-gray-500`}>ชื่อผู้รับ (TH):</TextTheme>
                            <TextTheme size='sm' font='Prompt-Medium'>{PROMPTPAY_RECEIVER.displayName.th}</TextTheme>
                        </View>
                        <View style={tw`flex-row justify-between items-center`}>
                            <TextTheme size='sm' style={tw`text-gray-500`}>ชื่อผู้รับ (EN):</TextTheme>
                            <TextTheme size='sm' font='Prompt-Medium'>{PROMPTPAY_RECEIVER.displayName.eng}</TextTheme>
                        </View>
                    </View>
                )}
            </View>
        );
    }
);

export default QRCodeGenerator;