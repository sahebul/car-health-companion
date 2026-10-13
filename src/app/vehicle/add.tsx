import React, { useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TextInputProps,
    useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { AlertCircle } from 'lucide-react-native';
import { darkColors, lightColors, radius, spacing } from '../../constants/theme';
import { GradientButton } from '../../components/ui/GradientButton';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { db } from '../../db/client';
import { vehicles } from '../../db/schema';
import { eq } from 'drizzle-orm';
//make below years dynamic
const current_year = new Date().getFullYear();
let a = [];
for (let i = current_year; i >= 2018; i--) {
    a.push(String(i));
}
const YEARS = a;

const POPULAR_MAKES = ['Toyota', 'Maruti', 'Hyundai', 'Tata', 'Kia'];

interface FormState {
    make: string;
    model: string;
    year: string;
    trim: string;
    engine: string;
    vin: string;
    licensePlate: string;
    mileage: string;
    mileageUnit: string;
    type: string;
}

interface FormErrors {
    make?: string;
    model?: string;
    year?: string;
    mileage?: string;
}

const INITIAL: FormState = {
    make: '',
    type: 'Four Wheelers',
    model: '',
    year: '',
    trim: '',
    engine: '',
    vin: '',
    licensePlate: '',
    mileage: '',
    mileageUnit: 'km',
};

export default function AddVehicleScreen() {
    const router = useRouter();
    const { vehicleId } = useLocalSearchParams();
    const isEdit = !!vehicleId;
    const [form, setForm] = useState<FormState>(INITIAL);
    const [errors, setErrors] = useState<FormErrors>({});
    const [saving, setSaving] = useState(false);

    const isDark = useColorScheme() === 'dark';
    const colors = isDark ? darkColors : lightColors;
    const styles = createStyles(colors);

    const modelRef = useRef<TextInput>(null);
    const mileageRef = useRef<TextInput>(null);

    useFocusEffect(
        React.useCallback(() => {
            if (isEdit) {
                const fetchVehicle = async () => {
                    const vehicle = await db.query.vehicles.findFirst({
                        where: eq(vehicles.id, Number(vehicleId as string))
                    });
                    if (vehicle) {
                        setForm({
                            make: vehicle.make,
                            type: vehicle.type,
                            model: vehicle.model,
                            year: vehicle.year.toString(),
                            trim: vehicle.trim || '',
                            engine: vehicle.engine || '',
                            vin: vehicle.vin || '',
                            licensePlate: vehicle.licensePlate || '',
                            mileage: vehicle.currentMileage ? vehicle.currentMileage.toString() : '0',
                            mileageUnit: (vehicle.mileageUnit as 'mi' | 'km') || 'km',
                        });
                    }
                };
                fetchVehicle();
            }
        }, [isEdit, vehicleId])
    );

    const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [key]: undefined }));
        }
    };

    const formattedMileage = useMemo(() => {
        const digits = form.mileage.replace(/\D/g, '');
        if (!digits) return '';
        return Number(digits).toLocaleString();
    }, [form.mileage]);

    const handleMileageChange = (text: string) => {
        const digits = text.replace(/\D/g, '').slice(0, 8);
        update('mileage', digits);
    };

    const validate = (): boolean => {
        const next: FormErrors = {};
        if (!form.make.trim()) next.make = 'Make is required';
        if (!form.model.trim()) next.model = 'Model is required';
        if (!form.year) next.year = 'Year is required';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSave = async () => {

        try {
            if (!validate()) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }
            setSaving(true);

            const yearNum = Number(form.year);
            const mileageNum = Number(form.mileage);

            if (isEdit) {
                await db.update(vehicles)
                    .set({
                        name: form.year + " " + form.make + " " + form.model,
                        make: form.make,
                        type: form.type ?? 'Four Wheelers',
                        model: form.model,
                        trim: form.trim,
                        engine: form.engine,
                        vin: form.vin,
                        year: yearNum,
                        licensePlate: form.licensePlate || null,
                        currentMileage: mileageNum,
                        mileageUnit: form.mileageUnit ?? 'km',
                    })
                    .where(eq(vehicles.id, Number(vehicleId as string)));
            } else {
                await db.insert(vehicles).values({
                    name: form.year + " " + form.make + " " + form.model,
                    make: form.make,
                    type: form.type ?? 'Four Wheelers',
                    model: form.model,
                    trim: form.trim,
                    engine: form.engine,
                    vin: form.vin,
                    year: yearNum,
                    licensePlate: form.licensePlate || null,
                    currentMileage: mileageNum,
                    mileageUnit: form.mileageUnit ?? 'km',
                });

            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
            setSaving(false);
        } catch (error) {
            setSaving(false);
            console.error('Failed to save vehicle:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const previewLine1 = [form.year, form.make, form.model].filter(Boolean).join(' ');
    const previewLine2 = [form.trim, form.engine].filter(Boolean).join(' · ');

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
                    <Pressable onPress={() => router.back()} hitSlop={12}>
                        <Text style={styles.cancel}>Cancel</Text>
                    </Pressable>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Live preview card */}
                    <Animated.View entering={FadeIn.duration(300)} style={styles.previewCard}>
                        <LinearGradient
                            colors={['rgba(10,132,255,0.18)', 'rgba(94,92,230,0.04)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.previewIcon}>
                            <Text style={{ fontSize: 28 }}>
                                {form.type === 'Four Wheelers' ? '🚗' : '🏍️'}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.previewTitle} numberOfLines={1}>
                                {previewLine1 || 'New Vehicle'}
                            </Text>
                            <Text style={styles.previewSub} numberOfLines={1}>
                                {previewLine2 || 'Fill in the details below'}
                            </Text>
                        </View>
                    </Animated.View>
                    {/* Type */}

                    <View style={{ marginTop: spacing.sm }}>
                        <Text style={styles.label}>TYPE</Text>
                        <SegmentedControl
                            options={['Four Wheelers', 'Two Wheelers']}
                            selectedIndex={form.type === 'Four Wheelers' ? 0 : 1}
                            onChange={(i) => update('type', i === 0 ? 'Four Wheelers' : 'Two Wheelers')}
                        />
                    </View>
                    {/* Make */}
                    <Field
                        label="MAKE"
                        value={form.make}
                        onChangeText={(v) => update('make', v)}
                        placeholder="Toyota"
                        autoCapitalize="words"
                        returnKeyType="next"
                        onSubmitEditing={() => modelRef.current?.focus()}
                        error={errors.make}
                        styles={styles}
                    />

                    {/* Popular makes quick-select */}
                    <View style={styles.quickRow}>
                        {POPULAR_MAKES.map((m) => (
                            <Pressable
                                key={m}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    update('make', m);
                                }}
                                style={[
                                    styles.quickChip,
                                    form.make === m && styles.quickChipActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.quickChipText,
                                        form.make === m && styles.quickChipTextActive,
                                    ]}
                                >
                                    {m}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Model */}
                    <Field
                        ref={modelRef}
                        label="MODEL"
                        value={form.model}
                        onChangeText={(v) => update('model', v)}
                        placeholder="Camry"
                        autoCapitalize="words"
                        returnKeyType="next"
                        onSubmitEditing={() => mileageRef.current?.focus()}
                        error={errors.model}
                        styles={styles}
                    />

                    {/* Year quick-select */}
                    <Text style={[styles.label, { marginTop: spacing.sm }]}>YEAR</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.yearRow}
                    >
                        {YEARS.map((y) => (
                            <Pressable
                                key={y}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    update('year', y);
                                }}
                                style={[
                                    styles.yearChip,
                                    form.year === y && styles.yearChipActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.yearText,
                                        form.year === y && styles.yearTextActive,
                                    ]}
                                >
                                    {y}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                    {errors.year && <ErrorText styles={styles} message={errors.year} />}


                    {/* Trim + Engine (side by side) */}
                    <View style={styles.twoCol}>
                        <View style={{ flex: 1 }}>
                            <Field
                                label="TRIM/VARIANT"
                                value={form.trim}
                                onChangeText={(v) => update('trim', v)}
                                placeholder="SE"
                                autoCapitalize="characters"
                                styles={styles}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Field
                                label="ENGINE"
                                value={form.engine}
                                onChangeText={(v) => update('engine', v)}
                                placeholder="2.5L"
                                styles={styles}
                            />
                        </View>
                    </View>
                    {/* Mileage + unit */}
                    <Text style={[styles.label, { marginTop: spacing.sm }]}>CURRENT MILEAGE</Text>
                    <View style={[styles.mileageWrap, errors.mileage && styles.inputError]}>
                        <TextInput
                            ref={mileageRef}
                            value={formattedMileage}
                            onChangeText={handleMileageChange}
                            placeholder="78,420"
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="numeric"
                            style={styles.mileageInput}
                        />
                        <Text style={styles.mileageUnit}>
                            {form.mileageUnit === 'mi' ? 'mi' : 'km'}
                        </Text>
                    </View>
                    <View style={{ marginTop: spacing.sm }}>
                        <SegmentedControl
                            options={['Kilometers', 'Miles']}
                            selectedIndex={form.mileageUnit === 'km' ? 0 : 1}
                            onChange={(i) => update('mileageUnit', i === 0 ? 'km' : 'mi')}
                        />
                    </View>
                    {errors.mileage && <ErrorText styles={styles} message={errors.mileage} />}

                    {/* VIN */}
                    <Field
                        label="VIN (OPTIONAL)"
                        value={form.vin}
                        onChangeText={(v) => update('vin', v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        placeholder="4T1G11AK1MU..."
                        autoCapitalize="characters"
                        maxLength={17}
                        monospace
                        hint="17 characters"
                        styles={styles}
                    />

                    {/* License plate */}
                    <Field
                        label="LICENSE PLATE (OPTIONAL)"
                        value={form.licensePlate}
                        onChangeText={(v) => update('licensePlate', v.toUpperCase())}
                        placeholder="ABC-1234"
                        autoCapitalize="characters"
                        styles={styles}
                    />

                    {/* Submit */}
                    <Animated.View entering={FadeInUp.delay(200)} style={{ marginTop: spacing.xl }}>
                        <GradientButton
                            title={saving ? 'Saving...' : isEdit ? 'Update Vehicle' : 'Add Vehicle'}
                            onPress={handleSave}
                        />
                    </Animated.View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

/* ---------- Reusable Field ---------- */

interface FieldProps extends TextInputProps {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    error?: string;
    hint?: string;
    monospace?: boolean;
    styles: any
}

const Field = React.forwardRef<TextInput, FieldProps>(
    ({ label, value, onChangeText, error, hint, monospace, styles, ...rest }, ref) => {
        return (
            <View style={{ marginTop: spacing.lg }}>
                <View style={styles.labelRow}>
                    <Text style={styles.label}>{label}</Text>
                    {hint && <Text style={styles.hint}>{hint}</Text>}
                </View>
                <View style={[styles.inputWrap, error && styles.inputError]}>
                    <TextInput
                        ref={ref}
                        value={value}
                        onChangeText={onChangeText}
                        // placeholderTextColor={colors.textTertiary}
                        style={[styles.input, monospace && styles.monoInput]}
                        {...rest}
                    />
                </View>
                {error && <ErrorText styles={styles} message={error} />}
            </View>
        );
    }
);
Field.displayName = 'Field';

function ErrorText({ message, styles }: { message: string, styles: any }) {
    return (
        <Animated.View entering={FadeIn.duration(150)} style={styles.errorRow}>
            <AlertCircle size={13} color={darkColors.danger} />
            <Text style={styles.errorText}>{message}</Text>
        </Animated.View>
    );
}

/* ---------- Styles ---------- */

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

    /* Live preview */
    previewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    previewIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: -0.2,
    },
    previewSub: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },

    /* Labels */
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        color: colors.textTertiary,
        marginBottom: spacing.sm,
    },
    hint: {
        fontSize: 11,
        color: colors.textTertiary,
        marginBottom: spacing.sm,
    },

    /* Inputs */
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
    input: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: 16,
        padding: 0,
    },
    monoInput: {
        fontVariant: ['tabular-nums'],
        letterSpacing: 1,
    },
    inputError: {
        borderColor: colors.danger,
        backgroundColor: 'rgba(255,69,58,0.06)',
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: spacing.sm,
    },
    errorText: {
        fontSize: 12,
        color: colors.danger,
        fontWeight: '500',
    },

    /* Popular makes */
    quickRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    quickChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    quickChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    quickChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    quickChipTextActive: { color: '#FFF' },

    /* Year chips */
    yearRow: {
        gap: spacing.sm,
        paddingVertical: 2,
        paddingRight: spacing.xl,
    },
    yearChip: {
        minWidth: 64,
        height: 44,
        paddingHorizontal: spacing.md,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    yearChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    yearText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        fontVariant: ['tabular-nums'],
    },
    yearTextActive: { color: '#FFF' },

    /* Two column row */
    twoCol: {
        flexDirection: 'row',
        gap: spacing.md,
    },

    /* Mileage */
    mileageWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.input,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        height: 52,
    },
    mileageInput: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: 16,
        padding: 0,
        fontVariant: ['tabular-nums'],
    },
    mileageUnit: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
        paddingHorizontal: 4,
    },
});