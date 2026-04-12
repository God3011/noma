import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/types';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useWorkoutPresetStore } from '../../store/useWorkoutPresetStore';
import { WorkoutItem } from '../../components/workout/WorkoutItem';
import { PresetWeightModal } from './PresetWeightModal';
import { WorkoutPreset } from '../../types/workout';
import { getCategoryColor } from '../../constants/workoutTypes';
import { getToday, getNextDay, getPrevDay, formatDate } from '../../utils/dateHelpers';
import { theme } from '../../constants/theme';

type Nav = StackNavigationProp<RootStackParamList>;

export function WorkoutScreen() {
    const navigation = useNavigation<Nav>();
    const [selectedDate, setSelectedDate] = useState(getToday());
    const workouts = useWorkoutStore((s) => s.workouts);
    const deleteWorkout = useWorkoutStore((s) => s.deleteWorkout);
    const presets = useWorkoutPresetStore((s) => s.presets);
    const deletePreset = useWorkoutPresetStore((s) => s.deletePreset);

    const [activePreset, setActivePreset] = useState<WorkoutPreset | null>(null);

    const dayWorkouts = useMemo(
        () => workouts.filter((w) => w.date === selectedDate),
        [workouts, selectedDate]
    );

    const handleDeletePreset = (preset: WorkoutPreset) => {
        Alert.alert(
            'Delete Preset',
            `Delete "${preset.name}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deletePreset(preset.id) },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <Text style={styles.title}>Workouts</Text>
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

                {/* Summary */}
                <View style={styles.summaryCard}>
                    <Ionicons name="barbell" size={24} color={theme.colors.primary} />
                    <Text style={styles.summaryText}>
                        {dayWorkouts.length} workout{dayWorkouts.length !== 1 ? 's' : ''} logged
                    </Text>
                </View>

                {/* ── Preset Sessions ───────────────────────────────────────── */}
                <View style={styles.presetsSection}>
                    <View style={styles.presetsSectionHeader}>
                        <Text style={styles.presetsSectionTitle}>Preset Sessions</Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('AddWorkout', { presetMode: true })}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Text style={styles.newPresetLink}>+ New</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.presetsRow}>
                            {presets.length === 0 && (
                                <TouchableOpacity
                                    style={styles.emptyPresetCard}
                                    onPress={() => navigation.navigate('AddWorkout', { presetMode: true })}
                                    activeOpacity={0.75}
                                >
                                    <Ionicons name="add-circle-outline" size={28} color={theme.colors.primary} />
                                    <Text style={styles.emptyPresetText}>Create your first preset</Text>
                                </TouchableOpacity>
                            )}
                            {presets.map((preset) => {
                                const categories = [...new Set(preset.exercises.map((e) => e.category))];
                                return (
                                    <TouchableOpacity
                                        key={preset.id}
                                        style={styles.presetCard}
                                        onPress={() => setActivePreset(preset)}
                                        onLongPress={() => handleDeletePreset(preset)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.presetCardTop}>
                                            <Text style={styles.presetName} numberOfLines={2}>
                                                {preset.name}
                                            </Text>
                                            <Ionicons name="play-circle" size={22} color={theme.colors.primary} />
                                        </View>
                                        <Text style={styles.presetExCount}>
                                            {preset.exercises.length} exercise{preset.exercises.length !== 1 ? 's' : ''}
                                        </Text>
                                        <View style={styles.presetCatBadges}>
                                            {categories.slice(0, 3).map((cat) => (
                                                <View
                                                    key={cat}
                                                    style={[styles.presetCatDot, { backgroundColor: getCategoryColor(cat) }]}
                                                />
                                            ))}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                            {presets.length > 0 && (
                                <TouchableOpacity
                                    style={styles.addPresetCard}
                                    onPress={() => navigation.navigate('AddWorkout', { presetMode: true })}
                                    activeOpacity={0.75}
                                >
                                    <Ionicons name="add" size={24} color={theme.colors.primary} />
                                    <Text style={styles.addPresetCardText}>New{'\n'}Preset</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>
                </View>

                {/* Workout List — one card per exercise */}
                <Text style={styles.logTitle}>Today's Log</Text>
                {dayWorkouts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="fitness-outline" size={48} color={theme.colors.surfaceContainerHigh} />
                        <Text style={styles.emptyTitle}>No workouts yet</Text>
                        <Text style={styles.emptyText}>Tap + to log a workout or use a preset above</Text>
                    </View>
                ) : (
                    dayWorkouts.flatMap((w) => {
                        const exercises = w.exercises ?? [{
                            name: w.workout_type || 'Workout',
                            category: w.category || 'other' as const,
                            sets: w.sets || [],
                            duration_minutes: w.duration_minutes,
                        }];
                        return exercises.map((ex, exIdx) => (
                            <WorkoutItem
                                key={`${w.id}-${exIdx}`}
                                exercise={ex}
                                onDelete={() => deleteWorkout(w.id)}
                            />
                        ));
                    })
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddWorkout')}
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

            {/* Preset weight selection modal */}
            <PresetWeightModal
                preset={activePreset}
                onClose={() => setActivePreset(null)}
                onLogged={() => setActivePreset(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { paddingHorizontal: 20, paddingTop: 60 },
    headerRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
    },
    title: { fontSize: 26, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.5 },
    brandTag: { fontSize: 20, fontWeight: '900', color: theme.colors.primary, letterSpacing: -0.5 },
    datePicker: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 24, marginBottom: 20, paddingVertical: 8,
        backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: theme.borderRadius.pill,
    },
    dateText: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary },
    summaryCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: theme.colors.primaryContainer, borderRadius: theme.borderRadius.sm,
        padding: 16, marginBottom: 20,
    },
    summaryText: { fontSize: 15, fontWeight: '600', color: theme.colors.onPrimaryContainer },
    // Presets section
    presetsSection: { marginBottom: 24 },
    presetsSectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
    },
    presetsSectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
    newPresetLink: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
    presetsRow: { flexDirection: 'row', gap: 10, paddingRight: 20 },
    emptyPresetCard: {
        width: 200, padding: 20, borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderWidth: 1.5, borderColor: theme.colors.primary,
        borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    emptyPresetText: {
        fontSize: 13, fontWeight: '600', color: theme.colors.primary, textAlign: 'center',
    },
    presetCard: {
        width: 150, padding: 14, borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderWidth: 1, borderColor: theme.colors.outlineVariant,
        justifyContent: 'space-between', minHeight: 100,
    },
    presetCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    presetName: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, flex: 1, marginRight: 6 },
    presetExCount: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '500', marginBottom: 8 },
    presetCatBadges: { flexDirection: 'row', gap: 4 },
    presetCatDot: { width: 8, height: 8, borderRadius: 4 },
    addPresetCard: {
        width: 80, borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderWidth: 1.5, borderColor: theme.colors.primary,
        borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4,
        minHeight: 100,
    },
    addPresetCardText: {
        fontSize: 11, fontWeight: '600', color: theme.colors.primary, textAlign: 'center',
    },
    logTitle: {
        fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 12,
    },
    emptyState: {
        alignItems: 'center', paddingVertical: 48, gap: 8,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textSecondary },
    emptyText: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center' },
    fab: { position: 'absolute', bottom: 100, right: 20, zIndex: 10 },
    fabGradient: {
        width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
        shadowColor: '#006c49', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    },
});
