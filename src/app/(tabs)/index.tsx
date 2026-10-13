import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, Bell, ChevronRight } from 'lucide-react-native';
import { lightColors, darkColors, spacing, radius, statusColor } from '../../constants/theme';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { db } from '../../db/client';
import { Reminder, MaintenanceLog } from '../../types'
import { getMaintenanceType, getMapppedList } from '../../utils/common';


export default function HomeScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const styles = createStyles(colors);
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
  const [recentLogs, setRecentLogs] = useState<MaintenanceLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );
  const fetchDashboardData = async () => {
    //find all reminder not completed and upcoming based on dueDate
    const reminderData = await db.query.reminders.findMany({
      with: { vehicle: true },
      where: (reminders, { eq, and, gt, isNotNull }) => and(
        eq(reminders.isCompleted, false),
        isNotNull(reminders.dueDate)
      ),
      orderBy: (reminders, { asc }) => [asc(reminders.dueDate)],
    });
    const mappedList: Reminder[] = getMapppedList(reminderData);
    setActiveReminders(mappedList.slice(0, 3));
    const maintenanceLogData = await db.query.maintenanceLogs.findMany({
      with: { vehicle: true },
      limit: 3,
      orderBy: (maintenanceLogs, { desc }) => [desc(maintenanceLogs.performedAt)],
    });
    console.log("recentLogs", maintenanceLogData);
    setRecentLogs(maintenanceLogData);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{
              (() => {
                const hour = new Date().getHours();
                if (hour < 12) return 'Good morning';
                if (hour < 18) return 'Good afternoon';
                return 'Good evening';
              })()
            }</Text>
            <Text style={styles.title}>Your Garage</Text>
          </View>
          <Pressable style={styles.iconBtn}>
            <Bell size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>UPCOMING</Text>
        {
          activeReminders.length > 0 ? (
            activeReminders.map((r) => {
              const color = r.status === 'overdue' ? colors.danger : r.status === 'due_soon' ? colors.warning : colors.success;
              return (
                <View key={r.id} style={styles.reminderCard}>
                  <View style={styles.reminderHeader}>
                    <Text style={styles.reminderTitle}>{r.title}</Text>
                    <Text style={[styles.reminderDue, { color }]}>{r.dueLabel}</Text>
                  </View>
                  <Text style={styles.reminderSub}>{r.vehicle?.name ?? ''}</Text>
                  <View style={{ marginTop: 10 }}>
                    <ProgressBar value={r.progress} color={color} />
                  </View>
                </View>
              );
            })) : (
            <Text style={styles.emptyText}>No upcoming reminders</Text>
          )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT MAINTENANCE</Text>
          {
            recentLogs.length > 0 && (
              <Pressable onPress={() => router.push('/maintenance')}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            )
          }
        </View>
        {
          recentLogs.length > 0 ? (
            recentLogs.map((log) => (
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
                  <Text style={styles.logSubTitle}>{log.vehicle?.name ?? ""} </Text>
                  <Text style={styles.logMeta}>
                    {new Date(log.performedAt).toLocaleDateString('en-US')}  · {log.mileageAtService?.toLocaleString() ?? '--'} km · ${log.cost ?? '--'}
                  </Text>
                  <Text style={styles.logShop}>{log.shopName}</Text>
                </View>
                <ChevronRight size={18} color={colors.textTertiary} />
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyText}>No maintenance logs found</Text>
          )}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/maintenance/add')}
      >
        <Plus size={24} color="#FFF" />
      </Pressable>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof lightColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  greeting: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  seeAll: { fontSize: 13, fontWeight: '600', color: colors.primary, marginBottom: spacing.md },
  reminderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reminderTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  reminderDue: { fontSize: 12, fontWeight: '600' },
  reminderSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
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
  logSubTitle: { fontSize: 15, color: colors.textSecondary },
  logMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  logShop: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
  }
});