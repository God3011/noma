import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, StatusBar,
    TouchableOpacity, ActionSheetIOS, Platform, Alert, TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/types';
import { useUserStore } from '../../store/useUserStore';
import { useFoodLogStore } from '../../store/useFoodLogStore';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getDailyScore } from '../../store/useDailyRatingStore';
import { useDailyStepsStore } from '../../store/useDailyStepsStore';
import { useTodoStore, TodoItem } from '../../store/useTodoStore';
import { DailyRatingMeter } from '../../components/common/DailyRatingMeter';
import { StatCard } from '../../components/common/StatCard';
import { StreakWidget } from '../../components/common/StreakWidget';
import { getToday, getGreeting, formatDate } from '../../utils/dateHelpers';
import { generateId } from '../../utils/generateId';
import { theme } from '../../constants/theme';

type Nav = StackNavigationProp<RootStackParamList>;

export function HomeScreen() {
    const navigation = useNavigation<Nav>();
    const profile = useUserStore((s) => s.profile);
    const plan = useUserStore((s) => s.plan);
    const meals = useFoodLogStore((s) => s.meals);
    const workouts = useWorkoutStore((s) => s.workouts);

    const [score, setScore] = useState(getDailyScore(getToday()));

    useFocusEffect(
        useCallback(() => {
            setScore(getDailyScore(getToday()));
        }, [meals, workouts])
    );

    const today = getToday();
    const todayMeals = meals.filter((m) => m.date === today);
    const todayWorkouts = workouts.filter((w) => w.date === today);
    const todaySteps = useDailyStepsStore((s) => s.getSteps(today));
    const setSteps = useDailyStepsStore((s) => s.setSteps);
    const [editingSteps, setEditingSteps] = useState(false);
    const [stepsInput, setStepsInput] = useState('');

    const completedDates = useMemo(() => {
        const dates = new Set<string>();
        meals.forEach(m => dates.add(m.date));
        workouts.forEach(w => dates.add(w.date));
        return Array.from(dates);
    }, [meals, workouts]);

    const totalCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);
    const totalProtein = todayMeals.reduce((sum, m) => sum + m.protein_g, 0);
    const calorieTarget = plan?.daily_calories || 2000;
    const caloriePercent = Math.min(100, Math.round((totalCalories / calorieTarget) * 100));

    const saveSteps = () => {
        const val = parseInt(stepsInput) || 0;
        setSteps(today, val);
        setEditingSteps(false);
    };

    // ─── Todo ───
    const todos = useTodoStore((s) => s.todos);
    const addTodo = useTodoStore((s) => s.addTodo);
    const toggleTodo = useTodoStore((s) => s.toggleTodo);
    const deleteTodo = useTodoStore((s) => s.deleteTodo);
    const [newTodo, setNewTodo] = useState('');

    const handleAddTodo = () => {
        if (!newTodo.trim()) return;
        addTodo({
            id: generateId(),
            text: newTodo.trim(),
            done: false,
            created_at: new Date().toISOString(),
        });
        setNewTodo('');
    };

    const showActionSheet = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Add Meal', 'Add Workout'],
                    cancelButtonIndex: 0,
                },
                (idx) => {
                    if (idx === 1) navigation.navigate('AddMeal');
                    if (idx === 2) navigation.navigate('AddWorkout');
                }
            );
        } else {
            Alert.alert('Quick Add', 'What would you like to log?', [
                { text: 'Add Meal', onPress: () => navigation.navigate('AddMeal') },
                { text: 'Add Workout', onPress: () => navigation.navigate('AddWorkout') },
                { text: 'Cancel', style: 'cancel' },
            ]);
        }
    };

    const pendingTodos = todos.filter((t) => !t.done);
    const doneTodos = todos.filter((t) => t.done);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            style={styles.accountBtn}
                            onPress={() => navigation.navigate('Account')}
                            activeOpacity={0.75}
                        >
                            <Ionicons name="person" size={18} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.greeting}>{getGreeting()},</Text>
                            <Text style={styles.name}>Champion</Text>
                        </View>
                    </View>
                    <Text style={styles.date}>{formatDate(today)}</Text>
                </View>

                {/* Hero Section */}
                <View style={styles.heroRow}>
                    <View style={styles.heroCard}>
                        <Text style={styles.heroLabel}>DAILY VITALITY</Text>
                        <Text style={styles.heroCalories}>
                            {totalCalories.toLocaleString()}{' '}
                            <Text style={styles.heroTarget}>/ {calorieTarget.toLocaleString()} kcal</Text>
                        </Text>
                        <View style={styles.heroBadgeRow}>
                            <View style={styles.heroBadge}>
                                <Text style={styles.heroBadgeText}>{caloriePercent}% TARGET</Text>
                            </View>
                            <Text style={styles.heroRemaining}>
                                {Math.max(0, calorieTarget - totalCalories)} remaining
                            </Text>
                        </View>
                    </View>
                    <View style={styles.meterCard}>
                        <DailyRatingMeter
                            score={score.total}
                            label={score.label}
                            color={score.color}
                            size={140}
                        />
                    </View>
                </View>

                {/* Summary Strip — no calories */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
                    <View style={styles.statsRow}>
                        <StatCard
                            imageIcon={require('../../../assets/protein-icon.png')}
                            label="Protein"
                            value={`${totalProtein}g`}
                        />
                        <StatCard
                            icon="barbell"
                            iconColor="#006c49"
                            label="Workouts"
                            value={`${todayWorkouts.length}`}
                        />
                        <StatCard
                            icon="footsteps"
                            iconColor="#10b981"
                            label="Steps"
                            value={`${todaySteps.toLocaleString()}`}
                            onPress={() => { setStepsInput(todaySteps > 0 ? todaySteps.toString() : ''); setEditingSteps(true); }}
                        />
                        <StatCard
                            icon="person-circle-outline"
                            iconColor="#a78bfa"
                            label="Avatar"
                            value="—"
                        />
                    </View>
                </ScrollView>

                {/* Step Editor */}
                {editingSteps && (
                    <View style={styles.stepEditor}>
                        <Text style={styles.stepEditorLabel}>Log today's steps</Text>
                        <View style={styles.stepEditorRow}>
                            <TextInput
                                style={styles.stepInput}
                                value={stepsInput}
                                onChangeText={setStepsInput}
                                placeholder="0"
                                keyboardType="numeric"
                                autoFocus
                                placeholderTextColor={theme.colors.textMuted}
                            />
                            <TouchableOpacity style={styles.stepSaveBtn} onPress={saveSteps}>
                                <Text style={styles.stepSaveBtnText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setEditingSteps(false)}>
                                <Ionicons name="close" size={22} color={theme.colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Monthly Streak Widget */}
                <StreakWidget completedDates={completedDates} />

                {/* To-Do List */}
                <View style={styles.todoSection}>
                    <Text style={styles.sectionTitle}>To-Do</Text>

                    {/* Add todo input */}
                    <View style={styles.todoInputRow}>
                        <TextInput
                            style={styles.todoInput}
                            value={newTodo}
                            onChangeText={setNewTodo}
                            placeholder="Add a task..."
                            placeholderTextColor={theme.colors.textMuted}
                            onSubmitEditing={handleAddTodo}
                            returnKeyType="done"
                        />
                        <TouchableOpacity
                            style={[styles.todoAddBtn, !newTodo.trim() && { opacity: 0.4 }]}
                            onPress={handleAddTodo}
                            disabled={!newTodo.trim()}
                        >
                            <Ionicons name="add" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Pending todos */}
                    {pendingTodos.map((todo) => (
                        <View key={todo.id} style={styles.todoItem}>
                            <TouchableOpacity
                                style={styles.todoCheck}
                                onPress={() => toggleTodo(todo.id)}
                            >
                                <View style={styles.todoCheckbox} />
                            </TouchableOpacity>
                            <Text style={styles.todoText}>{todo.text}</Text>
                            <TouchableOpacity onPress={() => deleteTodo(todo.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Ionicons name="close" size={16} color={theme.colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Done todos */}
                    {doneTodos.length > 0 && (
                        <Text style={styles.doneLabel}>Completed ({doneTodos.length})</Text>
                    )}
                    {doneTodos.map((todo) => (
                        <View key={todo.id} style={[styles.todoItem, styles.todoItemDone]}>
                            <TouchableOpacity
                                style={styles.todoCheck}
                                onPress={() => toggleTodo(todo.id)}
                            >
                                <View style={styles.todoCheckboxDone}>
                                    <Ionicons name="checkmark" size={12} color="#fff" />
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.todoTextDone}>{todo.text}</Text>
                            <TouchableOpacity onPress={() => deleteTodo(todo.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Ionicons name="close" size={16} color={theme.colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {todos.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No tasks yet — add one above</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { paddingHorizontal: 20, paddingTop: 60 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    accountBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: theme.colors.primaryContainer,
        alignItems: 'center', justifyContent: 'center',
    },
    greeting: { fontSize: 15, color: theme.colors.textSecondary, fontWeight: '400' },
    name: { fontSize: 26, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.5 },
    date: { fontSize: 13, color: theme.colors.textMuted, fontWeight: '500', marginTop: 4 },
    heroRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    heroCard: {
        flex: 1, backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md, padding: 20,
    },
    heroLabel: {
        fontSize: 10, fontWeight: '700', color: theme.colors.primary,
        letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8,
    },
    heroCalories: {
        fontSize: 28, fontWeight: '800', color: theme.colors.textPrimary,
        letterSpacing: -0.5, marginBottom: 8,
    },
    heroTarget: { fontSize: 14, fontWeight: '400', color: theme.colors.textMuted },
    heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    heroBadge: {
        backgroundColor: '#e6f9f0', paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: theme.borderRadius.pill,
    },
    heroBadgeText: { fontSize: 10, fontWeight: '700', color: theme.colors.primary, letterSpacing: 0.5 },
    heroRemaining: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '500' },
    meterCard: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md, padding: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    statsScroll: { marginBottom: 24 },
    statsRow: { flexDirection: 'row', gap: 10, paddingRight: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 12 },
    // Step editor
    stepEditor: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 20,
    },
    stepEditorLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 10 },
    stepEditorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    stepInput: {
        flex: 1, backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm, paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary,
    },
    stepSaveBtn: {
        backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.sm,
        paddingHorizontal: 20, paddingVertical: 12,
    },
    stepSaveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    // To-Do
    todoSection: { marginTop: 4 },
    todoInputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    todoInput: {
        flex: 1, backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.sm, paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 14, color: theme.colors.textPrimary,
        borderWidth: 1, borderColor: theme.colors.outlineVariant,
    },
    todoAddBtn: {
        backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.sm,
        width: 44, alignItems: 'center', justifyContent: 'center',
    },
    todoItem: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.sm, padding: 14, marginBottom: 6,
    },
    todoItemDone: { opacity: 0.6 },
    todoCheck: { width: 24, alignItems: 'center' },
    todoCheckbox: {
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 2, borderColor: theme.colors.primary,
    },
    todoCheckboxDone: {
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: theme.colors.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    todoText: { flex: 1, fontSize: 14, color: theme.colors.textPrimary, fontWeight: '500' },
    todoTextDone: {
        flex: 1, fontSize: 14, color: theme.colors.textMuted,
        fontWeight: '500', textDecorationLine: 'line-through',
    },
    doneLabel: {
        fontSize: 12, fontWeight: '600', color: theme.colors.textMuted,
        marginTop: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    emptyState: {
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm, padding: 24, alignItems: 'center', marginBottom: 8,
    },
    emptyText: { fontSize: 14, color: theme.colors.textMuted },
});
