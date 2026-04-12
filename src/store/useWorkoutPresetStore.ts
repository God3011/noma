import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutPreset, WorkoutSet } from '../types/workout';

interface WorkoutPresetState {
    presets: WorkoutPreset[];
    // lastWeights[presetId][exerciseName] = sets with weights from last session
    lastWeights: Record<string, Record<string, WorkoutSet[]>>;
    addPreset: (preset: WorkoutPreset) => void;
    deletePreset: (id: string) => void;
    saveLastWeights: (presetId: string, exerciseName: string, sets: WorkoutSet[]) => void;
    getLastWeights: (presetId: string, exerciseName: string) => WorkoutSet[] | undefined;
}

export const useWorkoutPresetStore = create<WorkoutPresetState>()(
    persist(
        (set, get) => ({
            presets: [],
            lastWeights: {},
            addPreset: (preset) =>
                set((s) => ({ presets: [...s.presets, preset] })),
            deletePreset: (id) =>
                set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),
            saveLastWeights: (presetId, exerciseName, sets) =>
                set((s) => ({
                    lastWeights: {
                        ...s.lastWeights,
                        [presetId]: {
                            ...s.lastWeights[presetId],
                            [exerciseName]: sets,
                        },
                    },
                })),
            getLastWeights: (presetId, exerciseName) =>
                get().lastWeights[presetId]?.[exerciseName],
        }),
        {
            name: 'noma-workout-preset-store',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
