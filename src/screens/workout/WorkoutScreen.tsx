import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/types';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { WorkoutItem } from '../../components/workout/WorkoutItem';
import { getToday, getNextDay, getPrevDay, formatDate } from '../../utils/dateHelpers';
import { theme } from '../../constants/theme';

type Nav = StackNavigationProp<RootStackParamList>;

export function WorkoutScreen() {
    const navigation = useNavigation<Nav>();
    const [selectedDate, setSelectedDate] = useState(getToday());
    const workouts = useWorkoutStore((s) => s.workouts);
    const deleteWorkout = useWorkoutStore((s) => s.deleteWorkout);

    const dayWorkouts = useMemo(
        () => workouts.filter((w) => w.date === selectedDate),
        [workouts, selectedDate]
    );

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

                {/* Workout List */}
                {dayWorkouts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="fitness-outline" size={48} color={theme.colors.surfaceContainerHigh} />
                        <Text style={styles.emptyTitle}>No workouts yet</Text>
                        <Text style={styles.emptyText}>Tap + to log your first workout of the day</Text>
                    </View>
                ) : (
                    dayWorkouts.map((w) => (
                        <WorkoutItem key={w.id} workout={w} onDelete={deleteWorkout} />
                    ))
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
    emptyState: {
        alignItems: 'center', paddingVertical: 48, gap: 8,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textSecondary },
    emptyText: { fontSize: 14, color: theme.colors.textMuted },
    fab: { position: 'absolute', bottom: 100, right: 20, zIndex: 10 },
    fabGradient: {
        width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
        shadowColor: '#006c49', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    },
});
