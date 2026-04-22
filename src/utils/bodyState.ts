import { Meal } from '../types/food';
import { WorkoutEntry } from '../types/workout';
import { BodyType, BodyGoal } from '../types/user';

export interface BodyState {
    fatLevel: number;    // 0–1  (0 = very lean, 1 = very overweight)
    muscleLevel: number; // 0–1  (0 = no muscle, 1 = very muscular)
}

// Baseline fat/muscle from body type set at onboarding
const BODY_TYPE_BASE: Record<BodyType, { fat: number; muscle: number }> = {
    slim:        { fat: 0.05, muscle: 0.10 },
    normal:      { fat: 0.25, muscle: 0.20 },
    overweight:  { fat: 0.65, muscle: 0.15 },
};

// Goal fat/muscle targets — where the user wants to be
const BODY_GOAL_TARGET: Record<BodyGoal, { fat: number; muscle: number }> = {
    lean:        { fat: 0.08, muscle: 0.30 },
    athletic:    { fat: 0.15, muscle: 0.65 },
    bulk:        { fat: 0.30, muscle: 0.80 },
};

const DAYS_WINDOW = 14;

function getDateStr(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
}

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

export function computeBodyState(
    meals: Meal[],
    workouts: WorkoutEntry[],
    dailyCalorieTarget: number,
    bodyWeightKg: number,
    bodyType: BodyType = 'normal',
    bodyGoal: BodyGoal = 'athletic',
): BodyState {
    const base = BODY_TYPE_BASE[bodyType];
    const goal = BODY_GOAL_TARGET[bodyGoal];

    let totalSurplus = 0;
    let totalProtein = 0;
    let workoutDays = 0;
    let activeDays = 0;

    for (let i = 0; i < DAYS_WINDOW; i++) {
        const date = getDateStr(i);
        const dayMeals = meals.filter(m => m.date === date);
        const dayWorkouts = workouts.filter(w => w.date === date);
        if (dayMeals.length === 0 && dayWorkouts.length === 0) continue;
        activeDays++;

        const dayCalories = dayMeals.reduce((s, m) => s + m.calories, 0);
        const dayProtein = dayMeals.reduce((s, m) => s + m.protein_g, 0);
        totalSurplus += dayCalories - dailyCalorieTarget;
        totalProtein += dayProtein;
        if (dayWorkouts.length > 0) workoutDays++;
    }

    if (activeDays === 0) {
        // No data yet — show user's starting body type
        return { fatLevel: base.fat, muscleLevel: base.muscle };
    }

    const avgSurplus = totalSurplus / activeDays;
    const avgProtein = totalProtein / activeDays;
    const workoutFreq = workoutDays / DAYS_WINDOW; // 0–1

    // Protein adequacy vs recommended 1.6g/kg
    const proteinAdequacy = clamp(avgProtein / (bodyWeightKg * 1.6), 0, 1);

    // --- Fat delta from baseline ---
    // +500 kcal surplus daily → gaining fat, workouts partially offset it
    const surplusAdjusted = avgSurplus * (1 - workoutFreq * 0.4);
    // Map -500..+500 → -0.2..+0.2 change from baseline
    const fatDelta = (surplusAdjusted / 500) * 0.20;
    const fatLevel = clamp(base.fat + fatDelta, 0, 1);

    // --- Muscle delta from baseline ---
    // Workouts + protein → progress toward goal muscle level
    const muscleProgress = workoutFreq * proteinAdequacy;
    // Move from base toward goal muscle over time
    const muscleRange = goal.muscle - base.muscle;
    const muscleDelta = muscleRange * muscleProgress * (1 - fatLevel * 0.25);
    const muscleLevel = clamp(base.muscle + muscleDelta, 0, 1);

    return { fatLevel, muscleLevel };
}
