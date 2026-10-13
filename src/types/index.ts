import { Vehicle } from '../db/schema';

export type VehicleStatus = 'healthy' | 'due_soon' | 'overdue';

export type { Vehicle } from '../db/schema';

export type MaintenanceType =
    | 'oil_change'
    | 'tire_rotation'
    | 'brake_pads'
    | 'air_filter'
    | 'battery'
    | 'other';

export interface MaintenanceLog {
    id: number;
    vehicleId: number;
    type: string;
    description: string | null;
    mileageAtService: number | null;
    cost: number | null;
    shopName: string | null;
    performedAt: string; // ISO
    notes: string | null;
    createdAt?: string | null;
    vehicle: Vehicle
}

export type ReminderStatus = 'overdue' | 'due_soon' | 'upcoming' | 'completed';

export interface Reminder {
    id: string;
    vehicleId: number;
    vehicleLabel: string;
    title: string;
    type: string;
    dueDate?: string;
    dueMileage?: number;
    dueLabel: string;
    progress: number; // 0..1
    status: ReminderStatus;
    completedAt?: string;
    vehicle: any;
    reminderDateTime?: string;
}