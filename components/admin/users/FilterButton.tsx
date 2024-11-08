import TextTheme from "@/components/TextTheme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { TouchableOpacity } from "react-native";
import { View } from "react-native-ui-lib";
import tw from "twrnc"

interface FilterButtonProps {
    options: Array<{ label: string; value: string | null }>;
    selectedValue: string | null;
    onSelect: (value: string | null) => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ options, selectedValue, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View style={tw`relative`}>
            <TouchableOpacity
                onPress={() => setIsOpen(!isOpen)}
                style={tw`bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-row items-center gap-2`}
            >
                <Ionicons name="filter" size={20} color={String(tw.color("indigo-500"))} />
                <TextTheme style={tw`text-gray-700`}>
                    {options.find(opt => opt.value === selectedValue)?.label || 'All'}
                </TextTheme>
            </TouchableOpacity>

            {isOpen && (
                <View style={tw`absolute top-12 right-0 bg-white rounded-xl shadow-lg border border-gray-100 min-w-[120px] z-50`}>
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => {
                                onSelect(option.value);
                                setIsOpen(false);
                            }}
                            style={tw`px-4 py-2.5 border-b border-gray-100 last:border-b-0`}
                        >
                            <TextTheme
                                style={tw`${selectedValue === option.value ? 'text-indigo-600' : 'text-gray-700'}`}
                            >
                                {option.label}
                            </TextTheme>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

export default FilterButton