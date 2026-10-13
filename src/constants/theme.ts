export const lightColors = {
    bg: '#FFFFFF',
    surface: '#F2F2F2',
    surfaceElevated: '#E5E5E7',
    border: 'rgba(0,0,0,0.08)',
    textPrimary: '#000000',
    textSecondary: 'rgba(0,0,0,0.6)',
    textTertiary: 'rgba(0,0,0,0.4)',
    primary: '#0A84FF',
    primaryAlt: '#5E5CE6',
    accent: '#FF9F0A',
    success: '#30D158',
    warning: '#FFD60A',
    danger: '#FF453A',
}
export const darkColors = {
    bg: '#000000',
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',
    border: 'rgba(255,255,255,0.08)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.6)',
    textTertiary: 'rgba(133, 133, 133, 0.4)',

    primary: '#0A84FF',
    primaryAlt: '#5E5CE6',
    accent: '#FF9F0A',
    success: '#30D158',
    warning: '#FFD60A',
    danger: '#FF453A',
};

export const radius = {
    card: 20,
    button: 14,
    chip: 999,
    input: 14,
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
};

export const getColor = (status: 'upcoming' | 'due_soon' | 'overdue' | 'completed', colors: typeof lightColors | typeof darkColors) => {
    switch (status) {
        case 'overdue':
            return colors.danger;
        case 'due_soon':
            return colors.warning;
        case 'upcoming':
            return colors.success;
        default:
            return colors.textTertiary;
    }
};
export const statusColor = (status: 'healthy' | 'due_soon' | 'overdue', colors: typeof lightColors | typeof darkColors) => {
    switch (status) {
        case 'healthy':
            return colors.success;
        case 'due_soon':
            return colors.warning;
        case 'overdue':
            return colors.danger;
    }
};

export const statusLabel = (status: 'healthy' | 'due_soon' | 'overdue') => {
    switch (status) {
        case 'healthy':
            return 'Healthy';
        case 'due_soon':
            return 'Due soon';
        case 'overdue':
            return 'Overdue';
    }
};