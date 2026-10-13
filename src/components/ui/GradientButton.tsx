import React from 'react';
import { Text, StyleSheet, Pressable, ViewStyle, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { lightColors, darkColors, spacing, radius } from '../../constants/theme';

interface GradientButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'ghost';
    style?: ViewStyle;
    icon?: React.ReactNode;
}

export function GradientButton({
    title,
    onPress,
    variant = 'primary',
    style,
    icon,
}: GradientButtonProps) {

    const isDark = useColorScheme() === 'dark';
    const colors = isDark ? darkColors : lightColors;
    const styles = createStyles(colors);

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    if (variant === 'ghost') {
        return (
            <Pressable
                onPress={handlePress}
                style={({ pressed }) => [
                    styles.ghost,
                    pressed && { opacity: 0.7 },
                    style,
                ]}
            >
                {icon}
                <Text style={styles.ghostText}>{title}</Text>
            </Pressable>
        );
    }

    return (
        <Pressable
            onPress={handlePress}
            style={({ pressed }) => [
                pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
                style,
            ]}
        >
            <LinearGradient
                colors={[colors.primary, colors.primaryAlt]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                {icon}
                <Text style={styles.text}>{title}</Text>
            </LinearGradient>
        </Pressable>
    );
}

const createStyles = (colors: typeof lightColors) => StyleSheet.create({
    gradient: {
        height: 52,
        borderRadius: radius.button,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    ghost: {
        height: 52,
        borderRadius: radius.button,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    ghostText: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
});