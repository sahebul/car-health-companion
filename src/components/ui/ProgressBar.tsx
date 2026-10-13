import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { darkColors } from '../../constants/theme';

interface ProgressBarProps {
    value: number; // 0..1
    color?: string;
    height?: number;
}

export function ProgressBar({ value, color = darkColors.primary, height = 6 }: ProgressBarProps) {
    const clamped = Math.max(0, Math.min(1, value));
    return (
        <View style={[styles.track, { height, borderRadius: height / 2 }]}>
            <LinearGradient
                colors={[color, adjustOpacity(color, 0.7)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                    styles.fill,
                    { width: `${clamped * 100}%`, borderRadius: height / 2 },
                ]}
            />
        </View>
    );
}

function adjustOpacity(hex: string, alpha: number) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
    track: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
    },
});