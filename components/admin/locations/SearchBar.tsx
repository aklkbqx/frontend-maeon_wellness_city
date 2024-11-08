import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChangeText,
    placeholder = "ค้นหา..."
}) => {
    return (
        <View style={tw`flex-1 relative`}>
            <View style={tw`absolute z-10 left-3 top-3`}>
                <Ionicons name="search" size={20} color="#6B7280" />
            </View>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                style={[tw`bg-white text-gray-900 rounded-xl pl-10 pr-4 py-2.5 w-full border border-gray-200`,{fontFamily: "Prompt-Regular"}]}
                placeholderTextColor="#9CA3AF"
            />
        </View>
    );
};

export default SearchBar;