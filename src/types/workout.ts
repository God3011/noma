export type WorkoutCategory = 'strength' | 'cardio' | 'flexibility' | 'sport' | 'other';

export interface WorkoutSet {
    reps: number;
    weight_kg?: number;
}

export interface Exercise {
    name: string;
    category: WorkoutCategory;
    sets: WorkoutSet[];           // for strength/flexibility
    duration_minutes?: number;    // for cardio/sport/other
    speed_kmh?: number;           // optional, for cardio
}

export interface WorkoutEntry {
    id: string;
    date: string;         // 'YYYY-MM-DD'
    exercises: Exercise[];
    notes?: string;
    logged_at: string;
    // Legacy compat
    workout_type?: string;
    category?: WorkoutCategory;
    sets?: WorkoutSet[];
    duration_minutes?: number;
}
