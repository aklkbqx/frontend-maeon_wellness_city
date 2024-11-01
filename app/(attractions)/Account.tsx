import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, View, ActivityIndicator } from 'react-native';
import tw from "twrnc"
import { formatEmail, formatPhoneNumber, handleErrorMessage } from '@/helper/my-lib';
import { Href, router, useFocusEffect } from 'expo-router';
import { useStatusBar } from '@/hooks/useStatusBar';
import { Users } from '@/types/PrismaType';
import { Avatar, Switch, TouchableOpacity } from 'react-native-ui-lib';
import TextTheme from '@/components/TextTheme';
import LogoutModal from '@/components/LogoutModal';
import { Ionicons } from '@expo/vector-icons';
import Loading from '@/components/Loading';
import { useFetchMeContext } from '@/context/FetchMeContext';

const MyAccount: React.FC = () => {
  useStatusBar("dark-content");
  const { userData, profileImageUrl, isLoading, initializeUserData, logout } = useFetchMeContext();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeUserData();
    setRefreshing(false);
  }, [initializeUserData]);

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-slate-100`}>
        <Loading loading={isLoading} color={String(tw.color("rose-500"))} />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-slate-100`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[String(tw`text-rose-500`.color)]}
            tintColor={String(tw`text-rose-500`.color)}
          />
        }
      >
        <View style={[tw`flex-1 shadow pb-5 web:pb-5 rounded-3xl m-2 bg-white mb-20`]}>
          <ProfileSection profileImageUrl={profileImageUrl} userData={userData} />
          <View style={tw`border-b-8 border-zinc-200`} />
          {userData ? <MenuSection title="บัญชีของฉัน" type="account" userData={userData} /> : null}
          <MenuSection title="สนับสนุนและเกี่ยวกับ" type="policy" userData={userData} />
          <MenuSection title="การตั้งค่า" type="setting" userData={userData} logout={logout} />
        </View>
        <View style={tw`android:mb-10 ios:mb-5`} />
      </ScrollView>
    </View>
  );
};

const ProfileSection: React.FC<{
  profileImageUrl: string | null;
  userData: Users | null;
}> = ({ profileImageUrl, userData }) => {
  return (
    <View style={tw`p-5 flex-row items-center gap-4`}>
      <View style={[tw`w-[80px] h-[80px] rounded-full bg-zinc-300 items-center justify-center`]}>
        {(userData && profileImageUrl ? (
          <Avatar
            size={75}
            badgePosition='BOTTOM_RIGHT'
            badgeProps={{ backgroundColor: String(tw`text-green-500`.color), size: 15, borderWidth: 1, borderColor: "white" }}
            source={{ uri: profileImageUrl }}
          />
        ) : (
          <Avatar
            size={75}
            source={require("@/assets/images/default-profile.jpg")}
          />
        ))}
      </View>
      {userData ? (
        <TouchableOpacity onPress={() => router.navigate("/account/edit-account")} style={tw.style("flex-col gap-1 flex-1")}>
          <View style={tw.style("flex-row gap-1")}>
            <TextTheme size='lg' font="Prompt-SemiBold">{userData && `${userData.firstname} ${userData.lastname}`}</TextTheme>
          </View>
          <View style={tw.style("flex-row gap-1")}>
            <TextTheme size='xs' color='slate-600' style={tw.style("w-[200px]")}>{userData && formatEmail(userData.email)}</TextTheme>
          </View>
          <View style={tw.style("flex-row gap-1")}>
            <TextTheme size='xs' style={tw.style("w-[200px]")}>{userData && formatPhoneNumber(userData.tel)}</TextTheme>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity onPress={() => router.navigate({
            pathname: "/register",
            params: {
              backToPage: "/my-account"
            }
          })}>
            <TextTheme font="Prompt-SemiBold" size="xl" children="ลงทะเบียน" />
          </TouchableOpacity>
          <TextTheme font="Prompt-SemiBold" size="xl" children="/" />
          <TouchableOpacity onPress={() => router.navigate({
            pathname: "/login",
            params: {
              backToPage: "/my-account"
            }
          })}>
            <TextTheme font="Prompt-SemiBold" size="xl" children="เข้าสู่ระบบ" />
          </TouchableOpacity>
        </View>
      )}
    </View >
  )
}


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
  userData: Users | null;
  logout?: () => void;
}> = ({ title, type, userData, logout }) => {
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

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

  return (
    <>
      {title && <TextTheme children={title} size="lg" color="zinc-400" font="Prompt-SemiBold" style={tw`px-5 my-2`} />}
      <View style={tw`border-b-2 border-slate-200`} />
      {filteredItems.map(({ text, iconname, link }, index) => (
        <React.Fragment key={`menulist-${type}-${index}`}>
          <TouchableOpacity
            onPress={() => handleItemPress(link, text)}
            style={tw`flex-row justify-between items-center px-5 w-full py-3`}>
            <View style={tw`flex-row items-center gap-2`}>
              <Ionicons style={text == "ออกจากระบบ" ? tw`text-red-600` : tw`text-zinc-700`} size={25} name={iconname} />
              <TextTheme color={text == "ออกจากระบบ" ? "red-600" : 'zinc-700'} style={tw`text-[16px]`}>{text}</TextTheme>
            </View>
            {text == "การแจ้งเตือน" ? (
              <View>
                <Switch value={false} onValueChange={() => console.log('value changed')} />
              </View>
            ) : null}
          </TouchableOpacity>
          {text == "ออกจากระบบ" && logout ? (
            <LogoutModal
              isVisible={isLogoutModalVisible}
              onClose={() => setIsLogoutModalVisible(false)}
              onLogout={logout}
            />
          ) : null}

        </React.Fragment>
      ))}
    </>
  );
};


export default MyAccount;