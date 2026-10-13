import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { darkColors, lightColors, radius, spacing } from '../../constants/theme';
import { GradientButton } from '../../components/ui/GradientButton';
import { MaintenanceType } from '../../types';
import { db } from '../../db/client';
import { maintenanceLogs, type Vehicle } from '../../db/schema';

const TYPES: { key: MaintenanceType; emoji: string; label: string }[] = [
    { key: 'oil_change', emoji: '🛢️', label: 'Oil' },
    { key: 'tire_rotation', emoji: '🛞', label: 'Tires' },
    { key: 'brake_pads', emoji: '🛑', label: 'Brakes' },
    { key: 'air_filter', emoji: '🌬️', label: 'Air' },
    { key: 'battery', emoji: '⚡', label: 'Battery' },
    { key: 'other', emoji: '⚡', label: 'Other' },
];

export default function AddMaintenanceScreen() {
    const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';
    const colors = isDark ? darkColors : lightColors;
    const styles = createStyles(colors);
    const [selected, setSelected] = useState<MaintenanceType>('oil_change');
    const [mileage, setMileage] = useState('');
    const [cost, setCost] = useState('');
    const [shop, setShop] = useState('');
    const [notes, setNotes] = useState('');
    const [vehiclesData, setVehiclesData] = useState<Vehicle[]>([]);
    const [vehicle, setVehicle] = useState(0);

    useFocusEffect(
        useCallback(() => {
            fetchVehicles();
        }, [])
    );

    const fetchVehicles = async () => {
        const data = await db.query.vehicles.findMany();
        if (data.length === 0) {
            //add vehicle
            router.push(`/vehicle/add`)
        }
        setVehiclesData(data);
        if (vehicleId) {
            const index = data.findIndex(v => v.id.toString() === vehicleId);
            if (index !== -1) {
                setVehicle(index);
            }
        }
    }

    const handleSave = async () => {
        const vehicleData = vehiclesData[vehicle];
        try {
            await db.insert(maintenanceLogs).values({
                vehicleId: vehicleData.id,
                type: selected,
                mileageAtService: parseInt(mileage),
                cost: parseFloat(cost),
                shopName: shop,
                notes: notes,
                description: `Service completed at ${new Date().toLocaleDateString()}`,
                performedAt: new Date().toISOString()
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
        } catch (error) {
            console.error("Error adding maintenance log:", error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Log Maintenance</Text>
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

                    <Text style={styles.label}>TYPE</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
                        {TYPES.map((t) => (
                            <Pressable
                                key={t.key}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setSelected(t.key);
                                }}
                                style={[styles.typeChip, selected === t.key && styles.typeChipActive]}
                            >
                                <Text style={styles.typeEmoji}>{t.emoji}</Text>
                                <Text style={[styles.typeLabel, selected === t.key && styles.typeLabelActive]}>
                                    {t.label}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>

                    <Field styles={styles} label="MILEAGE AT SERVICE" value={mileage} onChangeText={setMileage} placeholder="78,420" suffix="mi" keyboardType="numeric" />
                    <Field styles={styles} label="COST" value={cost} onChangeText={setCost} placeholder="89.00" prefix="$" keyboardType="numeric" />
                    <Field styles={styles} label="SHOP (OPTIONAL)" value={shop} onChangeText={setShop} placeholder="Jiffy Lube" />
                    <Field styles={styles} label="NOTES" value={notes} onChangeText={setNotes} placeholder="Used synthetic 5W-30..." multiline />

                    <View style={{ height: spacing.lg }} />
                    <GradientButton title="Save Maintenance" onPress={handleSave} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

interface FieldProps {
    label: string;
    styles?: any;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    prefix?: string;
    suffix?: string;
    keyboardType?: 'default' | 'numeric';
    multiline?: boolean;
}

function Field({ label, styles, value, onChangeText, placeholder, prefix, suffix, keyboardType = 'default', multiline }: FieldProps) {
    return (
        <View style={{ marginTop: spacing.lg }}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputWrap, multiline && { height: 96, alignItems: 'flex-start', paddingTop: 12 }]}>
                {prefix && <Text style={styles.affix}>{prefix}</Text>}
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    // placeholderTextColor={colors.textTertiary}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    style={[styles.input, multiline && { textAlignVertical: 'top' }]}
                />
                {suffix && <Text style={styles.affix}>{suffix}</Text>}
            </View>
        </View>
    );
}

const createStyles = (colors: typeof lightColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
    },
    title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
    cancel: { fontSize: 15, color: colors.primary, fontWeight: '600' },
    scroll: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    label: {
        fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
        color: colors.textTertiary, marginBottom: spacing.sm,
    },
    typeRow: { gap: spacing.sm, paddingVertical: 4 },
    typeChip: {
        width: 72, height: 84,
        borderRadius: radius.card,
        backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.border,
        alignItems: 'center', justifyContent: 'center',
        gap: 6,
    },
    typeChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    typeEmoji: { fontSize: 24 },
    typeLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    typeLabelActive: { color: '#FFF' },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.input,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        height: 52,
    },
    input: { flex: 1, color: colors.textPrimary, fontSize: 16 },
    affix: { color: colors.textSecondary, fontSize: 15, fontWeight: '600', paddingHorizontal: 4 },
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
});