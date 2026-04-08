import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export function SkincareScreen() {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.content}>
                <View style={styles.iconWrap}>
                    <Ionicons name="leaf-outline" size={48} color={theme.colors.primary} />
                </View>
                <Text style={styles.title}>Skincare</Text>
                <Text style={styles.subtitle}>
                    Track your skincare routine and get personalized tips. Coming soon.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    iconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primaryContainer,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        color: theme.colors.textMuted,
        textAlign: 'center',
        lineHeight: 22,
    },
});
