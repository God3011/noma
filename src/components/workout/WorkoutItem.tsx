import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutEntry } from '../../types/workout';
import { getCategoryColor } from '../../constants/workoutTypes';
import { theme } from '../../constants/theme';

interface WorkoutItemProps {
    workout: WorkoutEntry;
    onDelete: (id: string) => void;
}

export function WorkoutItem({ workout, onDelete }: WorkoutItemProps) {
    // Support both new multi-exercise and legacy single-exercise format
    const exercises = workout.exercises ?? [{
        name: workout.workout_type || 'Workout',
        category: workout.category || 'other',
        sets: workout.sets || [],
        duration_minutes: workout.duration_minutes,
    }];

    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const totalDuration = exercises.reduce((sum, ex) => sum + (ex.duration_minutes || 0), 0);

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>
                        {exercises.map((e) => e.name).join(' + ')}
                    </Text>
                    <TouchableOpacity onPress={() => onDelete(workout.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={16} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                </View>

                <View style={styles.badgeRow}>
                    {exercises.map((ex, i) => (
                        <View key={i} style={[styles.badge, { backgroundColor: getCategoryColor(ex.category) + '18' }]}>
                            <Text style={[styles.badgeText, { color: getCategoryColor(ex.category) }]}>
                                {ex.category}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.metaRow}>
                    {totalSets > 0 && (
                        <View style={styles.metaItem}>
                            <Ionicons name="layers-outline" size={14} color={theme.colors.textMuted} />
                            <Text style={styles.metaText}>{totalSets} sets</Text>
                        </View>
                    )}
                    {totalDuration > 0 && (
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
                            <Text style={styles.metaText}>{totalDuration} min</Text>
                        </View>
                    )}
                    {exercises.some((e) => e.speed_kmh) && (
                        <View style={styles.metaItem}>
                            <Ionicons name="speedometer-outline" size={14} color={theme.colors.textMuted} />
                            <Text style={styles.metaText}>
                                {exercises.find((e) => e.speed_kmh)?.speed_kmh} km/h
                            </Text>
                        </View>
                    )}
                    <Text style={styles.exerciseCount}>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.sm,
        padding: 14,
        marginBottom: 8,
    },
    content: { flex: 1 },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.textPrimary,
        flex: 1,
        marginRight: 8,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginBottom: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: theme.borderRadius.pill,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontWeight: '500',
    },
    exerciseCount: {
        fontSize: 11,
        color: theme.colors.textMuted,
        fontWeight: '600',
        marginLeft: 'auto',
    },
});
