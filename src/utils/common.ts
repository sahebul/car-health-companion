import { Reminder } from '../types';

export const getMaintenanceType = (type: string) => {
    switch (type) {
        case 'oil_change':
            return 'Oil Change';
        case 'tire_rotation':
            return 'Tire Rotation';
        case 'brake_pads':
            return 'Brake Pads';
        case 'air_filter':
            return 'Air Filter';
        case 'battery':
            return 'Battery';
        case 'other':
            return 'Other';
        default:
            return 'Other';
    }
}
export const getMapppedList = (reminderData: any[]): Reminder[] => {
    return reminderData.map((r: any) => {
        let status: Reminder['status'] = 'upcoming';
        let dueLabel = 'Unknown';

        if (r.isCompleted) {
            status = 'completed';
            dueLabel = 'Completed';
        } else if (r.dueDate) {
            const due = new Date(r.dueDate);
            const now = new Date();
            const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
            const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const diffDays = Math.round((dueMidnight.getTime() - nowMidnight.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                dueLabel = `was due ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago`;
                status = 'overdue';
            } else if (diffDays === 0) {
                dueLabel = 'due today';
                status = 'due_soon';
            } else {
                dueLabel = `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
                if (diffDays <= 7) status = 'due_soon';
            }
        } else if (r.dueMileage) {
            if (r.vehicle) {
                const diffMi = r.dueMileage - r.vehicle.currentMileage;
                if (diffMi < 0) {
                    dueLabel = `was due ${Math.abs(diffMi).toLocaleString()} mi ago`;
                    status = 'overdue';
                } else {
                    status = diffMi <= 500 ? 'due_soon' : 'upcoming';
                    const estimatedDays = Math.round(diffMi / 33); // Assuming ~12,000 miles/year (33 miles/day)
                    let timeEstimate = '';
                    if (estimatedDays < 14) {
                        timeEstimate = `~${estimatedDays} day${estimatedDays === 1 ? '' : 's'}`;
                    } else if (estimatedDays < 60) {
                        timeEstimate = `~${Math.round(estimatedDays / 7)} weeks`;
                    } else {
                        timeEstimate = `~${Math.round(estimatedDays / 30)} months`;
                    }
                    dueLabel = `in ${diffMi.toLocaleString()} mi (${timeEstimate})`;
                }
            } else {
                dueLabel = `${r.dueMileage.toLocaleString()} mi`;
            }
        }

        return {
            id: r.id.toString(),
            vehicleId: r.vehicleId?.toString(),
            vehicleLabel: r.vehicle ? r.vehicle.name : 'Unknown Vehicle',
            title: r.title,
            type: r.type,
            dueDate: r.dueDate || undefined,
            dueMileage: r.dueMileage || undefined,
            dueLabel,
            progress: status === 'completed' ? 1 : (status === 'overdue' ? 0.9 : (status === 'due_soon' ? 0.7 : 0.2)),
            status,
            completedAt: r.completedAt || undefined,
            vehicle: r.vehicle ?? null,
            reminderDateTime: r.reminderDateTime
        };
    });
}