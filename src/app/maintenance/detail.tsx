import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
    useColorScheme,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft,
    ChevronRight,
    Trash2,
    Calendar,
    Gauge,
    DollarSign,
    MapPin,
    FileText,
    Car,
    Clock,
    Wrench,
    CheckCircle2,
    Info,
} from 'lucide-react-native';
import { darkColors, lightColors, spacing, radius } from '../../constants/theme';
import { MaintenanceLog } from '../../types';
import { getMaintenanceType } from '../../utils/common';
import { db } from '../../db/client';
import { maintenanceLogs } from '../../db/schema';
import { eq } from 'drizzle-orm';

interface TypeConfig {
    label: string;
    emoji: string;
    accentColor: string;
    description: string;
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
    oil_change: {
        label: 'Oil & Filter Change',
        emoji: '🛢️',
        accentColor: '#FF9F0A',
        description: 'Engine oil flushed and replaced with fresh lubricant and filter.',
    },
    tire_rotation: {
        label: 'Tire Rotation',
        emoji: '🛞',
        accentColor: '#0A84FF',
        description: 'Tire positions rotated to ensure balanced tread wear.',
    },
    brake_pads: {
        label: 'Brake Pads & Service',
        emoji: '🛑',
        accentColor: '#FF453A',
        description: 'Brake system inspection, pad replacement, or rotor service.',
    },
    air_filter: {
        label: 'Air Filter Replacement',
        emoji: '🌬️',
        accentColor: '#30D158',
        description: 'Engine intake or cabin air filter elements inspected and replaced.',
    },
    battery: {
        label: 'Battery & Electrical',
        emoji: '⚡',
        accentColor: '#BF5AF2',
        description: 'Battery health test, terminal service, or unit replacement.',
    },
    other: {
        label: 'General Maintenance',
        emoji: '🔧',
        accentColor: '#64D2FF',
        description: 'Scheduled maintenance, diagnostic service, or repair.',
    },
};

function getTypeConfig(type: string): TypeConfig {
    return (
        TYPE_CONFIG[type] ?? {
            label: getMaintenanceType(type),
            emoji: '🔧',
            accentColor: '#64D2FF',
            description: 'Routine maintenance service performed.',
        }
    );
}

