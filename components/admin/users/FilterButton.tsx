import { useState } from 'react';
import { TouchableOpacity, Text, Modal, View, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

interface FilterOption {
    label: string;
    value: string | null;
}

interface FilterButtonProps {
    options: FilterOption[];
    selectedValue: string | null;
    onSelect: (value: string | null) => void;
}

export function FilterButton({ options, selectedValue, onSelect }: FilterButtonProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const selectedOption = options.find(opt => opt.value === selectedValue);

    return (
        <>
            <TouchableOpacity
                style={tw`flex-row items-center bg-gray-100 rounded-lg px-3 py-2`}
                onPress={() => setModalVisible(true)}
            >
                <Ionicons name="filter" size={20} color="#6B7280" />
                <Text style={tw`ml-2 text-gray-700`}>
                    {selectedOption?.label || 'Filter'}
                </Text>
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={tw`flex-1 bg-black bg-opacity-50`}>
                    <View style={tw`mt-auto bg-white rounded-t-xl`}>
                        <View style={tw`p-4 border-b border-gray-200`}>
                            <Text style={tw`text-lg font-bold text-center`}>Filter by Role</Text>
                        </View>

                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value || 'all'}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={tw`p-4 border-b border-gray-100 flex-row justify-between items-center`}
                                    onPress={() => {
                                        onSelect(item.value);
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text style={tw`text-gray-700`}>{item.label}</Text>
                                    {item.value === selectedValue && (
                                        <Ionicons name="checkmark" size={20} color="#4F46E5" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />

                        <TouchableOpacity
                            style={tw`p-4 bg-gray-100`}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={tw`text-center text-gray-700 font-medium`}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}