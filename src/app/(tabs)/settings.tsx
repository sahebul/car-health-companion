import React from 'react';
import { View, Text, StyleSheet, useColorScheme, Button, Appearance, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lightColors, darkColors, radius, spacing } from '../../constants/theme';

export default function SettingsScreen() {

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const colors = isDarkMode ? darkColors : lightColors;

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <View style={styles.card}>
        <Row styles={styles} label="Distance unit" value="KM" />
        <Row styles={styles} label="Currency" value="INR" />
        <View style={[styles.row, styles.rowBorder]}>
          <Text style={styles.rowLabel}>Dark Mode</Text>
          <Switch 
            value={isDarkMode} 
            onValueChange={(val) => Appearance.setColorScheme(val ? 'dark' : 'light')} 
          />
        </View>
        <Row styles={styles} label="About" value="v1.0.0" last />
      </View>

    </SafeAreaView>
  );
}

function Row({ styles, label, value, last }: { styles: ReturnType<typeof createStyles>; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: typeof lightColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.lg },
  title: { fontSize: 32, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.textPrimary, fontSize: 15 },
  rowValue: { color: colors.textSecondary, fontSize: 15 },
});