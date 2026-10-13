import { Text, TextProps, useColorScheme } from 'react-native';

export function ThemedText(props: TextProps) {
    const isDark = useColorScheme() === 'dark';

    return (
        <Text
            {...props}
            style={[{ color: isDark ? '#ffffff' : '#000000' }, props.style]}
        />
    );
}
