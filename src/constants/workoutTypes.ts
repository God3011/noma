import { WorkoutCategory } from '../types/workout';

export interface WorkoutTypeEntry {
    name: string;
    category: WorkoutCategory;
}

export const WORKOUT_TYPES: WorkoutTypeEntry[] = [
    // Strength
    { name: 'Bench Press', category: 'strength' },
    { name: 'Squat', category: 'strength' },
    { name: 'Deadlift', category: 'strength' },
    { name: 'Pull-ups', category: 'strength' },
    { name: 'Push-ups', category: 'strength' },
    { name: 'Shoulder Press', category: 'strength' },
    { name: 'Rows', category: 'strength' },
    { name: 'Bicep Curl', category: 'strength' },
    { name: 'Tricep Extension', category: 'strength' },
    { name: 'Leg Press', category: 'strength' },
    { name: 'Lunges', category: 'strength' },

    // Cardio
    { name: 'Running', category: 'cardio' },
    { name: 'Cycling', category: 'cardio' },
    { name: 'Swimming', category: 'cardio' },
    { name: 'Jump Rope', category: 'cardio' },
    { name: 'Rowing', category: 'cardio' },
    { name: 'Elliptical', category: 'cardio' },
    { name: 'HIIT', category: 'cardio' },

    // Flexibility
    { name: 'Yoga', category: 'flexibility' },
    { name: 'Stretching', category: 'flexibility' },
    { name: 'Foam Rolling', category: 'flexibility' },

    // Sport
    { name: 'Basketball', category: 'sport' },
    { name: 'Football', category: 'sport' },
    { name: 'Tennis', category: 'sport' },
    { name: 'Martial Arts', category: 'sport' },
];

export const WORKOUT_CATEGORIES: WorkoutCategory[] = [
    'strength',
    'cardio',
    'flexibility',
    'sport',
    'other',
];

export const getCategoryColor = (category: WorkoutCategory): string => {
    switch (category) {
        case 'strength': return '#006c49';
        case 'cardio': return '#855300';
        case 'flexibility': return '#505f76';
        case 'sport': return '#10b981';
        case 'other': return '#6c7a71';
    }
};
