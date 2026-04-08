import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutEntry } from '../types/workout';

interface WorkoutState {
    workouts: WorkoutEntry[];
    addWorkout: (entry: WorkoutEntry) => void;
    deleteWorkout: (id: string) => void;
    getWorkoutsByDate: (date: string) => WorkoutEntry[];
}

export const useWorkoutStore = create<WorkoutState>()(
    persist(
        (set, get) => ({
            workouts: [],
            addWorkout: (entry) =>
                set((state) => ({ workouts: [...state.workouts, entry] })),
            deleteWorkout: (id) =>
                set((state) => ({ workouts: state.workouts.filter((w) => w.id !== id) })),
            getWorkoutsByDate: (date) => get().workouts.filter((w) => w.date === date),
        }),
        {
            name: 'noma-workout-store',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
