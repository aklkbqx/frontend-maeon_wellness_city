import { TextInput, View, LayoutChangeEvent } from "react-native";
import TextTheme from "../TextTheme";
import tw from "twrnc"
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { FormDataInput } from "@/types/types";
import { Users } from "@/types/PrismaType";

interface UserInfoSectionProps {
    formDataInput: FormDataInput;
    setFormDataInput: React.Dispatch<React.SetStateAction<FormDataInput>>;
    userData: Users | null;
}

const UserInfoSection: React.FC<UserInfoSectionProps> = ({ formDataInput, setFormDataInput, userData }) => {
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const fields = {
        firstname: {
            label: "ชื่อ",
            icon: "person-outline",
            placeholder: "กรอกชื่อของคุณ",
        },
        lastname: {
            label: "นามสกุล",
            icon: "person-outline",
            placeholder: "กรอกนามสกุลของคุณ",
        },
        tel: {
            label: "เบอร์โทรศัพท์",
            icon: "call-outline",
            placeholder: "กรอกเบอร์โทรศัพท์ของคุณ",
        },
    };

    const renderInput = (field: keyof typeof fields) => {
        if (userData?.role === "admin" && field === "tel") return null;

        const isFocused = focusedField === field;

        return (
            <View key={field} style={tw`mb-4`}>
                <TextTheme
                    style={tw`mb-1.5 text-gray-700`}
                    font="Prompt-Medium"
                    size="sm"
                >
                    {fields[field].label}
                </TextTheme>
                <View style={tw.style(
                    'flex-row items-center',
                    'bg-white border rounded-xl overflow-hidden',
                    isFocused ? 'border-blue-500' : 'border-gray-200'
                )}>
                    <View style={tw`pl-4 pr-2`}>
                        <Ionicons
                            name={fields[field].icon as any}
                            size={20}
                            color={isFocused ? tw.color('blue-500') : tw.color('gray-400')}
                        />
                    </View>
                    <TextInput
                        style={[
                            tw.style(
                                'flex-1 p-3.5',
                                'text-gray-900',
                                'bg-white'
                            ),
                            { fontFamily: "Prompt-Regular" }
                        ]}
                        placeholder={fields[field].placeholder}
                        placeholderTextColor={String(tw.color('gray-400'))}
                        value={formDataInput[field]}
                        onChangeText={(text) => setFormDataInput(prev => ({ ...prev, [field]: text }))}
                        onFocus={() => setFocusedField(field)}
                        onBlur={() => setFocusedField(null)}
                        autoCapitalize="none"
                        keyboardType={field === 'tel' ? 'numeric' : 'default'}
                        maxLength={field === 'tel' ? 10 : undefined}
                    />
                </View>
            </View>
        );
    };

    return (
        <View>
            <View style={tw`flex-row items-center gap-2 mb-4`}>
                <Ionicons
                    name="person"
                    size={20}
                    color={tw.color('blue-500')}
                />
                <TextTheme
                    font="Prompt-SemiBold"
                    size="lg"
                    style={tw`text-gray-800`}
                >
                    ข้อมูลผู้ใช้
                </TextTheme>
            </View>

            <View>
                {(Object.keys(fields) as Array<keyof typeof fields>).map(renderInput)}
            </View>
        </View>
    );
};

export default UserInfoSection;