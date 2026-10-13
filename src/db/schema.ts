// src/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

export const vehicles = sqliteTable('vehicles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  trim: text('trim'),
  engine: text('engine'),
  vin: text('vin'), // optional
  licensePlate: text('license_plate'),
  currentMileage: integer('current_mileage').notNull().default(0),
  mileageUnit: text('mileage_unit', { enum: ['mi', 'km'] }).notNull().default('km'),
  status: text('status', { enum: ['healthy', 'due_soon', 'overdue'] }).notNull().default('healthy'),
  type: text('type', { enum: ['Four Wheelers', 'Two Wheelers'] }).notNull().default('Four Wheelers'),
  totalServices: integer('total_services').notNull().default(0),
  totalSpent: real('total_spent').notNull().default(0),
  nextReminder: text('next_reminder', { mode: 'json' }).$type<{ title: string; dueLabel: string; progress: number } | null>(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const maintenanceLogs = sqliteTable('maintenance_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vehicleId: integer('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // e.g., 'oil_change', 'tire_rotation', 'brake_pads'
  description: text('description'),
  mileageAtService: integer('mileage_at_service'),
  cost: real('cost'), // in local currency
  shopName: text('shop_name'),
  notes: text('notes'),
  performedAt: text('performed_at').notNull(), // ISO date
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const reminders = sqliteTable('reminders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vehicleId: integer('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(), // e.g., "Oil Change"
  type: text('type').notNull(), // maps to maintenance type
  dueDate: text('due_date'), // ISO date, nullable
  dueMileage: integer('due_mileage'), // nullable
  reminderDateTime: text('reminder_date_time'), // ISO date, nullable
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
  completedAt: text('completed_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const vehicleRelations = relations(vehicles, ({ many }) => ({
  maintenanceLogs: many(maintenanceLogs),
  reminders: many(reminders),
}));

export const maintenanceLogsRelations = relations(maintenanceLogs, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [maintenanceLogs.vehicleId],
    references: [vehicles.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [reminders.vehicleId],
    references: [vehicles.id],
  }),
}));

// Type exports for use throughout the app
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type MaintenanceLog = typeof maintenanceLogs.$inferSelect;
export type NewMaintenanceLog = typeof maintenanceLogs.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;