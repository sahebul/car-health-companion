import { TextInput, TextInputProps, useColorScheme } from "react-native";

export function ThemedTextInput(props: TextInputProps) {
    const isDark = useColorScheme() === 'dark';
    return (
        <TextInput
            {...props}
            style={[{
                color: isDark ? '#ffffff' : '#000000',
                borderColor: isDark ? '#545151ff' : '#cdcdcdff',
            }, props.style]}
        />
    )
}