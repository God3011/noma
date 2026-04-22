import { WorkoutEntry, Exercise, WorkoutCategory } from '../types/workout';

// ─── Tiers ───────────────────────────────────────────────────────────────────

export type Tier =
    | 'Untrained'
    | 'Bronze'
    | 'Silver'
    | 'Gold'
    | 'Platinum'
    | 'Diamond'
    | 'Master'
    | 'Legend';

export const TIER_THRESHOLDS: { tier: Tier; xp: number }[] = [
    { tier: 'Untrained', xp: 0 },
    { tier: 'Bronze', xp: 200 },
    { tier: 'Silver', xp: 600 },
    { tier: 'Gold', xp: 1500 },
    { tier: 'Platinum', xp: 3500 },
    { tier: 'Diamond', xp: 6000 },
    { tier: 'Master', xp: 10000 },
    { tier: 'Legend', xp: 15000 },
];

export const TIER_COLORS: Record<Tier, string> = {
    Untrained: '#6b7280',
    Bronze: '#cd7f32',
    Silver: '#94a3b8',
    Gold: '#f59e0b',
    Platinum: '#e5e7eb',
    Diamond: '#67e8f9',
    Master: '#a855f7',
    Legend: '#f97316',
};

export function getTierForXP(xp: number): Tier {
    let current: Tier = 'Untrained';
    for (const { tier, xp: threshold } of TIER_THRESHOLDS) {
        if (xp >= threshold) current = tier;
        else break;
    }
    return current;
}

export function getNextTierThreshold(xp: number): number {
    for (const { xp: threshold } of TIER_THRESHOLDS) {
        if (threshold > xp) return threshold;
    }
    return TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1].xp;
}

export function getCurrentTierThreshold(xp: number): number {
    let current = 0;
    for (const { xp: threshold } of TIER_THRESHOLDS) {
        if (threshold <= xp) current = threshold;
        else break;
    }
    return current;
}

// ─── Muscle Groups ───────────────────────────────────────────────────────────

export type MuscleGroup =
    | 'Chest'
    | 'Back'
    | 'Shoulders'
    | 'Biceps'
    | 'Triceps'
    | 'Quadriceps'
    | 'Hamstrings'
    | 'Glutes'
    | 'Calves'
    | 'Legs'
    | 'Core'
    | 'Cardio';

export const ALL_MUSCLES: MuscleGroup[] = [
    'Chest',
    'Back',
    'Shoulders',
    'Biceps',
    'Triceps',
    'Quadriceps',
    'Hamstrings',
    'Glutes',
    'Calves',
    'Legs',
    'Core',
    'Cardio',
];

export const UPPER_BODY_MUSCLES: MuscleGroup[] = [
    'Chest',
    'Back',
    'Shoulders',
    'Biceps',
    'Triceps',
];

export const LOWER_BODY_MUSCLES: MuscleGroup[] = [
    'Quadriceps',
    'Hamstrings',
    'Glutes',
    'Calves',
    'Legs',
];

export const CORE_MUSCLES: MuscleGroup[] = ['Core'];

// ─── Exercise → Muscle Mapping ────────────────────────────────────────────────

const EXERCISE_MUSCLE_MAP: Record<string, MuscleGroup[]> = {
    'Bench Press': ['Chest', 'Triceps', 'Shoulders'],
    'Squat': ['Quadriceps', 'Glutes', 'Hamstrings'],
    'Deadlift': ['Back', 'Glutes', 'Hamstrings'],
    'Pull-ups': ['Back', 'Biceps'],
    'Push-ups': ['Chest', 'Triceps', 'Shoulders'],
    'Shoulder Press': ['Shoulders', 'Triceps'],
    'Rows': ['Back', 'Biceps'],
    'Bicep Curl': ['Biceps'],
    'Tricep Extension': ['Triceps'],
    'Leg Press': ['Quadriceps', 'Glutes'],
    'Lunges': ['Quadriceps', 'Glutes', 'Hamstrings'],
    'Running': ['Cardio', 'Legs'],
    'Cycling': ['Cardio', 'Quadriceps'],
    'Swimming': ['Cardio', 'Back', 'Shoulders'],
    'Jump Rope': ['Cardio', 'Calves'],
    'Rowing': ['Back', 'Shoulders', 'Biceps'],
    'HIIT': ['Cardio', 'Core'],
    'Plank': ['Core', 'Shoulders'],
};

