import React, { useState, useCallback } from 'react';
import { ScrollView, RefreshControl, Image } from 'react-native';
import { View, Colors, TabController, Dialog, Drawer, TouchableOpacity, Badge } from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import TextTheme from '@/components/TextTheme';
import { useStatusBar } from '@/hooks/useStatusBar';
import { Tabs, useFocusEffect } from 'expo-router';
import api from '@/helper/api';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import * as Animatable from 'react-native-animatable';
import { router } from 'expo-router';
import AddLocationModal from '@/components/admin/locations/AddLocationModal';
import SearchBar from '@/components/admin/locations/SearchBar';
import FilterButton from '@/components/admin/locations/FilterButton';
import { Locations } from '@/types/PrismaType';

interface tabItemsType {
    label: string;
    key: string;
    icon: keyof typeof Ionicons.glyphMap;
}

interface FilterOption {
    label: string;
    value: string;
}

interface LocationDetailType {
    address?: string;
    contact?: string;
    date_info?: string;
    images?: string;
}

// Constants
const LOCATION_TYPE_MAP = {
    1: { key: 'attractions', name: 'สถานที่ท่องเที่ยว', color: '#3B82F6', icon: 'map' },
    2: { key: 'accommodation', name: 'ที่พัก', color: '#EC4899', icon: 'bed' },
    3: { key: 'learning_resources', name: 'แหล่งเรียนรู้', color: '#8B5CF6', icon: 'book' },
    4: { key: 'restaurant', name: 'ร้านอาหาร', color: '#F59E0B', icon: 'restaurant' },
    5: { key: 'hospital', name: 'โรงพยาบาล', color: '#10B981', icon: 'medical' }
} as const;

const tabItems: tabItemsType[] = [
    { label: 'ทั้งหมด', key: 'ALL', icon: 'location' },
    ...Object.entries(LOCATION_TYPE_MAP).map(([id, info]) => ({
        label: info.name,
        key: id,
        icon: info.icon as keyof typeof Ionicons.glyphMap
    }))
];

// Helper Functions
const getLocationDetail = (location: Locations): LocationDetailType | null => {
    const typeInfo = LOCATION_TYPE_MAP[location.type as keyof typeof LOCATION_TYPE_MAP];
    if (!typeInfo) return null;

    const details = location[typeInfo.key as keyof Locations] as any[];
    return details && details.length > 0 ? details[0] : null;
};

const getLocationImages = (location: Locations): string[] => {
    const detail = getLocationDetail(location);
    if (!detail?.images) return [];
    try {
        return JSON.parse(detail.images);
    } catch {
        return [];
    }
};

const getLocationAddress = (location: Locations): string => {
    const detail = getLocationDetail(location);
    return detail?.address || '';
};

const getContactInfo = (location: Locations) => {
    const detail = getLocationDetail(location);
    if (!detail?.contact) return {};
    try {
        return JSON.parse(detail.contact);
    } catch {
        return {};
    }
};

const getDateInfo = (location: Locations) => {
    const detail = getLocationDetail(location);
    if (!detail?.date_info) return null;
    try {
        return JSON.parse(detail.date_info);
    } catch {
        return null;
    }
};

const getLocationTypeColor = (type: number): string => {
    return LOCATION_TYPE_MAP[type as keyof typeof LOCATION_TYPE_MAP]?.color || '#6B7280';
};

