import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList, OnboardingStackParamList } from './types';
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
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
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
                </>
            )}
        </RootStack.Navigator>
    );
}
