import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Meal } from '../types/food';

interface FoodLogState {
    meals: Meal[];
    addMeal: (meal: Meal) => void;
    deleteMeal: (id: string) => void;
    getMealsByDate: (date: string) => Meal[];
}

export const useFoodLogStore = create<FoodLogState>()(
    persist(
        (set, get) => ({
            meals: [],
            addMeal: (meal) => set((state) => ({ meals: [...state.meals, meal] })),
            deleteMeal: (id) =>
                set((state) => ({ meals: state.meals.filter((m) => m.id !== id) })),
            getMealsByDate: (date) => get().meals.filter((m) => m.date === date),
        }),
        {
            name: 'noma-foodlog-store',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
