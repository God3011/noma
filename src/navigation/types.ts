export type OnboardingStackParamList = {
    Welcome: undefined;
    ProfileSetup: undefined;
    ActivitySetup: undefined;
    CaloriePlan: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    FoodLog: undefined;
    Workout: undefined;
    FoodRating: undefined;
    Insights: undefined;
};

export type RootStackParamList = {
    Onboarding: undefined;
    Main: undefined;
    AddMeal: undefined;
    AddWorkout: { presetMode?: boolean; editPresetId?: string } | undefined;
    ActiveWorkout: { date?: string } | undefined;
    SessionDetail: { date: string };
    MuscleRankings: undefined;
    SaveMeal: undefined;
    Account: undefined;
    Avatar: undefined;
};
