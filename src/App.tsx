import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { RootNavigator } from './navigation/RootNavigator';
import { theme } from './constants/theme';

const AppTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: theme.colors.background,
        card: theme.colors.background,
        border: 'transparent',
    },
};

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <NavigationContainer theme={AppTheme}>
                <RootNavigator />
            </NavigationContainer>
        </GestureHandlerRootView>
    );
}
