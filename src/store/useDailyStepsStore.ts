import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DailyStepsState {
    steps: Record<string, number>; // { 'YYYY-MM-DD': steps }
    healthSyncEnabled: boolean;
    setSteps: (date: string, count: number) => void;
    getSteps: (date: string) => number;
    setHealthSyncEnabled: (enabled: boolean) => void;
}

export const useDailyStepsStore = create<DailyStepsState>()(
    persist(
        (set, get) => ({
            steps: {},
            healthSyncEnabled: false,
            setSteps: (date, count) =>
                set((state) => ({ steps: { ...state.steps, [date]: count } })),
            getSteps: (date) => get().steps[date] ?? 0,
            setHealthSyncEnabled: (enabled) => set({ healthSyncEnabled: enabled }),
        }),
        {
            name: 'noma-daily-steps-store',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
