import React, { useState } from 'react';
import { View, TouchableOpacity, FlatList, RefreshControl, Image, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import TextTheme from '@/components/TextTheme';
import { Users, UsersAccountStatus, UsersRole, UsersUsageStatus } from '@/types/PrismaType';
import UserRoleBadge from '@/components/UserRoleBadge';
import AddUserModal, { CreateUserData } from '@/components/admin/users/AddUserModal';

// Components
interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, placeholder }) => (
    <View style={tw`flex-1 relative`}>
        <View style={tw`absolute left-3 top-3 z-10`}>
            <Ionicons name="search" size={20} color="#6B7280" />
        </View>
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            style={tw`bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 font-medium`}
            placeholderTextColor="#9CA3AF"
        />
    </View>
);

interface FilterButtonProps {
    options: Array<{ label: string; value: string | null }>;
    selectedValue: string | null;
    onSelect: (value: string | null) => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ options, selectedValue, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View style={tw`relative`}>
            <TouchableOpacity
                onPress={() => setIsOpen(!isOpen)}
                style={tw`bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-row items-center gap-2`}
            >
                <Ionicons name="filter" size={20} color="#4F46E5" />
                <TextTheme style={tw`text-gray-700`}>
                    {options.find(opt => opt.value === selectedValue)?.label || 'All'}
                </TextTheme>
            </TouchableOpacity>

            {isOpen && (
                <View style={tw`absolute top-12 right-0 bg-white rounded-xl shadow-lg border border-gray-100 min-w-[120px] z-50`}>
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => {
                                onSelect(option.value);
                                setIsOpen(false);
                            }}
                            style={tw`px-4 py-2.5 border-b border-gray-100 last:border-b-0`}
                        >
                            <TextTheme
                                style={tw`${selectedValue === option.value ? 'text-indigo-600' : 'text-gray-700'}`}
                            >
                                {option.label}
                            </TextTheme>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

interface UserListItemProps {
    user: Users;
    onPress: () => void;
}

const UserListItem: React.FC<UserListItemProps> = ({ user, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        style={tw`bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm border border-gray-100`}
    >
        <View style={tw`flex-row items-center gap-3`}>
            <Image
                source={{ uri: user.profile_picture || 'https://via.placeholder.com/40' }}
                style={tw`w-12 h-12 rounded-full bg-gray-200`}
            />
            <View>
                <TextTheme font="Prompt-Medium" style={tw`text-gray-900`}>
                    {user.firstname} {user.lastname}
                </TextTheme>
                <TextTheme size="sm" style={tw`text-gray-500`}>
                    {user.email}
                </TextTheme>
                <View style={tw`mt-1`}>
                    <UserRoleBadge role={user.role} size='xs' />
                </View>
            </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
);

// Mock Data
const mockUsers: Users[] = [
    {
        id: 1,
        firstname: "John",
        lastname: "Doe",
        email: "john@example.com",
        password: "hashed_password",
        tel: "0123456789",
        profile_picture: "/uploads/profile/1.jpg",
        role: "admin" as UsersRole,
        usage_status: "OFFLINE" as UsersUsageStatus,
        status_last_update: new Date(),
        account_status: "ACTIVE" as UsersAccountStatus,
        created_at: new Date(),
        updated_at: new Date(),
        bookings: [], // Bookings[]
        locations: [], // Locations[]
        notifications: [], // Notifications[]
        programs: [], // Programs[]
    },
    {
        id: 2,
        firstname: "Jane",
        lastname: "Smith",
        email: "jane@example.com",
        password: "hashed_password",
        tel: "0987654321",
        profile_picture: "/uploads/profile/2.jpg",
        role: "user" as UsersRole,
        usage_status: "ONLINE" as UsersUsageStatus,
        status_last_update: new Date(),
        account_status: "ACTIVE" as UsersAccountStatus,
        created_at: new Date(),
        updated_at: new Date(),
        bookings: [],
        locations: [],
        notifications: [],
        programs: [],
    },
    {
        id: 3,
        firstname: "Hospital",
        lastname: "Admin",
        email: "hospital@example.com",
        password: "hashed_password",
        tel: "0123456789",
        profile_picture: undefined,
        role: "hospital" as UsersRole,
        usage_status: "OFFLINE" as UsersUsageStatus,
        status_last_update: new Date(),
        account_status: "ACTIVE" as UsersAccountStatus,
        created_at: new Date(),
        bookings: [],
        locations: [],
        notifications: [],
        programs: [],
    }
];

export default function UsersScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const roles = [
        { label: 'ทั้งหมด', value: null },
        { label: 'ผู้ดูแลระบบ', value: 'admin' },
        { label: 'ผู้ใช้งาน', value: 'user' },
        { label: 'โรงพยาบาล', value: 'hospital' },
        { label: 'ร้านอาหาร', value: 'restaurant' },
        { label: 'สถานที่ท่องเที่ยว', value: 'attractions' },
    ];

    const filteredUsers = mockUsers.filter(user => {
        const matchesSearch =
            user.firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.lastname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = selectedRole ? user.role === selectedRole : true;

        return matchesSearch && matchesRole;
    });

    const handleRefresh = () => {
        setIsLoading(true);
        // Simulate refresh
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    };

    const handleAddUser = async (userData: CreateUserData) => {
        try {
            setIsSubmitting(true);
            // const response = await api.post('/api/users', userData);
            console.log('Creating user:', userData);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setIsAddModalVisible(false);
            // Refresh user list
            handleRefresh();

            // Show success message
            // useShowToast("success", "สำเร็จ", "เพิ่มสมาชิกเรียบร้อยแล้ว");
        } catch (error) {
            // Handle error
            console.error('Error creating user:', error);
            // useShowToast("error", "ข้อผิดพลาด", "ไม่สามารถเพิ่มสมาชิกได้");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            <Stack.Screen options={{
                header: () => (
                    <View style={tw`bg-white border-b border-gray-200`}>
                        <View style={tw`px-4 pt-14 pb-4`}>
                            <View style={tw`flex-row justify-between items-center mb-4`}>
                                <TextTheme font="Prompt-SemiBold" size="xl" style={tw`text-gray-900`}>
                                    จัดการสมาชิก
                                </TextTheme>
                                <TouchableOpacity
                                    onPress={() => setIsAddModalVisible(true)}
                                    style={tw`bg-indigo-600 px-4 py-2.5 rounded-xl flex-row items-center`}
                                >
                                    <Ionicons name="add-circle-outline" size={20} color="white" />
                                    <TextTheme style={tw`text-white ml-2`} font="Prompt-Medium">
                                        เพิ่มสมาชิก
                                    </TextTheme>
                                </TouchableOpacity>

                                <AddUserModal
                                    isVisible={isAddModalVisible}
                                    onClose={() => setIsAddModalVisible(false)}
                                    onSubmit={handleAddUser}
                                    isLoading={isSubmitting}
                                />
                            </View>

                            <View style={tw`flex-row items-center gap-3`}>
                                <SearchBar
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholder="ค้นหาสมาชิก..."
                                />
                                <FilterButton
                                    options={roles}
                                    selectedValue={selectedRole}
                                    onSelect={setSelectedRole}
                                />
                            </View>
                        </View>
                    </View>
                )
            }} />

            <FlatList
                data={filteredUsers}
                renderItem={({ item }) => (
                    <UserListItem
                        user={item}
                        onPress={() => router.push(`/users/${item.id}`)}
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
                        <TextTheme style={tw`text-gray-500`}>
                            ไม่พบข้อมูลสมาชิก
                        </TextTheme>
                    </View>
                )}
            />
        </View>
    );
}