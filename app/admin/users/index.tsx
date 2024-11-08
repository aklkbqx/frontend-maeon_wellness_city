import React, { useCallback, useState } from 'react';
import { View, TouchableOpacity, FlatList, RefreshControl, Image } from 'react-native';
import { router, Stack, Tabs, useFocusEffect } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import TextTheme from '@/components/TextTheme';
import { Users } from '@/types/PrismaType';
import UserRoleBadge from '@/components/UserRoleBadge';
import AddUserModal, { CreateUserData } from '@/components/admin/users/AddUserModal';
import api, { apiUrl } from '@/helper/api';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import FilterButton from '@/components/admin/users/FilterButton';
import UserListSkeleton from '@/components/admin/users/UserListSkeleton';
import SearchBar from '@/components/admin/users/SearchBar';
import Loading from '@/components/Loading';
import useShowToast from '@/hooks/useShowToast';

interface UserListItemProps {
    user: Users;
    onPress: () => void;
}

const UserListItem: React.FC<UserListItemProps> = ({ user, onPress }) => {
    return (
        <TouchableOpacity onPress={onPress} style={tw`bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm border border-gray-100`}>
            <View style={tw`flex-row items-center gap-3`}>
                <Image
                    source={{ uri: apiUrl + "/images/user_images/" + user.profile_picture }}
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
            <Ionicons name="chevron-forward" size={20} />
        </TouchableOpacity>
    )
}

export default function UsersScreen() {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [users, setUsers] = useState<Users[] | null>(null);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const roles = [
        { label: 'ทั้งหมด', value: null },
        { label: 'ผู้ดูแลระบบ', value: 'admin' },
        { label: 'ผู้ใช้งาน', value: 'user' },
        { label: 'โรงพยาบาล', value: 'hospital' },
        { label: 'ร้านอาหาร', value: 'restaurant' },
        { label: 'สถานที่ท่องเที่ยว', value: 'attractions' },
    ];

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchAllUser()
        setIsRefreshing(false);
    };

    const fetchAllUser = async () => {
        setIsLoading(true);
        try {
            const response = await api.get("/api/admin/users");
            if (response.data.success) {
                setUsers(response.data.users)
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(message);
            })
        } finally {
            setIsLoading(false);
        }
    }

    useFocusEffect(useCallback(() => {
        fetchAllUser()
    }, []))

    const handleAddUser = async (userData: CreateUserData) => {
        setIsSubmitting(true);
        try {
            const response = await api.post("/api/admin/users/", {
                userData
            });
            if(response.data.success){
                useShowToast("success","สำเร็จ","สร้างสมาชิกสำเร็จแล้ว");
            }
        } catch (error) {
            handleAxiosError(error, (message) => {
                handleErrorMessage(error);
            })
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!users || isRefreshing) {
        return <UserListSkeleton />
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.lastname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = selectedRole ? user.role === selectedRole : true;
        return matchesSearch && matchesRole;
    });

    return (
        <>
            <Tabs.Screen options={{
                header: () => (
                    <View style={tw`bg-white border-b border-gray-200`}>
                        <View style={tw`px-4 pt-14 pb-4`}>
                            <View style={tw`flex-row justify-between items-center mb-4`}>
                                <TextTheme font="Prompt-SemiBold" size="xl" style={tw`text-gray-900`}>
                                    จัดการสมาชิก
                                </TextTheme>
                                <TouchableOpacity onPress={() => setIsAddModalVisible(true)} style={tw`bg-indigo-600 px-4 py-2.5 rounded-xl flex-row items-center`}>
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
                ),
                headerShown: true
            }} />
            <View style={tw`flex-1 bg-gray-50`}>
                {isLoading ? (
                    <>
                        <View style={tw`mt-2`}>
                            <Loading loading />
                        </View>
                        <UserListSkeleton />
                    </>
                ) : (
                    <FlatList
                        data={filteredUsers}
                        renderItem={({ item }) => (
                            <UserListItem user={item} onPress={() => router.navigate({
                                pathname: `/admin/users`,
                                params: {
                                    userId: item.id
                                }
                            })} />
                        )}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={tw`p-4`}
                        ItemSeparatorComponent={() => <View style={tw`h-2`} />}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
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
                )}
            </View>
        </>
    );
}