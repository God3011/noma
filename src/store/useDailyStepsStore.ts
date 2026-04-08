import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DailyStepsState {
    steps: Record<string, number>; // { 'YYYY-MM-DD': steps }
    setSteps: (date: string, count: number) => void;
    getSteps: (date: string) => number;
}

export const useDailyStepsStore = create<DailyStepsState>()(
    persist(
        (set, get) => ({
            steps: {},
            setSteps: (date, count) =>
                set((state) => ({ steps: { ...state.steps, [date]: count } })),
            getSteps: (date) => get().steps[date] ?? 0,
        }),
        {
            name: 'noma-daily-steps-store',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
