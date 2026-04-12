import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { generateId } from '../../utils/generateId';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useWorkoutPresetStore } from '../../store/useWorkoutPresetStore';
import { InputField } from '../../components/common/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { getToday } from '../../utils/dateHelpers';
import { WORKOUT_TYPES, WORKOUT_CATEGORIES } from '../../constants/workoutTypes';
import { WorkoutCategory, Exercise } from '../../types/workout';
import { RootStackParamList } from '../../navigation/types';
import { theme } from '../../constants/theme';

type AddWorkoutRoute = RouteProp<RootStackParamList, 'AddWorkout'>;

// Store reps/weight as raw strings so decimal input (e.g. "80.5") works correctly
interface SetForm {
    repsStr: string;
    weightStr: string;
}

interface ExerciseForm {
    name: string;
    category: WorkoutCategory;
    customName: string;
    sets: SetForm[];
    duration: string;
    speed: string;
}

const emptySet = (): SetForm => ({ repsStr: '', weightStr: '' });

const emptyExercise = (): ExerciseForm => ({
    name: '',
    category: 'strength',
    customName: '',
    sets: [emptySet()],
    duration: '',
    speed: '',
});

const isTimeBased = (cat: WorkoutCategory) => cat === 'cardio' || cat === 'sport';

export function AddWorkoutScreen() {
    const navigation = useNavigation();
    const route = useRoute<AddWorkoutRoute>();
    const presetMode = route.params?.presetMode ?? false;

    const addWorkout = useWorkoutStore((s) => s.addWorkout);
    const addPreset = useWorkoutPresetStore((s) => s.addPreset);

    const [exercises, setExercises] = useState<ExerciseForm[]>([emptyExercise()]);
    const [notes, setNotes] = useState('');
    const [presetName, setPresetName] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // --- Exercise helpers ---
    const updateExercise = (idx: number, patch: Partial<ExerciseForm>) => {
        const updated = [...exercises];
        updated[idx] = { ...updated[idx], ...patch };
        setExercises(updated);
    };

    const addExercise = () => setExercises([...exercises, emptyExercise()]);
    const removeExercise = (idx: number) => setExercises(exercises.filter((_, i) => i !== idx));

    // --- Set helpers ---
    const addSet = (exIdx: number) => {
        const updated = [...exercises];
        updated[exIdx].sets = [...updated[exIdx].sets, emptySet()];
        setExercises(updated);
    };
    const removeSet = (exIdx: number, setIdx: number) => {
        const updated = [...exercises];
        updated[exIdx].sets = updated[exIdx].sets.filter((_, i) => i !== setIdx);
        setExercises(updated);
    };
    const updateSet = (exIdx: number, setIdx: number, field: 'repsStr' | 'weightStr', val: string) => {
        const updated = [...exercises];
        updated[exIdx].sets[setIdx] = { ...updated[exIdx].sets[setIdx], [field]: val };
        setExercises(updated);
    };

    // --- Build validated exercises ---
    const buildExercises = (): { exercises: Exercise[]; errs: Record<string, string> } => {
        const errs: Record<string, string> = {};
        const builtExercises: Exercise[] = [];

        exercises.forEach((ex, i) => {
            const finalName = ex.name === '__custom__' || ex.category === 'other'
                ? ex.customName.trim()
                : ex.name;
            if (!finalName) {
                errs[`ex${i}`] = 'Select or enter an exercise';
                return;
            }
            if (isTimeBased(ex.category)) {
                if (!ex.duration || parseInt(ex.duration) <= 0) {
                    errs[`ex${i}_dur`] = 'Enter duration';
                    return;
                }
                builtExercises.push({
                    name: finalName,
                    category: ex.category,
                    sets: [],
                    duration_minutes: parseInt(ex.duration),
                    speed_kmh: parseFloat(ex.speed) || undefined,
                });
            } else {
                const validSets = ex.sets
                    .map((s) => ({ reps: parseInt(s.repsStr) || 0, weight_kg: parseFloat(s.weightStr) || undefined }))
                    .filter((s) => s.reps > 0);
                const hasDur = parseInt(ex.duration) > 0;
                if (validSets.length === 0 && !hasDur) {
                    errs[`ex${i}_sets`] = 'Add sets or duration';
                    return;
                }
                builtExercises.push({
                    name: finalName,
                    category: ex.category,
                    sets: validSets,
                    duration_minutes: parseInt(ex.duration) || undefined,
                });
            }
        });

        return { exercises: builtExercises, errs };
    };

    const handleSave = () => {
        const { exercises: builtExercises, errs } = buildExercises();

        if (builtExercises.length === 0 && Object.keys(errs).length === 0) {
            errs.general = 'Add at least one exercise';
        }
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        addWorkout({
            id: generateId(),
            date: getToday(),
            exercises: builtExercises,
            notes: notes.trim() || undefined,
            logged_at: new Date().toISOString(),
        });
        navigation.goBack();
    };

    const handleSavePreset = () => {
        const errs: Record<string, string> = {};
        if (!presetName.trim()) {
            errs.presetName = 'Enter a name for this preset';
        }

        const { exercises: builtExercises, errs: exErrs } = buildExercises();
        Object.assign(errs, exErrs);

        if (builtExercises.length === 0 && !exErrs.general) {
            errs.general = 'Add at least one exercise';
        }
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        addPreset({
            id: generateId(),
            name: presetName.trim(),
            exercises: builtExercises,
            created_at: new Date().toISOString(),
        });
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={28} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>{presetMode ? 'Create Preset' : 'Log Workout'}</Text>
                    <View style={{ width: 28 }} />
                </View>

                {/* Preset name field */}
                {presetMode && (
                    <InputField
                        label="Preset Name"
                        value={presetName}
                        onChangeText={setPresetName}
                        placeholder="e.g. Push Day, Upper Body..."
                        error={errors.presetName}
                    />
                )}

                {errors.general ? <Text style={styles.errorText}>{errors.general}</Text> : null}

                {/* Exercise Cards */}
                {exercises.map((ex, exIdx) => {
                    const filtered = WORKOUT_TYPES.filter((t) => t.category === ex.category);
                    const timeBased = isTimeBased(ex.category);
                    return (
                        <View key={exIdx} style={styles.exerciseCard}>
                            {/* Exercise header */}
                            <View style={styles.exerciseHeader}>
                                <Text style={styles.exerciseNum}>Exercise {exIdx + 1}</Text>
                                {exercises.length > 1 && (
                                    <TouchableOpacity onPress={() => removeExercise(exIdx)}>
                                        <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Category */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                                <View style={styles.catRow}>
                                    {WORKOUT_CATEGORIES.map((cat) => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[styles.catChip, ex.category === cat && styles.catChipActive]}
                                            onPress={() => updateExercise(exIdx, { category: cat, name: '', customName: '' })}
                                        >
                                            <Text style={[styles.catText, ex.category === cat && styles.catTextActive]}>
                                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>

                            {/* Exercise picker */}
                            {ex.category === 'other' ? (
                                <InputField
                                    label="Exercise Name"
                                    value={ex.customName}
                                    onChangeText={(v) => updateExercise(exIdx, { customName: v })}
                                    placeholder="Custom exercise"
                                    error={errors[`ex${exIdx}`]}
                                />
                            ) : (
                                <>
                                    {errors[`ex${exIdx}`] ? <Text style={styles.errorText}>{errors[`ex${exIdx}`]}</Text> : null}
                                    <View style={styles.typeGrid}>
                                        {filtered.map((t) => (
                                            <TouchableOpacity
                                                key={t.name}
                                                style={[styles.typeChip, ex.name === t.name && styles.typeChipActive]}
                                                onPress={() => updateExercise(exIdx, { name: t.name, customName: '' })}
                                            >
                                                <Text style={[styles.typeText, ex.name === t.name && styles.typeTextActive]}>
                                                    {t.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                        <TouchableOpacity
                                            style={[styles.typeChip, styles.customChip, ex.name === '__custom__' && styles.typeChipActive]}
                                            onPress={() => updateExercise(exIdx, { name: '__custom__' })}
                                        >
                                            <Text style={[styles.typeText, ex.name === '__custom__' && styles.typeTextActive]}>+ Custom</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {ex.name === '__custom__' && (
                                        <InputField
                                            label="Custom Exercise Name"
                                            value={ex.customName}
                                            onChangeText={(v) => updateExercise(exIdx, { customName: v })}
                                            placeholder="e.g. Cable Fly, Box Jumps..."
                                        />
                                    )}
                                </>
                            )}

                            {/* Cardio / Sport → Time + Speed */}
                            {timeBased ? (
                                <View style={{ marginTop: 8 }}>
                                    {errors[`ex${exIdx}_dur`] ? <Text style={styles.errorText}>{errors[`ex${exIdx}_dur`]}</Text> : null}
                                    <InputField
                                        label="Duration"
                                        value={ex.duration}
                                        onChangeText={(v) => updateExercise(exIdx, { duration: v })}
                                        placeholder="30"
                                        keyboardType="numeric"
                                        suffix="min"
                                    />
                                    {ex.category === 'cardio' && (
                                        <InputField
                                            label="Speed (optional)"
                                            value={ex.speed}
                                            onChangeText={(v) => updateExercise(exIdx, { speed: v })}
                                            placeholder="—"
                                            keyboardType="decimal-pad"
                                            suffix="km/h"
                                        />
                                    )}
                                </View>
                            ) : (
                                <>
                                    {/* Strength / Flexibility → Sets */}
                                    <View style={styles.setsHeader}>
                                        <Text style={styles.label}>Sets</Text>
                                        <TouchableOpacity onPress={() => addSet(exIdx)}>
                                            <Text style={styles.addSetBtn}>+ Add Set</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {errors[`ex${exIdx}_sets`] ? <Text style={styles.errorText}>{errors[`ex${exIdx}_sets`]}</Text> : null}
                                    {ex.sets.map((s, sIdx) => (
                                        <View key={sIdx} style={styles.setRow}>
                                            <Text style={styles.setNum}>{sIdx + 1}</Text>
                                            <InputField
                                                label="Reps"
                                                value={s.repsStr}
                                                onChangeText={(v) => updateSet(exIdx, sIdx, 'repsStr', v)}
                                                placeholder="10"
                                                keyboardType="numeric"
                                                style={styles.setInput}
                                            />
                                            <InputField
                                                label="Weight"
                                                value={s.weightStr}
                                                onChangeText={(v) => updateSet(exIdx, sIdx, 'weightStr', v)}
                                                placeholder="—"
                                                keyboardType="decimal-pad"
                                                suffix="kg"
                                                style={styles.setInput}
                                            />
                                            {ex.sets.length > 1 && (
                                                <TouchableOpacity onPress={() => removeSet(exIdx, sIdx)} style={styles.removeSet}>
                                                    <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))}
                                    <InputField
                                        label="Duration (optional)"
                                        value={ex.duration}
                                        onChangeText={(v) => updateExercise(exIdx, { duration: v })}
                                        placeholder="—"
                                        keyboardType="numeric"
                                        suffix="min"
                                    />
                                </>
                            )}
                        </View>
                    );
                })}

                {/* Add another exercise */}
                <TouchableOpacity style={styles.addExerciseBtn} onPress={addExercise}>
                    <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                    <Text style={styles.addExerciseText}>Add Another Exercise</Text>
                </TouchableOpacity>

                {!presetMode && (
                    <InputField
                        label="Notes (optional)"
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="How did the session go?"
                        multiline
                    />
                )}

                <View style={{ marginTop: 16, marginBottom: 40 }}>
                    <PrimaryButton
                        title={presetMode ? 'Save Preset' : 'Log Workout'}
                        onPress={presetMode ? handleSavePreset : handleSave}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { padding: 24, paddingTop: 60 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
    },
    title: { fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary },
    label: {
        fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary,
        marginBottom: 8, letterSpacing: 0.3,
    },
    errorText: { color: theme.colors.error, fontSize: 12, marginBottom: 8, fontWeight: '500' },
    exerciseCard: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
    },
    exerciseHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
    },
    exerciseNum: { fontSize: 14, fontWeight: '700', color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
    catRow: { flexDirection: 'row', gap: 6 },
    catChip: {
        paddingVertical: 8, paddingHorizontal: 14, borderRadius: theme.borderRadius.pill,
        backgroundColor: theme.colors.surfaceContainerLow, borderWidth: 1, borderColor: theme.colors.outlineVariant,
    },
    catChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    catText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
    catTextActive: { color: '#fff' },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    typeChip: {
        paddingVertical: 8, paddingHorizontal: 12, borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.surfaceContainerLow, borderWidth: 1, borderColor: theme.colors.outlineVariant,
    },
    typeChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    customChip: { borderStyle: 'dashed' as const },
    typeText: { fontSize: 12, fontWeight: '500', color: theme.colors.textSecondary },
    typeTextActive: { color: '#fff' },
    setsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 8 },
    addSetBtn: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
    setRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    setNum: { fontSize: 13, fontWeight: '700', color: theme.colors.textMuted, width: 18, textAlign: 'center' },
    setInput: { flex: 1, marginBottom: 6 },
    removeSet: { marginTop: 12 },
    addExerciseBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: theme.borderRadius.sm,
        borderWidth: 1, borderColor: theme.colors.primary, borderStyle: 'dashed',
        marginBottom: 20,
    },
    addExerciseText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
});
