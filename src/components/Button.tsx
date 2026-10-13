import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ title, variant = 'primary', style, ...rest }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        style,
      ]}
      {...rest}
    >
      <Text
        style={[
          styles.text,
          variant === 'primary' && styles.primaryText,
          variant === 'secondary' && styles.secondaryText,
          variant === 'danger' && styles.dangerText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Primary variant
  primary: {
    backgroundColor: '#007AFF', // iOS blue
  },
  primaryText: {
    color: '#FFFFFF',
  },
  // Secondary variant
  secondary: {
    backgroundColor: '#E5E5EA',
  },
  secondaryText: {
    color: '#000000',
  },
  // Danger variant
  danger: {
    backgroundColor: '#FF3B30', // iOS red
  },
  dangerText: {
    color: '#FFFFFF',
  },
});
