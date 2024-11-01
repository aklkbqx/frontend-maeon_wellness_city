import { Users } from '@/types/PrismaType';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import tw from 'twrnc';

interface UserListItemProps {
    user: Users;
    onPress: () => void;
}

export function UserListItem({ user, onPress }: UserListItemProps) {
    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'hospital': return 'bg-blue-100 text-blue-800';
            case 'restaurant': return 'bg-green-100 text-green-800';
            case 'attractions': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <TouchableOpacity
            style={tw`bg-white rounded-lg p-4 shadow-sm`}
            onPress={onPress}
        >
            <View style={tw`flex-row items-center`}>
                <Image
                    source={{ uri: user.profile_picture || 'https://via.placeholder.com/40' }}
                    style={tw`w-10 h-10 rounded-full`}
                />
                <View style={tw`ml-3 flex-1`}>
                    <Text style={tw`font-semibold text-gray-900`}>
                        {user.firstname} {user.lastname}
                    </Text>
                    <Text style={tw`text-gray-500 text-sm`}>{user.email}</Text>
                </View>
                <View style={tw`${user.role ? getRoleColor(user.role) : ""} px-3 py-1 rounded-full`}>
                    <Text style={tw`text-xs font-medium`}>
                        {user.role && user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Text>
                </View>
            </View>

            <View style={tw`flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100`}>
                <Text style={tw`text-sm text-gray-500`}>
                    Status: {user.account_status}
                </Text>
                <Text style={tw`text-sm text-gray-500`}>
                    Tel: {user.tel}
                </Text>
            </View>
        </TouchableOpacity>
    );
}