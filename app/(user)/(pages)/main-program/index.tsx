import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Image, FlatList, Modal, TextInput } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import TextTheme from '@/components/TextTheme';
import tw from 'twrnc';
import { formatDateThai } from '@/helper/my-lib';
import { TouchableOpacity } from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';
import api, { apiUrl } from '@/helper/api';
import { handleErrorMessage } from '@/helper/my-lib';
import Loading from '@/components/Loading';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { useStatusBar } from '@/hooks/useStatusBar';

// Types
export interface Activity {
    sequence: number;
    start_time: string;
    end_time: string;
    activity: string;
    description?: string;
    location_id?: number;
    location_name?: string;
    location_type?: string;
    services?: string[];
    cost: number;
    included_in_total_price: boolean;
    is_mandatory?: boolean;
    note?: string;
    selected_program?: {
        id: number;
        name: string;
        time: string;
        people_count: number;
        price_per_person: number;
        total_price: number;
    };
    locations?: Array<{
        id: number;
        name: string;
        type: string;
    }>;
}

export interface DaySchedule {
    day: number;
    date?: string;
    title: string;
    activities: Activity[];
}

export interface Program {
    id: number;
    type: number;
    program_category: 'SHORT' | 'LONG';
    name: string;
    description: string;
    schedules: DaySchedule[];
    total_price: number;
    duration_days: number;
    status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
    wellness_dimensions?: string[];
    images?: string[];
}

export interface ProgramType {
    id: number;
    name: string;
    description: string;
    programs: Program[];
}

