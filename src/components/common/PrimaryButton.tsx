import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'filled' | 'outline' | 'ghost';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export function PrimaryButton({
    title,
    onPress,
    disabled,
    loading,
    variant = 'filled',
    style,
    textStyle,
}: PrimaryButtonProps) {
    if (variant === 'outline') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                style={[styles.outlineBtn, disabled && styles.disabled, style]}
                activeOpacity={0.7}
            >
                <Text style={[styles.outlineText, textStyle]}>{title}</Text>
            </TouchableOpacity>
        );
    }

    if (variant === 'ghost') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                style={[styles.ghostBtn, style]}
                activeOpacity={0.7}
            >
                <Text style={[styles.ghostText, textStyle]}>{title}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.85}
            style={[disabled && styles.disabled, style]}
        >
            <LinearGradient
                colors={['#CC5500', '#FF6B00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient]}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={[styles.filledText, textStyle]}>{title}</Text>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    gradient: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: theme.borderRadius.pill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filledText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    outlineBtn: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: theme.borderRadius.pill,
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        alignItems: 'center',
    },
    outlineText: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: '700',
    },
    ghostBtn: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    ghostText: {
        color: theme.colors.textMuted,
        fontSize: 14,
        fontWeight: '500',
    },
    disabled: {
        opacity: 0.5,
    },
});
