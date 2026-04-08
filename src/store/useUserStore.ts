import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, CaloriePlan } from '../types/user';

interface UserState {
    profile: UserProfile | null;
    plan: CaloriePlan | null;
    setProfile: (profile: UserProfile) => void;
    setPlan: (plan: CaloriePlan) => void;
    resetAll: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            profile: null,
            plan: null,
            setProfile: (profile) => set({ profile }),
            setPlan: (plan) => set({ plan }),
            resetAll: () => set({ profile: null, plan: null }),
        }),
        {
            name: 'noma-user-store',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
