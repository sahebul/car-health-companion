import { ScrollView, ScrollViewProps, useColorScheme } from 'react-native';

export function ThemeScrollView(props: ScrollViewProps) {
    const isDark = useColorScheme() === 'dark';

    return (
        <ScrollView
            {...props}
            style={[{ backgroundColor: isDark ? '#000000' : '#ffffff' }, props.style]}
        />
    );
}