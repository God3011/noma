import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/types';
import { useFoodLogStore } from '../../store/useFoodLogStore';
import { useUserStore } from '../../store/useUserStore';
import { MealItem } from '../../components/foodlog/MealItem';
import { getToday, getNextDay, getPrevDay, formatDate } from '../../utils/dateHelpers';
import { MealType } from '../../types/food';
import { theme } from '../../constants/theme';

type Nav = StackNavigationProp<RootStackParamList>;

const MEAL_SECTIONS: { type: MealType; label: string }[] = [
    { type: 'breakfast', label: 'Breakfast' },
    { type: 'lunch', label: 'Lunch' },
    { type: 'dinner', label: 'Dinner' },
    { type: 'snack', label: 'Snacks' },
];

export function FoodLogScreen() {
    const navigation = useNavigation<Nav>();
    const [selectedDate, setSelectedDate] = useState(getToday());
    const meals = useFoodLogStore((s) => s.meals);
    const deleteMeal = useFoodLogStore((s) => s.deleteMeal);
    const plan = useUserStore((s) => s.plan);

    const dayMeals = useMemo(() => meals.filter((m) => m.date === selectedDate), [meals, selectedDate]);

    const totalCalories = dayMeals.reduce((s, m) => s + m.calories, 0);
    const totalProtein = dayMeals.reduce((s, m) => s + m.protein_g, 0);
    const totalCarbs = dayMeals.reduce((s, m) => s + m.carbs_g, 0);
    const totalFat = dayMeals.reduce((s, m) => s + m.fat_g, 0);
    const target = plan?.daily_calories || 2000;
    const progress = Math.min(100, Math.round((totalCalories / target) * 100));

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <Text style={styles.title}>Daily Log</Text>
                    <Text style={styles.brandTag}>Noma</Text>
                </View>

                {/* Date Picker */}
                <View style={styles.datePicker}>
                    <TouchableOpacity onPress={() => setSelectedDate(getPrevDay(selectedDate))}>
                        <Ionicons name="chevron-back" size={24} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelectedDate(getToday())}>
                        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelectedDate(getNextDay(selectedDate))}>
                        <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Hero Progress */}
                <View style={styles.heroCard}>
                    <View style={styles.heroTop}>
                        <View>
                            <Text style={styles.heroLabel}>DAILY VITALITY</Text>
                            <Text style={styles.heroVal}>
                                {totalCalories.toLocaleString()}{' '}
                                <Text style={styles.heroUnit}>kcal</Text>
                            </Text>
                        </View>
                        <View style={styles.remainingBox}>
                            <Text style={styles.remainingLabel}>Remaining</Text>
                            <Text style={styles.remainingVal}>{Math.max(0, target - totalCalories)}</Text>
                        </View>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                    </View>
                </View>

                {/* Macros */}
                <View style={styles.macroRow}>
                    <View style={styles.macroCard}>
                        <Text style={styles.macroLabel}>Protein</Text>
                        <Text style={styles.macroVal}>{totalProtein}g</Text>
                    </View>
                    <View style={styles.macroCard}>
                        <Text style={styles.macroLabel}>Carbs</Text>
                        <Text style={styles.macroVal}>{totalCarbs}g</Text>
                    </View>
                    <View style={styles.macroCard}>
                        <Text style={styles.macroLabel}>Fat</Text>
                        <Text style={styles.macroVal}>{totalFat}g</Text>
                    </View>
                </View>

                {/* Meal Sections */}
                {MEAL_SECTIONS.map(({ type, label }) => {
                    const sectionMeals = dayMeals.filter((m) => m.meal_type === type);
                    return (
                        <View key={type} style={styles.mealSection}>
                            <Text style={styles.mealSectionTitle}>{label}</Text>
                            {sectionMeals.length === 0 ? (
                                <View style={styles.emptySection}>
                                    <Text style={styles.emptyText}>No {label.toLowerCase()} logged</Text>
                                </View>
                            ) : (
                                sectionMeals.map((meal) => (
                                    <MealItem key={meal.id} meal={meal} onDelete={deleteMeal} />
                                ))
                            )}
                        </View>
                    );
                })}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddMeal')}
                activeOpacity={0.85}
            >
                <LinearGradient
                    colors={['#006c49', '#10b981']}
                    style={styles.fabGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { paddingHorizontal: 20, paddingTop: 60 },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: { fontSize: 26, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.5 },
    brandTag: { fontSize: 20, fontWeight: '900', color: theme.colors.primary, letterSpacing: -0.5 },
    datePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        marginBottom: 20,
        paddingVertical: 8,
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.pill,
    },
    dateText: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary },
    heroCard: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md,
        padding: 20,
        marginBottom: 16,
    },
    heroTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    heroLabel: {
        fontSize: 10, fontWeight: '700', color: theme.colors.primary,
        letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6,
    },
    heroVal: { fontSize: 36, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -1 },
    heroUnit: { fontSize: 16, fontWeight: '400', color: theme.colors.textMuted },
    remainingBox: {
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm,
        padding: 12,
        alignItems: 'center',
    },
    remainingLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.textMuted },
    remainingVal: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary },
    progressBarBg: {
        height: 6,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
    },
    macroRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    macroCard: {
        flex: 1,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm,
        padding: 14,
        alignItems: 'center',
    },
    macroLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    macroVal: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary },
    mealSection: { marginBottom: 16 },
    mealSectionTitle: {
        fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 10,
    },
    emptySection: {
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm,
        padding: 16,
        alignItems: 'center',
    },
    emptyText: { fontSize: 13, color: theme.colors.textMuted },
    fab: { position: 'absolute', bottom: 100, right: 20, zIndex: 10 },
    fabGradient: {
        width: 56, height: 56, borderRadius: 28,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#006c49', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    },
});
