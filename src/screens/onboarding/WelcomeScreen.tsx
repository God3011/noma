import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingStackParamList } from '../../navigation/types';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { theme } from '../../constants/theme';

type Nav = StackNavigationProp<OnboardingStackParamList, 'Welcome'>;

export function WelcomeScreen() {
    const navigation = useNavigation<Nav>();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            {/* Decorative gradient orb */}
            <View style={styles.orbContainer}>
                <LinearGradient
                    colors={['rgba(16,185,129,0.12)', 'rgba(0,108,73,0.06)', 'transparent']}
                    style={styles.orb}
                    start={{ x: 0.3, y: 0 }}
                    end={{ x: 0.7, y: 1 }}
                />
            </View>

            <View style={styles.content}>
                <View style={styles.logoSection}>
                    <Text style={styles.logo}>NOMA</Text>
                    <Text style={styles.tagline}>Know your body. Fuel your goals.</Text>
                </View>

                <View style={styles.ctaSection}>
                    <PrimaryButton
                        title="Get Started"
                        onPress={() => navigation.navigate('ProfileSetup')}
                    />
                    <PrimaryButton
                        title="Log In"
                        onPress={() => { }}
                        variant="ghost"
                        style={{ marginTop: 8 }}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    orbContainer: {
        position: 'absolute',
        top: -100,
        right: -80,
        width: 350,
        height: 350,
    },
    orb: {
        width: '100%',
        height: '100%',
        borderRadius: 175,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingTop: 160,
        paddingBottom: 60,
    },
    logoSection: {
        alignItems: 'center',
    },
    logo: {
        fontSize: 56,
        fontWeight: '900',
        color: theme.colors.primary,
        letterSpacing: 12,
        marginBottom: 16,
    },
    tagline: {
        fontSize: 17,
        color: theme.colors.textSecondary,
        fontWeight: '400',
        textAlign: 'center',
        lineHeight: 26,
    },
    ctaSection: {
        paddingHorizontal: 16,
    },
});
