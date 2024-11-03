
import React, { useState, useCallback } from 'react';
import { View, ScrollView, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import TextTheme from '@/components/TextTheme';
import { Users, LocationTypes, Locations } from '@/types/PrismaType';

// Types
interface LocationData extends Locations {
    location_types: LocationTypes;
    users?: Users | null;
}

// Mock Data
const mockLocations: LocationData[] = [
    {
        id: 1,
        name: "น้ำพุร้อนสันกำแพง",
        type: 1,
        map: JSON.stringify({
            latitude: "18.734851928466686",
            longitude: "99.3034750636564"
        }),
        note: "น้ำพุร้อนที่มีชื่อเสียงของจังหวัดเชียงใหม่",
        time_slots: null,
        owner_id: null,
        isActive: true,
        created_at: new Date(),
        updated_at: null,
        location_types: {
            id: 1,
            name: "สถานที่ท่องเที่ยว",
            created_at: new Date()
        },
        users: null
    },
    {
        id: 2,
        name: "ฮิมดอยโฮมสเตย์",
        type: 2,
        map: JSON.stringify({
            latitude: "18.86552412729214",
            longitude: "99.3509964648321"
        }),
        note: "โฮมสเตย์บรรยากาศดี วิวภูเขา",
        time_slots: JSON.stringify({
            check_in: "14:00",
            check_out: "12:00"
        }),
        owner_id: 1,
        isActive: true,
        created_at: new Date(),
        updated_at: null,
        location_types: {
            id: 2,
            name: "ที่พัก",
            created_at: new Date()
        },
        users: {
            id: 1,
            firstname: "John",
            lastname: "Doe",
            email: "john@example.com",
            profile_picture: null,
            role: "accommodation"
        } as Users
    }
];

const mockLocationTypes = [
    { id: 1, name: 'สถานที่ท่องเที่ยว' },
    { id: 2, name: 'ที่พัก' },
    { id: 3, name: 'แหล่งเรียนรู้' },
    { id: 4, name: 'ร้านอาหารและของฝาก' },
    { id: 5, name: 'โรงพยาบาล' },
];

// Components
interface FilterTabProps {
    label: string;
    isActive: boolean;
    count: number;
    onPress: () => void;
}

const FilterTab: React.FC<FilterTabProps> = ({ label, isActive, count, onPress }) => (
    <TouchableOpacity
        style={tw`
            px-4 py-2 rounded-xl 
            ${isActive ? 'bg-indigo-100' : 'bg-white'}
            border border-gray-200
        `}
        onPress={onPress}
    >
        <View style={tw`flex-row items-center gap-2`}>
            <TextTheme style={tw`${isActive ? 'text-indigo-600' : 'text-gray-600'}`}>
                {label}
            </TextTheme>
            <View style={tw`
                px-2 py-0.5 rounded-full
                ${isActive ? 'bg-indigo-500' : 'bg-gray-200'}
            `}>
                <TextTheme 
                    size="xs"
                    style={tw`${isActive ? 'text-white' : 'text-gray-600'}`}
                >
                    {count}
                </TextTheme>
            </View>
        </View>
    </TouchableOpacity>
);

interface LocationItemProps {
    location: LocationData;
    onPress: () => void;
    onToggleStatus: () => void;
}

const LocationItem: React.FC<LocationItemProps> = ({ location, onPress, onToggleStatus }) => {
    return (
        <TouchableOpacity
            style={tw`bg-white p-4 rounded-xl shadow-sm border border-gray-100`}
            onPress={onPress}
        >
            <View style={tw`flex-row justify-between items-start`}>
                <View style={tw`flex-1`}>
                    <View style={tw`flex-row items-center gap-2`}>
                        <TextTheme font="Prompt-Medium" size="base">
                            {location.name}
                        </TextTheme>
                        <View style={tw`
                            px-2 py-0.5 rounded-full
                            ${location.isActive ? 'bg-green-100' : 'bg-gray-100'}
                        `}>
                            <TextTheme 
                                size="xs"
                                style={tw`${location.isActive ? 'text-green-600' : 'text-gray-600'}`}
                            >
                                {location.isActive ? 'เปิดให้บริการ' : 'ปิดให้บริการ'}
                            </TextTheme>
                        </View>
                    </View>
                    
                    <View style={tw`flex-row items-center gap-2 mt-1`}>
                        <View style={tw`
                            px-2 py-0.5 rounded-full bg-gray-100
                        `}>
                            <TextTheme size="xs" style={tw`text-gray-600`}>
                                {location.location_types.name}
                            </TextTheme>
                        </View>
                        {location.users && (
                            <View style={tw`flex-row items-center gap-1`}>
                                <Ionicons name="person-outline" size={14} color={tw.color('gray-500')} />
                                <TextTheme size="xs" style={tw`text-gray-500`}>
                                    {location.users.firstname} {location.users.lastname}
                                </TextTheme>
                            </View>
                        )}
                    </View>

                    {location.note && (
                        <TextTheme size="sm" style={tw`text-gray-500 mt-1`}>
                            {location.note}
                        </TextTheme>
                    )}

                    {location.map && (
                        <View style={tw`flex-row items-center gap-1 mt-1`}>
                            <Ionicons name="location-outline" size={14} color={tw.color('gray-500')} />
                            <TextTheme size="xs" style={tw`text-gray-500`}>
                                {JSON.parse(location.map).latitude}, {JSON.parse(location.map).longitude}
                            </TextTheme>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={tw`p-2`}
                    onPress={onToggleStatus}
                >
                    <Ionicons 
                        name={location.isActive ? "eye-outline" : "eye-off-outline"} 
                        size={20} 
                        color={location.isActive ? tw.color('green-500') : tw.color('gray-400')} 
                    />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

// Main Component
export default function LocationsScreen() {
    const router = useRouter();
    const [activeType, setActiveType] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [locations, setLocations] = useState<LocationData[]>(mockLocations);

    const handleRefresh = async () => {
        setIsLoading(true);
        // TODO: Fetch locations
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    };

    const handleToggleStatus = async (locationId: number) => {
        setLocations(prev => 
            prev.map(location => 
                location.id === locationId 
                    ? { ...location, isActive: !location.isActive }
                    : location
            )
        );
        // TODO: Update location status
    };

    const getFilteredLocations = () => {
        if (!activeType) return locations;
        return locations.filter(location => location.type === activeType);
    };

    const getLocationTypeCount = (typeId: number) => {
        return locations.filter(location => location.type === typeId).length;
    };

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            <Stack.Screen options={{
                headerTitle: "จัดการสถานที่",
                headerTitleStyle: { 
                    fontFamily: "Prompt-SemiBold",
                    fontSize: 18 
                },
                headerRight: () => (
                    <TouchableOpacity
                        style={tw`bg-indigo-600 px-4 py-2 rounded-xl flex-row items-center`}
                        onPress={() => router.push('/admin/locations/create')}
                    >
                        <Ionicons name="add-outline" size={20} color="white" />
                        <TextTheme style={tw`text-white ml-1`} font="Prompt-Medium">
                            เพิ่มสถานที่
                        </TextTheme>
                    </TouchableOpacity>
                ),
                headerShadowVisible: false
            }} />

            {/* Filter Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={tw`border-b border-gray-200 bg-white`}
                contentContainerStyle={tw`p-4`}
            >
                <View style={tw`mr-2`}>
                    <FilterTab
                        label="ทั้งหมด"
                        isActive={activeType === null}
                        count={locations.length}
                        onPress={() => setActiveType(null)}
                    />
                </View>
                {mockLocationTypes.map((type) => (
                    <View key={type.id} style={tw`mr-2`}>
                        <FilterTab
                            label={type.name}
                            isActive={activeType === type.id}
                            count={getLocationTypeCount(type.id)}
                            onPress={() => setActiveType(type.id)}
                        />
                    </View>
                ))}
            </ScrollView>

            {/* Locations List */}
            <FlatList
                data={getFilteredLocations()}
                renderItem={({ item }) => (
                    <LocationItem
                        location={item}
                        onPress={() => router.push(`/admin/locations/${item.id}`)}
                        onToggleStatus={() => handleToggleStatus(item.id)}
                    />
                )}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={tw`p-4`}
                ItemSeparatorComponent={() => <View style={tw`h-2`} />}
                refreshControl={
                    <RefreshControl 
                        refreshing={isLoading} 
                        onRefresh={handleRefresh}
                        colors={[String(tw.color('indigo-600'))]}
                        tintColor={String(tw.color('indigo-600'))}
                    />
                }
                ListEmptyComponent={() => (
                    <View style={tw`flex-1 items-center justify-center py-8`}>
                        <Ionicons 
                            name="location-outline" 
                            size={48} 
                            color={tw.color('gray-400')} 
                        />
                        <TextTheme style={tw`text-gray-500 mt-2`}>
                            ไม่พบข้อมูลสถานที่
                        </TextTheme>
                    </View>
                )}
            />
        </View>
    );
}