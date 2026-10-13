import { KeyboardAvoidingView, KeyboardAvoidingViewProps, useColorScheme } from 'react-native'

export function ThemeKeyboardAvoidingView(props: KeyboardAvoidingViewProps) {
    const isDark = useColorScheme() === 'dark';

    return (
        <KeyboardAvoidingView
            {...props}
            style={[{ backgroundColor: isDark ? '#000000' : '#ffffff' }, props.style]}
        />
    );
}