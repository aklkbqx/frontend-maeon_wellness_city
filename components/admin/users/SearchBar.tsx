import { TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    style?: any;
}

export function SearchBar({ value, onChangeText, placeholder, style }: SearchBarProps) {
    return (
        <View style={[tw`flex-row items-center bg-gray-100 rounded-lg px-3`, style]}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                style={tw`flex-1 py-2 pl-2`}
            />
        </View>
    );
}