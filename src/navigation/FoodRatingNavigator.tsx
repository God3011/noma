import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ScannedProduct } from '../types/foodRating';
import FoodRatingScreen from '../screens/foodrating/FoodRatingScreen';
import ScannerScreen from '../screens/foodrating/ScannerScreen';
import ProductResultScreen from '../screens/foodrating/ProductResultScreen';

export type FoodRatingStackParamList = {
  FoodRatingHome: undefined;
  Scanner: undefined;
  ProductResult: { product: ScannedProduct };
};

const Stack = createStackNavigator<FoodRatingStackParamList>();

export function FoodRatingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FoodRatingHome" component={FoodRatingScreen} />
      <Stack.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ presentation: 'modal', cardStyle: { backgroundColor: '#000' } }}
      />
      <Stack.Screen name="ProductResult" component={ProductResultScreen} />
    </Stack.Navigator>
  );
}
