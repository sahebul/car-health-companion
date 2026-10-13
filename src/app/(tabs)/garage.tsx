import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, Bell, Settings } from 'lucide-react-native';
import { DUMMY_VEHICLES } from '../../data/dummy';
import { VehicleCard } from '../../components/vehicle/VehicleCard';
import { darkColors, lightColors, radius, spacing } from '../../constants/theme';
// import { Vehicle } from '../../types';
import { CustomSafeAreaview } from '../../components/themes';
import { db } from '../../db/client';
import { vehicles, type Vehicle } from '../../db/schema';
import { useCallback, useState } from 'react';
export default function GarageScreen() {
    const router = useRouter();
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

    return (
        <CustomSafeAreaview style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>My Garage</Text>
                    <Text style={styles.subtitle}>
                        {vehiclesData.length} vehicles · 0 needs attention
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    <Pressable style={styles.iconBtn}>
                        <Bell size={20} color={colors.textPrimary} />
                    </Pressable>
                </View>
            </View>

            <FlashList
                data={vehiclesData}
                keyExtractor={(item: Vehicle) => item.id.toString()}
                renderItem={({ item, index }) => (
                    <VehicleCard
                        vehicle={item}
                        index={index}
                        onPress={() => router.push(`/vehicle/${item.id}`)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                    <Pressable style={styles.addCard} onPress={() => router.push('/vehicle/add')}>
                        <Plus size={20} color={colors.textSecondary} />
                        <Text style={styles.addCardText}>Add New vehicle</Text>
                    </Pressable>
                }
            />
        </CustomSafeAreaview>
    );
}

const createStyles = (colors: typeof lightColors) => StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 4,
    },
    headerActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    listContent: {
        paddingHorizontal: spacing.md,
        paddingBottom: 120,
    },
    addCard: {
        height: 80,
        borderRadius: radius.card,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    addCardText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textSecondary,
    },
});