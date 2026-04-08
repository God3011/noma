import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { CalorieTier } from '../../utils/calorieCalculator';

interface CalorieTierCardProps {
    tier: CalorieTier;
    isSelected: boolean;
    isRecommended: boolean;
    onSelect: () => void;
    style?: ViewStyle;
}

export function CalorieTierCard({
    tier,
    isSelected,
    isRecommended,
    onSelect,
    style,
}: CalorieTierCardProps) {
    return (
        <TouchableOpacity
            onPress={onSelect}
            activeOpacity={0.8}
            style={[
                styles.card,
                isSelected && styles.selected,
                isRecommended && !isSelected && styles.recommended,
                style,
            ]}
        >
            {isRecommended && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>RECOMMENDED</Text>
                </View>
            )}
            <Text style={[styles.tierName, isSelected && styles.selectedText]}>
                {tier.label}
            </Text>
            <Text style={[styles.calories, isSelected && styles.selectedText]}>
                {tier.dailyCalories}
            </Text>
            <Text style={[styles.caloriesLabel, isSelected && styles.selectedSubtext]}>
                kcal/day
            </Text>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
                <Ionicons
                    name="trending-down"
                    size={14}
                    color={isSelected ? '#fff' : theme.colors.primary}
                />
                <Text style={[styles.infoText, isSelected && styles.selectedSubtext]}>
                    {tier.weeklyLossKg} kg/week
                </Text>
            </View>
            <View style={styles.infoRow}>
                <Ionicons
                    name="time-outline"
                    size={14}
                    color={isSelected ? '#fff' : theme.colors.textMuted}
                />
                <Text style={[styles.infoText, isSelected && styles.selectedSubtext]}>
                    {tier.timeLabel}
                </Text>
            </View>

            {isSelected && (
                <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md,
        padding: 20,
        flex: 1,
        borderWidth: 1.5,
        borderColor: theme.colors.outlineVariant,
        position: 'relative',
    },
    selected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    recommended: {
        borderColor: theme.colors.primaryLight,
    },
    badge: {
        backgroundColor: theme.colors.primaryContainer,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: theme.borderRadius.pill,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: theme.colors.primary,
        letterSpacing: 1,
    },
    tierName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        marginBottom: 4,
    },
    calories: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        letterSpacing: -0.5,
    },
    caloriesLabel: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontWeight: '500',
        marginBottom: 12,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.surfaceContainerHigh,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    infoText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
    selectedText: {
        color: '#ffffff',
    },
    selectedSubtext: {
        color: 'rgba(255,255,255,0.8)',
    },
    checkmark: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
});
