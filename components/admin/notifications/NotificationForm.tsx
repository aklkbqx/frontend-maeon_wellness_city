import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, TextInput, Keyboard } from 'react-native';
import { Dialog } from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';
import TextTheme from '@/components/TextTheme';
import tw from 'twrnc';

interface CustomInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    error?: string;
    placeholder?: string;
    multiline?: boolean;
    numberOfLines?: number;
    style?: object;
}

const CustomInput: React.FC<CustomInputProps> = ({
    label,
    value,
    onChangeText,
    error,
    ...props
}) => (
    <View style={tw`mb-4`}>
        <TextTheme font="Prompt-Medium" style={tw`mb-1 text-gray-700`}>
            {label}
        </TextTheme>
        <View style={tw`relative`}>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                style={[
                    tw`bg-white border rounded-xl px-4 py-3`,
                    error ? tw`border-red-300` : tw`border-gray-200`,
                    { fontFamily: 'Prompt-Regular' },
                    props.style
                ]}
                placeholderTextColor="#9CA3AF"
                {...props}
            />
        </View>
        {error && (
            <TextTheme style={tw`text-red-500 text-sm mt-1`}>
                {error}
            </TextTheme>
        )}
    </View>
);

// Notification type enum
export enum NotificationType {
    SYSTEM = 'SYSTEM',
    PAYMENT = 'PAYMENT',
    STATUS_UPDATE = 'STATUS_UPDATE',
    ANNOUNCEMENT = 'ANNOUNCEMENT',
    CHAT = 'CHAT',
    ORDER = 'ORDER',
    PROMOTION = 'PROMOTION',
    REMINDER = 'REMINDER'
}

// Role type enum
export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
    HOSPITAL = 'hospital',
    RESTAURANT = 'restaurant',
    ATTRACTIONS = 'attractions',
    LEARNING_RESOURCES = 'learning_resources',
    ACCOMMODATION = 'accommodation'
}

interface NotificationFormProps {
    visible: boolean;
    onClose: () => void;
    onSubmit?: (message: NotificationMessage) => void;
}

interface NotificationMessage {
    type: NotificationType;
    title: string;
    body: string;
    receive: {
        all: boolean;
        role?: UserRole[];
    };
    data: {
        link: string;
    };
}

interface FormErrors {
    title?: string;
    body?: string;
    roles?: string;
}

const ROLES = [
    { label: 'ทุกคน', value: 'all' },
    { label: 'ผู้ใช้งานทั่วไป', value: UserRole.USER },
    { label: 'ผู้ดูแลระบบ', value: UserRole.ADMIN },
    { label: 'โรงพยาบาล', value: UserRole.HOSPITAL },
    { label: 'ร้านอาหาร', value: UserRole.RESTAURANT },
    { label: 'สถานที่ท่องเที่ยว', value: UserRole.ATTRACTIONS },
    { label: 'แหล่งเรียนรู้', value: UserRole.LEARNING_RESOURCES },
    { label: 'ที่พัก', value: UserRole.ACCOMMODATION }
] as const;

const NOTIFICATION_TYPES = [
    { label: 'ระบบ', value: NotificationType.SYSTEM },
    { label: 'การชำระเงิน', value: NotificationType.PAYMENT },
    { label: 'อัพเดทสถานะ', value: NotificationType.STATUS_UPDATE },
    { label: 'ประกาศ', value: NotificationType.ANNOUNCEMENT },
    { label: 'แชท', value: NotificationType.CHAT },
    { label: 'คำสั่งซื้อ', value: NotificationType.ORDER },
    { label: 'โปรโมชั่น', value: NotificationType.PROMOTION },
    { label: 'เตือนความจำ', value: NotificationType.REMINDER }
] as const;

