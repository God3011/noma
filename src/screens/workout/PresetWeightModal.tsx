import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Modal, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutPreset, WorkoutSet, Exercise, WorkoutCategory } from '../../types/workout';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useWorkoutPresetStore } from '../../store/useWorkoutPresetStore';
import { getCategoryColor } from '../../constants/workoutTypes';
import { generateId } from '../../utils/generateId';
import { getToday } from '../../utils/dateHelpers';
import { theme } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

// String fields so decimal input (e.g. "80.5") works without mid-type clobbering
interface SetForm {
    repsStr: string;
    weightStr: string;
}

interface ExerciseWeightForm {
    name: string;
    category: WorkoutCategory;
    sets: SetForm[];
    duration: string;
    speed: string;
    sameAsLast: boolean;
    noLastData: boolean;
}

const isTimeBased = (cat: WorkoutCategory) => cat === 'cardio' || cat === 'sport';

function workoutSetToForm(s: WorkoutSet): SetForm {
    return { repsStr: s.reps > 0 ? String(s.reps) : '', weightStr: s.weight_kg ? String(s.weight_kg) : '' };
}

function initForms(preset: WorkoutPreset): ExerciseWeightForm[] {
    return preset.exercises.map((ex) => ({
        name: ex.name,
        category: ex.category,
        sets: ex.sets.length > 0
            ? ex.sets.map((s) => ({ repsStr: String(s.reps), weightStr: '' }))
            : [{ repsStr: '', weightStr: '' }],
        duration: ex.duration_minutes ? String(ex.duration_minutes) : '',
        speed: ex.speed_kmh ? String(ex.speed_kmh) : '',
        sameAsLast: false,
        noLastData: false,
    }));
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    preset: WorkoutPreset | null;
    onClose: () => void;
    onLogged: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PresetWeightModal({ preset, onClose, onLogged }: Props) {
    const addWorkout = useWorkoutStore((s) => s.addWorkout);
    const saveLastWeights = useWorkoutPresetStore((s) => s.saveLastWeights);
    const getLastWeights = useWorkoutPresetStore((s) => s.getLastWeights);

    const [forms, setForms] = useState<ExerciseWeightForm[]>(() =>
        preset ? initForms(preset) : []
    );

    useEffect(() => {
        if (preset) setForms(initForms(preset));
    }, [preset?.id]);

    if (!preset) return null;

    // ─── Form helpers ─────────────────────────────────────────────────────────

    const updateForm = (idx: number, patch: Partial<ExerciseWeightForm>) => {
        setForms((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], ...patch };
            return next;
        });
    };

    const updateSet = (exIdx: number, setIdx: number, field: 'repsStr' | 'weightStr', val: string) => {
        setForms((prev) => {
            const next = [...prev];
            const sets = [...next[exIdx].sets];
            sets[setIdx] = { ...sets[setIdx], [field]: val };
            next[exIdx] = { ...next[exIdx], sets };
            return next;
        });
    };

    const addSet = (exIdx: number) => {
        setForms((prev) => {
            const next = [...prev];
            next[exIdx] = {
                ...next[exIdx],
                sets: [...next[exIdx].sets, { repsStr: '', weightStr: '' }],
            };
            return next;
        });
    };

    const removeSet = (exIdx: number, setIdx: number) => {
        setForms((prev) => {
            const next = [...prev];
            next[exIdx] = {
                ...next[exIdx],
                sets: next[exIdx].sets.filter((_, i) => i !== setIdx),
            };
            return next;
        });
    };

    const toggleSameAsLast = (exIdx: number) => {
        const form = forms[exIdx];
        if (form.sameAsLast) {
            // Turn off — revert to preset template (reps pre-filled, weights blank)
            const presetEx = preset.exercises[exIdx];
            updateForm(exIdx, {
                sameAsLast: false,
                noLastData: false,
                sets: presetEx.sets.length > 0
                    ? presetEx.sets.map((s) => ({ repsStr: String(s.reps), weightStr: '' }))
                    : [{ repsStr: '', weightStr: '' }],
            });
        } else {
            // Turn on — try to load last session weights
            const last = getLastWeights(preset.id, form.name);
            if (last && last.length > 0) {
                updateForm(exIdx, {
                    sameAsLast: true,
                    noLastData: false,
                    sets: last.map(workoutSetToForm),
                });
            } else {
                updateForm(exIdx, { sameAsLast: true, noLastData: true });
            }
        }
    };

    // ─── Save ─────────────────────────────────────────────────────────────────

    const handleLog = () => {
        const exercises: Exercise[] = forms.map((form) => {
            if (isTimeBased(form.category)) {
                return {
                    name: form.name,
                    category: form.category,
                    sets: [],
                    duration_minutes: parseInt(form.duration) || 0,
                    speed_kmh: parseFloat(form.speed) || undefined,
                };
            }
            const validSets: WorkoutSet[] = form.sets
                .map((s) => ({ reps: parseInt(s.repsStr) || 0, weight_kg: parseFloat(s.weightStr) || undefined }))
                .filter((s) => s.reps > 0);
            return { name: form.name, category: form.category, sets: validSets };
        });

        // Persist weights so "same as last session" works next time
        forms.forEach((form) => {
            if (!isTimeBased(form.category)) {
                const validSets: WorkoutSet[] = form.sets
                    .map((s) => ({ reps: parseInt(s.repsStr) || 0, weight_kg: parseFloat(s.weightStr) || undefined }))
                    .filter((s) => s.reps > 0);
                if (validSets.length > 0) {
                    saveLastWeights(preset.id, form.name, validSets);
                }
            }
        });

        addWorkout({
            id: generateId(),
            date: getToday(),
            exercises,
            logged_at: new Date().toISOString(),
        });

        onLogged();
        onClose();
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <Modal
            visible={!!preset}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close" size={26} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>{preset.name}</Text>
                        <Text style={styles.headerSub}>
                            {preset.exercises.length} exercise{preset.exercises.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    <View style={{ width: 26 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.sectionHint}>
                        Set your weights for today's session, or copy from last time.
                    </Text>

                    {forms.map((form, exIdx) => {
                        const timeBased = isTimeBased(form.category);
                        const catColor = getCategoryColor(form.category);
                        return (
                            <View key={exIdx} style={styles.exerciseCard}>
                                {/* Exercise title row */}
                                <View style={styles.exTitleRow}>
                                    <Text style={styles.exName}>{form.name}</Text>
                                    <View style={[styles.catBadge, { backgroundColor: catColor + '1a' }]}>
                                        <Text style={[styles.catBadgeText, { color: catColor }]}>
                                            {form.category}
                                        </Text>
                                    </View>
                                </View>

                                {/* Same as last session toggle (strength/flexibility only) */}
                                {!timeBased && (
                                    <TouchableOpacity
                                        style={[styles.sameAsLastBtn, form.sameAsLast && styles.sameAsLastBtnActive]}
                                        onPress={() => toggleSameAsLast(exIdx)}
                                        activeOpacity={0.75}
                                    >
                                        <View style={[styles.checkbox, form.sameAsLast && styles.checkboxChecked]}>
                                            {form.sameAsLast && (
                                                <Ionicons name="checkmark" size={12} color="#fff" />
                                            )}
                                        </View>
                                        <Text style={[styles.sameAsLastText, form.sameAsLast && styles.sameAsLastTextActive]}>
                                            Same as last session
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* No data notice */}
                                {form.sameAsLast && form.noLastData && (
                                    <Text style={styles.noLastDataText}>
                                        No previous session found — enter weights below.
                                    </Text>
                                )}

                                {/* Strength / Flexibility → set rows */}
                                {!timeBased && (
                                    <>
                                        <View style={styles.setsHeaderRow}>
                                            <Text style={styles.colLabel} />
                                            <Text style={[styles.colLabel, styles.colLabelField]}>Reps</Text>
                                            <Text style={[styles.colLabel, styles.colLabelField]}>Weight (kg)</Text>
                                            <View style={{ width: 24 }} />
                                        </View>
                                        {form.sets.map((s, sIdx) => (
                                            <View key={sIdx} style={styles.setRow}>
                                                <Text style={styles.setNum}>{sIdx + 1}</Text>
                                                <TextInput
                                                    style={styles.setInput}
                                                    value={s.repsStr}
                                                    onChangeText={(v) => updateSet(exIdx, sIdx, 'repsStr', v)}
                                                    placeholder="10"
                                                    placeholderTextColor={theme.colors.textMuted}
                                                    keyboardType="numeric"
                                                />
                                                <TextInput
                                                    style={[styles.setInput, styles.weightInput]}
                                                    value={s.weightStr}
                                                    onChangeText={(v) => updateSet(exIdx, sIdx, 'weightStr', v)}
                                                    placeholder="—"
                                                    placeholderTextColor={theme.colors.textMuted}
                                                    keyboardType="decimal-pad"
                                                />
                                                {form.sets.length > 1 ? (
                                                    <TouchableOpacity onPress={() => removeSet(exIdx, sIdx)}>
                                                        <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                                                    </TouchableOpacity>
                                                ) : (
                                                    <View style={{ width: 18 }} />
                                                )}
                                            </View>
                                        ))}
                                        <TouchableOpacity
                                            style={styles.addSetBtn}
                                            onPress={() => addSet(exIdx)}
                                        >
                                            <Ionicons name="add-circle-outline" size={16} color={theme.colors.primary} />
                                            <Text style={styles.addSetText}>Add Set</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {/* Cardio / Sport → duration + speed */}
                                {timeBased && (
                                    <View style={styles.timeFields}>
                                        <View style={styles.timeField}>
                                            <Text style={styles.timeFieldLabel}>Duration</Text>
                                            <View style={styles.timeInputRow}>
                                                <TextInput
                                                    style={styles.timeInput}
                                                    value={form.duration}
                                                    onChangeText={(v) => updateForm(exIdx, { duration: v })}
                                                    placeholder="30"
                                                    placeholderTextColor={theme.colors.textMuted}
                                                    keyboardType="numeric"
                                                />
                                                <Text style={styles.timeSuffix}>min</Text>
                                            </View>
                                        </View>
                                        {form.category === 'cardio' && (
                                            <View style={styles.timeField}>
                                                <Text style={styles.timeFieldLabel}>Speed (optional)</Text>
                                                <View style={styles.timeInputRow}>
                                                    <TextInput
                                                        style={styles.timeInput}
                                                        value={form.speed}
                                                        onChangeText={(v) => updateForm(exIdx, { speed: v })}
                                                        placeholder="—"
                                                        placeholderTextColor={theme.colors.textMuted}
                                                        keyboardType="decimal-pad"
                                                    />
                                                    <Text style={styles.timeSuffix}>km/h</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        );
                    })}

                    {/* Log button */}
                    <TouchableOpacity style={styles.logBtn} onPress={handleLog} activeOpacity={0.85}>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.logBtnText}>Log Workout</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant,
    },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.3 },
    headerSub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
    scroll: { padding: 20 },
    sectionHint: {
        fontSize: 13, color: theme.colors.textMuted, marginBottom: 20, lineHeight: 18,
    },
    exerciseCard: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md,
        padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: theme.colors.outlineVariant,
    },
    exTitleRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 12,
    },
    exName: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary, flex: 1, marginRight: 8 },
    catBadge: {
        paddingHorizontal: 10, paddingVertical: 3, borderRadius: theme.borderRadius.pill,
    },
    catBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
    sameAsLastBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 8, paddingHorizontal: 12,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderWidth: 1, borderColor: theme.colors.outlineVariant,
        marginBottom: 14, alignSelf: 'flex-start',
    },
    sameAsLastBtnActive: {
        backgroundColor: theme.colors.primaryContainer,
        borderColor: theme.colors.primary,
    },
    checkbox: {
        width: 18, height: 18, borderRadius: 4,
        borderWidth: 2, borderColor: theme.colors.textMuted,
        alignItems: 'center', justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: theme.colors.primary, borderColor: theme.colors.primary,
    },
    sameAsLastText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
    sameAsLastTextActive: { color: theme.colors.primary },
    noLastDataText: {
        fontSize: 11, color: theme.colors.textMuted, fontStyle: 'italic',
        marginBottom: 10, marginTop: -6,
    },
    setsHeaderRow: {
        flexDirection: 'row', alignItems: 'center',
        marginBottom: 4, gap: 8,
    },
    colLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.textMuted, width: 22, textTransform: 'uppercase', letterSpacing: 0.3 },
    colLabelField: { flex: 1, textAlign: 'center' },
    setRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
    },
    setNum: {
        width: 22, fontSize: 13, fontWeight: '700',
        color: theme.colors.textMuted, textAlign: 'center',
    },
    setInput: {
        flex: 1, backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm, borderWidth: 1,
        borderColor: theme.colors.outlineVariant, paddingHorizontal: 10,
        paddingVertical: 10, fontSize: 15, fontWeight: '600',
        color: theme.colors.textPrimary, textAlign: 'center',
    },
    weightInput: { flex: 1 },
    addSetBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingVertical: 6, paddingHorizontal: 10, alignSelf: 'flex-start', marginTop: 2,
    },
    addSetText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
    timeFields: { flexDirection: 'row', gap: 12 },
    timeField: { flex: 1 },
    timeFieldLabel: {
        fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary,
        marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3,
    },
    timeInputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm, borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
        paddingHorizontal: 12, paddingVertical: 10,
    },
    timeInput: {
        flex: 1, fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary,
    },
    timeSuffix: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '500' },
    logBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
        paddingVertical: 16, marginTop: 8,
    },
    logBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
