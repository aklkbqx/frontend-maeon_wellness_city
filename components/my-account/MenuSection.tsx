import React, { useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { Switch } from 'react-native-ui-lib';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Href } from 'expo-router';
import tw from 'twrnc';
import TextTheme from '../TextTheme';
import LogoutModal from '../LogoutModal';
import { Users } from '@/types/PrismaType';
import { useNotification } from '@/context/NotificationProvider';
import { useFetchMeContext } from '@/context/FetchMeContext';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface MenuItem {
    text: string;
    iconname: IoniconsName;
    link: string;
    color?: string;
}

interface MenuSectionProps {
    title: string;
    type: 'account' | 'policy' | 'setting';
    userData: Users | null;
}

const menuList: Record<MenuSectionProps['type'], MenuItem[]> = {
    account: [
        {
            text: "ข้อมูลส่วนตัว",
            iconname: "person",
            link: "/pages/edit-account"
        },
        {
            text: "สิ่งที่ถูกใจ",
            iconname: "heart",
            link: "/"
        },
    ],
    policy: [
        {
            text: "ติดต่อกับฝ่ายสนับสนุน",
            iconname: "chatbubbles-sharp",
            link: "/"
        },
        {
            text: "รายงานปัญหา",
            iconname: "flag",
            link: "/"
        },
        {
            text: "ข้อกำหนดและนโยบาย",
            iconname: "alert-circle",
            link: "/"
        },
    ],
    setting: [
        {
            text: "การแจ้งเตือน",
            iconname: "notifications",
            link: "/"
        },
        {
            text: "ออกจากระบบ",
            iconname: "log-out",
            link: "/logout"
        },
    ]
};

const MenuSection: React.FC<MenuSectionProps> = ({ title, type, userData }) => {
    const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
    const { logout } = useFetchMeContext();
    const { toggleNotifications, isEnabled } = useNotification();

    // Filter items based on user status
    const filteredItems = menuList[type].filter(item => {
        if (item.text === "ออกจากระบบ") {
            return userData !== null;
        }
        return true;
    });

    const handleItemPress = (link: string, text: string) => {
        if (text === "ออกจากระบบ") {
            setIsLogoutModalVisible(true);
        } else {
            router.navigate(link as Href);
        }
    };

    const renderItem = ({ item }: { item: MenuItem }) => (
        <TouchableOpacity
            onPress={() =>
                item.text === "การแจ้งเตือน"
                    ? toggleNotifications()
                    : handleItemPress(item.link, item.text)
            }
            style={tw`flex-row justify-between items-center p-4 bg-white mb-2 shadow-sm`}
        >
            <View style={tw`flex-row items-center gap-3`}>
                <View style={tw`w-10 h-10 rounded-full ${item.text === "ออกจากระบบ" ? "bg-red-100" : "bg-blue-100"} items-center justify-center`}>
                    <Ionicons
                        style={item.text === "ออกจากระบบ" ? tw`text-red-600` : tw`text-blue-600`}
                        size={20}
                        name={item.iconname}
                    />
                </View>
                <TextTheme
                    font="Prompt-Medium"
                    color={item.text === "ออกจากระบบ" ? "red-600" : 'zinc-700'}
                >
                    {item.text}
                </TextTheme>
            </View>
            {item.text === "การแจ้งเตือน" ? (
                <Switch 
                    style={tw`${isEnabled ? 'bg-blue-500' : "bg-gray-300"}`} 
                    value={isEnabled} 
                    onValueChange={toggleNotifications} 
                />
            ) : (
                <MaterialCommunityIcons 
                    name="chevron-right" 
                    size={24} 
                    color="#9CA3AF"
                />
            )}
        </TouchableOpacity>
    );

    const keyExtractor = (item: MenuItem, index: number) =>
        `menulist-${type}-${index}`;

    return (
        <>
            <View style={tw`px-5 py-3`}>
                {title && (
                    <TextTheme
                        size="base"
                        color="zinc-500"
                        font="Prompt-SemiBold"
                        style={tw`mb-2`}
                    >
                        {title}
                    </TextTheme>
                )}
                <FlatList
                    data={filteredItems}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    scrollEnabled={false}
                    initialNumToRender={filteredItems.length}
                    contentContainerStyle={tw`gap-1`}
                />
            </View>
            <LogoutModal
                isVisible={isLogoutModalVisible}
                onClose={() => setIsLogoutModalVisible(false)}
                onLogout={logout}
            />
        </>
    );
};

export default MenuSection;