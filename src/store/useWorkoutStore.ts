import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutEntry, Exercise } from '../types/workout';
import { generateId } from '../utils/generateId';
import { getToday } from '../utils/dateHelpers';

interface WorkoutState {
    workouts: WorkoutEntry[];
    addWorkout: (entry: WorkoutEntry) => void;
    addExercisesToDate: (date: string, exercises: Exercise[], notes?: string) => void;
    deleteWorkout: (id: string) => void;
    getWorkoutsByDate: (date: string) => WorkoutEntry[];
    getSessionByDate: (date: string) => WorkoutEntry | undefined;
}

export const useWorkoutStore = create<WorkoutState>()(
    persist(
        (set, get) => ({
            workouts: [],
            addWorkout: (entry) =>
                set((state) => ({ workouts: [...state.workouts, entry] })),
            addExercisesToDate: (date, exercises, notes) => {
                const entry: WorkoutEntry = {
                    id: generateId(),
                    date,
                    exercises,
                    notes,
                    logged_at: new Date().toISOString(),
                };
                set((state) => ({ workouts: [...state.workouts, entry] }));
            },
            deleteWorkout: (id) =>
                set((state) => ({ workouts: state.workouts.filter((w) => w.id !== id) })),
            getWorkoutsByDate: (date) => get().workouts.filter((w) => w.date === date),
            getSessionByDate: (date) => {
                const entries = get().workouts.filter((w) => w.date === date);
                if (entries.length === 0) return undefined;
                // Return most recent entry for the date
                return entries[entries.length - 1];
            },
        }),
        {
            name: 'noma-workout-store',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
