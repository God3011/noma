import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Slider from '@react-native-community/slider';
import { OnboardingStackParamList } from '../../navigation/types';
import { useUserStore } from '../../store/useUserStore';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { theme } from '../../constants/theme';

type Nav = StackNavigationProp<OnboardingStackParamList, 'ActivitySetup'>;

const WORKOUT_OPTIONS = [
    { label: '0', value: 0 },
    { label: '1-2', value: 2 },
    { label: '3-4', value: 4 },
    { label: '5-6', value: 6 },
    { label: '7', value: 7 },
];

export function ActivitySetupScreen() {
    const navigation = useNavigation<Nav>();
    const profile = useUserStore((s) => s.profile);
    const setProfile = useUserStore((s) => s.setProfile);

    const [steps, setSteps] = useState(profile?.steps_per_day || 5000);
    const [workoutDays, setWorkoutDays] = useState(profile?.workout_days_per_week || 3);

    const handleNext = () => {
        if (profile) {
            setProfile({
                ...profile,
                steps_per_day: steps,
                workout_days_per_week: workoutDays,
            });
        }
        navigation.navigate('CaloriePlan');
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <StatusBar barStyle="dark-content" />
            {/* Progress */}
            <View style={styles.progressRow}>
                <View style={[styles.progressDot, styles.progressDone]} />
                <View style={[styles.progressDot, styles.progressActive]} />
                <View style={[styles.progressDot]} />
            </View>
            <Text style={styles.step}>Step 2 of 3</Text>

            <Text style={styles.heading}>Activity Level</Text>
            <Text style={styles.subtitle}>Help us understand your daily movement</Text>

            {/* Steps Slider */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>Average Daily Steps</Text>
                    <View style={styles.stepsValue}>
                        <Text style={styles.stepsNum}>{steps.toLocaleString()}</Text>
                        <Text style={styles.stepsUnit}>steps</Text>
                    </View>
                </View>
                <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={20000}
                    step={1000}
                    value={steps}
                    onValueChange={setSteps}
                    minimumTrackTintColor={theme.colors.primary}
                    maximumTrackTintColor={theme.colors.surfaceContainerHigh}
                    thumbTintColor={theme.colors.primary}
                />
                <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>0</Text>
                    <Text style={styles.sliderLabel}>10k</Text>
                    <Text style={styles.sliderLabel}>20k</Text>
                </View>
            </View>

            {/* Workout Days */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Workout Days per Week</Text>
                <View style={styles.segmentRow}>
                    {WORKOUT_OPTIONS.map((opt) => (
                        <TouchableOpacity
                            key={opt.label}
                            style={[styles.segment, workoutDays === opt.value && styles.segmentActive]}
                            onPress={() => setWorkoutDays(opt.value)}
                        >
                            <Text style={[styles.segmentText, workoutDays === opt.value && styles.segmentTextActive]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={{ marginTop: 32 }}>
                <PrimaryButton title="Next" onPress={handleNext} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scroll: {
        padding: 24,
        paddingTop: 60,
    },
    progressRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    progressDot: {
        height: 4,
        flex: 1,
        borderRadius: 2,
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    progressActive: {
        backgroundColor: theme.colors.primary,
    },
    progressDone: {
        backgroundColor: theme.colors.primaryLight,
    },
    step: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 24,
    },
    heading: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        marginBottom: 36,
    },
    section: {
        marginBottom: 36,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: 12,
    },
    stepsValue: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    stepsNum: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.primary,
    },
    stepsUnit: {
        fontSize: 13,
        color: theme.colors.textMuted,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sliderLabel: {
        fontSize: 11,
        color: theme.colors.textMuted,
    },
    segmentRow: {
        flexDirection: 'row',
        gap: 8,
    },
    segment: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
    },
    segmentActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textSecondary,
    },
    segmentTextActive: {
        color: '#ffffff',
    },
});
