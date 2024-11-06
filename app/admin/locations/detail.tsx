// components/admin/locations/LocationDetail.tsx
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Image, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import TextTheme from '@/components/TextTheme';
import { Dialog } from 'react-native-ui-lib';
import api from '@/helper/api';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import type { Locations } from '@/types/PrismaType';
import LoadingScreen from '@/components/LoadingScreen';

interface LocationDetailInfo {
    address?: string;
    contact?: {
        tel?: string[];
        line_id?: string;
        email?: string;
    };
    date_info?: {
        text: string;
        start?: string;
        end?: string;
    };
    description?: string;
    interest?: string;
    service_fee?: string;
    health?: string;
    activites?: string;
    images?: string[];
}

const LOCATION_TYPE_MAP = {
    1: { key: 'attractions', name: 'สถานที่ท่องเที่ยว' },
    2: { key: 'accommodation', name: 'ที่พัก' },
    3: { key: 'learning_resources', name: 'แหล่งเรียนรู้' },
    4: { key: 'restaurant', name: 'ร้านอาหาร' },
    5: { key: 'hospital', name: 'โรงพยาบาล' }
} as const;

type LocationTypeKeys = 'attractions' | 'accommodation' | 'learning_resources' | 'restaurant' | 'hospital';

// Helper Functions
const getLocationTypeKey = (type: number): LocationTypeKeys | null => {
    const typeInfo = LOCATION_TYPE_MAP[type as keyof typeof LOCATION_TYPE_MAP];
    return typeInfo ? typeInfo.key as LocationTypeKeys : null;
};

