import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

interface ChipProps {
    icon?: React.ReactNode;
    label: string;
    color?: string;
    bgOpacity?: number;
}

export function Chip({ icon, label, color = colors.textPrimary, bgOpacity = 0.12 }: ChipProps) {
    return (
        <View
            style={[
                styles.chip,
                { backgroundColor: hexToRgba(color, bgOpacity) },
            ]}
        >
            {icon}
            <Text style={[styles.label, { color }]}>{label}</Text>
        </View>
    );
}

function hexToRgba(hex: string, alpha: number) {
    if (hex.startsWith('rgba')) return hex;
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.chip,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
    },
});