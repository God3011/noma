import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, StatusBar,
    TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/types';
import { useUserStore } from '../../store/useUserStore';
import { InputField } from '../../components/common/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { theme } from '../../constants/theme';

type Nav = StackNavigationProp<OnboardingStackParamList, 'ProfileSetup'>;

export function ProfileSetupScreen() {
    const navigation = useNavigation<Nav>();
    const setProfile = useUserStore((s) => s.setProfile);
    const existingProfile = useUserStore((s) => s.profile);

    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [goalWeight, setGoalWeight] = useState('');
    const [sex, setSex] = useState<'male' | 'female'>('male');
    const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!age || parseInt(age) <= 0 || parseInt(age) > 120) errs.age = 'Enter a valid age';
        if (!weight || parseFloat(weight) <= 0) errs.weight = 'Enter a valid weight';
        if (!height || parseFloat(height) <= 0) errs.height = 'Enter a valid height';
        if (!goalWeight || parseFloat(goalWeight) <= 0) errs.goalWeight = 'Enter a valid goal weight';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (!validate()) return;

        let weightKg = parseFloat(weight);
        let heightCm = parseFloat(height);
        let goalWeightKg = parseFloat(goalWeight);

        if (units === 'imperial') {
            weightKg = weightKg * 0.453592;
            heightCm = heightCm * 2.54;
            goalWeightKg = goalWeightKg * 0.453592;
        }

        setProfile({
            age: parseInt(age),
            weight_kg: Math.round(weightKg * 10) / 10,
            height_cm: Math.round(heightCm * 10) / 10,
            goal_weight_kg: Math.round(goalWeightKg * 10) / 10,
            sex,
            steps_per_day: existingProfile?.steps_per_day || 5000,
            workout_days_per_week: existingProfile?.workout_days_per_week || 3,
            unit_preference: units,
        });

        navigation.navigate('ActivitySetup');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Progress */}
                <View style={styles.progressRow}>
                    <View style={[styles.progressDot, styles.progressActive]} />
                    <View style={[styles.progressDot]} />
                    <View style={[styles.progressDot]} />
                </View>
                <Text style={styles.step}>Step 1 of 3</Text>

                <Text style={styles.heading}>Your Profile</Text>
                <Text style={styles.subtitle}>Let's personalize your experience</Text>

                {/* Unit toggle */}
                <View style={styles.segmentRow}>
                    <TouchableOpacity
                        style={[styles.segment, units === 'metric' && styles.segmentActive]}
                        onPress={() => setUnits('metric')}
                    >
                        <Text style={[styles.segmentText, units === 'metric' && styles.segmentTextActive]}>
                            Metric (kg, cm)
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segment, units === 'imperial' && styles.segmentActive]}
                        onPress={() => setUnits('imperial')}
                    >
                        <Text style={[styles.segmentText, units === 'imperial' && styles.segmentTextActive]}>
                            Imperial (lbs, in)
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Sex toggle */}
                <Text style={styles.fieldLabel}>Sex</Text>
                <View style={styles.segmentRow}>
                    <TouchableOpacity
                        style={[styles.segment, sex === 'male' && styles.segmentActive]}
                        onPress={() => setSex('male')}
                    >
                        <Text style={[styles.segmentText, sex === 'male' && styles.segmentTextActive]}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segment, sex === 'female' && styles.segmentActive]}
                        onPress={() => setSex('female')}
                    >
                        <Text style={[styles.segmentText, sex === 'female' && styles.segmentTextActive]}>Female</Text>
                    </TouchableOpacity>
                </View>

                <InputField
                    label="Age"
                    value={age}
                    onChangeText={setAge}
                    placeholder="25"
                    keyboardType="numeric"
                    suffix="years"
                    error={errors.age}
                />
                <InputField
                    label="Current Weight"
                    value={weight}
                    onChangeText={setWeight}
                    placeholder={units === 'metric' ? '70' : '154'}
                    keyboardType="numeric"
                    suffix={units === 'metric' ? 'kg' : 'lbs'}
                    error={errors.weight}
                />
                <InputField
                    label="Height"
                    value={height}
                    onChangeText={setHeight}
                    placeholder={units === 'metric' ? '175' : '69'}
                    keyboardType="numeric"
                    suffix={units === 'metric' ? 'cm' : 'inches'}
                    error={errors.height}
                />
                <InputField
                    label="Goal Weight"
                    value={goalWeight}
                    onChangeText={setGoalWeight}
                    placeholder={units === 'metric' ? '65' : '143'}
                    keyboardType="numeric"
                    suffix={units === 'metric' ? 'kg' : 'lbs'}
                    error={errors.goalWeight}
                />

                <View style={{ marginTop: 16 }}>
                    <PrimaryButton title="Next" onPress={handleNext} />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
        marginBottom: 28,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    segmentRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    segment: {
        flex: 1,
        paddingVertical: 12,
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
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    segmentTextActive: {
        color: '#ffffff',
    },
});
