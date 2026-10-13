import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Car, ChevronLeft, ChevronRight, Pencil, Plus, Bike } from 'lucide-react-native';
import { DUMMY_VEHICLES, DUMMY_LOGS, DUMMY_REMINDERS } from '../../data/dummy';
import { darkColors, lightColors, radius, spacing, statusColor } from '../../constants/theme';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { GradientButton } from '../../components/ui/GradientButton';
import { db } from '../../db/client';
import { vehicles, type Vehicle, maintenanceLogs } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { MaintenanceLog, Reminder } from '../../types';
import { getMaintenanceType, getMapppedList } from '../../utils/common';

export default function VehicleDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    // const vehicle = DUMMY_VEHICLES.find((v) => v.id === id) ?? DUMMY_VEHICLES[0];
    const [tab, setTab] = useState(0);

    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);

    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const colors = isDarkMode ? darkColors : lightColors;

    const styles = createStyles(colors);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [stats, setStats] = useState({ totalServices: 0, totalSpent: 0 });
    const status = statusColor(vehicle?.status ?? 'healthy', colors);


    useFocusEffect(
        React.useCallback(() => {
            const fetchVehicle = async () => {
                const data = await db.query.vehicles.findFirst({ where: eq(vehicles.id, Number(id)) });
                setVehicle(data || null);
            };
            fetchVehicle();
            fetchData();
        }, [id])
    );

    const fetchData = async () => {

        const statsResult = await db
            .select({
                totalServices: sql<number>`count(${maintenanceLogs.id})`,
                totalSpent: sql<number>`coalesce(sum(${maintenanceLogs.cost}), 0)`,
            })
            .from(maintenanceLogs)
            .where(eq(maintenanceLogs.vehicleId, Number(id)));
        if (statsResult.length > 0) {
            setStats({
                totalServices: Number(statsResult[0].totalServices) || 0,
                totalSpent: Number(statsResult[0].totalSpent) || 0,
            });
        }

        const reminderData = await db.query.reminders.findMany({
            with: { vehicle: true },
            where: (reminders, { eq, and, gt, isNotNull }) => and(
                eq(reminders.vehicleId, Number(id))
            ),
            orderBy: (reminders, { asc }) => [asc(reminders.dueDate)],
        });

        const mappedList: Reminder[] = getMapppedList(reminderData);
        setReminders(mappedList);
        const maintenanceLogData = await db.query.maintenanceLogs.findMany({
            where: (maintenanceLogs, { eq, and }) => and(
                eq(maintenanceLogs.vehicleId, Number(id))
            ),
            with: {
                vehicle: true,
            },
            limit: 5,
            orderBy: (maintenanceLogs, { desc }) => [desc(maintenanceLogs.performedAt)],
        });
        setLogs(maintenanceLogData as MaintenanceLog[]);

    }

    if (!vehicle) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <Text style={{ color: colors.textPrimary }}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={[`${status}33`, colors.bg]}
                style={styles.headerBg}
            />
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <View style={styles.navBar}>
                    <Pressable onPress={() => router.back()} style={styles.navBtn}>
                        <ChevronLeft size={22} color={colors.textPrimary} />
                    </Pressable>
                    <Pressable
                        style={styles.navBtn}
                        onPress={() => router.push({ pathname: '/vehicle/add', params: { vehicleId: vehicle.id } })}
                    >
                        <Pencil size={20} color={colors.textPrimary} />
                    </Pressable>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header card */}
                    <View style={styles.hero}>
                        <View style={styles.heroIcon}>
                            {
                                vehicle.type === "Four Wheelers" ? <Car size={32} color={colors.textPrimary} /> : <Bike size={32} color={colors.textPrimary} />
                            }
                        </View>
                        <Text style={styles.heroTitle}>
                            {vehicle.year} {vehicle.make} {vehicle.model}
                        </Text>
                        <Text style={styles.heroSub}>
                            {vehicle.trim} · {vehicle.engine} · VIN {vehicle.vin}
                        </Text>

                        <View style={styles.statsRow}>
                            <StatBox styles={styles} label={`${vehicle.currentMileage.toLocaleString()}`} sub="kilometers" />
                            <StatBox styles={styles} label={`${stats.totalServices}`} sub="services" />
                            <StatBox styles={styles} label={`$${stats.totalSpent.toLocaleString()}`} sub="spent" />
                        </View>

                    </View>

                    <View style={{ marginBottom: spacing.xl }}>
                        <SegmentedControl
                            options={['History', 'Reminders']}
                            selectedIndex={tab}
                            onChange={setTab}
                        />
                    </View>

                    {tab === 0 ? (
                        <>
                            <Text style={styles.sectionTitle}>UPCOMING</Text>
                            {reminders.slice(0, 2).map((r) => {
                                const c = r.status === 'overdue' ? colors.danger : colors.warning;
                                return (
                                    <View key={r.id} style={styles.reminderCard}>
                                        <View style={styles.reminderRow}>
                                            <Text style={styles.reminderTitle}>{r.title}</Text>
                                            <Text style={[styles.reminderDue, { color: c }]}>{r.dueLabel}</Text>
                                        </View>
                                        <ProgressBar value={r.progress} color={c} />
                                    </View>
                                );
                            })}

                            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>RECENT</Text>
                            {logs.map((log) => (
                                <Pressable
                                    key={log.id}
                                    style={styles.logCard}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/maintenance/detail',
                                            params: { id: String(log.id), detail: JSON.stringify(log) },
                                        })
                                    }
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.logTitle}>{getMaintenanceType(log.type)} </Text>
                                        <Text style={styles.logMeta}>
                                            {new Date(log.performedAt).toLocaleDateString('en-US')}  · {log.mileageAtService?.toLocaleString() ?? '--'} km · ${log.cost ?? '--'}
                                        </Text>
                                        <Text style={styles.logShop}>{log.shopName}</Text>
                                    </View>
                                    <ChevronRight size={18} color={colors.textTertiary} />
                                </Pressable>
                            ))}
                        </>
                    ) : (
                        <>
                            <Text style={styles.sectionTitle}>ACTIVE REMINDERS</Text>
                            {reminders.map((r) => {
                                const c = r.status === 'overdue' ? colors.danger : r.status === 'due_soon' ? colors.warning : colors.success;
                                return (
                                    <View key={r.id} style={styles.reminderCard}>
                                        <View style={styles.reminderRow}>
                                            <Text style={styles.reminderTitle}>{r.title}</Text>
                                            <Text style={[styles.reminderDue, { color: c }]}>{r.dueLabel}</Text>
                                        </View>
                                        <ProgressBar value={r.progress} color={c} />
                                        <View style={styles.actionRow}>
                                            <Pressable style={styles.actionBtn}>
                                                <Text style={styles.actionText}>Mark Done</Text>
                                            </Pressable>
                                            <Pressable style={styles.actionBtnGhost}>
                                                <Text style={styles.actionTextGhost}>Snooze</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                );
                            })}
                        </>
                    )}
                </ScrollView>

                <View style={styles.bottomBar}>
                    <GradientButton
                        title="Log Maintenance"
                        icon={<Plus size={18} color="#FFF" />}
                        onPress={() => router.push({ pathname: '/maintenance/add', params: { vehicleId: id } })}
                    />
                </View>
            </SafeAreaView>
        </View>
    );
}

