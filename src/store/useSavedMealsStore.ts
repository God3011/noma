import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedMeal } from '../types/savedMeal';

interface SavedMealsState {
    savedMeals: SavedMeal[];
    addSavedMeal: (meal: SavedMeal) => void;
    deleteSavedMeal: (id: string) => void;
    updateSavedMeal: (id: string, meal: Partial<SavedMeal>) => void;
}

export const useSavedMealsStore = create<SavedMealsState>()(
    persist(
        (set) => ({
            savedMeals: [],
            addSavedMeal: (meal) =>
                set((state) => ({ savedMeals: [meal, ...state.savedMeals] })),
            deleteSavedMeal: (id) =>
                set((state) => ({ savedMeals: state.savedMeals.filter((m) => m.id !== id) })),
            updateSavedMeal: (id, updates) =>
                set((state) => ({
                    savedMeals: state.savedMeals.map((m) => (m.id === id ? { ...m, ...updates } : m)),
                })),
        }),
        {
            name: 'noma-saved-meals-store',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
