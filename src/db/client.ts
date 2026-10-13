// src/db/client.ts
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, deleteDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

import { Platform } from 'react-native';

// if (Platform.OS !== 'web') {
//   try {
//     deleteDatabaseSync('car_health.db');
//   } catch (e) {
//     // ignore
//   }
// }

// On the web, the SQLite WASM worker frequently times out during local development.
// For Web UI testing, we bypass the real database initialization to prevent crashes.
const expoDb = Platform.OS === 'web'
  ? {
    transaction: () => { },
    runSync: () => ({ changes: 0, lastInsertRowId: 0 }),
    getFirstSync: () => null,
    getAllSync: () => [],
    execSync: () => { },
  } as any
  : openDatabaseSync('car_health.db');

export const db = drizzle(expoDb, { schema });