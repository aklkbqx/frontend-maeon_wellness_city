import { View, TextInput, TouchableWithoutFeedback, Keyboard, FlatList, TouchableOpacity, BackHandler, Image } from 'react-native'
import React, { useState, useCallback, useEffect } from 'react'
import { useStatusBar } from '@/hooks/useStatusBar';
import { Ionicons } from '@expo/vector-icons';
import tw from "twrnc"
import TextTheme from '@/components/TextTheme';
import { useTabBar } from '@/context/TabBarContext';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { handleAxiosError, handleErrorMessage } from '@/helper/my-lib';
import api from '@/helper/api';

interface LocationType {
  id: string;
  name: string;
}

interface SearchResult {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  image?: string | null;
  address?: string | null;
  subdistrict?: string | null;
  contact?: string | null;
  map?: string | null;
  date_info?: string | null;
}

const Search = () => {
  useStatusBar("dark-content");
  const { hideTabBar, showTabBar } = useTabBar();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searching, setSearching] = useState<boolean>(false);

  const fetchLocationTypes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/search/locations/types");
      if (response.data.success && response.data.location_type) {
        const locations = response.data.location_type.filter((loc: LocationType) => loc.name !== "โรงพยาบาล");
        setLocationTypes(locations);
      }
    } catch (error) {
      handleAxiosError(error, (message) => {
        handleErrorMessage(message);
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // สำหรับค้นหาทั่วไป
  const searchAll = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(`/api/search/search?q=${encodeURIComponent(query)}`);
      if (response.data.success) {
        setSearchResults(response.data.results || []);
      }
    } catch (error) {
      handleAxiosError(error, (message) => {
        handleErrorMessage(message);
      });
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchLocationTypes();
  }, [fetchLocationTypes]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    searchAll(text);
  }, [searchAll]);

  const getIconName = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case "สถานที่ท่องเที่ยว": return "earth";
      case "ที่พัก": return "bed";
      case "แหล่งเรียนรู้": return "school";
      case "ร้านอาหารและของฝาก": return "restaurant";
      case "โรงพยาบาล": return "medical";
      default: return "alert";
    }
  };

  const getIconColor = (index: number): string => {
    const colors = ["rose-500", "sky-500", "purple-500", "amber-500", "fuchsia-500"];
    return colors[index % colors.length];
  };

  useFocusEffect(useCallback(() => {
    hideTabBar();
    return () => showTabBar()
  }, [hideTabBar, showTabBar]));

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.back();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  const renderLocationTypeItem = ({ item, index }: { item: LocationType; index: number }) => (
    <TouchableOpacity
      style={tw`bg-white p-4 rounded-2xl flex-row items-center gap-3 my-1.5`}
      onPress={() => {
        router.push(`/locations/by-type/${item.id}`);
      }}
    >
      <LinearGradient
        colors={["#fff", String(tw.color(getIconColor(index).replace("-500", "-50")))]}
        style={tw`w-14 h-14 rounded-xl justify-center items-center border border-[${String(tw.color(getIconColor(index).replace("-500", "-100")))}]`}
      >
        <Ionicons
          name={getIconName(item.name)}
          size={30}
          color={String(tw.color(getIconColor(index)))}
        />
      </LinearGradient>
      <View style={tw`flex-1`}>
        <TextTheme font='Prompt-Medium' size='base'>{item.name}</TextTheme>
      </View>
      <Ionicons name="chevron-forward" size={20} style={tw`text-gray-400`} />
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    // Parse contact information if available
    let contactInfo = null;
    try {
      contactInfo = item.contact ? JSON.parse(item.contact) : null;
    } catch (e) {
      console.error('Error parsing contact:', e);
    }

    // Parse opening hours if available
    let openingHours = null;
    try {
      openingHours = item.date_info ? JSON.parse(item.date_info) : null;
    } catch (e) {
      console.error('Error parsing date_info:', e);
    }

    return (
      <TouchableOpacity
        style={tw`bg-white p-4 rounded-2xl flex-row items-center gap-3 my-1.5`}
        onPress={() => router.push(`/detail/${item.id}`)}
      >
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={tw`w-14 h-14 rounded-xl`}
            resizeMode="cover"
          />
        ) : (
          <View style={tw`w-14 h-14 rounded-xl bg-slate-100 justify-center items-center`}>
            <Ionicons name={getIconName(item.type)} size={24} color="#666" />
          </View>
        )}
        <View style={tw`flex-1`}>
          <TextTheme font='Prompt-Medium' size='base'>{item.name}</TextTheme>
          <TextTheme font='Prompt-Light' size='sm' style={tw`text-gray-500`}>{item.type}</TextTheme>
          {item.subdistrict && (
            <TextTheme font='Prompt-Light' size='xs' style={tw`text-gray-400`}>
              {item.subdistrict}
            </TextTheme>
          )}
          {openingHours?.text && (
            <TextTheme font='Prompt-Light' size='xs' style={tw`text-gray-400`}>
              เวลาทำการ: {openingHours.text}
            </TextTheme>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={tw`flex-1 bg-slate-100`}>
      <View style={tw`px-5 mt-2 flex-1`}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={tw`relative mb-3`}>
            <TextInput
              style={[
                tw`border border-slate-200 rounded-xl py-2 px-10 flex-row text-zinc-500 bg-white`,
                { fontFamily: "Prompt-Regular" }
              ]}
              placeholder='ค้นหาสถานที่ที่คุณสนใจ...'
              placeholderTextColor={"#717179"}
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize='none'
              autoFocus
            />
            {searching ? (
              <Ionicons
                name='refresh'
                style={tw`text-zinc-500 absolute top-[15%] android:top-[20%] right-[4%] text-xl`}
              />
            ) : (
              <Ionicons
                name='search'
                style={tw`text-zinc-500 absolute top-[15%] android:top-[20%] left-[4%] text-xl`}
              />
            )}
          </View>
        </TouchableWithoutFeedback>

        {!loading && !searchQuery && (
          <>
            <TextTheme font='Prompt-Medium' size='lg' style={tw`mb-2`}>หมวดหมู่ที่น่าสนใจ</TextTheme>
            <FlatList
              data={locationTypes}
              renderItem={renderLocationTypeItem}
              keyExtractor={item => item.id}
              contentContainerStyle={tw`pb-20`}
              showsVerticalScrollIndicator={false}
              onScroll={Keyboard.dismiss}
            />
          </>
        )}

        {searchQuery && (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={item => item.id}
            contentContainerStyle={tw`pb-20`}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={tw`mt-4 items-center`}>
                <TextTheme font='Prompt-Regular' style={tw`text-gray-500`}>
                  {searching ? 'กำลังค้นหา...' : 'ไม่พบข้อมูลที่ค้นหา'}
                </TextTheme>
              </View>
            )}
            onScroll={Keyboard.dismiss}
          />
        )}
      </View>
    </View>
  )
}

export default Search