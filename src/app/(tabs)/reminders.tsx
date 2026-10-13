import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SectionList, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { DUMMY_REMINDERS } from '../../data/dummy';
import { lightColors, darkColors, radius, spacing, getColor } from '../../constants/theme';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { type Reminder } from '../../types';
import { db } from '../../db/client';
import { reminders } from '../../db/schema';
import { getMapppedList } from '../../utils/common';
import { eq } from 'drizzle-orm';

export default function RemindersScreen() {
    const router = useRouter();
    const [remindersList, setReminders] = useState<Reminder[]>([]);
    const isDark = useColorScheme() === 'dark';
    const colors = isDark ? darkColors : lightColors;
    const styles = createStyles(colors);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    async function loadData() {
        const list = await db.query.reminders.findMany({
            with: { vehicle: true }
        });
        const mappedList: Reminder[] = getMapppedList(list);
        setReminders(mappedList);
    }


    if (!remindersList || remindersList.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.title}>Reminders</Text>
                    <Pressable
                        style={styles.addBtn}
                        onPress={() => router.push('/reminders/add')}
                    >
                        <Plus size={18} color="#FFF" />
                        <Text style={styles.addText}>Add</Text>
                    </Pressable>
                </View>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ color: colors.textPrimary }}>No reminders</Text>
                </View>
            </SafeAreaView>
        )
    }

    const sections = buildSections(remindersList, colors);


    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Reminders</Text>
                <Pressable
                    style={styles.addBtn}
                    onPress={() => router.push('/reminders/add')}
                >
                    <Plus size={18} color="#FFF" />
                    <Text style={styles.addText}>Add</Text>
                </Pressable>
            </View>

            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                renderSectionHeader={({ section }) => (
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: section.color }]}>
                            {section.title}
                        </Text>
                    </View>
                )}
                renderItem={({ item }) => <ReminderCard styles={styles} reminder={item} onRefresh={loadData} />}
                contentContainerStyle={styles.listContent}
                stickySectionHeadersEnabled={false}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

function ReminderCard({ styles, reminder, onRefresh }: { styles: ReturnType<typeof createStyles>; reminder: Reminder; onRefresh: () => void }) {
    const isCompleted = reminder.status === 'completed';
    const isDark = useColorScheme() === 'dark';
    const colors = isDark ? darkColors : lightColors;
    const color = getColor(reminder.status, colors);

    const markAsDone = async (id: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await db.update(reminders).set({ isCompleted: true, completedAt: new Date().toISOString() }).where(eq(reminders.id, Number(id)));
        onRefresh();
    };

    const snoozeReminder = async (days: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Calculate new due date (from now or existing due date, whichever is later)
        const baseDate = reminder.dueDate && new Date(reminder.dueDate) > new Date()
            ? new Date(reminder.dueDate)
            : new Date();
        const newDueDate = new Date(baseDate);
        newDueDate.setDate(newDueDate.getDate() + days);

        // Set notification reminder 1 day before due date at 9:00 AM (or same day if snoozing for 1 day)
        const newReminderDateTime = new Date(newDueDate);
        if (days > 1) {
            newReminderDateTime.setDate(newReminderDateTime.getDate() - 1);
        }
        newReminderDateTime.setHours(9, 0, 0, 0);

        await db
            .update(reminders)
            .set({
                dueDate: newDueDate.toISOString(),
                reminderDateTime: newReminderDateTime.toISOString(),
                isCompleted: false,
                completedAt: null,
            })
            .where(eq(reminders.id, Number(reminder.id)));

        onRefresh();
    };

    const handleSnoozePress = () => {
        Alert.alert(
            'Snooze Reminder',
            'How long would you like to postpone this reminder?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: '1 Day', onPress: () => snoozeReminder(1) },
                { text: '3 Days', onPress: () => snoozeReminder(3) },
                { text: '1 Week', onPress: () => snoozeReminder(7) },
                { text: '2 Weeks', onPress: () => snoozeReminder(14) },
            ]
        );
    };

    if (isCompleted) {
        return (
            <View style={[styles.card, { opacity: 0.6 }]}>
                <View style={styles.row}>
                    <Text style={styles.titleText}>{reminder.title}</Text>
                    <Text style={styles.done}>✓</Text>
                </View>
                <Text style={styles.subText}>{reminder.vehicleLabel} · {reminder.dueLabel}</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.titleText}>{reminder.title}</Text>
                {/* <Text style={styles.titleText}>{reminder.reminderDateTime}</Text> */}
                <Text style={[styles.dueText, { color }]}>{reminder.dueLabel}</Text>
            </View>
            <Text style={styles.subText}>{reminder.vehicleLabel}</Text>
            <View style={{ marginTop: spacing.md }}>
                <ProgressBar value={reminder.progress} color={color} />
            </View>
            <View style={styles.actions}>
                <Pressable
                    style={styles.primaryAction}
                    onPress={() => markAsDone(reminder.id)}
                >
                    <Text style={styles.primaryActionText}>Mark Done</Text>
                </Pressable>
                <Pressable style={styles.ghostAction} onPress={handleSnoozePress}>
                    <Text style={styles.ghostActionText}>Snooze</Text>
                </Pressable>
            </View>
        </View>
    );
}

function buildSections(reminders: Reminder[], colors: typeof lightColors) {
    const overdue = reminders.filter((r) => r.status === 'overdue');
    const dueSoon = reminders.filter((r) => r.status === 'due_soon');
    const upcoming = reminders.filter((r) => r.status === 'upcoming');
    const completed = reminders.filter((r) => r.status === 'completed');

    const out: { title: string; color: string; data: Reminder[] }[] = [];
    if (overdue.length) out.push({ title: '⚠️  OVERDUE', color: colors.danger, data: overdue });
    if (dueSoon.length) out.push({ title: '🟡  DUE SOON', color: colors.warning, data: dueSoon });
    if (upcoming.length) out.push({ title: '🟢  UPCOMING', color: colors.success, data: upcoming });
    if (completed.length) out.push({ title: '✅  COMPLETED', color: colors.textTertiary, data: completed });
    return out;
}

const createStyles = (colors: typeof lightColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
    },
    title: { fontSize: 32, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: spacing.md,
        height: 38,
        borderRadius: 999,
        backgroundColor: colors.primary,
    },
    addText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
    listContent: { paddingHorizontal: spacing.md, paddingBottom: 120 },
    sectionHeader: { marginTop: spacing.lg, marginBottom: spacing.md },
    sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    titleText: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    dueText: { fontSize: 12, fontWeight: '600' },
    subText: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    done: { fontSize: 16, color: colors.success, fontWeight: '700' },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    primaryAction: {
        flex: 1, height: 40, borderRadius: 10,
        backgroundColor: colors.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    primaryActionText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
    ghostAction: {
        flex: 1, height: 40, borderRadius: 10,
        borderWidth: 1, borderColor: colors.border,
        alignItems: 'center', justifyContent: 'center',
    },
    ghostActionText: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
});