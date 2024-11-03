import React from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import { LineChart } from "react-native-chart-kit";
import tw from "twrnc"
import TextTheme from '@/components/TextTheme';

const Index = () => {
    return (
        <ScrollView style={tw`flex-1 bg-gray-50`}>
            <TextTheme style={tw`text-2xl font-bold mb-2 px-4`}>แดชบอร์ด</TextTheme>
            <View style={[tw` rounded-xl overflow-hidden`, { transform: [{ scale: 0.92 }] }]}>
                <LineChart
                    data={{
                        labels: ["January", "February", "March", "April", "May", "June"],
                        datasets: [
                            {
                                data: [
                                    Math.random() * 100,
                                    Math.random() * 100,
                                    Math.random() * 100,
                                    Math.random() * 100,
                                    Math.random() * 100,
                                    Math.random() * 100
                                ]
                            }
                        ]
                    }}
                    width={Dimensions.get("window").width}
                    height={220}
                    yAxisLabel="$"
                    yAxisSuffix="k"
                    yAxisInterval={1}
                    chartConfig={{
                        backgroundGradientFrom: String(tw.color("rose-700")),
                        backgroundGradientTo: String(tw.color("rose-400")),
                        decimalPlaces: 2,
                        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        style: {
                            borderRadius: 16
                        },
                        propsForDots: {
                            r: "6",
                            strokeWidth: "2",
                            stroke: String(tw.color("rose-400"))
                        }
                    }}
                    bezier
                    style={{
                        borderRadius: 16,
                    }}
                />
            </View>
        </ScrollView>
    );
};

export default Index;