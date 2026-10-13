import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { lightColors, darkColors, radius, spacing } from '../../constants/theme';
import { GradientButton } from '../../components/ui/GradientButton';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db } from '../../db/client';
import { type Vehicle, reminders } from '../../db/schema';
import { DrizzleError } from 'drizzle-orm';

const VEHICLES = ['🚗  2021 Toyota Camry', '🚙  2018 Honda Civic'];
const REMIND_BEFORE_OPTIONS = [
    { label: 'Day of (9 AM)', daysBefore: 0 },
    { label: '1 day before', daysBefore: 1 },
    { label: '3 days before', daysBefore: 3 },
    { label: '1 week before', daysBefore: 7 },
];

export default function AddReminderScreen() {
    const router = useRouter();
    const [vehicle, setVehicle] = useState(0);
    const [trigger, setTrigger] = useState(0); // 0 = date, 1 = mileage
    const [title, setTitle] = useState('Oil Change');
    const [dueDate, setDueDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [mileage, setMileage] = useState('78,820');
    const [selectedRemindBefore, setSelectedRemindBefore] = useState(1); // default 1 day before
    const isDark = useColorScheme() === 'dark';
    const colors = isDark ? darkColors : lightColors;
    const styles = createStyles(colors);

    const [vehiclesData, setVehiclesData] = useState<Vehicle[]>([]);
    useFocusEffect(
        useCallback(() => {
            fetchVehicles();
        }, [])
    );
    const fetchVehicles = async () => {
        const data = await db.query.vehicles.findMany();
        setVehiclesData(data);
    }

    const calculateReminderDateTime = (date: Date, daysBefore: number) => {
        const reminder = new Date(date);
        reminder.setDate(reminder.getDate() - daysBefore);
        reminder.setHours(9, 0, 0, 0); // 9:00 AM notification
        return reminder.toISOString();
    };

    const handleCreateReminder = async () => {
        try {
            await db.insert(reminders).values({
                vehicleId: vehiclesData[vehicle].id,
                title,
                type: 'oil change',
                reminderDateTime: trigger === 0 ? calculateReminderDateTime(dueDate, selectedRemindBefore) : null,
                dueDate: trigger === 0 ? dueDate.toISOString() : null,
                dueMileage: trigger === 1 ? parseInt(mileage.replace(/,/g, '') || '0', 10) : null,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
        } catch (error) {
            console.error('Error creating reminder:', error);
            alert('Failed to create reminder');
            // 1. Check if it's a Drizzle-wrapped error
            if (error instanceof DrizzleError && error.cause) {
                const rawError = error.cause as any;

                // 2. Access the database-specific fields
                console.error("Actual DB Error Message:", rawError.message);
                console.error("DB Error Code (e.g., Postgres 23505):", rawError.code);
            } else {
                // Fallback for generic errors
                console.error(error);
            }

        }
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ title: 'Add Reminder', headerBackTitle: 'Back' }} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>New Reminder</Text>
                    <Pressable onPress={() => router.back()}>
                        <Text style={styles.cancel}>Cancel</Text>
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <Text style={styles.label}>VEHICLE</Text>
                    {vehiclesData && vehiclesData.length > 0 && vehiclesData.map((v, i) => (
                        <Pressable
                            key={v.id}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setVehicle(i);
                            }}
                            style={[styles.vehicleRow, vehicle === i && styles.vehicleRowActive]}
                        >
                            <Text style={styles.vehicleText}>{v.name ?? ""}</Text>
                            {vehicle === i && <Text style={styles.check}>✓</Text>}
                        </Pressable>
                    ))}

                    <Text style={[styles.label, { marginTop: spacing.lg }]}>TITLE</Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        style={styles.input}
                        placeholderTextColor={colors.textTertiary}
                    />

                    <Text style={[styles.label, { marginTop: spacing.lg }]}>TRIGGER</Text>
                    <SegmentedControl
                        options={['By Date', 'By Mileage']}
                        selectedIndex={trigger}
                        onChange={setTrigger}
                    />

                    {trigger === 0 ? (
                        <>
                            <Text style={[styles.label, { marginTop: spacing.lg }]}>DUE DATE</Text>
                            {Platform.OS === 'ios' ? (
                                <View style={{ backgroundColor: colors.surface, borderRadius: radius.input, padding: spacing.sm }}>
                                    <DateTimePicker
                                        value={dueDate}
                                        mode="date"
                                        display="default"
                                        onValueChange={(event, selectedDate) => {
                                            if (selectedDate) setDueDate(selectedDate);
                                        }}
                                        themeVariant={isDark ? 'dark' : 'light'}
                                    />
                                </View>
                            ) : (
                                <>
                                    <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
                                        <Text style={styles.inputText}>📅  {dueDate.toLocaleDateString()}</Text>
                                    </Pressable>
                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={dueDate}
                                            mode="date"
                                            display="default"
                                            onValueChange={(event, selectedDate) => {
                                                setShowDatePicker(false);
                                                if (selectedDate) setDueDate(selectedDate);
                                            }}
                                        />
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <Text style={[styles.label, { marginTop: spacing.lg }]}>DUE MILEAGE</Text>
                            <View style={styles.input}>
                                <TextInput
                                    value={mileage}
                                    onChangeText={setMileage}
                                    keyboardType="numeric"
                                    style={styles.inputText}
                                    placeholderTextColor={colors.textTertiary}
                                />
                                <Text style={styles.affix}>mi</Text>
                            </View>
                        </>
                    )}

                    {trigger === 0 && (
                        <>
                            <Text style={[styles.label, { marginTop: spacing.lg }]}>REMIND ME</Text>
                            <View style={styles.snoozeRow}>
                                {REMIND_BEFORE_OPTIONS.map((opt) => {
                                    const active = selectedRemindBefore === opt.daysBefore;
                                    return (
                                        <Pressable
                                            key={opt.daysBefore}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setSelectedRemindBefore(opt.daysBefore);
                                            }}
                                            style={[styles.snoozeChip, active && styles.snoozeChipActive]}
                                        >
                                            <Text style={[styles.snoozeText, active && styles.snoozeTextActive]}>
                                                {opt.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    <View style={{ height: spacing.xl }} />
                    <GradientButton
                        title="Create Reminder"
                        onPress={handleCreateReminder}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const createStyles = (colors: typeof lightColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg,
    },
    title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
    cancel: { fontSize: 15, color: colors.primary, fontWeight: '600' },
    scroll: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    label: {
        fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
        color: colors.textTertiary, marginBottom: spacing.sm,
    },
    vehicleRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.input,
        borderWidth: 1, borderColor: colors.border,
        paddingHorizontal: spacing.md,
        height: 52,
        marginBottom: spacing.sm,
    },
    vehicleRowActive: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(10,132,255,0.08)',
    },
    vehicleText: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
    check: { color: colors.primary, fontWeight: '700', fontSize: 16 },
    input: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.input,
        borderWidth: 1, borderColor: colors.border,
        paddingHorizontal: spacing.md,
        height: 52,
        color: colors.textPrimary,
    },
    inputText: { flex: 1, color: colors.textPrimary, fontSize: 15 },
    affix: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
    snoozeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    snoozeChip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.border,
    },
    snoozeChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    snoozeText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    snoozeTextActive: { color: '#FFF' },
});