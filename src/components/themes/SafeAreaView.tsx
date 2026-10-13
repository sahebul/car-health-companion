import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors } from '../../constants/theme';

export function CustomSafeAreaview(props: SafeAreaViewProps) {
    const isDark = useColorScheme() === 'dark';
    return (
        <SafeAreaView {...props} style={{ flex: 1, backgroundColor: 'isDark ? darkColors.bg : lightColors.bg' }} />
    );
}
