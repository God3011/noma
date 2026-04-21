import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { theme } from '../constants/theme';
import { HomeScreen } from '../screens/home/HomeScreen';
import { FoodLogScreen } from '../screens/foodlog/FoodLogScreen';
import { WorkoutScreen } from '../screens/workout/WorkoutScreen';
import { FoodRatingNavigator } from './FoodRatingNavigator';
import InsightsScreen from '../screens/insights/InsightsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: 'rgba(19, 19, 19, 0.92)',
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255, 255, 255, 0.05)',
                    elevation: 0,
                    height: 88,
                    paddingBottom: 24,
                    paddingTop: 8,
                    borderTopLeftRadius: 32,
                    borderTopRightRadius: 32,
                    position: 'absolute',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -8 },
                    shadowOpacity: 0.1,
                    shadowRadius: 16,
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textMuted,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    marginTop: 2,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Dashboard',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="grid" size={22} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="FoodLog"
                component={FoodLogScreen}
                options={{
                    tabBarLabel: 'Log',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="book" size={22} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Workout"
                component={WorkoutScreen}
                options={{
                    tabBarLabel: 'Workout',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="barbell" size={22} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="FoodRating"
                component={FoodRatingNavigator}
                options={{
                    tabBarLabel: 'Rating',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="star" size={22} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Insights"
                component={InsightsScreen}
                options={{
                    tabBarLabel: 'Insights',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="bar-chart-outline" size={22} color={color} />
                    ),
                    headerShown: false,
                }}
            />
        </Tab.Navigator>
    );
}
