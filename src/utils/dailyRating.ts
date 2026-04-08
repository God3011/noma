import { Meal } from '../types/food';
import { WorkoutEntry } from '../types/workout';
import { CaloriePlan, UserProfile } from '../types/user';

export interface DailyScore {
    total: number;
    foodScore: number;
    workoutScore: number;
    stepsScore: number;
    label: string;
    color: string;
}

export function calculateDailyScore(
    meals: Meal[],
    workouts: WorkoutEntry[],
    plan: CaloriePlan | null,
    profile: UserProfile | null,
): DailyScore {
    // Food score (40 pts max)
    let foodScore = 0;
    if (plan && plan.daily_calories > 0) {
        const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
        const ratio = totalCalories / plan.daily_calories;
        if (ratio <= 1) {
            foodScore = Math.round(ratio * 40);
        } else {
            // Penalize over-eating: lose points proportionally
            const overRatio = ratio - 1;
            foodScore = Math.max(0, Math.round(40 - overRatio * 40));
        }
    }

    // Workout score (35 pts max)
    const workoutScore = workouts.length > 0 ? 35 : 0;

    // Steps score (25 pts max)
    let stepsScore = 0;
    if (profile && profile.steps_per_day > 0) {
        stepsScore = Math.min(25, Math.round((profile.steps_per_day / 10000) * 25));
    }

    const total = Math.min(100, foodScore + workoutScore + stepsScore);

    let label: string;
    let color: string;
    if (total >= 86) {
        label = 'Crushing It';
        color = '#10b981';
    } else if (total >= 61) {
        label = 'On Track';
        color = '#006c49';
    } else if (total >= 31) {
        label = 'Getting There';
        color = '#f5a623';
    } else {
        label = 'Needs Attention';
        color = '#FF4D6D';
    }

    return { total, foodScore, workoutScore, stepsScore, label, color };
}
