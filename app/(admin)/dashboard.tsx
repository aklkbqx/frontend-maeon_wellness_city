import { DashboardStats } from '@/components/admin/dashboard/DashboardStats';
import { ScrollView, View, Text } from 'react-native';
import tw from 'twrnc';

export default function Dashboard() {
    return (
        <ScrollView style={tw`flex-1 bg-gray-50`}>
            <View style={tw`p-4`}>
                <Text style={tw`text-2xl font-bold mb-6`}>Welcome, Admin</Text>

                {/* Stats Overview */}
                <DashboardStats />

                {/* Recent Bookings */}
                <View style={tw`mt-6`}>
                    <Text style={tw`text-xl font-semibold mb-4`}>Recent Bookings</Text>
                    {/* <RecentBookings /> */}
                </View>

                {/* Activity Feed */}
                <View style={tw`mt-6`}>
                    <Text style={tw`text-xl font-semibold mb-4`}>Recent Activity</Text>
                    {/* <ActivityFeed /> */}
                </View>
            </View>
        </ScrollView>
    );
}