const LocationDetail: React.FC = () => {
    const { locations_id } = useLocalSearchParams();
    const [location, setLocation] = useState<Locations | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<Partial<Locations> & { detail?: LocationDetailInfo }>({});
    const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);

    useEffect(() => {
        fetchLocationDetail();
    }, [locations_id]);

    const fetchLocationDetail = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/api/admin/locations/${locations_id}`);
            if (response.data.success) {
                setLocation(response.data.location);
                // แปลงข้อมูลสำหรับการแก้ไข
                const locationDetail = getLocationDetail(response.data.location);
                setEditedData({
                    ...response.data.location,
                    detail: locationDetail
                });
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message);
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getLocationDetail = (location: Locations): LocationDetailInfo => {
        const typeKey = getLocationTypeKey(location.type);
        if (!typeKey) return {};

        const details = location[typeKey]?.[0] || {};
        return {
            ...details,
            contact: details.contact ? JSON.parse(details.contact) : undefined,
            date_info: details.date_info ? JSON.parse(details.date_info) : undefined,
            images: details.images ? JSON.parse(details.images) : undefined
        };
    };

    const handleSave = async () => {
        try {
            const response = await api.put(`/api/admin/locations/${locations_id}`, editedData);
            if (response.data.success) {
                handleErrorMessage('บันทึกการเปลี่ยนแปลงสำเร็จ');
                setIsEditing(false);
                fetchLocationDetail();
            }
        } catch (error) {
            handleAxiosError(error, handleErrorMessage);
        }
    };

    const handleDelete = async () => {
        try {
            const response = await api.delete(`/api/admin/locations/${locations_id}`);
            if (response.data.success) {
                handleErrorMessage('ลบสถานที่สำเร็จ');
                router.back();
            }
        } catch (error) {
            handleAxiosError(error, handleErrorMessage);
        }
    };

    const handleToggleStatus = async (id: number, isActive: boolean) => {
        try {
            const response = await api.put(`/api/admin/locations/${id}/status`, {
                status: isActive ? 'active' : 'inactive'
            });
            if (response.data.success) {
                // setLocations(prev =>
                //     prev.map(item =>
                //         item.id === id ? { ...item, isActive } : item
                //     )
                // );
                handleErrorMessage(`${isActive ? 'เปิด' : 'ปิด'}ให้บริการสำเร็จ`);
            }
        } catch (error) {
            handleAxiosError(error, handleErrorMessage);
        }
    };

    if (isLoading || !location) {
        return <LoadingScreen />;
    }

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Header */}
            < View style={tw`bg-white border-b border-gray-200`}>
                <View style={tw`px-4 pt-14 pb-4 flex-row justify-between items-center`}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={tw`flex-row items-center`}
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                        <TextTheme style={tw`ml-2`}> ย้อนกลับ </TextTheme>
                    </TouchableOpacity>
                    <View style={tw`flex-row gap-2`}>
                        {
                            isEditing ? (
                                <>
                                    <TouchableOpacity
                                        onPress={() => setIsEditing(false)}
                                        style={tw`px-4 py-2 bg-gray-100 rounded-xl`}
                                    >
                                        <TextTheme>ยกเลิก </TextTheme>
                                    </TouchableOpacity>
                                    < TouchableOpacity
                                        onPress={handleSave}
                                        style={tw`px-4 py-2 bg-blue-600 rounded-xl flex-row items-center gap-2`}
                                    >
                                        <TextTheme color="white" > บันทึก </TextTheme>
                                        < Ionicons name="save" size={20} color="white" />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        onPress={() => setIsEditing(true)}
                                        style={tw`px-4 py-2 bg-blue-600 rounded-xl flex-row items-center gap-2`}
                                    >
                                        <TextTheme color="white" > แก้ไข </TextTheme>
                                        < Ionicons name="create" size={20} color="white" />
                                    </TouchableOpacity>
                                    < TouchableOpacity
                                        onPress={() => setIsDeleteDialogVisible(true)}
                                        style={tw`px-4 py-2 bg-red-600 rounded-xl flex-row items-center gap-2`}
                                    >
                                        <TextTheme color="white" > ลบ </TextTheme>
                                        < Ionicons name="trash" size={20} color="white" />
                                    </TouchableOpacity>
                                </>
                            )}
                    </View>
                </View>
            </View>

            {/* Content */}
            <ScrollView>
                {/* รูปภาพสถานที่ */}
                < View style={tw`bg-white p-4 mb-2`}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} >
                        <View style={tw`flex-row gap-2`}>
                            {
                                editedData.detail?.images?.map((image, index) => (
                                    <Image
                                        key={index}
                                        source={{ uri: image }}
                                        style={tw`w-40 h-40 rounded-xl`}
                                    />
                                ))}
                        </View>
                    </ScrollView>
                </View>

                {/* ข้อมูลทั่วไป */}
                <View style={tw`bg-white p-4 mb-2`}>
                    <TextTheme font="Prompt-Medium" size="lg" style={tw`mb-4`}>
                        ข้อมูลทั่วไป
                    </TextTheme>

                    < View style={tw`mb-4`}>
                        <TextTheme font="Prompt-Medium" style={tw`mb-1`}> ชื่อสถานที่ </TextTheme>
                        < TextInput
                            value={editedData.name}
                            onChangeText={text => setEditedData(prev => ({ ...prev, name: text }))}
                            editable={isEditing}
                            style={
                                [
                                    tw`bg-white border rounded-xl px-4 py-3`,
                                    isEditing ? tw`border-gray-200` : tw`border-transparent bg-gray-50`
                                ]}
                        />
                    </View>

                    <View style={tw`mb-4`}>
                        <TextTheme font="Prompt-Medium" style={tw`mb-1`}> ที่อยู่ </TextTheme>
                        <TextInput
                            value={editedData.detail?.address}
                            onChangeText={
                                text =>
                                    setEditedData(prev => ({
                                        ...prev,
                                        detail: { ...prev.detail, address: text }
                                    }))
                            }
                            editable={isEditing}
                            multiline
                            style={
                                [
                                    tw`bg-white border rounded-xl px-4 py-3`,
                                    isEditing ? tw`border-gray-200` : tw`border-transparent bg-gray-50`
                                ]}
                        />
                    </View>

                    {/* เพิ่มฟิลด์อื่นๆ ตามต้องการ */}
                </View>

                {/* <TouchableOpacity
                    onPress={() => onToggleStatus(item.id, !item.isActive)}
                    style={tw`flex-row items-center gap-1`}
                >
                    <Ionicons
                        name={item.isActive ? 'power' : 'power-outline'}
                        size={16}
                        color={item.isActive ? '#10B981' : '#EF4444'}
                    />
                    <TextTheme size="sm" style={tw`text-gray-500`}>
                        {item.isActive ? 'เปิดอยู่' : 'ปิดอยู่'}
                    </TextTheme>
                </TouchableOpacity> */}

                {/* ข้อมูลการติดต่อ */}
                <View style={tw`bg-white p-4 mb-2`}>
                    <TextTheme font="Prompt-Medium" size="lg" style={tw`mb-4`}>
                        ข้อมูลการติดต่อ
                    </TextTheme>

                    {isEditing ? (
                        <>
                            {/* เบอร์โทรศัพท์ */}
                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-1`}>เบอร์โทรศัพท์</TextTheme>
                                {editedData.detail?.contact?.tel?.map((tel, index) => (
                                    <View key={index} style={tw`flex-row items-center gap-2 mb-2`}>
                                        <TextInput
                                            value={tel}
                                            onChangeText={(text) => {
                                                const newTel = [...(editedData.detail?.contact?.tel || [])];
                                                newTel[index] = text;
                                                setEditedData(prev => ({
                                                    ...prev,
                                                    detail: {
                                                        ...prev.detail,
                                                        contact: {
                                                            ...prev.detail?.contact,
                                                            tel: newTel
                                                        }
                                                    }
                                                }));
                                            }}
                                            style={tw`flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3`}
                                            keyboardType="phone-pad"
                                        />
                                        <TouchableOpacity
                                            onPress={() => {
                                                const newTel = editedData.detail?.contact?.tel?.filter((_, i) => i !== index);
                                                setEditedData(prev => ({
                                                    ...prev,
                                                    detail: {
                                                        ...prev.detail,
                                                        contact: {
                                                            ...prev.detail?.contact,
                                                            tel: newTel
                                                        }
                                                    }
                                                }));
                                            }}
                                            style={tw`p-2`}
                                        >
                                            <Ionicons name="trash" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditedData(prev => ({
                                            ...prev,
                                            detail: {
                                                ...prev.detail,
                                                contact: {
                                                    ...prev.detail?.contact,
                                                    tel: [...(prev.detail?.contact?.tel || []), '']
                                                }
                                            }
                                        }));
                                    }}
                                    style={tw`flex-row items-center gap-2 mt-2`}
                                >
                                    <Ionicons name="add-circle" size={20} color="#3B82F6" />
                                    <TextTheme style={tw`text-blue-500`}>เพิ่มเบอร์โทรศัพท์</TextTheme>
                                </TouchableOpacity>
                            </View>

                            {/* Line ID */}
                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-1`}>Line ID</TextTheme>
                                <TextInput
                                    value={editedData.detail?.contact?.line_id}
                                    onChangeText={(text) => {
                                        setEditedData(prev => ({
                                            ...prev,
                                            detail: {
                                                ...prev.detail,
                                                contact: {
                                                    ...prev.detail?.contact,
                                                    line_id: text
                                                }
                                            }
                                        }));
                                    }}
                                    style={tw`bg-white border border-gray-200 rounded-xl px-4 py-3`}
                                />
                            </View>

                            {/* Email */}
                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-1`}>Email</TextTheme>
                                <TextInput
                                    value={editedData.detail?.contact?.email}
                                    onChangeText={(text) => {
                                        setEditedData(prev => ({
                                            ...prev,
                                            detail: {
                                                ...prev.detail,
                                                contact: {
                                                    ...prev.detail?.contact,
                                                    email: text
                                                }
                                            }
                                        }));
                                    }}
                                    style={tw`bg-white border border-gray-200 rounded-xl px-4 py-3`}
                                    keyboardType="email-address"
                                />
                            </View>
                        </>
                    ) : (
                        <>
                            {
                                editedData.detail?.contact?.tel?.map((tel, index) => (
                                    <View key={index} style={tw`mb-2 flex-row items-center gap-2`}>
                                        <Ionicons name="call" size={20} color="#6B7280" />
                                        <TextTheme>{tel} </TextTheme>
                                    </View>
                                ))}

                            {
                                editedData.detail?.contact?.line_id && (
                                    <View style={tw`mb-2 flex-row items-center gap-2`}>
                                        <Ionicons name="logo-linkedin" size={20} color="#6B7280" />
                                        <TextTheme>{editedData.detail.contact.line_id} </TextTheme>
                                    </View>
                                )
                            }

                            {
                                editedData.detail?.contact?.email && (
                                    <View style={tw`mb-2 flex-row items-center gap-2`}>
                                        <Ionicons name="mail" size={20} color="#6B7280" />
                                        <TextTheme>{editedData.detail.contact.email} </TextTheme>
                                    </View>
                                )
                            }
                        </>
                    )}
                </View>

                <View style={tw`bg-white p-4 mb-2`}>
                    <TextTheme font="Prompt-Medium" size="lg" style={tw`mb-4`}>เวลาทำการ</TextTheme>

                    {isEditing ? (
                        <View>
                            <View style={tw`mb-4`}>
                                <TextTheme font="Prompt-Medium" style={tw`mb-1`}>รายละเอียด</TextTheme>
                                <TextInput
                                    value={editedData.detail?.date_info?.text}
                                    onChangeText={(text) => {
                                        setEditedData(prev => ({
                                            ...prev,
                                            detail: {
                                                ...prev.detail,
                                                date_info: {
                                                    ...prev.detail?.date_info,
                                                    text
                                                }
                                            }
                                        }));
                                    }}
                                    style={tw`bg-white border border-gray-200 rounded-xl px-4 py-3`}
                                />
                            </View>

                            <View style={tw`flex-row gap-2 mb-4`}>
                                <View style={tw`flex-1`}>
                                    <TextTheme font="Prompt-Medium" style={tw`mb-1`}>เวลาเปิด</TextTheme>
                                    <TextInput
                                        value={editedData.detail?.date_info?.start}
                                        // onChangeText={(text) => {
                                        //     setEditedData(prev => ({
                                        //         ...prev,
                                        //         detail: {
                                        //             ...prev.detail,
                                        //             date_info: {
                                        //                 ...prev.detail?.date_info,
                                        //                 start: text
                                        //             }
                                        //         }
                                        //     }));
                                        // }}
                                        style={tw`bg-white border border-gray-200 rounded-xl px-4 py-3`}
                                    />
                                </View>

                                <View style={tw`flex-1`}>
                                    <TextTheme font="Prompt-Medium" style={tw`mb-1`}>เวลาปิด</TextTheme>
                                    <TextInput
                                        value={editedData.detail?.date_info?.end}
                                        // onChangeText={(text) => {
                                        //     setEditedData(prev => ({
                                        //         ...prev,
                                        //         detail: {
                                        //             ...prev.detail,
                                        //             date_info: {
                                        //                 ...prev.detail?.date_info,
                                        //                 end: text
                                        //             }
                                        //         }
                                        //     }));
                                        // }}
                                        style={tw`bg-white border border-gray-200 rounded-xl px-4 py-3`}
                                    />
                                </View>
                            </View>
                        </View>
                    ) : (
                        <>
                            <View style={tw`flex-row items-center gap-2`}>
                                <Ionicons name="time" size={20} color="#6B7280" />
                                <TextTheme>
                                    {editedData.detail?.date_info?.text}
                                    {
                                        editedData.detail?.date_info?.start && editedData.detail?.date_info?.end &&
                                        ` ${editedData.detail.date_info.start}-${editedData.detail.date_info.end}`
                                    }
                                </TextTheme>
                            </View>
                            {editedData.detail?.description && (
                                <View style={tw`bg-white p-4 mb-2`}>
                                    <TextTheme font="Prompt-Medium" size="lg" style={tw`mb-4`
                                    }>
                                        คำอธิบายเพิ่มเติม
                                    </TextTheme>
                                    < TextTheme style={tw`text-gray-600`}>
                                        {editedData.detail.description}
                                    </TextTheme>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* เวลาทำการ */}
                {/* <View style={tw`bg-white p-4 mb-2`}>
                    <TextTheme font="Prompt-Medium" size="lg" style={tw`mb-4`}>
                        เวลาทำการ
                    </TextTheme>

                    <View style={tw`flex-row items-center gap-2`}>
                        <Ionicons name="time" size={20} color="#6B7280" />
                        <TextTheme>
                            {editedData.detail?.date_info?.text}
                            {
                                editedData.detail?.date_info?.start && editedData.detail?.date_info?.end &&
                                ` ${editedData.detail.date_info.start}-${editedData.detail.date_info.end}`
                            }
                        </TextTheme>
                    </View>
                </View> */}

                {/* คำอธิบายเพิ่มเติม */}

            </ScrollView>

            {/* Delete Confirmation Dialog */}
            <Dialog
                visible={isDeleteDialogVisible}
                onDialogDismissed={() => setIsDeleteDialogVisible(false)}
            >
                <View style={tw`bg-white rounded-2xl p-4 w-[80%] max-w-sm mx-auto`}>
                    <TextTheme font="Prompt-Medium" size="lg" style={tw`mb-4 text-center`}>
                        ยืนยันการลบ
                    </TextTheme>
                    < TextTheme style={tw`text-center mb-6`}>
                        คุณต้องการลบสถานที่นี้ใช่หรือไม่ ?
                    </TextTheme>
                    < View style={tw`flex-row justify-end gap-2`}>
                        <TouchableOpacity
                            onPress={() => setIsDeleteDialogVisible(false)}
                            style={tw`px-4 py-2 bg-gray-100 rounded-xl`}
                        >
                            <TextTheme>ยกเลิก </TextTheme>
                        </TouchableOpacity>
                        < TouchableOpacity
                            onPress={handleDelete}
                            style={tw`px-4 py-2 bg-red-600 rounded-xl`}
                        >
                            <TextTheme color="white" > ลบ </TextTheme>
                        </TouchableOpacity>
                    </View>
                </View>
            </Dialog>
        </View>
    );
};

export default LocationDetail;