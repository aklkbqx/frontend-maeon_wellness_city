import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { UserListItem } from '@/components/admin/users/UserListItem';
import { SearchBar } from '@/components/admin/users/SearchBar';
import { FilterButton } from '@/components/admin/users/FilterButton';

export default function UsersScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    const roles = [
        { label: 'All', value: null },
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
        { label: 'Hospital', value: 'hospital' },
        { label: 'Restaurant', value: 'restaurant' },
        { label: 'Attractions', value: 'attractions' },
    ];

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Header */}
            <View style={tw`p-4 bg-white border-b border-gray-200`}>
                <View style={tw`flex-row justify-between items-center mb-4`}>
                    <Text style={tw`text-2xl font-bold`}>Users</Text>
                    <TouchableOpacity
                        style={tw`bg-blue-500 px-4 py-2 rounded-lg flex-row items-center`}
                        onPress={() => router.push('/users/create')}
                    >
                        <Ionicons name="add" size={20} color="white" />
                        <Text style={tw`text-white ml-2`}>Add User</Text>
                    </TouchableOpacity>
                </View>

                {/* Search and Filter */}
                <View style={tw`flex-row items-center gap-2`}>
                    <SearchBar
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search users..."
                        style={tw`flex-1`}
                    />
                    <FilterButton
                        options={roles}
                        selectedValue={selectedRole}
                        onSelect={setSelectedRole}
                    />
                </View>
            </View>

            {/* Users List */}
            {/* <FlatList
                data={users}
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
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                }
            /> */}
        </View>
    );
}