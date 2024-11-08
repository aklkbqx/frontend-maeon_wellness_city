import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dialog } from 'react-native-ui-lib';
import TextTheme from '@/components/TextTheme';
import tw from 'twrnc';

interface FilterOption {
    label: string;
    value: string;
}

interface FilterButtonProps {
    options: FilterOption[];
    selectedValue: string;
    onSelect: (value: string) => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({
    options,
    selectedValue,
    onSelect
}) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <>
            <TouchableOpacity
                onPress={() => setIsVisible(true)}
                style={tw`bg-white px-4 py-2.5 rounded-xl flex-row items-center gap-2 border border-gray-200`}
            >
                <Ionicons name="filter" size={20} color={String(tw.color("indigo-500"))} />
                <TextTheme style={tw`text-gray-700`}>ตัวกรอง</TextTheme>
            </TouchableOpacity>

            <Dialog
                visible={isVisible}
                onDialogDismissed={() => setIsVisible(false)}
            >
                <View style={tw`bg-white rounded-2xl w-[80%] max-w-sm mx-auto p-4`}>
                    <TextTheme font="Prompt-Medium" size="lg" style={tw`mb-4`}>
                        ตัวกรอง
                    </TextTheme>

                    <View style={tw`gap-2`}>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => {
                                    onSelect(option.value);
                                    setIsVisible(false);
                                }}
                                style={tw`flex-row items-center justify-between p-3 rounded-xl ${selectedValue === option.value ? 'bg-indigo-50' : ''
                                    }`}
                            >
                                <TextTheme>{option.label}</TextTheme>
                                {selectedValue === option.value && (
                                    <Ionicons name="checkmark-circle" size={20} color={String(tw.color("indigo-500"))} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={() => setIsVisible(false)}
                        style={tw`mt-4 p-3 bg-gray-100 rounded-xl`}
                    >
                        <TextTheme style={tw`text-center`}>ปิด</TextTheme>
                    </TouchableOpacity>
                </View>
            </Dialog>
        </>
    );
};

export default FilterButton;