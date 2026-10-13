import React from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent, useColorScheme } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { lightColors, darkColors } from '../../constants/theme';

interface SegmentedControlProps {
    options: string[];
    selectedIndex: number;
    onChange: (index: number) => void;
}

export function SegmentedControl({ options, selectedIndex, onChange }: SegmentedControlProps) {
    const [width, setWidth] = React.useState(0);
    const translateX = useSharedValue(0);
    const isDark = useColorScheme() === 'dark';
    const colors = isDark ? darkColors : lightColors;
    const styles = createStyles(colors);
    React.useEffect(() => {
        if (width > 0) {
            translateX.value = withSpring((width / options.length) * selectedIndex, {
                stiffness: 300,
                damping: 30,
            });
        }
    }, [selectedIndex, width, options.length]);

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const onLayout = (e: LayoutChangeEvent) => {
        setWidth(e.nativeEvent.layout.width - 4);
    };

    return (
        <View style={styles.container} onLayout={onLayout}>
            <Animated.View
                style={[
                    styles.indicator,
                    { width: width / options.length },
                    indicatorStyle,
                ]}
            />
            {options.map((opt, i) => (
                <Pressable
                    key={opt}
                    onPress={() => {
                        Haptics.selectionAsync();
                        onChange(i);
                    }}
                    style={styles.tab}
                >
                    <Text
                        style={[
                            styles.label,
                            selectedIndex === i && styles.labelActive,
                        ]}
                    >
                        {opt}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}

const createStyles = (colors: typeof lightColors) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: 'rgba(120,120,128,0.16)',
        borderRadius: 12,
        padding: 2,
        position: 'relative',
    },
    indicator: {
        position: 'absolute',
        top: 2,
        left: 2,
        bottom: 2,
        backgroundColor: colors.surfaceElevated,
        borderRadius: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        zIndex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    labelActive: {
        color: colors.textPrimary,
    },
});