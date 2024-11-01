import { View, Text } from 'react-native';
import tw from 'twrnc';

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    color: 'blue' | 'green' | 'purple' | 'orange';
}

const colorStyles = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
};

export function StatCard({ title, value, change, color }: StatCardProps) {
    return (
        <View style={tw`w-1/2 p-2`}>
            <View style={tw`${colorStyles[color]} p-4 rounded-lg border`}>
                <Text style={tw`text-gray-600 text-sm`}>{title}</Text>
                <Text style={tw`text-2xl font-bold mt-1`}>{value}</Text>
                <Text style={tw`text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {change}
                </Text>
            </View>
        </View>
    );
}