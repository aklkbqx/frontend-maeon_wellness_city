import React, { useState, useEffect } from 'react';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import TextTheme from '@/components/TextTheme';

interface Stats {
    users: {
        total: number;
        active: number;
        newToday: number;
    };
    bookings: {
        total: number;
        pending: number;
        completed: number;
        recent: BookingData[];
    };
    revenue: {
        total: number;
        thisMonth: number;
        lastMonth: number;
    };
    locations: {
        total: number;
        byType: Record<string, number>;
    };
}

interface BookingData {
    id: number;
    program_name: string;
    start_date: string;
    total_price: number;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
}

interface RecentBookingsProps {
    bookings: BookingData[];
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color }) => (
    <View style={tw`${color} rounded-lg p-4 shadow-sm flex-1`}>
        <View style={tw`flex-row justify-between items-start`}>
            <View>
                <TextTheme style={tw`text-gray-500`} size="xs">{title}</TextTheme>
                <TextTheme style={tw`text-2xl mt-2`} font="Prompt-SemiBold">{value}</TextTheme>
                <TextTheme style={tw`text-gray-600 mt-1`} size="xs">{subtitle}</TextTheme>
            </View>
            <View style={tw`bg-white/20 rounded-full p-2`}>
                <Ionicons name={icon} size={24} style={tw`text-gray-700`} />
            </View>
        </View>
    </View>
);

const RecentBookings: React.FC<RecentBookingsProps> = ({ bookings }) => (
    <View style={tw`bg-white rounded-lg shadow-sm p-4 mt-6`}>
        <TextTheme style={tw`mb-4`} font="Prompt-SemiBold" size="lg">Recent Bookings</TextTheme>
        {bookings.map((booking, index) => (
            <View key={index} style={tw`flex-row justify-between items-center py-3 border-b border-gray-100`}>
                <View>
                    <TextTheme font="Prompt-Medium">{booking.program_name}</TextTheme>
                    <TextTheme style={tw`text-gray-500`} size="xs">
                        {new Date(booking.start_date).toLocaleDateString()}
                    </TextTheme>
                </View>
                <View style={tw`flex-row items-center`}>
                    <TextTheme style={tw`mr-2`}>฿{booking.total_price}</TextTheme>
                    <View style={tw`px-2 py-1 rounded ${booking.status === 'PENDING' ? 'bg-yellow-100' :
                        booking.status === 'CONFIRMED' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                        <TextTheme size="xs">{booking.status}</TextTheme>
                    </View>
                </View>
            </View>
        ))}
    </View>
);

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats>({
        users: { total: 0, active: 0, newToday: 0 },
        bookings: { total: 0, pending: 0, completed: 0, recent: [] },
        revenue: { total: 0, thisMonth: 0, lastMonth: 0 },
        locations: { total: 0, byType: {} }
    });
    const [loading, setLoading] = useState<boolean>(true);
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Implement your API calls here to fetch the dashboard data
                // Example:
                // const response = await fetch('your-api-endpoint');
                // const data = await response.json();
                // setStats(data);

                // Mock data for demonstration
                setStats({
                    users: { total: 1234, active: 890, newToday: 12 },
                    bookings: {
                        total: 156,
                        pending: 45,
                        completed: 111,
                        recent: [
                            {
                                id: 1,
                                program_name: "วิถีชีวิตแม่กำปอง",
                                start_date: "2024-11-03",
                                total_price: 450,
                                status: "PENDING"
                            },
                            // Add more mock bookings as needed
                        ]
                    },
                    revenue: { total: 45000, thisMonth: 15000, lastMonth: 12000 },
                    locations: {
                        total: 24,
                        byType: {
                            attractions: 8,
                            accommodation: 6,
                            restaurants: 10
                        }
                    }
                });
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <View style={tw`flex-1 justify-center items-center`}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ScrollView style={tw`flex-1 bg-gray-50`}>
            <View style={tw`p-4`}>
                <View style={tw`flex-row gap-4 mb-6`}>
                    <StatCard
                        title="Total Users"
                        value={stats.users.total}
                        subtitle={`+${stats.users.newToday} today`}
                        icon="people"
                        color="bg-blue-50"
                    />
                    <StatCard
                        title="Active Bookings"
                        value={stats.bookings.pending}
                        subtitle={`${stats.bookings.completed} completed`}
                        icon="calendar"
                        color="bg-green-50"
                    />
                </View>

                <View style={tw`flex-row gap-4`}>
                    <StatCard
                        title="Revenue (THB)"
                        value={`฿${stats.revenue.total.toLocaleString()}`}
                        subtitle={`${stats.revenue.thisMonth > stats.revenue.lastMonth ? '↑' : '↓'} ${Math.abs(stats.revenue.thisMonth - stats.revenue.lastMonth).toLocaleString()} vs last month`}
                        icon="cash"
                        color="bg-purple-50"
                    />
                    <StatCard
                        title="Locations"
                        value={stats.locations.total}
                        subtitle="Across all categories"
                        icon="location"
                        color="bg-orange-50"
                    />
                </View>

                <RecentBookings bookings={stats.bookings.recent} />
            </View>
        </ScrollView>
    );
};

export default Dashboard;