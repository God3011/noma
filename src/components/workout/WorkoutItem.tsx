import React, { useState } from 'react';
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
    const [expanded, setExpanded] = useState(false);
    const catColor = getCategoryColor(exercise.category);
    const isTimeBased = exercise.category === 'cardio' || exercise.category === 'sport';

    return (
        <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.85}>
            <View style={styles.container}>
                <View style={[styles.categoryBar, { backgroundColor: catColor }]} />
                <View style={styles.content}>
                    <View style={styles.titleRow}>
                        <View style={styles.titleLeft}>
                            <Text style={styles.title} numberOfLines={1}>{exercise.name}</Text>
                            <View style={[styles.badge, { backgroundColor: catColor + '18' }]}>
                                <Text style={[styles.badgeText, { color: catColor }]}>{exercise.category}</Text>
                            </View>
                        </View>
                        <View style={styles.rightCol}>
                            <TouchableOpacity
                                onPress={onDelete}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={styles.deleteBtn}
                            >
                                <Ionicons name="trash-outline" size={15} color={theme.colors.error} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {expanded && (
                        <View style={styles.metaSection}>
                            {isTimeBased ? (
                                <View style={styles.metaRow}>
                                    {(exercise.duration_minutes ?? 0) > 0 && (
                                        <View style={styles.metaPill}>
                                            <Ionicons name="time-outline" size={12} color={theme.colors.primary} />
                                            <Text style={styles.metaText}>{exercise.duration_minutes} min</Text>
                                        </View>
                                    )}
                                    {exercise.speed_kmh && (
                                        <View style={styles.metaPill}>
                                            <Ionicons name="speedometer-outline" size={12} color={theme.colors.primary} />
                                            <Text style={styles.metaText}>{exercise.speed_kmh} km/h</Text>
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.setsTable}>
                                    {exercise.sets.map((set, i) => (
                                        <View key={i} style={styles.setRow}>
                                            <Text style={styles.setNum}>Set {i + 1}</Text>
                                            <Text style={styles.setVal}>{set.reps} reps</Text>
                                            {set.weight_kg ? <Text style={styles.setVal}>{set.weight_kg} kg</Text> : null}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
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
    content: { flex: 1, padding: 12 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    titleLeft: { flex: 1, marginRight: 8, gap: 5 },
    title: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
    badge: {
        alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2,
        borderRadius: theme.borderRadius.pill,
    },
    badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    rightCol: { alignItems: 'center' },
    deleteBtn: { padding: 2 },
    metaSection: { marginTop: 10 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    metaPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.borderRadius.pill, paddingHorizontal: 8, paddingVertical: 3,
    },
    metaText: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '500' },
    setsTable: { gap: 4 },
    setRow: {
        flexDirection: 'row', gap: 16,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.borderRadius.sm, paddingHorizontal: 10, paddingVertical: 6,
    },
    setNum: { fontSize: 11, fontWeight: '700', color: theme.colors.textMuted, width: 44 },
    setVal: { fontSize: 11, fontWeight: '600', color: theme.colors.textPrimary },
});
