import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, SectionList, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Search } from 'lucide-react-native';
import { DUMMY_LOGS } from '../../data/dummy';
import { darkColors, lightColors, spacing, radius, statusColor } from '../../constants/theme';
import { MaintenanceLog } from '../../types';
import { db } from '../../db/client';
import { eq } from 'drizzle-orm';
import { maintenanceLogs } from '../../db/schema';
import { getMaintenanceType } from '../../utils/common';

const TYPE_FILTERS = ['All', 'Oil', 'Tires', 'Brakes', 'Air'];

export default function MaintenanceHistoryScreen() {
    const router = useRouter();
    const [filter, setFilter] = useState('All');
    const isDark = useColorScheme() === 'dark';
    const colors = isDark ? darkColors : lightColors;
    const styles = createStyles(colors);
    const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);


    useFocusEffect(
        React.useCallback(() => {
            const fetchLogs = async () => {
                const data = await db.query.maintenanceLogs.findMany({
                    with: {
                        vehicle: true,
                    }
                });
                const formattedLogs: MaintenanceLog[] = data.map(log => ({
                    id: log.id,
                    vehicleId: log.vehicleId,
                    type: log.type as any,
                    description: log.description || '',
                    mileageAtService: log.mileageAtService || 0,
                    cost: log.cost || 0,
                    shopName: log.shopName || '',
                    performedAt: log.performedAt,
                    notes: log.notes,
                    vehicle: log.vehicle
                }));
                setMaintenanceLogs(formattedLogs);
                // console.log("logs", JSON.stringify(formattedLogs));
            };
            fetchLogs();
        }, [])
    );

    if (!maintenanceLogs) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <Text style={{ color: colors.textPrimary }}>Loading...</Text>
            </View>
        );
    }
    const filtered = maintenanceLogs.filter((log) => {
        if (filter === 'All') return true;
        if (filter === 'Oil') return log.type === 'oil_change';
        if (filter === 'Tires') return log.type === 'tire_rotation';
        if (filter === 'Brakes') return log.type === 'brake_pads';
        if (filter === 'Air') return log.type === 'air_filter';
        return true;
    });

    const sections = groupByYear(filtered);
    const total = filtered.reduce((sum, l) => sum + (l.cost ?? 0), 0);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.navBar}>
                <Pressable onPress={() => router.back()} style={styles.navBtn}>
                    <ChevronLeft size={22} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.navTitle}>Maintenance History</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchWrap}>
                <Search size={18} color={colors.textTertiary} />
                <TextInput
                    placeholder="Search logs..."
                    placeholderTextColor={colors.textTertiary}
                    style={styles.searchInput}
                />
            </View>

            <View style={styles.chipRow}>
                {TYPE_FILTERS.map((f) => (
                    <Pressable
                        key={f}
                        onPress={() => setFilter(f)}
                        style={[styles.filterChip, filter === f && styles.filterChipActive]}
                    >
                        <Text
                            style={[styles.filterText, filter === f && styles.filterTextActive]}
                        >
                            {f}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id.toString()}
                renderSectionHeader={({ section }) => (
                    <Text style={styles.yearHeader}>{section.title}</Text>
                )}
                renderItem={({ item }) => <LogRow log={item} />}
                contentContainerStyle={styles.listContent}
                stickySectionHeadersEnabled={false}
                showsVerticalScrollIndicator={false}
            />

            <View style={styles.summaryBar}>
                <Text style={styles.summaryText}>
                    Total spent: <Text style={styles.summaryStrong}>${total}</Text> · {filtered.length} services
                </Text>
            </View>
        </SafeAreaView>
    );
}

function LogRow({ log }: { log: MaintenanceLog }) {
    const isDark = useColorScheme() === 'dark';
    const colors = isDark ? darkColors : lightColors;
    const styles = createStyles(colors);

    const handlePress = () => {
        router.push({
            pathname: '/maintenance/detail',
            params: { detail: JSON.stringify(log), id: String(log.id) },
        });
    };
    return (
        <Pressable onPress={handlePress} style={styles.logCard}>
            <View style={{ flex: 1 }}>
                <Text style={styles.logTitle}>{getMaintenanceType(log.type)}</Text>
                <Text style={styles.logSubTitle}>{log.vehicle?.name}</Text>
                <Text style={styles.logMeta}>
                    {new Date(log.performedAt).toLocaleDateString('en-US')} · {log.mileageAtService?.toLocaleString()} km · ${log.cost}
                </Text>
                <Text style={styles.logShop}>{log.shopName}</Text>
            </View>
        </Pressable>
    );
}

function groupByYear(logs: MaintenanceLog[]) {
    const map = new Map<string, MaintenanceLog[]>();
    logs.forEach((log) => {
        const year = log.performedAt.slice(0, 4);
        if (!map.has(year)) map.set(year, []);
        map.get(year)!.push(log);
    });
    return Array.from(map.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([title, data]) => ({ title, data }));
}

const createStyles = (colors: typeof lightColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    logSubTitle: { fontSize: 15, color: colors.textSecondary },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    navBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: colors.border,
    },
    navTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
        height: 44,
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchInput: { flex: 1, color: colors.textPrimary, fontSize: 15 },
    chipRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        marginTop: spacing.md,
    },
    filterChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    filterTextActive: { color: '#FFF' },
    listContent: { padding: spacing.md, paddingBottom: 140 },
    yearHeader: {
        fontSize: 12, fontWeight: '700', letterSpacing: 1.2,
        color: colors.textTertiary, marginTop: spacing.lg, marginBottom: spacing.md,
    },
    logCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    logTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    logMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    logShop: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
    summaryBar: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: spacing.xl,
        paddingBottom: 34,
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'center',
    },
    summaryText: { color: colors.textSecondary, fontSize: 13 },
    summaryStrong: { color: colors.textPrimary, fontWeight: '700' },
});