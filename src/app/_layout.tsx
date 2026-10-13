import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { Text, View, useColorScheme } from 'react-native';
import { ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router/react-navigation';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { db } from '../db/client';
import migrations from '../../drizzle/migrations.js';
import { colors } from '../constants/theme';
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View>
        <Text>Database migration failed</Text>
        <Text>{error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View>
        <Text>Preparing database...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="vehicle/add"
            options={{
              presentation: 'modal',
              title: 'Add Vehicle',
            }}
          />

          <Stack.Screen
            name="maintenance/add"
            options={{
              presentation: 'modal',
              title: 'Log Maintenance',
            }}
          />

          <Stack.Screen
            name="reminder/add"
            options={{
              presentation: 'modal',
              title: 'Add Reminder',
            }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}