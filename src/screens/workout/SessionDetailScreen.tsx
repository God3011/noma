import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { getCategoryColor } from '../../constants/workoutTypes';
import { formatDate } from '../../utils/dateHelpers';
import { theme } from '../../constants/theme';
import { Exercise, WorkoutSet } from '../../types/workout';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'SessionDetail'>;

function SetRow({ set, index }: { set: WorkoutSet; index: number }) {
    return (
        <View style={styles.setRow}>
            <View style={styles.setNumBadge}>
                <Text style={styles.setNumText}>{index + 1}</Text>
            </View>
            <Text style={styles.setDetail}>
                {set.reps} reps
                {set.weight_kg ? ` × ${set.weight_kg} kg` : ' (bodyweight)'}
            </Text>
            {set.weight_kg && set.reps ? (
                <Text style={styles.setVolume}>
                    {Math.round(set.reps * set.weight_kg)} vol
                </Text>
            ) : null}
        </View>
    );
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
    const color = getCategoryColor(exercise.category);
    const totalSets = exercise.sets.length;
    const totalVolume = exercise.sets.reduce(
        (sum, s) => sum + s.reps * (s.weight_kg ?? 0),
        0
    );

    return (
        <View style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <View style={[styles.catBadge, { backgroundColor: color + '22' }]}>
                        <Text style={[styles.catBadgeText, { color }]}>{exercise.category}</Text>
                    </View>
                </View>
                <View style={styles.exerciseMeta}>
                    {totalSets > 0 && (
                        <Text style={styles.metaText}>{totalSets} sets</Text>
                    )}
                    {exercise.duration_minutes ? (
                        <Text style={styles.metaText}>{exercise.duration_minutes} min</Text>
                    ) : null}
                    {totalVolume > 0 && (
                        <Text style={[styles.metaText, { color: theme.colors.primary }]}>
                            {totalVolume.toLocaleString()} vol
                        </Text>
                    )}
                </View>
            </View>

            {exercise.sets.length > 0 && (
                <View style={styles.setsList}>
                    {exercise.sets.map((set, i) => (
                        <SetRow key={i} set={set} index={i} />
                    ))}
                </View>
            )}

            {exercise.speed_kmh ? (
                <View style={styles.speedRow}>
                    <Ionicons name="speedometer-outline" size={13} color={theme.colors.textMuted} />
                    <Text style={styles.speedText}>{exercise.speed_kmh} km/h</Text>
                </View>
            ) : null}
        </View>
    );
}

export function SessionDetailScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<RouteProps>();
    const { date } = route.params;

    const getSessionByDate = useWorkoutStore((s) => s.getSessionByDate);
    const session = getSessionByDate(date);

    const exercises = session?.exercises ?? [];
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const totalVolume = exercises.reduce(
        (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps * (set.weight_kg ?? 0), 0),
        0
    );
    const totalDuration = exercises.reduce((sum, ex) => sum + (ex.duration_minutes ?? 0), 0);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerDate}>{formatDate(date)}</Text>
                    <Text style={styles.headerSub}>
                        {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('ActiveWorkout', { date })}
                >
                    <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
            </View>

            {/* Summary strip */}
            <View style={styles.summaryStrip}>
                {totalSets > 0 && (
                    <View style={styles.summaryItem}>
                        <Ionicons name="layers-outline" size={16} color={theme.colors.primary} />
                        <Text style={styles.summaryVal}>{totalSets}</Text>
                        <Text style={styles.summaryLabel}>sets</Text>
                    </View>
                )}
                {totalVolume > 0 && (
                    <View style={styles.summaryItem}>
                        <Ionicons name="barbell-outline" size={16} color={theme.colors.tertiary} />
                        <Text style={styles.summaryVal}>{totalVolume.toLocaleString()}</Text>
                        <Text style={styles.summaryLabel}>vol</Text>
                    </View>
                )}
                {totalDuration > 0 && (
                    <View style={styles.summaryItem}>
                        <Ionicons name="time-outline" size={16} color={theme.colors.secondary} />
                        <Text style={styles.summaryVal}>{totalDuration}</Text>
                        <Text style={styles.summaryLabel}>min</Text>
                    </View>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {exercises.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="fitness-outline" size={48} color={theme.colors.surfaceContainerHigh} />
                        <Text style={styles.emptyText}>No exercises logged for this session</Text>
                    </View>
                ) : (
                    exercises.map((ex, i) => (
                        <ExerciseCard key={i} exercise={ex} />
                    ))
                )}

                {session?.notes ? (
                    <View style={styles.notesCard}>
                        <Text style={styles.notesLabel}>Session Notes</Text>
                        <Text style={styles.notesText}>{session.notes}</Text>
                    </View>
                ) : null}

                <View style={{ height: 60 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outlineVariant,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surfaceContainerLow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerDate: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
    headerSub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.pill,
        backgroundColor: theme.colors.primaryContainer,
    },
    editText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
    summaryStrip: {
        flexDirection: 'row',
        gap: 0,
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outlineVariant,
    },
    summaryItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
    },
    summaryVal: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
    summaryLabel: { fontSize: 11, color: theme.colors.textMuted, fontWeight: '500' },
    scroll: { padding: 20 },
    exerciseCard: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
    },
    exerciseHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    exerciseName: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 6 },
    catBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: theme.borderRadius.pill,
    },
    catBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    exerciseMeta: { alignItems: 'flex-end', gap: 3 },
    metaText: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '600' },
    setsList: {
        gap: 6,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outlineVariant,
        paddingTop: 10,
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    setNumBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: theme.colors.surfaceContainerLow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    setNumText: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted },
    setDetail: { flex: 1, fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
    setVolume: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '600' },
    speedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outlineVariant,
        paddingTop: 8,
    },
    speedText: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '500' },
    notesCard: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
        marginTop: 4,
    },
    notesLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.textMuted,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    notesText: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20 },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: { fontSize: 14, color: theme.colors.textMuted, fontWeight: '500' },
});
