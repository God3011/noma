import React, { useState } from 'react';
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
    lunch: '#CC5500',
    dinner: '#505f76',
    snack: '#855300',
};

export function MealItem({ meal, onDelete }: MealItemProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.85}>
            <View style={styles.container}>
                <View style={[styles.iconWrap, { backgroundColor: mealTypeColors[meal.meal_type] + '18' }]}>
                    <Ionicons name={mealTypeIcons[meal.meal_type]} size={18} color={mealTypeColors[meal.meal_type]} />
                </View>

                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <Text style={styles.name} numberOfLines={1}>{meal.name}</Text>
                        <Text style={styles.calories}>{meal.calories} <Text style={styles.unit}>kcal</Text></Text>
                    </View>
                    {expanded && (
                        <View style={styles.macroRow}>
                            <View style={styles.macroPill}>
                                <Text style={styles.macroLabel}>Calories</Text>
                                <Text style={styles.macroVal}>{meal.calories} kcal</Text>
                            </View>
                            <View style={styles.macroPill}>
                                <Text style={styles.macroLabel}>Protein</Text>
                                <Text style={styles.macroVal}>{meal.protein_g}g</Text>
                            </View>
                            <View style={styles.macroPill}>
                                <Text style={styles.macroLabel}>Fat</Text>
                                <Text style={styles.macroVal}>{meal.fat_g}g</Text>
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.rightCol}>
                    <Text style={styles.time}>{formatTime(meal.logged_at)}</Text>
                    <TouchableOpacity
                        onPress={() => onDelete(meal.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.deleteBtn}
                    >
                        <Ionicons name="trash-outline" size={15} color={theme.colors.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.sm,
        padding: 12,
        marginBottom: 8,
        gap: 10,
    },
    iconWrap: {
        width: 36, height: 36, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
        alignSelf: 'flex-start',
    },
    content: { flex: 1 },
    topRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary,
        flex: 1, marginRight: 6,
    },
    calories: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
    unit: { fontSize: 10, fontWeight: '400', color: theme.colors.textMuted },
    macroRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
    macroPill: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.borderRadius.pill,
        paddingHorizontal: 8, paddingVertical: 3,
    },
    macroLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.primary },
    macroVal: { fontSize: 10, fontWeight: '600', color: theme.colors.textSecondary },
    rightCol: { alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
    time: { fontSize: 10, color: theme.colors.textMuted, fontWeight: '500' },
    deleteBtn: { padding: 2 },
});