const NotificationForm: React.FC<NotificationFormProps> = ({
    visible,
    onClose,
    onSubmit,
}) => {
    const [formData, setFormData] = useState<{
        title: string;
        body: string;
        type: NotificationType;
    }>({
        title: '',
        body: '',
        type: NotificationType.SYSTEM,
    });

    const [selectedRoles, setSelectedRoles] = useState<Array<UserRole | 'all'>>([]);
    const [errors, setErrors] = useState<FormErrors>({});

    const validate = (): FormErrors => {
        const newErrors: FormErrors = {};
        if (!formData.title.trim()) newErrors.title = 'กรุณากรอกหัวข้อ';
        if (!formData.body.trim()) newErrors.body = 'กรุณากรอกเนื้อหา';
        if (selectedRoles.length === 0) newErrors.roles = 'กรุณาเลือกผู้รับ';
        return newErrors;
    };

    const handleSubmit = () => {
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const message: NotificationMessage = {
            type: formData.type,
            title: formData.title,
            body: formData.body,
            receive: selectedRoles.includes('all')
                ? { all: true }
                : { all: false, role: selectedRoles.filter((role): role is UserRole => role !== 'all') },
            data: { link: '/notifications' }
        };

        onSubmit?.(message);
        handleClose();
    };

    const handleClose = () => {
        setFormData({
            title: '',
            body: '',
            type: NotificationType.SYSTEM,
        });
        setSelectedRoles([]);
        setErrors({});
        onClose();
    };

    const toggleRole = (role: UserRole | 'all') => {
        if (role === 'all') {
            setSelectedRoles(['all']);
            return;
        }

        const newRoles = selectedRoles.includes(role)
            ? selectedRoles.filter(r => r !== role)
            : [...selectedRoles.filter(r => r !== 'all'), role];
        setSelectedRoles(newRoles);
    };

    const getRoleIcon = (role: UserRole | 'all'): keyof typeof Ionicons.glyphMap => {
        const iconMap: Record<UserRole | 'all', keyof typeof Ionicons.glyphMap> = {
            user: 'person',
            admin: 'shield',
            hospital: 'medical',
            restaurant: 'restaurant',
            attractions: 'map',
            learning_resources: 'book',
            accommodation: 'bed',
            all: 'people'
        };
        return iconMap[role];
    };


    return (
        <Dialog visible={visible} onDialogDismissed={handleClose}>
            <View style={tw`bg-white rounded-2xl w-[90%] max-w-md mx-auto`}>
                <View style={tw`p-4 border-b border-gray-200`}>
                    <TextTheme font="Prompt-Medium" size="lg">ส่งการแจ้งเตือน</TextTheme>
                </View>

                <ScrollView onScroll={Keyboard.dismiss}>
                    <View style={tw`p-4`}>
                        <View style={tw`mb-4`}>
                            <TextTheme font="Prompt-Medium" style={tw`mb-2`}>ประเภท</TextTheme>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-4 px-4`}>
                                <View style={tw`flex-row gap-2 mr-8`}>
                                    {NOTIFICATION_TYPES.map(type => (
                                        <TouchableOpacity
                                            key={type.value}
                                            onPress={() => setFormData({ ...formData, type: type.value })}
                                            style={[
                                                tw`px-3 py-1 rounded-full border`,
                                                formData.type === type.value
                                                    ? tw`bg-blue-500 border-blue-500`
                                                    : tw`border-gray-300`
                                            ]}
                                        >
                                            <TextTheme
                                                color={formData.type === type.value ? 'white' : 'black'}
                                                size="sm"
                                            >
                                                {type.label}
                                            </TextTheme>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        {/* หัวข้อ */}
                        <CustomInput
                            label="หัวข้อ"
                            value={formData.title}
                            onChangeText={(text) => {
                                setFormData({ ...formData, title: text });
                                if (errors.title) {
                                    setErrors({ ...errors, title: undefined });
                                }
                            }}
                            error={errors.title}
                            placeholder="กรอกหัวข้อการแจ้งเตือน"
                        />

                        {/* เนื้อหา */}
                        <CustomInput
                            label="เนื้อหา"
                            value={formData.body}
                            onChangeText={(text) => {
                                setFormData({ ...formData, body: text });
                                if (errors.body) {
                                    setErrors({ ...errors, body: undefined });
                                }
                            }}
                            error={errors.body}
                            placeholder="กรอกเนื้อหาการแจ้งเตือน"
                            multiline
                            numberOfLines={3}
                            style={[tw`h-24 border border-zinc-200 rounded-xl p-2`]}
                        />

                        {/* เลือกผู้รับ */}
                        <View style={tw`mb-4`}>
                            <TextTheme font="Prompt-Medium" style={tw`mb-2`}>ส่งถึง</TextTheme>
                            <View style={tw`flex-row flex-wrap gap-2`}>
                                {ROLES.map(role => (
                                    <TouchableOpacity
                                        key={role.value}
                                        onPress={() => toggleRole(role.value)}
                                        style={[
                                            tw`px-3 py-2 rounded-xl border flex-row items-center gap-2`,
                                            selectedRoles.includes(role.value)
                                                ? tw`bg-blue-500 border-blue-500`
                                                : tw`border-gray-300`
                                        ]}
                                    >
                                        <Ionicons
                                            name={getRoleIcon(role.value)}
                                            size={16}
                                            color={selectedRoles.includes(role.value) ? "white" : "#666"}
                                        />
                                        <TextTheme
                                            color={selectedRoles.includes(role.value) ? 'white' : 'black'}
                                            size="sm"
                                        >
                                            {role.label}
                                        </TextTheme>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {errors.roles && (
                                <TextTheme style={tw`text-red-500 text-sm mt-1`}>{errors.roles}</TextTheme>
                            )}
                        </View>
                    </View>
                </ScrollView>

                <View style={tw`p-4 border-t border-gray-200 flex-row justify-end gap-2`}>
                    <TouchableOpacity
                        onPress={handleClose}
                        style={tw`px-4 py-2 rounded-lg bg-gray-100 flex-1 flex-row justify-center`}
                    >
                        <TextTheme>ยกเลิก</TextTheme>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        style={tw`px-4 py-2 rounded-lg bg-blue-500 flex-row items-center gap-2`}
                    >
                        <TextTheme color="white">ส่งการแจ้งเตือน</TextTheme>
                        <Ionicons name="paper-plane" size={16} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </Dialog>
    );
};

export default NotificationForm;