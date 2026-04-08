import { useFoodLogStore } from './useFoodLogStore';
import { useWorkoutStore } from './useWorkoutStore';
import { useUserStore } from './useUserStore';
import { calculateDailyScore, DailyScore } from '../utils/dailyRating';

export function getDailyScore(date: string): DailyScore {
    const meals = useFoodLogStore.getState().getMealsByDate(date);
    const workouts = useWorkoutStore.getState().getWorkoutsByDate(date);
    const plan = useUserStore.getState().plan;
    const profile = useUserStore.getState().profile;
    return calculateDailyScore(meals, workouts, plan, profile);
}
