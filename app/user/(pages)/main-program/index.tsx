import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Image, FlatList, Modal, TextInput } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import TextTheme from '@/components/TextTheme';
import tw from 'twrnc';
import { formatDateThai } from '@/helper/my-lib';
import { TouchableOpacity } from 'react-native-ui-lib';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api, { apiUrl } from '@/helper/api';
import { handleErrorMessage } from '@/helper/my-lib';
import Loading from '@/components/Loading';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { useStatusBar } from '@/hooks/useStatusBar';
import { LinearGradient } from 'expo-linear-gradient';

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

const ProgramCard: React.FC<{ program: Program; onPress: () => void }> = ({ program, onPress }) => {
    if (!program.schedules?.[0]?.activities?.length) return null;

    const firstDay = program.schedules[0];
    const firstActivity = firstDay.activities[0];
    const lastActivity = firstDay.activities[firstDay.activities.length - 1];

    return (
        <Animatable.View
            animation="fadeInUp"
            duration={500}
            delay={200}
            useNativeDriver
        >
            <TouchableOpacity
                style={tw`bg-white rounded-3xl mb-2 overflow-hidden border border-slate-100`}
                onPress={onPress}
            >
                {/* Image Section */}
                <View style={tw`relative h-[200px]`}>
                    <Image
                        source={{ uri: `${apiUrl}/images/program_images/${program.images?.[0]}` }}
                        style={tw`w-full h-full`}
                        defaultSource={require("@/assets/images/placeholder.png")}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={tw`absolute bottom-0 left-0 right-0 p-4`}
                    >
                        {program.program_category === 'LONG' && (
                            <View style={tw`flex-row`}>
                                <BlurView intensity={10} tint="light" style={tw`flex-row items-center gap-2 mb-2 rounded-2xl overflow-hidden px-2 `}>
                                    <MaterialCommunityIcons name="calendar-range" size={20} color="white" />
                                    <TextTheme style={tw`text-white`}>
                                        {program.duration_days} วัน
                                    </TextTheme>
                                </BlurView>
                            </View>
                        )}
                        <View style={tw`flex-row items-center justify-between`}>
                            <BlurView intensity={10} style={tw`flex-row items-center gap-2 rounded-2xl overflow-hidden px-2`}>
                                <MaterialCommunityIcons name="clock-outline" size={20} color="white" />
                                <TextTheme style={tw`text-white`}>
                                    {program.type !== 2 ? `${firstActivity.start_time} - ${lastActivity.end_time}` : 'ยืดหยุ่นตามต้องการ'}
                                </TextTheme>
                            </BlurView>
                            <View style={tw`bg-green-600 px-3 py-1 rounded-full`}>
                                <TextTheme size='xs' style={tw`text-white`}>
                                    {program.total_price.toLocaleString()} บาท
                                </TextTheme>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Content Section */}
                <View style={tw`p-4`}>
                    <TextTheme
                        font="Prompt-SemiBold"
                        size="lg"
                        style={tw`mb-2`}
                        numberOfLines={2}
                    >
                        {program.name}
                    </TextTheme>
                    <TextTheme
                        font="Prompt-Light"
                        style={tw`text-gray-600 mb-3`}
                        numberOfLines={2}
                    >
                        {program.description}
                    </TextTheme>
                </View>
            </TouchableOpacity>
        </Animatable.View>
    );
};

// const SearchBar: React.FC<{
//     showSearch: boolean;
//     searchQuery: string;
//     onSearch: (text: string) => void;
//     onReset: () => void;
// }> = ({ showSearch, searchQuery, onSearch, onReset }) => (
//     <Animatable.View
//         animation={!showSearch ? "fadeInLeft" : "fadeInRight"}
//         style={tw`flex-row items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl`}
//     >
//         <Ionicons
//             name="search"
//             size={20}
//             color={tw.color('gray-400')}
//         />
//         <TextInput
//             style={[
//                 tw`flex-1 text-gray-700`,
//                 { fontFamily: "Prompt-Regular" }
//             ]}
//             placeholder="ค้นหาโปรแกรมท่องเที่ยว..."
//             placeholderTextColor={tw.color('gray-400')}
//             value={searchQuery}
//             onChangeText={onSearch}
//             autoFocus={showSearch}
//         />
//         {searchQuery ? (
//             <TouchableOpacity onPress={onReset}>
//                 <Ionicons name="close-circle" size={20} color={tw.color('gray-400')} />
//             </TouchableOpacity>
//         ) : null}
//     </Animatable.View>
// );

const EmptyState: React.FC = () => (
    <View style={tw`flex-1 items-center justify-center py-10`}>
        <MaterialCommunityIcons
            name="magnify-close"
            size={48}
            color={tw.color('gray-300')}
        />
        <TextTheme style={tw`text-gray-500 mt-4 text-center`}>
            ไม่พบโปรแกรมที่คุณค้นหา{'\n'}ลองค้นหาด้วยคำค้นอื่น
        </TextTheme>
    </View>
);

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
            pathname: '/user/main-program/details',
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
                    {dateSelected && (
                        <View style={tw`mt-2 mx-5 flex-row items-center gap-2 pb-2`}>
                            <MaterialCommunityIcons
                                name="calendar-check"
                                size={20}
                                color={tw.color('blue-500')}
                            />
                            <TextTheme style={tw`text-blue-500`}>
                                วันที่เลือก: {formatDateThai(dateSelected as string)}
                            </TextTheme>
                        </View>
                    )}
                </View>
            )
        }} />
    );

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {renderStackHeader()}

            {loading ? (
                <Loading loading={true} style={tw`flex-1`} />
            ) : (
                <ScrollView style={tw`flex-1`}>
                    <View style={tw`p-5`}>
                        {filteredProgramTypes.length > 0 ? (
                            filteredProgramTypes.map(programType => (
                                <View key={programType.id} style={tw`mb-6`}>
                                    <View style={tw`flex-row items-center gap-2 mb-4`}>
                                        <MaterialCommunityIcons
                                            name={programType.id === 1 ? "clock-outline" : "calendar-range"}
                                            size={24}
                                            color={tw.color('gray-700')}
                                        />
                                        <TextTheme font="Prompt-Bold" size="lg">
                                            {programType.name}
                                        </TextTheme>
                                    </View>
                                    {programType.programs.map(program => (
                                        <ProgramCard
                                            key={program.id}
                                            program={program}
                                            onPress={() => handleProgramDetail(program.id)}
                                        />
                                    ))}
                                </View>
                            ))
                        ) : (
                            hasSearched && <EmptyState />
                        )}
                    </View>
                    <View style={tw`h-20`} />
                </ScrollView>
            )}
        </View>
    );
};

export default MainTourProgram;