function formatFullDate(dateStr?: string | null) {
    if (!dateStr) return 'Not recorded';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

function getRelativeTime(dateStr?: string | null) {
    if (!dateStr) return '--';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '--';
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'Upcoming';
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
        }
        if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} ${months === 1 ? 'month' : 'months'} ago`;
        }
        const years = Math.floor(diffDays / 365);
        return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    } catch {
        return '--';
    }
}

export default function MaintenanceDetailScreen() {
    const router = useRouter();
    const { detail, id } = useLocalSearchParams<{ detail?: string; id?: string }>();
    const isDark = useColorScheme() === 'dark';
    const colors = isDark ? darkColors : lightColors;
    const styles = createStyles(colors);

    const initialLog: MaintenanceLog | null = useMemo(() => {
        if (detail && typeof detail === 'string') {
            try {
                return JSON.parse(detail);
            } catch (err) {
                console.warn('Failed to parse detail JSON parameter:', err);
            }
        }
        return null;
    }, [detail]);

    const [log, setLog] = useState<MaintenanceLog | null>(initialLog);
    const [loading, setLoading] = useState<boolean>(!initialLog);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    useEffect(() => {
        const logId = id ? Number(id) : initialLog?.id;
        if (!logId) {
            setLoading(false);
            return;
        }

        // If we don't have log or vehicle details are missing, fetch fresh from DB
        if (!initialLog || !initialLog.vehicle) {
            const fetchLog = async () => {
                try {
                    const data = await db.query.maintenanceLogs.findFirst({
                        where: eq(maintenanceLogs.id, logId),
                        with: {
                            vehicle: true,
                        },
                    });

                    if (data) {
                        setLog({
                            id: data.id,
                            vehicleId: data.vehicleId,
                            type: data.type,
                            description: data.description || '',
                            mileageAtService: data.mileageAtService ?? 0,
                            cost: data.cost ?? 0,
                            shopName: data.shopName || '',
                            performedAt: data.performedAt,
                            notes: data.notes,
                            vehicle: data.vehicle,
                            createdAt: data.createdAt,
                        });
                    }
                } catch (error) {
                    console.error('Error fetching maintenance log details:', error);
                } finally {
                    setLoading(false);
                }
            };

            fetchLog();
        } else {
            setLoading(false);
        }
    }, [id, initialLog]);

    const handleDelete = () => {
        if (!log || isDeleting) return;

        Alert.alert(
            'Delete Maintenance Record',
            `Are you sure you want to delete this maintenance entry${log.vehicle?.name ? ` for ${log.vehicle.name}` : ''}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsDeleting(true);
                            await db.delete(maintenanceLogs).where(eq(maintenanceLogs.id, log.id));
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            router.back();
                        } catch (err) {
                            setIsDeleting(false);
                            console.error('Failed to delete maintenance log:', err);
                            Alert.alert('Error', 'Unable to delete maintenance record. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.navBar}>
                    <Pressable onPress={() => router.back()} style={styles.navBtn}>
                        <ChevronLeft size={22} color={colors.textPrimary} />
                    </Pressable>
                    <Text style={styles.navTitle}>Maintenance Detail</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!log) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.navBar}>
                    <Pressable onPress={() => router.back()} style={styles.navBtn}>
                        <ChevronLeft size={22} color={colors.textPrimary} />
                    </Pressable>
                    <Text style={styles.navTitle}>Maintenance Detail</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.centerContainer}>
                    <View style={styles.notFoundIcon}>
                        <Info size={36} color={colors.textTertiary} />
                    </View>
                    <Text style={styles.notFoundTitle}>Record Not Found</Text>
                    <Text style={styles.notFoundSub}>
                        This maintenance record may have been removed or could not be loaded.
                    </Text>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>Return to History</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const typeConfig = getTypeConfig(log.type);
    const mileageUnit = log.vehicle?.mileageUnit || 'km';
    const mileageAtService = log.mileageAtService ?? 0;
    const currentMileage = log.vehicle?.currentMileage;
    const mileageDrivenSince = currentMileage != null && mileageAtService > 0 ? currentMileage - mileageAtService : null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Navigation Header */}
            <View style={styles.navBar}>
                <Pressable onPress={() => router.back()} style={styles.navBtn} hitSlop={8}>
                    <ChevronLeft size={22} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.navTitle}>Service Details</Text>
                <Pressable
                    onPress={handleDelete}
                    style={[styles.navBtn, styles.deleteNavBtn]}
                    hitSlop={8}
                    disabled={isDeleting}
                >
                    <Trash2 size={18} color={colors.danger} />
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Summary Card */}
                <View style={styles.heroCard}>
                    <View
                        style={[
                            styles.heroIconBox,
                            { backgroundColor: `${typeConfig.accentColor}22` },
                        ]}
                    >
                        <Text style={styles.heroEmoji}>{typeConfig.emoji}</Text>
                    </View>

                    <Text style={styles.heroTitle}>{typeConfig.label}</Text>

                    {log.description ? (
                        <Text style={styles.heroDesc}>{log.description}</Text>
                    ) : (
                        <Text style={styles.heroDesc}>{typeConfig.description}</Text>
                    )}

                    <View style={styles.heroBadgesRow}>
                        {log.vehicle?.name && (
                            <View style={styles.heroBadge}>
                                <Car size={13} color={colors.textSecondary} />
                                <Text style={styles.heroBadgeText} numberOfLines={1}>
                                    {log.vehicle.name}
                                </Text>
                            </View>
                        )}
                        <View style={styles.heroBadge}>
                            <Calendar size={13} color={colors.textSecondary} />
                            <Text style={styles.heroBadgeText}>
                                {new Date(log.performedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Key Metrics Quick Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <View style={styles.statHeader}>
                            <DollarSign size={13} color={colors.primary} />
                            <Text style={styles.statLabel}>COST</Text>
                        </View>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                            {log.cost != null ? `$${Number(log.cost).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '$0'}
                        </Text>
                        <Text style={styles.statSub}>Total amount</Text>
                    </View>

                    <View style={styles.statBox}>
                        <View style={styles.statHeader}>
                            <Gauge size={13} color={colors.textTertiary} />
                            <Text style={styles.statLabel}>ODOMETER</Text>
                        </View>
                        <Text style={styles.statValue}>
                            {mileageAtService > 0 ? mileageAtService.toLocaleString() : '--'}
                        </Text>
                        <Text style={styles.statSub}>{mileageUnit}</Text>
                    </View>

                    <View style={styles.statBox}>
                        <View style={styles.statHeader}>
                            <Clock size={13} color={colors.textTertiary} />
                            <Text style={styles.statLabel}>TIMELINE</Text>
                        </View>
                        <Text style={styles.statValue} numberOfLines={1}>
                            {getRelativeTime(log.performedAt)}
                        </Text>
                        <Text style={styles.statSub}>Date logged</Text>
                    </View>
                </View>

                {/* Section: Service Overview */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionHeaderTitle}>SERVICE OVERVIEW</Text>

                    <View style={styles.detailRow}>
                        <View style={styles.detailLabelGroup}>
                            <Wrench size={16} color={colors.textTertiary} />
                            <Text style={styles.detailLabel}>Category</Text>
                        </View>
                        <View
                            style={[
                                styles.pillBadge,
                                { backgroundColor: `${typeConfig.accentColor}18` },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.pillBadgeText,
                                    { color: typeConfig.accentColor },
                                ]}
                            >
                                {typeConfig.label}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailLabelGroup}>
                            <Calendar size={16} color={colors.textTertiary} />
                            <Text style={styles.detailLabel}>Date Performed</Text>
                        </View>
                        <Text style={styles.detailValue}>
                            {formatFullDate(log.performedAt)}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailLabelGroup}>
                            <Gauge size={16} color={colors.textTertiary} />
                            <Text style={styles.detailLabel}>Service Mileage</Text>
                        </View>
                        <Text style={styles.detailValue}>
                            {mileageAtService > 0
                                ? `${mileageAtService.toLocaleString()} ${mileageUnit}`
                                : 'Not recorded'}
                        </Text>
                    </View>

                    <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                        <View style={styles.detailLabelGroup}>
                            <DollarSign size={16} color={colors.textTertiary} />
                            <Text style={styles.detailLabel}>Total Cost</Text>
                        </View>
                        <Text style={[styles.detailValue, { fontWeight: '700', color: colors.textPrimary }]}>
                            {log.cost != null ? `$${Number(log.cost).toFixed(2)}` : '$0.00'}
                        </Text>
                    </View>
                </View>

                {/* Section: Workshop / Shop Info */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionHeaderTitle}>SERVICE LOCATION</Text>
                    <View style={styles.shopRow}>
                        <View style={styles.shopIconBox}>
                            <MapPin size={20} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.shopName}>
                                {log.shopName && log.shopName.trim() !== ''
                                    ? log.shopName
                                    : 'Self / DIY Service'}
                            </Text>
                            <Text style={styles.shopSub}>
                                {log.shopName && log.shopName.trim() !== ''
                                    ? 'Service provider & facility'
                                    : 'Performed by vehicle owner'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Section: Vehicle Info */}
                {log.vehicle && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionHeaderTitle}>VEHICLE</Text>
                        <Pressable
                            style={styles.vehicleRow}
                            onPress={() => router.push(`/vehicle/${log.vehicle.id}`)}
                        >
                            <View style={styles.vehicleIconBox}>
                                <Car size={22} color={colors.textPrimary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.vehicleName}>{log.vehicle.name}</Text>
                                <Text style={styles.vehicleSub}>
                                    {[
                                        log.vehicle.year,
                                        log.vehicle.make,
                                        log.vehicle.model,
                                        log.vehicle.licensePlate,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </Text>
                            </View>
                            <ChevronRight size={18} color={colors.textTertiary} />
                        </Pressable>

                        {mileageDrivenSince != null && (
                            <View style={styles.mileageDeltaBox}>
                                <CheckCircle2 size={16} color={colors.success} />
                                <Text style={styles.mileageDeltaText}>
                                    {mileageDrivenSince >= 0
                                        ? `+${mileageDrivenSince.toLocaleString()} ${mileageUnit} driven since this service`
                                        : `Logged at current odometer (${mileageAtService.toLocaleString()} ${mileageUnit})`}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Section: Notes & Remarks */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionHeaderTitle}>NOTES & REMARKS</Text>
                    {log.notes && log.notes.trim() !== '' ? (
                        <View style={styles.notesContainer}>
                            <FileText size={18} color={colors.primary} style={{ marginTop: 2 }} />
                            <Text style={styles.notesText}>{log.notes}</Text>
                        </View>
                    ) : (
                        <Text style={styles.noNotesText}>
                            No additional technician notes recorded for this service.
                        </Text>
                    )}
                </View>

                {/* Bottom Delete Action Button */}
                <Pressable
                    onPress={handleDelete}
                    style={({ pressed }) => [
                        styles.deleteButton,
                        pressed && { opacity: 0.75 },
                    ]}
                    disabled={isDeleting}
                >
                    <Trash2 size={18} color={colors.danger} />
                    <Text style={styles.deleteButtonText}>Delete Maintenance Record</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (colors: typeof lightColors) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        navBar: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
        },
        navBtn: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        deleteNavBtn: {
            borderColor: 'rgba(255, 69, 58, 0.25)',
            backgroundColor: 'rgba(255, 69, 58, 0.1)',
        },
        navTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
        scrollContent: {
            paddingHorizontal: spacing.md,
            paddingTop: spacing.sm,
            paddingBottom: 60,
        },
        centerContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.xl,
        },
        loadingText: {
            marginTop: spacing.md,
            color: colors.textSecondary,
            fontSize: 15,
        },
        notFoundIcon: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
        },
        notFoundTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 8,
        },
        notFoundSub: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: spacing.lg,
        },
        backBtn: {
            paddingHorizontal: spacing.xl,
            paddingVertical: 12,
            backgroundColor: colors.primary,
            borderRadius: radius.button,
        },
        backBtnText: {
            color: '#FFFFFF',
            fontWeight: '600',
            fontSize: 14,
        },
        heroCard: {
            backgroundColor: colors.surface,
            borderRadius: radius.card,
            padding: spacing.xl,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: spacing.md,
        },
        heroIconBox: {
            width: 68,
            height: 68,
            borderRadius: 34,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
        },
        heroEmoji: {
            fontSize: 32,
        },
        heroTitle: {
            fontSize: 22,
            fontWeight: '700',
            color: colors.textPrimary,
            textAlign: 'center',
            letterSpacing: -0.3,
        },
        heroDesc: {
            fontSize: 13,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: 4,
            lineHeight: 18,
            paddingHorizontal: spacing.sm,
        },
        heroBadgesRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            marginTop: spacing.lg,
            justifyContent: 'center',
        },
        heroBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: colors.surfaceElevated,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: radius.chip,
            borderWidth: 1,
            borderColor: colors.border,
        },
        heroBadgeText: {
            fontSize: 12,
            color: colors.textSecondary,
            fontWeight: '500',
        },
        statsRow: {
            flexDirection: 'row',
            gap: spacing.sm,
            marginBottom: spacing.md,
        },
        statBox: {
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
        },
        statHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginBottom: 6,
        },
        statLabel: {
            fontSize: 10,
            fontWeight: '700',
            color: colors.textTertiary,
            letterSpacing: 0.8,
        },
        statValue: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.textPrimary,
        },
        statSub: {
            fontSize: 11,
            color: colors.textTertiary,
            marginTop: 2,
        },
        sectionCard: {
            backgroundColor: colors.surface,
            borderRadius: radius.card,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: spacing.md,
        },
        sectionHeaderTitle: {
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.1,
            color: colors.textTertiary,
            marginBottom: spacing.md,
        },
        detailRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
        },
        detailLabelGroup: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
        },
        detailLabel: {
            fontSize: 14,
            color: colors.textSecondary,
        },
        detailValue: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textPrimary,
            maxWidth: '60%',
            textAlign: 'right',
        },
        pillBadge: {
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: radius.chip,
        },
        pillBadgeText: {
            fontSize: 12,
            fontWeight: '600',
        },
        shopRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
        },
        shopIconBox: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.surfaceElevated,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        shopName: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.textPrimary,
        },
        shopSub: {
            fontSize: 13,
            color: colors.textSecondary,
            marginTop: 2,
        },
        vehicleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingVertical: 4,
        },
        vehicleIconBox: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.surfaceElevated,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        vehicleName: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.textPrimary,
        },
        vehicleSub: {
            fontSize: 13,
            color: colors.textSecondary,
            marginTop: 2,
        },
        mileageDeltaBox: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: spacing.md,
            paddingTop: spacing.md,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
        },
        mileageDeltaText: {
            fontSize: 13,
            color: colors.textSecondary,
            fontWeight: '500',
        },
        notesContainer: {
            flexDirection: 'row',
            gap: spacing.sm,
            backgroundColor: colors.surfaceElevated,
            padding: spacing.md,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
        },
        notesText: {
            flex: 1,
            fontSize: 14,
            color: colors.textPrimary,
            lineHeight: 20,
        },
        noNotesText: {
            fontSize: 13,
            color: colors.textTertiary,
            fontStyle: 'italic',
            paddingVertical: 4,
        },
        deleteButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            height: 48,
            borderRadius: radius.button,
            borderWidth: 1,
            borderColor: 'rgba(255, 69, 58, 0.3)',
            backgroundColor: 'rgba(255, 69, 58, 0.08)',
            marginTop: spacing.sm,
        },
        deleteButtonText: {
            color: colors.danger,
            fontSize: 14,
            fontWeight: '600',
        },
    });