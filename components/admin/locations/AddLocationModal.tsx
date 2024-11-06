import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView } from 'react-native';
import { Dialog, TouchableOpacity } from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';
import TextTheme from '@/components/TextTheme';
import tw from 'twrnc';
import api from '@/helper/api';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';

interface AddLocationModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface LocationMap {
    latitude: string;
    longitude: string;
}

interface LocationFormData {
    name: string;
    type: number;
    map: LocationMap;
    note?: string;
    time_slots?: string[];
    owner_id?: number | null;
    address?: string;
    subdistrict_id?: number;
}

interface FormErrors {
    [key: string]: string | undefined;
}

interface User {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    role: string;
}

interface Subdistrict {
    id: number;
    name: string;
}

const LOCATION_TYPES = [
    { id: 1, name: 'สถานที่ท่องเที่ยว', icon: 'map', role: 'attractions' },
    { id: 2, name: 'ที่พัก', icon: 'bed', role: 'accommodation' },
    { id: 3, name: 'แหล่งเรียนรู้', icon: 'book', role: 'learning_resources' },
    { id: 4, name: 'ร้านอาหารและของฝาก', icon: 'restaurant', role: 'restaurant' },
    { id: 5, name: 'โรงพยาบาล', icon: 'medical', role: 'hospital' }
] as const;

const DEFAULT_TIME_SLOTS = [
    "09:00-10:00", "10:00-11:00", "11:00-12:00",
    "12:00-13:00", "13:00-14:00", "14:00-15:00",
    "15:00-16:00", "16:00-17:00"
];

const initialFormData: LocationFormData = {
    name: '',
    type: 1,
    map: {
        latitude: '',
        longitude: ''
    },
    note: '',
    time_slots: [],
    owner_id: null,
    address: '',
    subdistrict_id: undefined
};