function StatBox({ styles, label, sub }: { styles: any; label: string; sub: string }) {
    return (
        <View style={styles.statBox}>
            <Text style={styles.statValue}>{label}</Text>
            <Text style={styles.statSub}>{sub}</Text>
        </View>
    );
}

const createStyles = (colors: typeof darkColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 380 },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    navBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center', justifyContent: 'center',
    },
    scroll: { paddingHorizontal: spacing.md, paddingBottom: 120 },
    hero: { alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xl },
    heroIcon: {
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    heroTitle: {
        fontSize: 26, fontWeight: '700', color: colors.textPrimary,
        letterSpacing: -0.4, textAlign: 'center',
    },
    heroSub: {
        fontSize: 12, color: colors.textSecondary,
        marginTop: 4, textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.xl,
        width: '100%',
    },
    statBox: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: radius.card,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    statValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
    statSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    sectionTitle: {
        fontSize: 12, fontWeight: '700', letterSpacing: 1.2,
        color: colors.textTertiary, marginBottom: spacing.md,
    },
    reminderCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.md,
    },
    reminderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reminderTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    reminderDue: { fontSize: 12, fontWeight: '600' },
    logCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    logTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    logMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    actionRow: { flexDirection: 'row', gap: spacing.sm },
    actionBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 10,
        backgroundColor: colors.primary, alignItems: 'center',
    },
    actionText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
    actionBtnGhost: {
        flex: 1, paddingVertical: 10, borderRadius: 10,
        borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    },
    actionTextGhost: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
    bottomBar: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: spacing.xl,
        paddingBottom: 34,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    logShop: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
});