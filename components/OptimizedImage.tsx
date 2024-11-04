import { useState } from "react";
import { Image, ImageProps, View } from "react-native";
import tw from "twrnc"
import Loading from "./Loading";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
    containerStyle?: object;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
    style,
    containerStyle,
    ...props
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    return (
        <View style={[tw`relative`, containerStyle]}>
            <Image
                {...props}
                style={[
                    tw`w-full h-full`,
                    style,
                    hasError && tw`bg-gray-100`
                ]}
                onLoad={handleLoad}
                onError={handleError}
            />
            {isLoading && (
                <View style={tw`absolute inset-0 bg-gray-100 items-center justify-center`}>
                    <Loading loading />
                </View>
            )}
            {hasError && (
                <View style={tw`absolute inset-0 bg-gray-100 items-center justify-center`}>
                    <MaterialCommunityIcons
                        name="image-off"
                        size={24}
                        color={tw.color('gray-400')}
                    />
                </View>
            )}
        </View>
    );
};

export default OptimizedImage