import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/types';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { generateId } from '../../utils/generateId';
import { getToday } from '../../utils/dateHelpers';
import { WORKOUT_TYPES, WORKOUT_CATEGORIES, getCategoryColor } from '../../constants/workoutTypes';
import { WorkoutCategory, WorkoutSet, Exercise } from '../../types/workout';
import { theme } from '../../constants/theme';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'ActiveWorkout'>;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActiveSet {
    id: string;
    reps: number;
    weight_kg: number;
    completed: boolean;
}

interface ActiveExercise {
    id: string;
    name: string;
    category: WorkoutCategory;
    sets: ActiveSet[];
}

// ─── PR detection ─────────────────────────────────────────────────────────────

function getBestForExercise(
    workouts: ReturnType<typeof useWorkoutStore.getState>['workouts'],
    name: string
): number {
    let best = 0;
    for (const entry of workouts) {
        for (const ex of entry.exercises) {
            if (ex.name.toLowerCase() === name.toLowerCase()) {
                for (const s of ex.sets) {
                    const val = s.reps * (s.weight_kg ?? 0);
                    if (val > best) best = val;
                }
            }
        }
    }
    return best;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

function emptySet(): ActiveSet {
    return { id: generateId(), reps: 0, weight_kg: 0, completed: false };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NumberStepper({
    value,
    onChange,
    step = 1,
    decimals = 0,
}: {
    value: number;
    onChange: (v: number) => void;
    step?: number;
    decimals?: number;
}) {
    return (
        <View style={ns.row}>
            <TouchableOpacity
                style={ns.btn}
                onPress={() => onChange(Math.max(0, parseFloat((value - step).toFixed(decimals))))}
            >
                <Ionicons name="remove" size={16} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <TextInput
                style={ns.input}
                value={value === 0 ? '' : value.toString()}
                onChangeText={(t) => {
                    const n = decimals > 0 ? parseFloat(t) : parseInt(t);
                    if (!isNaN(n)) onChange(n);
                    else if (t === '') onChange(0);
                }}
                keyboardType="decimal-pad"
                selectTextOnFocus
                placeholder="0"
                placeholderTextColor={theme.colors.textMuted}
            />
            <TouchableOpacity
                style={ns.btn}
                onPress={() => onChange(parseFloat((value + step).toFixed(decimals)))}
            >
                <Ionicons name="add" size={16} color={theme.colors.textPrimary} />
            </TouchableOpacity>
        </View>
    );
}

const ns = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm,
        overflow: 'hidden',
    },
    btn: {
        width: 32,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        paddingVertical: 6,
        minWidth: 40,
    },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function ActiveWorkoutScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<RouteProps>();
    const date = route.params?.date ?? getToday();

    const workouts = useWorkoutStore((s) => s.workouts);
    const addExercisesToDate = useWorkoutStore((s) => s.addExercisesToDate);

    // Timer
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    // Exercise state
    const [exercises, setExercises] = useState<ActiveExercise[]>([]);
    const [selectedExId, setSelectedExId] = useState<string | null>(null);

    // Picker state
    const [searchText, setSearchText] = useState('');
    const [pickerCategory, setPickerCategory] = useState<WorkoutCategory | 'all'>('all');
    const [notes, setNotes] = useState('');

    const selectedEx = exercises.find((e) => e.id === selectedExId) ?? null;

    // ── Exercise picker ──────────────────────────────────────────────────────

    const filteredTypes = WORKOUT_TYPES.filter((t) => {
        const matchCat = pickerCategory === 'all' || t.category === pickerCategory;
        const matchSearch = searchText.trim() === '' ||
            t.name.toLowerCase().includes(searchText.toLowerCase());
        return matchCat && matchSearch;
    });

    const selectExercise = useCallback((name: string, category: WorkoutCategory) => {
        // Check if already in session
        const existing = exercises.find((e) => e.name === name);
        if (existing) {
            setSelectedExId(existing.id);
            return;
        }
        const newEx: ActiveExercise = {
            id: generateId(),
            name,
            category,
            sets: [emptySet()],
        };
        setExercises((prev) => [...prev, newEx]);
        setSelectedExId(newEx.id);
    }, [exercises]);

    // ── Set helpers ──────────────────────────────────────────────────────────

    const updateSet = (exId: string, setId: string, patch: Partial<ActiveSet>) => {
        setExercises((prev) =>
            prev.map((ex) =>
                ex.id === exId
                    ? { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }
                    : ex
            )
        );
    };

    const addSet = (exId: string) => {
        setExercises((prev) =>
            prev.map((ex) => {
                if (ex.id !== exId) return ex;
                const last = ex.sets[ex.sets.length - 1];
                return {
                    ...ex,
                    sets: [
                        ...ex.sets,
                        { ...emptySet(), reps: last?.reps ?? 0, weight_kg: last?.weight_kg ?? 0 },
                    ],
                };
            })
        );
    };

    // ── PR detection ─────────────────────────────────────────────────────────

    const prBest = selectedEx ? getBestForExercise(workouts, selectedEx.name) : 0;

    function isNewPR(set: ActiveSet): boolean {
        if (!set.completed || prBest === 0) return false;
        return set.reps * set.weight_kg > prBest;
    }

    // ── Finish ───────────────────────────────────────────────────────────────

    const handleFinish = () => {
        const builtExercises: Exercise[] = exercises
            .map((ex) => {
                const completedSets: WorkoutSet[] = ex.sets
                    .filter((s) => s.completed && s.reps > 0)
                    .map((s) => ({ reps: s.reps, weight_kg: s.weight_kg > 0 ? s.weight_kg : undefined }));
                if (completedSets.length === 0) return null;
                return {
                    name: ex.name,
                    category: ex.category,
                    sets: completedSets,
                };
            })
            .filter(Boolean) as Exercise[];

        if (builtExercises.length === 0) {
            Alert.alert('No sets logged', 'Complete at least one set before finishing.');
            return;
        }

        addExercisesToDate(date, builtExercises, notes.trim() || undefined);
        navigation.goBack();
    };

    const confirmFinish = () => {
        Alert.alert(
            'Finish Workout?',
            `${formatElapsed(elapsed)} elapsed · ${exercises.length} exercise(s)`,
            [
                { text: 'Keep Going', style: 'cancel' },
                { text: 'Finish', style: 'default', onPress: handleFinish },
            ]
        );
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="light-content" />

            {/* Sticky Header */}
            <View style={styles.stickyHeader}>
                <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() =>
                        Alert.alert('Discard workout?', 'Progress will be lost.', [
                            { text: 'Keep Going', style: 'cancel' },
                            { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
                        ])
                    }
                >
                    <Ionicons name="close" size={22} color={theme.colors.textMuted} />
                </TouchableOpacity>
                <View style={styles.timerBox}>
                    <Ionicons name="timer-outline" size={14} color={theme.colors.primary} />
                    <Text style={styles.timerText}>{formatElapsed(elapsed)}</Text>
                </View>
                <TouchableOpacity onPress={confirmFinish}>
                    <LinearGradient
                        colors={['#CC5500', '#FF6B00']}
                        style={styles.finishBtn}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.finishText}>Finish</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* ── Active Exercise Panel ── */}
                {selectedEx ? (
                    <View style={styles.activePanel}>
                        <View style={styles.activePanelHeader}>
                            <View>
                                <Text style={styles.activeName}>{selectedEx.name}</Text>
                                <View style={[styles.catBadge, { backgroundColor: getCategoryColor(selectedEx.category) + '22' }]}>
                                    <Text style={[styles.catBadgeText, { color: getCategoryColor(selectedEx.category) }]}>
                                        {selectedEx.category}
                                    </Text>
                                </View>
                            </View>
                            {prBest > 0 && (
                                <View style={styles.prRef}>
                                    <Text style={styles.prRefLabel}>PREV BEST</Text>
                                    <Text style={styles.prRefVal}>{prBest} vol</Text>
                                </View>
                            )}
                        </View>

                        {/* Set rows */}
                        <View style={styles.setsHeader}>
                            <Text style={styles.colLabel}>SET</Text>
                            <Text style={[styles.colLabel, { flex: 2 }]}>WEIGHT (kg)</Text>
                            <Text style={[styles.colLabel, { flex: 2 }]}>REPS</Text>
                            <Text style={[styles.colLabel, { width: 36 }]}></Text>
                        </View>

                        {selectedEx.sets.map((set, idx) => {
                            const isPR = isNewPR(set);
                            return (
                                <View
                                    key={set.id}
                                    style={[
                                        styles.setRow,
                                        set.completed && styles.setRowDone,
                                    ]}
                                >
                                    <Text style={styles.setNum}>{idx + 1}</Text>
                                    <View style={{ flex: 2 }}>
                                        <NumberStepper
                                            value={set.weight_kg}
                                            onChange={(v) => updateSet(selectedEx.id, set.id, { weight_kg: v })}
                                            step={2.5}
                                            decimals={1}
                                        />
                                    </View>
                                    <View style={{ flex: 2, marginLeft: 6 }}>
                                        <NumberStepper
                                            value={set.reps}
                                            onChange={(v) => updateSet(selectedEx.id, set.id, { reps: v })}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.completeBtn, set.completed && styles.completeBtnDone]}
                                        onPress={() => updateSet(selectedEx.id, set.id, { completed: !set.completed })}
                                    >
                                        <Ionicons
                                            name={set.completed ? 'checkmark' : 'checkmark-outline'}
                                            size={18}
                                            color={set.completed ? '#fff' : theme.colors.textMuted}
                                        />
                                    </TouchableOpacity>
                                    {isPR && (
                                        <View style={styles.prBadge}>
                                            <Text style={styles.prBadgeText}>NEW PR!</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}

                        <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(selectedEx.id)}>
                            <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
                            <Text style={styles.addSetText}>Add Set</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.noExercise}>
                        <Ionicons name="barbell-outline" size={40} color={theme.colors.surfaceContainerHigh} />
                        <Text style={styles.noExerciseText}>Pick an exercise below to start</Text>
                    </View>
                )}

                {/* ── Exercise Picker ── */}
                <View style={styles.pickerSection}>
                    <Text style={styles.pickerTitle}>
                        {selectedEx ? 'Add Another Exercise' : 'Choose Exercise'}
                    </Text>

                    {/* Search */}
                    <View style={styles.searchRow}>
                        <Ionicons name="search-outline" size={16} color={theme.colors.textMuted} style={{ marginLeft: 12 }} />
                        <TextInput
                            style={styles.searchInput}
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder="Search exercises..."
                            placeholderTextColor={theme.colors.textMuted}
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchText('')} style={{ marginRight: 10 }}>
                                <Ionicons name="close-circle" size={16} color={theme.colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Category filter */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catFilterScroll}>
                        <View style={styles.catFilterRow}>
                            <TouchableOpacity
                                style={[styles.catFilterChip, pickerCategory === 'all' && styles.catFilterActive]}
                                onPress={() => setPickerCategory('all')}
                            >
                                <Text style={[styles.catFilterText, pickerCategory === 'all' && styles.catFilterTextActive]}>
                                    All
                                </Text>
                            </TouchableOpacity>
                            {WORKOUT_CATEGORIES.filter((c) => c !== 'other').map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.catFilterChip, pickerCategory === cat && styles.catFilterActive]}
                                    onPress={() => setPickerCategory(cat)}
                                >
                                    <Text style={[styles.catFilterText, pickerCategory === cat && styles.catFilterTextActive]}>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Exercise chips grid */}
                    <View style={styles.exerciseGrid}>
                        {filteredTypes.map((t) => {
                            const active = exercises.some((e) => e.name === t.name);
                            const isSelected = selectedEx?.name === t.name;
                            const color = getCategoryColor(t.category);
                            return (
                                <TouchableOpacity
                                    key={t.name}
                                    style={[
                                        styles.exChip,
                                        { borderColor: color + '44' },
                                        active && { backgroundColor: color + '22' },
                                        isSelected && { backgroundColor: color + '44', borderColor: color },
                                    ]}
                                    onPress={() => selectExercise(t.name, t.category)}
                                >
                                    <Text style={[styles.exChipText, isSelected && { color: '#fff', fontWeight: '700' }]}>
                                        {t.name}
                                    </Text>
                                    {active && (
                                        <Ionicons name="checkmark-circle" size={12} color={color} style={{ marginLeft: 4 }} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* ── Logged Exercises Summary ── */}
                {exercises.length > 0 && (
                    <View style={styles.loggedSection}>
                        <Text style={styles.loggedTitle}>Session ({exercises.length} exercise{exercises.length !== 1 ? 's' : ''})</Text>
                        {exercises.map((ex) => {
                            const completedSets = ex.sets.filter((s) => s.completed).length;
                            return (
                                <TouchableOpacity
                                    key={ex.id}
                                    style={[styles.loggedItem, selectedExId === ex.id && styles.loggedItemActive]}
                                    onPress={() => setSelectedExId(ex.id)}
                                >
                                    <View style={[styles.loggedDot, { backgroundColor: getCategoryColor(ex.category) }]} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.loggedName}>{ex.name}</Text>
                                        <Text style={styles.loggedMeta}>
                                            {completedSets}/{ex.sets.length} sets done
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Notes */}
                <View style={styles.notesSection}>
                    <Text style={styles.notesLabel}>Session Notes (optional)</Text>
                    <TextInput
                        style={styles.notesInput}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="How did the workout go?"
                        placeholderTextColor={theme.colors.textMuted}
                        multiline
                    />
                </View>

                <View style={{ height: 80 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    stickyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 12,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outlineVariant,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.surfaceContainerLow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.surfaceContainerLow,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.pill,
    },
    timerText: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary, letterSpacing: 1 },
    finishBtn: {
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.pill,
    },
    finishText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    scroll: { paddingHorizontal: 20, paddingTop: 16 },
    // Active panel
    activePanel: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.lg,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
    },
    activePanelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    activeName: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 6 },
    catBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.pill,
    },
    catBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    prRef: { alignItems: 'flex-end' },
    prRefLabel: { fontSize: 9, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
    prRefVal: { fontSize: 13, fontWeight: '700', color: theme.colors.tertiary },
    setsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    colLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: theme.colors.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase',
        width: 28,
        textAlign: 'center',
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
        position: 'relative',
    },
    setRowDone: { opacity: 0.6 },
    setNum: {
        width: 22,
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.textMuted,
        textAlign: 'center',
    },
    completeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.surfaceContainerLow,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 6,
    },
    completeBtnDone: { backgroundColor: theme.colors.primary },
    prBadge: {
        position: 'absolute',
        right: -4,
        top: -10,
        backgroundColor: '#f59e0b',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.pill,
    },
    prBadgeText: { fontSize: 8, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
    addSetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        marginTop: 4,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.primary,
    },
    addSetText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
    noExercise: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 10,
    },
    noExerciseText: { fontSize: 14, color: theme.colors.textMuted, fontWeight: '500' },
    // Picker
    pickerSection: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.lg,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
    },
    pickerTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        marginBottom: 12,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.textPrimary,
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    catFilterScroll: { marginBottom: 12 },
    catFilterRow: { flexDirection: 'row', gap: 6 },
    catFilterChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.pill,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
    },
    catFilterActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    catFilterText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
    catFilterTextActive: { color: '#fff' },
    exerciseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    exChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
    },
    exChipText: { fontSize: 12, fontWeight: '500', color: theme.colors.textSecondary },
    // Logged exercises
    loggedSection: { marginBottom: 20 },
    loggedTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    loggedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.sm,
        padding: 12,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
    },
    loggedItemActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryContainer,
    },
    loggedDot: { width: 8, height: 8, borderRadius: 4 },
    loggedName: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
    loggedMeta: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
    // Notes
    notesSection: { marginBottom: 20 },
    notesLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    notesInput: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
        padding: 14,
        fontSize: 14,
        color: theme.colors.textPrimary,
        minHeight: 80,
        textAlignVertical: 'top',
    },
});
