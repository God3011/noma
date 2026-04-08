import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, KeyboardTypeOptions } from 'react-native';
import { theme } from '../../constants/theme';

interface InputFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: KeyboardTypeOptions;
    error?: string;
    suffix?: string;
    style?: ViewStyle;
    multiline?: boolean;
}

export function InputField({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    error,
    suffix,
    style,
    multiline,
}: InputFieldProps) {
    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputWrap, error ? styles.inputError : null]}>
                <TextInput
                    style={[styles.input, multiline && styles.multiline]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType={keyboardType}
                    multiline={multiline}
                />
                {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
        paddingHorizontal: 14,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: theme.colors.textPrimary,
    },
    multiline: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    suffix: {
        fontSize: 14,
        color: theme.colors.textMuted,
        fontWeight: '500',
        marginLeft: 4,
    },
    inputError: {
        borderColor: theme.colors.error,
    },
    errorText: {
        color: theme.colors.error,
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },
});
