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
    Skincare: undefined;
};

export type RootStackParamList = {
    Onboarding: undefined;
    Main: undefined;
    AddMeal: undefined;
    AddWorkout: { presetMode?: boolean } | undefined;
    SaveMeal: undefined;
    Account: undefined;
};