// Components
const LocationItem: React.FC<{
    item: Locations;
}> = ({ item }) => {
    const images = getLocationImages(item);
    const address = getLocationAddress(item);
    const contact = getContactInfo(item);
    const dateInfo = getDateInfo(item);

    return (
        <View style={tw`pt-2 px-2`}>
            <View style={tw`rounded-2xl border border-zinc-200 shadow bg-white`}>
                <TouchableOpacity
                    style={tw`p-4`}
                    onPress={() => router.navigate({
                        pathname: `/admin/locations/detail`,
                        params: {
                            locations_id: item.id
                        }
                    })}
                >
                    <View style={tw`flex-row gap-4`}>
                        {/* รูปภาพสถานที่ */}
                        <View style={tw`w-24 h-24 bg-gray-200 rounded-xl overflow-hidden`}>
                            {images[0] ? (
                                <Image
                                    source={{ uri: images[0] }}
                                    style={tw`w-full h-full`}
                                />
                            ) : (
                                <View style={tw`w-full h-full items-center justify-center`}>
                                    <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                                </View>
                            )}
                        </View>

                        <View style={tw`flex-1`}>
                            <View style={tw`flex-row items-center justify-between mb-1`}>
                                <Badge
                                    label={item.location_types.name}
                                    backgroundColor={getLocationTypeColor(item.type)}
                                    labelStyle={{ fontFamily: 'Prompt-Regular' }}
                                />
                                <Badge
                                    label={item.isActive ? 'เปิดให้บริการ' : 'ปิดให้บริการ'}
                                    backgroundColor={item.isActive ? Colors.green30 : Colors.red30}
                                    labelStyle={{ fontFamily: 'Prompt-Regular' }}
                                />
                            </View>

                            <TextTheme font="Prompt-Medium" style={tw`mb-1`}>
                                {item.name}
                            </TextTheme>

                            {address && (
                                <View style={tw`flex-row items-center gap-1 mb-1`}>
                                    <Ionicons name="location" size={16} color="#6B7280" />
                                    <TextTheme size="sm" style={tw`text-gray-500`} numberOfLines={1}>
                                        {address}
                                    </TextTheme>
                                </View>
                            )}

                            {contact.tel && (
                                <View style={tw`flex-row items-center gap-1 mb-1`}>
                                    <Ionicons name="call" size={16} color="#6B7280" />
                                    <TextTheme size="sm" style={tw`text-gray-500`}>
                                        {contact.tel[0]}
                                    </TextTheme>
                                </View>
                            )}

                            <View style={tw`flex-row items-center justify-between`}>
                                {dateInfo && (
                                    <TextTheme size="xs" style={tw`text-gray-500`}>
                                        เปิด: {dateInfo.text}
                                        {dateInfo.start && dateInfo.end && ` ${dateInfo.start}-${dateInfo.end}`}
                                    </TextTheme>
                                )}
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const LocationSkeletonLoader = () => (
    <View style={tw`pt-2 px-2`}>
        <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            style={tw`p-4 rounded-2xl border border-zinc-200 shadow bg-white`}
        >
            <View style={tw`flex-row gap-4`}>
                <View style={tw`w-24 h-24 bg-slate-200 rounded-xl`} />
                <View style={tw`flex-1`}>
                    <View style={tw`flex-row justify-between mb-4`}>
                        <View style={tw`w-20 h-6 bg-slate-200 rounded-full`} />
                        <View style={tw`w-24 h-6 bg-slate-200 rounded-full`} />
                    </View>
                    <View style={tw`mb-2 w-40 h-6 bg-slate-200 rounded`} />
                    <View style={tw`mb-2 w-full h-4 bg-slate-200 rounded`} />
                    <View style={tw`flex-row justify-between`}>
                        <View style={tw`w-16 h-4 bg-slate-200 rounded`} />
                        <View style={tw`w-16 h-4 bg-slate-200 rounded`} />
                    </View>
                </View>
            </View>
        </Animatable.View>
    </View>
);

const NoLocations = () => (
    <View style={tw`flex-1 justify-center items-center mt-20`}>
        <View style={tw`bg-slate-200 rounded-full p-4 mb-4`}>
            <Ionicons name="location-outline" size={50} style={tw`text-blue-500`} />
        </View>
        <TextTheme font="Prompt-Medium" size="lg" style={tw`text-slate-600 mb-1`}>
            ไม่พบสถานที่
        </TextTheme>
        <TextTheme size="sm" style={tw`text-slate-500 text-center px-6`}>
            ยังไม่มีข้อมูลสถานที่ในหมวดหมู่นี้
        </TextTheme>
    </View>
);

const LocationsAdminManager = () => {
    useStatusBar("dark-content");
    const [locations, setLocations] = useState<Locations[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTab, setSelectedTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('ALL');
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);

    const fetchLocations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/locations');
            if (response.data.success) {
                setLocations(response.data.locations);
            }
        } catch (error) {
            handleAxiosError(error, handleErrorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchLocations();
        }, [])
    );

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchLocations();
        setRefreshing(false);
    };


    const renderContent = (key: string) => {
        if (isLoading) {
            return [...Array(4)].map((_, i) => (
                <LocationSkeletonLoader key={i} />
            ));
        }

        let filteredLocations = [...locations];

        if (key !== 'ALL') {
            const typeId = parseInt(key);
            filteredLocations = filteredLocations.filter(location => location.type === typeId);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredLocations = filteredLocations.filter(location => {
                const address = getLocationAddress(location);
                return (
                    location.name.toLowerCase().includes(query) ||
                    address.toLowerCase().includes(query)
                );
            });
        }

        // ต่อจากฟังก์ชัน renderContent
        if (filteredLocations.length === 0) {
            return <NoLocations />;
        }

        if (key === 'ALL') {
            // จัดกลุ่มตาม location type
            const groupedLocations = filteredLocations.reduce((acc, location) => {
                const typeName = location.location_types.name;
                if (!acc[typeName]) {
                    acc[typeName] = [];
                }
                acc[typeName].push(location);
                return acc;
            }, {} as Record<string, Locations[]>);

            return (
                <>
                    {Object.entries(groupedLocations).map(([typeName, locations]) => (
                        <View key={typeName}>
                            <View style={tw`flex-row items-center gap-2 mt-4 mb-2 px-2`}>
                                <Ionicons
                                    name={LOCATION_TYPE_MAP[locations[0].type as keyof typeof LOCATION_TYPE_MAP]?.icon as keyof typeof Ionicons.glyphMap || 'location'}
                                    size={20}
                                    color={String(tw.color("blue-500"))}
                                />
                                <TextTheme font='Prompt-Medium' size='lg' style={tw`text-gray-900`}>
                                    {typeName}
                                </TextTheme>
                                <View style={tw`bg-blue-100 px-2 py-0.5 rounded-full`}>
                                    <TextTheme size='sm' style={tw`text-blue-700`}>
                                        {locations.length}
                                    </TextTheme>
                                </View>
                            </View>
                            {locations.map(location => (
                                <LocationItem
                                    key={location.id}
                                    item={location}
                                />
                            ))}
                        </View>
                    ))}
                </>
            );
        }

        return filteredLocations.map(location => (
            <LocationItem
                key={location.id}
                item={location}
            />
        ));
    };

    return (
        <>
            <Tabs.Screen
                options={{
                    header: () => (
                        <View style={tw`bg-white border-b border-gray-200`}>
                            <View style={tw`px-4 pt-14 pb-4`}>
                                <View style={tw`flex-row justify-between items-center mb-4`}>
                                    <TextTheme font="Prompt-SemiBold" size="xl" style={tw`text-gray-900`}>
                                        จัดการสถานที่
                                    </TextTheme>
                                    <TouchableOpacity
                                        onPress={() => setIsAddModalVisible(true)}
                                        style={tw`bg-blue-600 px-4 py-2.5 rounded-xl flex-row items-center gap-2`}
                                    >
                                        <Ionicons name="add-circle-outline" size={20} color="white" />
                                        <TextTheme color="white" font="Prompt-Medium">
                                            เพิ่มสถานที่
                                        </TextTheme>
                                    </TouchableOpacity>
                                </View>

                                <View style={tw`flex-row items-center gap-3`}>
                                    <SearchBar
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        placeholder="ค้นหาสถานที่..."
                                    />
                                    <FilterButton
                                        options={tabItems.map(item => ({
                                            label: item.label,
                                            value: item.key
                                        }))}
                                        selectedValue={selectedRole}
                                        onSelect={setSelectedRole}
                                    />
                                </View>
                            </View>
                        </View>
                    )
                }}
            />

            <View style={tw`flex-1 bg-gray-50`}>
                {/* Add Location Modal */}
                <AddLocationModal
                    isVisible={isAddModalVisible}
                    onClose={() => setIsAddModalVisible(false)}
                    onSuccess={() => {
                        setIsAddModalVisible(false);
                        fetchLocations();
                    }}
                />

                {/* Location List with Tabs */}
                <TabController
                    asCarousel
                    items={tabItems.map(item => ({
                        label: item.label,
                        leadingAccessory: (
                            <Ionicons
                                name={item.icon}
                                size={20}
                                color={String(tw.color("blue-500"))}
                                style={tw`mr-2`}
                            />
                        )
                    }))}
                    initialIndex={selectedTab}
                    onChangeIndex={setSelectedTab}
                >
                    <TabController.TabBar
                        containerStyle={tw`absolute`}
                        labelStyle={{ fontFamily: "Prompt-Regular" }}
                        selectedLabelStyle={{ fontFamily: "Prompt-Regular" }}
                        selectedLabelColor={String(tw.color("blue-500"))}
                        iconColor={String(tw.color("blue-500"))}
                        indicatorStyle={tw`bg-blue-500 h-0.5 rounded-full`}
                    />

                    <TabController.PageCarousel style={tw`mt-12`} scrollEnabled={false}>
                        {tabItems.map((tab, index) => (
                            <TabController.TabPage key={tab.key} index={index}>
                                <ScrollView
                                    refreshControl={
                                        <RefreshControl
                                            refreshing={refreshing}
                                            onRefresh={handleRefresh}
                                            colors={[String(tw.color("blue-500"))]}
                                            tintColor={String(tw.color("blue-500"))}
                                        />
                                    }
                                >
                                    {renderContent(tab.key)}
                                    <View style={tw`pb-30`} />
                                </ScrollView>
                            </TabController.TabPage>
                        ))}
                    </TabController.PageCarousel>
                </TabController>
            </View>
        </>
    );
};

export default LocationsAdminManager;