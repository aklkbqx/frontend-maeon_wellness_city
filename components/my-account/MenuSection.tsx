import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import TextTheme from "../TextTheme";
import { FlatList, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { Href, router } from "expo-router";
import { Switch } from "react-native-ui-lib";
import LogoutModal from "../LogoutModal";
import { Users } from "@/types/PrismaType";
import { useNotification } from "@/context/NotificationProvider";
import { useFetchMeContext } from "@/context/FetchMeContext";

type IoniconsName = keyof typeof Ionicons.glyphMap;

type MenuItem = {
    text: string;
    iconname: IoniconsName;
    link: string;
    color?: string;
};

type MenuList = {
    [key: string]: MenuItem[];
};

const menuList: MenuList = {
    account: [
        {
            text: "ข้อมูลส่วนตัว",
            iconname: "person",
            link: "/account/edit-account"
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

const MenuSection: React.FC<{
    title: string;
    type: keyof typeof menuList;
    userData: Users | null
}> = ({ title, type, userData }) => {
    const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
    const { logout } = useFetchMeContext()
    const { toggleNotifications, isEnabled } = useNotification();

    const items = menuList[type] || [];
    const filteredItems = items.filter(item => {
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

    const renderItem = ({ item, index }: { item: MenuItem; index: number }) => (
        <TouchableOpacity
            onPress={() =>
                item.text === "การแจ้งเตือน"
                    ? toggleNotifications()
                    : handleItemPress(item.link, item.text)
            }
            style={tw`flex-row justify-between items-center px-5 w-full py-3`}
        >
            <View style={tw`flex-row items-center gap-2`}>
                <Ionicons
                    style={item.text === "ออกจากระบบ" ? tw`text-red-600` : tw`text-zinc-700`}
                    size={25}
                    name={item.iconname}
                />
                <TextTheme
                    color={item.text === "ออกจากระบบ" ? "red-600" : 'zinc-700'}
                    style={tw`text-[16px]`}
                >
                    {item.text}
                </TextTheme>
            </View>
            {item.text === "การแจ้งเตือน" && (
                <View>
                    <Switch style={tw`${isEnabled ? 'bg-blue-500' : "bg-gray-500"}`} value={isEnabled} onValueChange={toggleNotifications} />
                </View>
            )}
        </TouchableOpacity>
    );

    const keyExtractor = (item: MenuItem, index: number) =>
        `menulist-${type}-${index}`;

    return (
        <>
            {title && (
                <TextTheme
                    size="lg"
                    color="zinc-400"
                    font="Prompt-SemiBold"
                    style={tw`px-5 my-2`}
                >
                    {title}
                </TextTheme>
            )}
            <View style={tw`border-b-2 border-slate-200`} />
            <FlatList
                data={filteredItems}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                scrollEnabled={false}
                initialNumToRender={filteredItems.length}
            />
            <LogoutModal
                isVisible={isLogoutModalVisible}
                onClose={() => setIsLogoutModalVisible(false)}
                onLogout={logout}
            />
        </>
    );
};

export default MenuSection;