export function getMusclesForExercise(name: string, category: WorkoutCategory): MuscleGroup[] {
    const key = Object.keys(EXERCISE_MUSCLE_MAP).find(
        (k) => k.toLowerCase() === name.toLowerCase()
    );
    if (key) return EXERCISE_MUSCLE_MAP[key];

    // Fallbacks for unrecognized
    switch (category) {
        case 'strength': return ['Back'];
        case 'cardio': return ['Cardio'];
        case 'flexibility': return ['Core'];
        case 'sport': return ['Cardio', 'Legs'];
        default: return ['Core'];
    }
}

// ─── XP Calculation ──────────────────────────────────────────────────────────

export function calcExerciseXP(exercise: Exercise): number {
    let xp = 0;
    if (exercise.duration_minutes && exercise.sets.length === 0) {
        // cardio-style
        xp += exercise.duration_minutes * 3;
    }
    for (const set of exercise.sets) {
        const weight = set.weight_kg ?? 5; // bodyweight_equiv = 5
        xp += set.reps * weight * 0.1;
    }
    // also count duration XP if present alongside sets (e.g. flexibility)
    if (exercise.duration_minutes && exercise.sets.length > 0) {
        xp += exercise.duration_minutes * 3;
    }
    return xp;
}

// ─── Aggregate XP per Muscle ─────────────────────────────────────────────────

export interface MuscleStats {
    muscle: MuscleGroup;
    xp: number;
    tier: Tier;
    totalVolume: number; // kg lifted (strength) or minutes (cardio/flexibility)
    volumeUnit: 'kg' | 'min';
}

export function computeMuscleStats(workouts: WorkoutEntry[]): Record<MuscleGroup, MuscleStats> {
    const xpMap: Record<string, number> = {};
    const volMap: Record<string, number> = {};
    const unitMap: Record<string, 'kg' | 'min'> = {};

    for (const muscle of ALL_MUSCLES) {
        xpMap[muscle] = 0;
        volMap[muscle] = 0;
        unitMap[muscle] = muscle === 'Cardio' ? 'min' : 'kg';
    }

    for (const entry of workouts) {
        for (const ex of entry.exercises) {
            const muscles = getMusclesForExercise(ex.name, ex.category);
            const xpPerMuscle = calcExerciseXP(ex) / muscles.length;

            // Volume: for cardio → minutes; for strength → total kg lifted
            let vol = 0;
            let unit: 'kg' | 'min' = 'kg';
            if (ex.duration_minutes && ex.sets.length === 0) {
                vol = ex.duration_minutes;
                unit = 'min';
            } else {
                vol = ex.sets.reduce((s, set) => s + set.reps * (set.weight_kg ?? 0), 0);
                unit = 'kg';
            }
            const volPerMuscle = vol / muscles.length;

            for (const muscle of muscles) {
                xpMap[muscle] += xpPerMuscle;
                volMap[muscle] += volPerMuscle;
                // If any exercise contributes kg, prefer kg
                if (unit === 'kg' && unitMap[muscle] === 'min') {
                    unitMap[muscle] = 'kg';
                }
            }
        }
    }

    const result = {} as Record<MuscleGroup, MuscleStats>;
    for (const muscle of ALL_MUSCLES) {
        const xp = Math.round(xpMap[muscle]);
        result[muscle] = {
            muscle,
            xp,
            tier: getTierForXP(xp),
            totalVolume: Math.round(volMap[muscle]),
            volumeUnit: unitMap[muscle],
        };
    }
    return result;
}

export function computeOverallXP(stats: Record<MuscleGroup, MuscleStats>): number {
    return Math.round(
        Object.values(stats).reduce((sum, s) => sum + s.xp, 0) / ALL_MUSCLES.length
    );
}
