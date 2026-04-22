export type BodyType = 'slim' | 'normal' | 'overweight';
export type BodyGoal = 'lean' | 'athletic' | 'bulk';

export interface UserProfile {
  age: number;
  weight_kg: number;
  height_cm: number;
  goal_weight_kg: number;
  sex: 'male' | 'female';
  steps_per_day: number;
  workout_days_per_week: number;
  unit_preference: 'metric' | 'imperial';
  body_type?: BodyType;
  goal?: BodyGoal;
}

export interface CaloriePlan {
  tier: 'aggressive' | 'moderate' | 'easy';
  daily_calories: number;
  tdee: number;
  bmr: number;
}
