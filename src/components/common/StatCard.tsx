import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface StatCardProps {
    icon?: keyof typeof Ionicons.glyphMap;
    imageIcon?: ImageSourcePropType;
    iconColor?: string;
    label: string;
    value: string;
    subtitle?: string;
    style?: ViewStyle;
    onPress?: () => void;
}

export function StatCard({ icon, imageIcon, iconColor, label, value, subtitle, style, onPress }: StatCardProps) {
    const content = (
        <>
            <View style={[styles.iconWrap, { backgroundColor: (iconColor || theme.colors.primary) + '15' }]}>
                {imageIcon ? (
                    <Image source={imageIcon} style={[styles.imageIcon, { tintColor: iconColor || theme.colors.primary }]} />
                ) : icon ? (
                    <Ionicons name={icon} size={20} color={iconColor || theme.colors.primary} />
                ) : null}
            </View>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </>
    );

    if (onPress) {
        return (
            <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    }

    return <View style={[styles.card, style]}>{content}</View>;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md,
        padding: 16,
        minWidth: 130,
        alignItems: 'center',
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    value: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    subtitle: {
        fontSize: 11,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    imageIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
    },
});
