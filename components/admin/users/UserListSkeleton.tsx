import React from "react";
import { View } from "react-native";
import * as Animatable from "react-native-animatable"
import tw from "twrnc"

const UserSkeletonItem = () => (
    <Animatable.View
        animation="pulse"
        iterationCount="infinite"
        easing="ease-in-out"
        style={tw`bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm border border-gray-100`}
    >
        <View style={tw`flex-row items-center gap-3`}>
            <View style={tw`w-12 h-12 rounded-full bg-slate-200`} />

            <View style={tw`gap-2`}>
                <View style={tw`w-32 h-5 bg-slate-200 rounded`} />
                <View style={tw`w-40 h-4 bg-slate-200 rounded`} />
                <View style={tw`w-20 h-4 bg-slate-200 rounded-full`} />
            </View>
        </View>
        <View style={tw`w-5 h-5 bg-slate-200 rounded-full`} />
    </Animatable.View>
);

const UserListSkeleton: React.FC = () => {
    return (
        <View style={tw`flex-1 bg-gray-50`}>
            <View style={tw`p-4`}>
                {[...Array(6)].map((_, index) => (
                    <React.Fragment key={index}>
                        <UserSkeletonItem />
                        {index < 5 && <View style={tw`h-2`} />}
                    </React.Fragment>
                ))}
            </View>
        </View>
    );
};

export default UserListSkeleton