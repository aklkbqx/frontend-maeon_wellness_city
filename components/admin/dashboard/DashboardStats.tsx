import { View } from 'react-native';
import tw from 'twrnc';
import { StatCard } from './StatCard';

export function DashboardStats() {
    return (
        <View style={tw`flex-row flex-wrap -mx-2`}>
            <StatCard
                title="Total Users"
                value="1,234"
                change="+12%"
                color="blue"
            />
            <StatCard
                title="Active Bookings"
                value="56"
                change="+5%"
                color="green"
            />
            <StatCard
                title="Total Revenue"
                value="$12,345"
                change="+8%"
                color="purple"
            />
            <StatCard
                title="Locations"
                value="89"
                change="+3%"
                color="orange"
            />
        </View>
    );
}