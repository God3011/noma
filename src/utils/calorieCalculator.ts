import { UserProfile } from '../types/user';

export function calculateBMR(profile: UserProfile): number {
    const { weight_kg, height_cm, age, sex } = profile;
    if (sex === 'male') {
        return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5;
    }
    return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161;
}

export function getActivityMultiplier(workoutDays: number): number {
    if (workoutDays === 0) return 1.2;
    if (workoutDays <= 2) return 1.375;
    if (workoutDays <= 4) return 1.55;
    if (workoutDays <= 6) return 1.725;
    return 1.9;
}

export function calculateTDEE(profile: UserProfile): number {
    const bmr = calculateBMR(profile);
    const multiplier = getActivityMultiplier(profile.workout_days_per_week);
    const stepBonus = profile.steps_per_day * 0.04;
    return Math.round(bmr * multiplier + stepBonus);
}

export interface CalorieTier {
    tier: 'aggressive' | 'moderate' | 'easy';
    label: string;
    dailyCalories: number;
    dailyDeficit: number;
    weeklyLossKg: number;
    weeksToGoal: number;
    timeLabel: string;
}

export function calculateCalorieTiers(
    tdee: number,
    weightToLoseKg: number
): CalorieTier[] {
    const tiers: { tier: 'aggressive' | 'moderate' | 'easy'; label: string; deficit: number }[] = [
        { tier: 'aggressive', label: 'Aggressive', deficit: 750 },
        { tier: 'moderate', label: 'Moderate', deficit: 500 },
        { tier: 'easy', label: 'Easy', deficit: 250 },
    ];

    return tiers.map(({ tier, label, deficit }) => {
        const dailyCalories = Math.max(1200, Math.round(tdee - deficit));
        const weeklyDeficitKcal = deficit * 7;
        const weeklyLossKg = weeklyDeficitKcal / 7700;
        const weeksToGoal = weightToLoseKg > 0
            ? Math.ceil(weightToLoseKg / weeklyLossKg)
            : 0;

        let timeLabel: string;
        if (weeksToGoal <= 0) {
            timeLabel = "You're at your goal!";
        } else if (weeksToGoal >= 8) {
            const months = Math.floor(weeksToGoal / 4);
            const remainWeeks = weeksToGoal % 4;
            timeLabel = remainWeeks > 0
                ? `~${months} months ${remainWeeks} weeks`
                : `~${months} months`;
        } else {
            timeLabel = `~${weeksToGoal} weeks`;
        }

        return {
            tier,
            label,
            dailyCalories,
            dailyDeficit: deficit,
            weeklyLossKg: Math.round(weeklyLossKg * 100) / 100,
            weeksToGoal,
            timeLabel,
        };
    });
}