const MainTourProgram: React.FC = () => {
    useStatusBar("dark-content");
    const { bookingData, dateSelected } = useLocalSearchParams();

    // States
    const [programTypes, setProgramTypes] = useState<ProgramType[]>([]);
    const [filteredProgramTypes, setFilteredProgramTypes] = useState<ProgramType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [hasSearched, setHasSearched] = useState<boolean>(false);

    const fetchProgramTypes = async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/programs/ready-made");
            if (response.data.success) {
                const programs = response.data.programs;

                const programsByType = programs.reduce((acc: ProgramType[], program: Program) => {
                    const type = program.type;
                    const typeName = type === 1 ? 'โปรแกรมระยะสั้น' : 'โปรแกรมระยะยาว';

                    let group = acc.find(g => g.id === type);

                    if (!group) {
                        group = {
                            id: type,
                            name: typeName,
                            description: '',
                            programs: []
                        };
                        acc.push(group);
                    }

                    group.programs.push(program);

                    return acc;
                }, []);

                setProgramTypes(programsByType);
                setFilteredProgramTypes(programsByType);
            } else {
                handleErrorMessage(response.data.message || "ไม่สามารถดึงข้อมูลโปรแกรมได้");
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || "ไม่สามารถดึงข้อมูลโปรแกรมได้";
            handleErrorMessage(errorMessage);
            console.error("Error fetching programs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProgramTypes();
    }, []);

    // Navigation
    const handleProgramDetail = (programId: number) => {
        router.navigate({
            pathname: '/main-program/details',
            params: { programId, bookingData, dateSelected }
        });
    };

    // Search
    const handleSearch = useCallback((text: string) => {
        setSearchQuery(text);
        setIsSearching(true);
        setHasSearched(true);
        setTimeout(() => {
            if (text) {
                const filtered = programTypes.map(pt => ({
                    ...pt,
                    programs: pt.programs.filter(p =>
                        p.name.toLowerCase().includes(text.toLowerCase()) ||
                        p.description.toLowerCase().includes(text.toLowerCase())
                    )
                })).filter(pt => pt.programs.length > 0);
                setFilteredProgramTypes(filtered);
            } else {
                setFilteredProgramTypes(programTypes);
            }
            setIsSearching(false);
        }, 300);
    }, [programTypes]);

    const resetSearch = useCallback(() => {
        setSearchQuery('');
        setFilteredProgramTypes(programTypes);
        setShowSearch(false);
        setIsSearching(false);
        setHasSearched(false);
    }, [programTypes]);

    // Render Program Card
    const renderProgram = (program: Program) => {
        try {
            // ตรวจสอบว่ามี schedules และ activities หรือไม่
            if (!program.schedules?.[0]?.activities?.length) {
                return null;
            }

            const firstDay = program.schedules[0];
            const firstActivity = firstDay.activities[0];
            const lastActivity = firstDay.activities[firstDay.activities.length - 1];

            return (
                <View key={program.id}>
                    <TouchableOpacity
                        style={tw`bg-white rounded-2xl mb-4 border border-slate-200 overflow-hidden`}
                        onPress={() => handleProgramDetail(program.id)}
                    >
                        <View style={tw`h-[180px] bg-slate-200 relative`}>
                            {program.images && program.images.length > 0 && !loading ? (
                                <Image
                                    source={{ uri: `${apiUrl}/images/program_images/${program.images[0]}` }}
                                    style={[tw`flex-1 h-[180px]`, { objectFit: "cover" }]}
                                    defaultSource={require("@/assets/images/placeholder.png")}
                                />
                            ) : (
                                <View style={tw`flex-1 justify-center items-center`}>
                                    <Loading loading />
                                </View>
                            )}
                        </View>
                        <View style={tw`p-4`}>
                            <View style={tw`flex-row justify-between items-start mb-2`}>
                                <TextTheme
                                    font="Prompt-SemiBold"
                                    style={tw`text-lg flex-1 mr-2`}
                                    numberOfLines={2}
                                >
                                    {program.name}
                                </TextTheme>
                                {program.program_category === 'LONG' && (
                                    <TextTheme style={tw`bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full`}>
                                        {program.duration_days} วัน
                                    </TextTheme>
                                )}
                            </View>
                            <TextTheme
                                font='Prompt-Light'
                                numberOfLines={2}
                                style={tw`text-gray-600 mb-2`}
                            >
                                {program.description}
                            </TextTheme>
                            <View style={tw`flex-row justify-between items-center`}>
                                <TextTheme
                                    font='Prompt-SemiBold'
                                    size='lg'
                                    style={tw`text-green-600`}
                                >
                                    {program.total_price.toLocaleString()} บาท
                                </TextTheme>
                                <TextTheme style={tw`text-gray-600`}>
                                    {program.type !== 2 ? firstActivity.start_time + " - " + lastActivity.end_time : null}
                                </TextTheme>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            );
        } catch (error) {
            console.error(`Error rendering program ${program.id}:`, error);
            return null;
        }
    };

    // Header Component
    const renderStackHeader = () => (
        <Stack.Screen options={{
            headerShown: true,
            header: () => (
                <View style={tw`bg-white`}>
                    <Animatable.View
                        animation={!showSearch ? "fadeInLeft" : "fadeInRight"}
                        style={tw`w-full ios:pt-14 android:pt-7.5 pb-1 justify-between flex-row px-5 items-center gap-2`}
                    >
                        {showSearch ? (
                            <>
                                <View style={tw`relative flex-1`}>
                                    <TextInput
                                        style={[tw`border border-slate-200 rounded-xl py-2.1 px-10 flex-row text-zinc-500 bg-white`, { fontFamily: "Prompt-Regular" }]}
                                        placeholder='ค้นหาโปรแกรม'
                                        placeholderTextColor={"#717179"}
                                        autoCapitalize='none'
                                        autoFocus
                                        value={searchQuery}
                                        onChangeText={handleSearch}
                                    />
                                    <Ionicons
                                        name='search'
                                        style={tw`text-zinc-500 absolute top-[15%] android:top-[20%] left-[4%] text-xl`}
                                    />
                                </View>
                                <TouchableOpacity onPress={resetSearch}>
                                    <TextTheme style={tw`text-zinc-800`}>ยกเลิก</TextTheme>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity
                                    onPress={() => router.back()}
                                    style={tw`flex-row items-center android:py-2.6 ios:py-2`}
                                >
                                    <Ionicons name="chevron-back" size={24} color={tw.color('black')} />
                                </TouchableOpacity>
                                <TextTheme style={tw`text-center`} font='Prompt-Bold' size='lg'>
                                    โปรแกรมการท่องเที่ยวหลัก
                                </TextTheme>
                                <TouchableOpacity
                                    style={tw`flex-row items-center`}
                                    onPress={() => setShowSearch(true)}
                                >
                                    <Ionicons name="search" size={24} color={tw.color('black')} />
                                </TouchableOpacity>
                            </>
                        )}
                    </Animatable.View>
                </View>
            )
        }} />
    );

    return (
        <>
            {renderStackHeader()}

            <Modal visible={loading} transparent>
                <BlurView intensity={10} style={tw`flex-1 justify-center items-center`}>
                    <Loading loading={loading} size={'large'} />
                </BlurView>
            </Modal>

            <ScrollView style={tw`flex-1 bg-slate-100 pt-4`}>
                <View style={tw`px-5`}>
                    <View style={tw`justify-between items-center flex-row my-1`}>
                        <TextTheme
                            font="Prompt-Medium"
                            size="sm"
                            style={tw`text-white bg-blue-500 rounded-xl overflow-hidden px-2 py-1`}
                        >
                            วันที่เลือก: {formatDateThai(dateSelected as string)}
                        </TextTheme>
                    </View>
                </View>

                <View style={tw`mx-5 mt-2`}>
                    {programTypes ? (
                        filteredProgramTypes.length > 0 ? (
                            !isSearching ? (
                                <FlatList
                                    data={filteredProgramTypes}
                                    renderItem={({ item: programType }) => (
                                        <>
                                            <TextTheme
                                                font="Prompt-Medium"
                                                size="lg"
                                                style={tw`mb-3`}
                                            >
                                                {programType.name}
                                            </TextTheme>
                                            {programType.programs.map(renderProgram)}
                                        </>
                                    )}
                                    keyExtractor={(item) => item.id.toString()}
                                    scrollEnabled={false}
                                />
                            ) : (
                                <Loading loading={isSearching} size={'large'} style={tw`mt-10`} />
                            )
                        ) : (
                            hasSearched && (
                                <View style={tw`mt-5`}>
                                    <TextTheme style={tw`text-center text-zinc-800`}>
                                        ไม่พบผลลัพธ์ที่คุณค้นหา
                                    </TextTheme>
                                </View>
                            )
                        )
                    ) : null}
                </View>
                <View style={tw`mb-20`} />
            </ScrollView>
        </>
    );
};

export default MainTourProgram;