import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronRight, Gauge, AlertTriangle, CheckCircle2, Car, Bike } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Vehicle } from '../../types';
import { darkColors, lightColors, radius, spacing, statusColor, statusLabel } from '../../constants/theme';
import { Chip } from '../ui/Chip';
import { ProgressBar } from '../ui/ProgressBar';

interface VehicleCardProps {
    vehicle: Vehicle;
    index: number;
    onPress: () => void
}

export function VehicleCard({ vehicle, index, onPress }: VehicleCardProps) {

    const isDark = useColorScheme() === 'dark';
    const colors = isDark ? darkColors : lightColors;
    const styles = createStyles(colors);
    const status = statusColor(vehicle.status, colors);
    const StatusIcon =
        vehicle.status === 'healthy' ? CheckCircle2 : AlertTriangle;


    return (
        <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
            <Pressable
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onPress();
                }}
                style={({ pressed }) => [
                    styles.card,
                    pressed && { transform: [{ scale: 0.98 }] },
                ]}
            >
                <LinearGradient
                    colors={[`${status}1F`, 'rgba(255,255,255,0.02)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                <View style={[styles.accentBar, { backgroundColor: status }]} />

                <View style={styles.row}>
                    <View style={styles.iconCircle}>
                        {
                            vehicle.type === "Four Wheelers" ? <Car size={22} color={colors.textPrimary} /> : <Bike size={22} color={colors.textPrimary} />
                        }
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.name}>
                            {vehicle.year} {vehicle.make} {vehicle.model}
                        </Text>
                        <Text style={styles.trim}>
                            {vehicle.trim} · {vehicle.engine}
                        </Text>
                    </View>
                    <ChevronRight size={20} color={colors.textTertiary} />
                </View>

                <View style={styles.chipRow}>
                    <Chip
                        icon={<Gauge size={14} color={colors.textSecondary} />}
                        label={`${vehicle.currentMileage.toLocaleString()} ${vehicle.mileageUnit}`}
                        color={colors.textSecondary}
                    />
                    <Chip
                        icon={<StatusIcon size={14} color={status} />}
                        label={statusLabel(vehicle.status)}
                        color={status}
                    />
                </View>

                {vehicle.nextReminder && (
                    <View style={styles.reminderBlock}>
                        <View style={styles.reminderRow}>
                            <Text style={styles.reminderLabel}>
                                🔧 {vehicle.nextReminder.title}
                            </Text>
                            <Text style={[styles.reminderDue, { color: status }]}>
                                {vehicle.nextReminder.dueLabel}
                            </Text>
                        </View>
                        <ProgressBar value={vehicle.nextReminder.progress} color={status} />
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
}

const createStyles = (colors: typeof lightColors) => StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
    },
    accentBar: {
        position: 'absolute',
        left: 0,
        top: 20,
        bottom: 20,
        width: 4,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 24,
    },
    name: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    trim: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    chipRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    reminderBlock: {
        gap: spacing.sm,
    },
    reminderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reminderLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    reminderDue: {
        fontSize: 13,
        fontWeight: '600',
    },
});