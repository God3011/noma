import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '../../types/workout';
import { getCategoryColor } from '../../constants/workoutTypes';
import { theme } from '../../constants/theme';

interface WorkoutItemProps {
    exercise: Exercise;
    onDelete: () => void;
}

export function WorkoutItem({ exercise, onDelete }: WorkoutItemProps) {
    const catColor = getCategoryColor(exercise.category);
    const isTimeBased = exercise.category === 'cardio' || exercise.category === 'sport';

    return (
        <View style={styles.container}>
            <View style={[styles.categoryBar, { backgroundColor: catColor }]} />
            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>{exercise.name}</Text>
                    <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={16} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.badge, { backgroundColor: catColor + '18' }]}>
                    <Text style={[styles.badgeText, { color: catColor }]}>
                        {exercise.category}
                    </Text>
                </View>

                <View style={styles.metaRow}>
                    {isTimeBased ? (
                        <>
                            {(exercise.duration_minutes ?? 0) > 0 && (
                                <View style={styles.metaItem}>
                                    <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
                                    <Text style={styles.metaText}>{exercise.duration_minutes} min</Text>
                                </View>
                            )}
                            {exercise.speed_kmh && (
                                <View style={styles.metaItem}>
                                    <Ionicons name="speedometer-outline" size={14} color={theme.colors.textMuted} />
                                    <Text style={styles.metaText}>{exercise.speed_kmh} km/h</Text>
                                </View>
                            )}
                        </>
                    ) : (
                        <>
                            {exercise.sets.length > 0 && (
                                <View style={styles.metaItem}>
                                    <Ionicons name="layers-outline" size={14} color={theme.colors.textMuted} />
                                    <Text style={styles.metaText}>{exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}</Text>
                                </View>
                            )}
                            {exercise.sets.some((s) => s.weight_kg) && (
                                <View style={styles.metaItem}>
                                    <Ionicons name="barbell-outline" size={14} color={theme.colors.textMuted} />
                                    <Text style={styles.metaText}>
                                        {exercise.sets.map((s) => s.weight_kg ? `${s.weight_kg}kg` : '—').join(' · ')}
                                    </Text>
                                </View>
                            )}
                            {exercise.sets.length > 0 && (
                                <Text style={styles.repsText}>
                                    {exercise.sets.map((s) => s.reps).join(' / ')} reps
                                </Text>
                            )}
                        </>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.sm,
        marginBottom: 8,
        overflow: 'hidden',
    },
    categoryBar: { width: 4 },
    content: { flex: 1, padding: 14 },
    titleRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 6,
    },
    title: {
        fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary,
        flex: 1, marginRight: 8,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: theme.borderRadius.pill, marginBottom: 8,
    },
    badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '500' },
    repsText: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '500' },
});
