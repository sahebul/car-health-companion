import { View, ViewProps, useColorScheme } from 'react-native';

export function ThemedView(props: ViewProps) {
    const isDark = useColorScheme() === 'dark';

    return (
        <View
            {...props}
            style={[{ backgroundColor: isDark ? '#000000' : '#ffffff' }, props.style]}
        />
    );
}
