import { Ionicons } from "@expo/vector-icons";
import { TextInput, View } from "react-native";
import tw from "twrnc"

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, placeholder }) => (
    <View style={tw`flex-1 relative`}>
        <View style={tw`absolute left-3 top-3 z-10`}>
            <Ionicons name="search" size={20} />
        </View>
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            style={[tw`bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 font-medium`, { fontFamily: "Prompt-Regular" }]}
            placeholderTextColor="#9CA3AF"
        />
    </View>
);


export default SearchBar