const AddLocationModal: React.FC<AddLocationModalProps> = ({
    isVisible,
    onClose,
    onSuccess
}) => {
    const [formData, setFormData] = useState<LocationFormData>(initialFormData);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showTimeSlots, setShowTimeSlots] = useState(false);
    const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);

    // New states
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);
    const [showUserSelector, setShowUserSelector] = useState(false);

    // Fetch users and subdistricts
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersResponse, subdistrictsResponse] = await Promise.all([
                    api.get('/api/users'),
                    api.get('/api/subdistricts')
                ]);

                if (usersResponse.data.success) {
                    setUsers(usersResponse.data.users);
                }
                if (subdistrictsResponse.data.success) {
                    setSubdistricts(subdistrictsResponse.data.subdistricts);
                }
            } catch (error) {
                handleAxiosError(error, handleErrorMessage);
            }
        };

        if (isVisible) {
            fetchData();
        }
    }, [isVisible]);

    // Filter users based on selected location type
    useEffect(() => {
        const selectedType = LOCATION_TYPES.find(type => type.id === formData.type);
        if (selectedType) {
            const filteredUsers = users.filter(user => user.role === selectedType.role);
            setFilteredUsers(filteredUsers);
        }
    }, [formData.type, users]);

    const validate = () => {
        const newErrors: FormErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'กรุณากรอกชื่อสถานที่';
        }
        if (!formData.type) {
            newErrors.type = 'กรุณาเลือกประเภทสถานที่';
        }
        if (!formData.address?.trim()) {
            newErrors.address = 'กรุณากรอกที่อยู่';
        }
        if (!formData.subdistrict_id) {
            newErrors.subdistrict = 'กรุณาเลือกตำบล';
        }
        return newErrors;
    };


    const handleSubmit = async () => {
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);
        try {
            const submitData = {
                ...formData,
                time_slots: selectedTimeSlots.length > 0 ? selectedTimeSlots : undefined,
                map: formData.map.latitude && formData.map.longitude ? formData.map : null
            };

            const response = await api.post('/api/locations', submitData);
            if (response.data.success) {
                handleErrorMessage('เพิ่มสถานที่สำเร็จ');
                onSuccess?.();
                handleClose();
            }
        } catch (error) {
            handleAxiosError(error, handleErrorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFormData(initialFormData);
        setErrors({});
        setSelectedTimeSlots([]);
        setShowTimeSlots(false);
        onClose();
    };

    const updateMapLocation = (field: keyof LocationMap, value: string) => {
        setFormData(prev => ({
            ...prev,
            map: {
                ...prev.map,
                [field]: value
            }
        }));
    };

    const toggleTimeSlot = (slot: string) => {
        setSelectedTimeSlots(prev =>
            prev.includes(slot)
                ? prev.filter(s => s !== slot)
                : [...prev, slot].sort()
        );
    };

    const clearError = (field: keyof FormErrors) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    };

    return (
        <Dialog visible={isVisible} onDialogDismissed={handleClose}>
            <View style={tw`h-full justify-center items-center`}>
                
                <View style={tw`bg-white rounded-2xl h-[85%] max-w-md mx-auto w-full`}>
                    
                    <View style={tw`flex-row justify-between items-center p-4 border-b border-gray-200`}>
                        <TextTheme font="Prompt-SemiBold" size="xl">
                            เพิ่มสถานที่ใหม่
                        </TextTheme>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        <View style={tw`p-4`}>
                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-2`}>ชื่อสถานที่</TextTheme>
                                <TextInput
                                    value={formData.name}
                                    onChangeText={(text) => {
                                        setFormData(prev => ({ ...prev, name: text }));
                                        clearError('name');
                                    }}
                                    style={[
                                        tw`bg-white border rounded-xl px-4 py-3`,
                                        errors.name ? tw`border-red-300` : tw`border-gray-200`
                                    ]}
                                    placeholder="กรอกชื่อสถานที่"
                                />
                                {errors.name && (
                                    <TextTheme style={tw`text-red-500 text-sm mt-1`}>{errors.name}</TextTheme>
                                )}
                            </View>

                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-2`}>ที่อยู่</TextTheme>
                                <TextInput
                                    value={formData.address}
                                    onChangeText={(text) => {
                                        setFormData(prev => ({ ...prev, address: text }));
                                        clearError('address');
                                    }}
                                    style={[
                                        tw`bg-white border rounded-xl px-4 py-3`,
                                        errors.address ? tw`border-red-300` : tw`border-gray-200`
                                    ]}
                                    placeholder="กรอกที่อยู่"
                                    multiline
                                />
                                {errors.address && (
                                    <TextTheme style={tw`text-red-500 text-sm mt-1`}>{errors.address}</TextTheme>
                                )}
                            </View>

                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-2`}>ตำบล</TextTheme>
                                <View style={tw`flex-row flex-wrap gap-2`}>
                                    {subdistricts.map(subdistrict => (
                                        <TouchableOpacity
                                            key={subdistrict.id}
                                            onPress={() => setFormData(prev => ({
                                                ...prev,
                                                subdistrict_id: subdistrict.id
                                            }))}
                                            style={[
                                                tw`px-3 py-2 rounded-xl border flex-row items-center`,
                                                formData.subdistrict_id === subdistrict.id
                                                    ? tw`bg-blue-500 border-blue-500`
                                                    : tw`border-gray-300`
                                            ]}
                                        >
                                            <TextTheme
                                                color={formData.subdistrict_id === subdistrict.id ? 'white' : 'black'}
                                                size="sm"
                                            >
                                                {subdistrict.name}
                                            </TextTheme>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {errors.subdistrict && (
                                    <TextTheme style={tw`text-red-500 text-sm mt-1`}>{errors.subdistrict}</TextTheme>
                                )}
                            </View>

                            <View style={tw`mb-4`}>
                                <View style={tw`flex-row justify-between items-center mb-2`}>
                                    <TextTheme font="Prompt-Medium">ผู้ดูแลสถานที่</TextTheme>
                                    <TouchableOpacity
                                        onPress={() => setShowUserSelector(!showUserSelector)}
                                        style={tw`flex-row items-center gap-1`}
                                    >
                                        <TextTheme size="sm" style={tw`text-blue-500`}>
                                            {showUserSelector ? 'ซ่อน' : 'แสดง'}
                                        </TextTheme>
                                        <Ionicons
                                            name={showUserSelector ? 'chevron-up' : 'chevron-down'}
                                            size={16}
                                            color="#3B82F6"
                                        />
                                    </TouchableOpacity>
                                </View>

                                {showUserSelector && (
                                    <View style={tw`border rounded-xl p-4`}>
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers.map(user => (
                                                <TouchableOpacity
                                                    key={user.id}
                                                    onPress={() => setFormData(prev => ({
                                                        ...prev,
                                                        owner_id: user.id
                                                    }))}
                                                    style={[
                                                        tw`p-3 rounded-xl flex-row justify-between items-center`,
                                                        formData.owner_id === user.id && tw`bg-blue-50`
                                                    ]}
                                                >
                                                    <View>
                                                        <TextTheme>{user.firstname} {user.lastname}</TextTheme>
                                                        <TextTheme size="sm" style={tw`text-gray-500`}>
                                                            {user.email}
                                                        </TextTheme>
                                                    </View>
                                                    {formData.owner_id === user.id && (
                                                        <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                                                    )}
                                                </TouchableOpacity>
                                            ))
                                        ) : (
                                            <TextTheme style={tw`text-center text-gray-500`}>
                                                ไม่พบผู้ใช้ที่มีสิทธิ์ดูแลสถานที่ประเภทนี้
                                            </TextTheme>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* ประเภทสถานที่ */}
                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-2`}>ประเภทสถานที่</TextTheme>
                                <View style={tw`flex-row flex-wrap gap-2`}>
                                    {LOCATION_TYPES.map(type => (
                                        <TouchableOpacity
                                            key={type.id}
                                            onPress={() => setFormData(prev => ({ ...prev, type: type.id }))}
                                            style={[
                                                tw`px-3 py-2 rounded-xl border flex-row items-center gap-2`,
                                                formData.type === type.id
                                                    ? tw`bg-blue-500 border-blue-500`
                                                    : tw`border-gray-300`
                                            ]}
                                        >
                                            <Ionicons
                                                name={type.icon as keyof typeof Ionicons.glyphMap}
                                                size={16}
                                                color={formData.type === type.id ? "white" : "#666"}
                                            />
                                            <TextTheme
                                                color={formData.type === type.id ? 'white' : 'black'}
                                                size="sm"
                                            >
                                                {type.name}
                                            </TextTheme>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* พิกัดแผนที่ */}
                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-2`}>พิกัดแผนที่ (ถ้ามี)</TextTheme>
                                <View style={tw`flex-row gap-2`}>
                                    <View style={tw`flex-1`}>
                                        <TextInput
                                            value={formData.map.latitude}
                                            onChangeText={(text) => updateMapLocation('latitude', text)}
                                            style={tw`bg-white border border-gray-200 rounded-xl px-4 py-3`}
                                            placeholder="Latitude"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={tw`flex-1`}>
                                        <TextInput
                                            value={formData.map.longitude}
                                            onChangeText={(text) => updateMapLocation('longitude', text)}
                                            style={tw`bg-white border border-gray-200 rounded-xl px-4 py-3`}
                                            placeholder="Longitude"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* เวลาทำการ */}
                            <View style={tw`mb-4`}>
                                <View style={tw`flex-row justify-between items-center mb-2`}>
                                    <TextTheme font="Prompt-Medium">เวลาทำการ</TextTheme>
                                    <TouchableOpacity
                                        onPress={() => setShowTimeSlots(!showTimeSlots)}
                                        style={tw`flex-row items-center gap-1`}
                                    >
                                        <TextTheme size="sm" style={tw`text-blue-500`}>
                                            {showTimeSlots ? 'ซ่อน' : 'แสดง'}
                                        </TextTheme>
                                        <Ionicons
                                            name={showTimeSlots ? 'chevron-up' : 'chevron-down'}
                                            size={16}
                                            color="#3B82F6"
                                        />
                                    </TouchableOpacity>
                                </View>

                                {showTimeSlots && (
                                    <View style={tw`flex-row flex-wrap gap-2`}>
                                        {DEFAULT_TIME_SLOTS.map(slot => (
                                            <TouchableOpacity
                                                key={slot}
                                                onPress={() => toggleTimeSlot(slot)}
                                                style={[
                                                    tw`px-3 py-1 rounded-full border`,
                                                    selectedTimeSlots.includes(slot)
                                                        ? tw`bg-blue-500 border-blue-500`
                                                        : tw`border-gray-300`
                                                ]}
                                            >
                                                <TextTheme
                                                    color={selectedTimeSlots.includes(slot) ? 'white' : 'black'}
                                                    size="sm"
                                                >
                                                    {slot}
                                                </TextTheme>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* หมายเหตุ */}
                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-2`}>หมายเหตุ (ถ้ามี)</TextTheme>
                                <TextInput
                                    value={formData.note}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, note: text }))}
                                    style={tw`bg-white border border-gray-200 rounded-xl px-4 py-3`}
                                    placeholder="หมายเหตุเพิ่มเติม"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        </View>
                    </ScrollView>

                    <View style={tw`p-4 border-t border-gray-200 flex-row justify-end gap-2`}>
                        <TouchableOpacity
                            onPress={handleClose}
                            style={tw`px-4 py-2 rounded-lg bg-gray-100`}
                        >
                            <TextTheme>ยกเลิก</TextTheme>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isLoading}
                            style={tw`px-4 py-2 rounded-lg bg-blue-500 flex-row items-center gap-2`}
                        >
                            <TextTheme color="white">
                                {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                            </TextTheme>
                            {!isLoading && <Ionicons name="save" size={16} color="white" />}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Dialog >
    );
};

export default AddLocationModal;