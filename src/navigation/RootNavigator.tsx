import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList, OnboardingStackParamList } from './types';
import { theme } from '../constants/theme';
import { useUserStore } from '../store/useUserStore';
import { MainTabNavigator } from './MainTabNavigator';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { ProfileSetupScreen } from '../screens/onboarding/ProfileSetupScreen';
import { ActivitySetupScreen } from '../screens/onboarding/ActivitySetupScreen';
import { CaloriePlanScreen } from '../screens/onboarding/CaloriePlanScreen';
import { AddMealScreen } from '../screens/foodlog/AddMealScreen';
import { SaveMealScreen } from '../screens/foodlog/SaveMealScreen';
import { AddWorkoutScreen } from '../screens/workout/AddWorkoutScreen';
import { AccountScreen } from '../screens/account/AccountScreen';
import { AvatarScreen } from '../screens/avatar/AvatarScreen';
import { ActiveWorkoutScreen } from '../screens/workout/ActiveWorkoutScreen';
import { SessionDetailScreen } from '../screens/workout/SessionDetailScreen';
import { MuscleRankingsScreen } from '../screens/workout/MuscleRankingsScreen';

const RootStack = createStackNavigator<RootStackParamList>();
const OnboardingStack = createStackNavigator<OnboardingStackParamList>();

function OnboardingNavigator() {
    return (
        <OnboardingStack.Navigator
            screenOptions={{ headerShown: false }}
        >
            <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
            <OnboardingStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
            <OnboardingStack.Screen name="ActivitySetup" component={ActivitySetupScreen} />
            <OnboardingStack.Screen name="CaloriePlan" component={CaloriePlanScreen} />
        </OnboardingStack.Navigator>
    );
}

export function RootNavigator() {
    const plan = useUserStore((s) => s.plan);

    return (
        <RootStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: theme.colors.background } }}>
            {plan === null ? (
                <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
            ) : (
                <>
                    <RootStack.Screen name="Main" component={MainTabNavigator} />
                    <RootStack.Screen
                        name="AddMeal"
                        component={AddMealScreen}
                        options={{ presentation: 'modal' }}
                    />
                    <RootStack.Screen
                        name="AddWorkout"
                        component={AddWorkoutScreen}
                        options={{ presentation: 'modal' }}
                    />
                    <RootStack.Screen
                        name="SaveMeal"
                        component={SaveMealScreen}
                        options={{ presentation: 'modal' }}
                    />
                    <RootStack.Screen
                        name="Account"
                        component={AccountScreen}
                        options={{ presentation: 'modal' }}
                    />
                    <RootStack.Screen
                        name="Avatar"
                        component={AvatarScreen}
                        options={{ presentation: 'modal' }}
                    />
                    <RootStack.Screen
                        name="ActiveWorkout"
                        component={ActiveWorkoutScreen}
                        options={{ presentation: 'modal' }}
                    />
                    <RootStack.Screen
                        name="SessionDetail"
                        component={SessionDetailScreen}
                    />
                    <RootStack.Screen
                        name="MuscleRankings"
                        component={MuscleRankingsScreen}
                    />
                </>
            )}
        </RootStack.Navigator>
    );
}
