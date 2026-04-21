import { Meal } from '../types/food';
import { WorkoutEntry } from '../types/workout';
import { UserProfile, CaloriePlan } from '../types/user';
import { calculateDailyScore } from './dailyRating';
import { format, subDays, parseISO } from 'date-fns';

export interface DayCalorie {
    date: string;
    label: string;
    calories: number;
}

export interface DayWorkout {
    date: string;
    label: string;
    trained: number;
}

export interface DayScore {
    date: string;
    label: string;
    score: number;
}

export interface MacroTotals {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
}

export interface InsightsData {
    dates: string[];
    calorieTrendData: DayCalorie[];
    avgDailyCalories: number;
    macroTotals: MacroTotals;
    bestDay: DayCalorie | null;
    worstDay: DayCalorie | null;
    workoutFrequencyData: DayWorkout[];
    workoutCount: number;
    currentStreak: number;
    bestStreak: number;
    dailyScoreData: DayScore[];
    avgDailyScore: number;
    calorieTrend: 'up' | 'down';
    workoutTrend: 'up' | 'down';
    scoreTrend: 'up' | 'down';
}

interface InsightsInput {
    meals: Meal[];
    workouts: WorkoutEntry[];
    profile: UserProfile;
    plan: CaloriePlan | null;
    days: number;
}

export const aggregateInsights = ({ meals, workouts, profile, plan, days }: InsightsInput): InsightsData => {
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
        dates.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
    }

    const filteredMeals = meals.filter(m => dates.includes(m.date));
    const filteredWorkouts = workouts.filter(w => dates.includes(w.date));

    // Per-day calorie data
    const calorieTrendData: DayCalorie[] = dates.map(date => {
        const dayMeals = filteredMeals.filter(m => m.date === date);
        return {
            date,
            label: format(parseISO(date), days <= 7 ? 'EEE' : 'd'),
            calories: dayMeals.reduce((sum, m) => sum + m.calories, 0),
        };
    });

    const daysWithData = calorieTrendData.filter(d => d.calories > 0);
    const avgDailyCalories = daysWithData.length > 0
        ? daysWithData.reduce((sum, d) => sum + d.calories, 0) / daysWithData.length
        : 0;

    // Macro totals
    const macroTotals: MacroTotals = {
        protein_g: filteredMeals.reduce((sum, m) => sum + (m.protein_g ?? 0), 0),
        carbs_g: filteredMeals.reduce((sum, m) => sum + (m.carbs_g ?? 0), 0),
        fat_g: filteredMeals.reduce((sum, m) => sum + (m.fat_g ?? 0), 0),
    };

    // Best and worst days (closest vs furthest from target)
    const target = plan?.daily_calories ?? 2000;
    const sortedByDistance = [...calorieTrendData]
        .filter(d => d.calories > 0)
        .sort((a, b) => Math.abs(a.calories - target) - Math.abs(b.calories - target));
    const bestDay = sortedByDistance[0] ?? null;
    const worstDay = sortedByDistance[sortedByDistance.length - 1] ?? null;

    // Workout frequency
    const workoutFrequencyData: DayWorkout[] = dates.map(date => ({
        date,
        label: format(parseISO(date), days <= 7 ? 'EEE' : 'd'),
        trained: filteredWorkouts.some(w => w.date === date) ? 1 : 0,
    }));
    const workoutCount = workoutFrequencyData.filter(d => d.trained).length;

    // Streaks
    const { currentStreak, bestStreak } = calculateStreaks(dates, filteredWorkouts);

    // Daily scores
    const dailyScoreData: DayScore[] = dates.map(date => {
        const dayMeals = filteredMeals.filter(m => m.date === date);
        const dayWorkouts = filteredWorkouts.filter(w => w.date === date);
        const scoreResult = calculateDailyScore(dayMeals, dayWorkouts, plan, profile);
        return {
            date,
            label: format(parseISO(date), days <= 7 ? 'EEE' : 'd'),
            score: scoreResult.total,
        };
    });

    const avgDailyScore = dailyScoreData.length > 0
        ? dailyScoreData.reduce((sum, d) => sum + d.score, 0) / dailyScoreData.length
        : 0;

    // Trends: compare first half vs second half
    const half = Math.floor(dates.length / 2);
    const secondLen = dates.length - half;

    const firstHalfCals = calorieTrendData.slice(0, half).reduce((s, d) => s + d.calories, 0) / (half || 1);
    const secondHalfCals = calorieTrendData.slice(half).reduce((s, d) => s + d.calories, 0) / (secondLen || 1);
    const calorieTrend: 'up' | 'down' = secondHalfCals >= firstHalfCals ? 'up' : 'down';

    const firstHalfW = workoutFrequencyData.slice(0, half).filter(d => d.trained).length;
    const secondHalfW = workoutFrequencyData.slice(half).filter(d => d.trained).length;
    const workoutTrend: 'up' | 'down' = secondHalfW >= firstHalfW ? 'up' : 'down';

    const firstHalfScore = dailyScoreData.slice(0, half).reduce((s, d) => s + d.score, 0) / (half || 1);
    const secondHalfScore = dailyScoreData.slice(half).reduce((s, d) => s + d.score, 0) / (secondLen || 1);
    const scoreTrend: 'up' | 'down' = secondHalfScore >= firstHalfScore ? 'up' : 'down';

    return {
        dates,
        calorieTrendData,
        avgDailyCalories,
        macroTotals,
        bestDay,
        worstDay,
        workoutFrequencyData,
        workoutCount,
        currentStreak,
        bestStreak,
        dailyScoreData,
        avgDailyScore,
        calorieTrend,
        workoutTrend,
        scoreTrend,
    };
};

const calculateStreaks = (dates: string[], workouts: WorkoutEntry[]) => {
    const trainedDates = new Set(workouts.map(w => w.date));

    let currentStreak = 0;
    for (let i = dates.length - 1; i >= 0; i--) {
        if (trainedDates.has(dates[i])) currentStreak++;
        else break;
    }

    let bestStreak = 0;
    let run = 0;
    for (const date of dates) {
        if (trainedDates.has(date)) { run++; bestStreak = Math.max(bestStreak, run); }
        else run = 0;
    }

    return { currentStreak, bestStreak };
};
