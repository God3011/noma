import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Meal, MealType } from '../../types/food';
import { formatTime } from '../../utils/dateHelpers';

interface MealItemProps {
    meal: Meal;
    onDelete: (id: string) => void;
}

const mealTypeIcons: Record<MealType, keyof typeof Ionicons.glyphMap> = {
    breakfast: 'sunny-outline',
    lunch: 'restaurant-outline',
    dinner: 'moon-outline',
    snack: 'cafe-outline',
};

const mealTypeColors: Record<MealType, string> = {
    breakfast: '#f5a623',
    lunch: '#006c49',
    dinner: '#505f76',
    snack: '#855300',
};

export function MealItem({ meal, onDelete }: MealItemProps) {
    return (
        <View style={styles.container}>
            <View style={[styles.iconWrap, { backgroundColor: mealTypeColors[meal.meal_type] + '15' }]}>
                <Ionicons
                    name={mealTypeIcons[meal.meal_type]}
                    size={20}
                    color={mealTypeColors[meal.meal_type]}
                />
            </View>
            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Text style={styles.name} numberOfLines={1}>{meal.name}</Text>
                    <Text style={styles.calories}>{meal.calories} <Text style={styles.unit}>kcal</Text></Text>
                </View>
                <View style={styles.bottomRow}>
                    <Text style={styles.time}>{formatTime(meal.logged_at)}</Text>
                    <Text style={styles.macros}>
                        P: {meal.protein_g}g • C: {meal.carbs_g}g • F: {meal.fat_g}g
                    </Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => onDelete(meal.id)} style={styles.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.sm,
        padding: 14,
        marginBottom: 8,
        gap: 12,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.textPrimary,
        flex: 1,
        marginRight: 8,
    },
    calories: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    unit: {
        fontSize: 11,
        fontWeight: '400',
        color: theme.colors.textMuted,
    },
    bottomRow: {
        flexDirection: 'row',
        gap: 12,
    },
    time: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontWeight: '500',
    },
    macros: {
        fontSize: 12,
        color: theme.colors.textMuted,
    },
    deleteBtn: {
        padding: 4,
    },
});
