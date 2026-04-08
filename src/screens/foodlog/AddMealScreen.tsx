import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, KeyboardAvoidingView, Platform, TextInput, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { generateId } from '../../utils/generateId';
import { estimateFromText } from '../../utils/foodEstimator';
import { estimateWithAI } from '../../utils/aiEstimator';
import { useFoodLogStore } from '../../store/useFoodLogStore';
import { useSavedMealsStore } from '../../store/useSavedMealsStore';
import { InputField } from '../../components/common/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { getToday } from '../../utils/dateHelpers';
import { RootStackParamList } from '../../navigation/types';
import { MealType } from '../../types/food';
import { theme } from '../../constants/theme';

type Nav = StackNavigationProp<RootStackParamList>;

const MEAL_TYPES: { type: MealType; label: string }[] = [
    { type: 'breakfast', label: 'Breakfast' },
    { type: 'lunch', label: 'Lunch' },
    { type: 'dinner', label: 'Dinner' },
    { type: 'snack', label: 'Snack' },
];

interface Estimation {
    source: 'ai' | 'local';
    items: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
}

export function AddMealScreen() {
    const navigation = useNavigation<Nav>();
    const addMeal = useFoodLogStore((s) => s.addMeal);
    const savedMeals = useSavedMealsStore((s) => s.savedMeals);

    const [description, setDescription] = useState('');
    const [name, setName] = useState('');
    const [mealType, setMealType] = useState<MealType>('lunch');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [estimation, setEstimation] = useState<Estimation | null>(null);
    const [loading, setLoading] = useState(false);
    const [didApply, setDidApply] = useState(false);
    const [aiError, setAiError] = useState('');

    const handleEstimate = useCallback(async () => {
        if (description.trim().length < 3) return;
        setLoading(true);
        setEstimation(null);
        setDidApply(false);
        setAiError('');

        try {
            // Try AI first
            const aiResult = await estimateWithAI(description.trim());
            if (aiResult) {
                setEstimation({
                    source: 'ai',
                    items: aiResult.items,
                    calories: aiResult.calories,
                    protein_g: aiResult.protein_g,
                    carbs_g: aiResult.carbs_g,
                    fat_g: aiResult.fat_g,
                });
                setLoading(false);
                return;
            }
            setAiError('AI unavailable — using local estimation');
        } catch (e: any) {
            setAiError(`AI error: ${e?.message || 'unknown'}`);
        }

        // Fallback to local keyword matching
        const localResult = estimateFromText(description.trim());
        if (localResult) {
            setEstimation({
                source: 'local',
                items: localResult.matchedItem,
                calories: localResult.calories,
                protein_g: localResult.protein_g,
                carbs_g: localResult.carbs_g,
                fat_g: localResult.fat_g,
            });
        }
        setLoading(false);
    }, [description]);

    const applyEstimation = () => {
        if (!estimation) return;
        if (!name) setName(estimation.items);
        setCalories(estimation.calories.toString());
        setProtein(estimation.protein_g.toString());
        setCarbs(estimation.carbs_g.toString());
        setFat(estimation.fat_g.toString());
        setDidApply(true);
    };

    const handleSave = () => {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = 'Enter meal name';
        if (!calories || parseInt(calories) <= 0) errs.calories = 'Enter valid calories';
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        addMeal({
            id: generateId(),
            date: getToday(),
            name: name.trim(),
            calories: parseInt(calories),
            protein_g: parseInt(protein) || 0,
            carbs_g: parseInt(carbs) || 0,
            fat_g: parseInt(fat) || 0,
            meal_type: mealType,
            logged_at: new Date().toISOString(),
        });
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={28} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Add Meal</Text>
                    <View style={{ width: 28 }} />
                </View>

                {/* Saved Meals Quick Add */}
                {savedMeals.length > 0 && (
                    <View style={styles.savedSection}>
                        <View style={styles.savedHeader}>
                            <Ionicons name="bookmark" size={16} color={theme.colors.primary} />
                            <Text style={styles.savedTitle}>Saved Meals</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.savedRow}>
                                {savedMeals.map((sm) => (
                                    <TouchableOpacity
                                        key={sm.id}
                                        style={styles.savedCard}
                                        onPress={() => {
                                            setName(sm.name);
                                            setCalories(sm.calories.toString());
                                            setProtein(sm.protein_g.toString());
                                            setCarbs(sm.carbs_g.toString());
                                            setFat(sm.fat_g.toString());
                                        }}
                                    >
                                        <Text style={styles.savedCardName} numberOfLines={1}>{sm.name}</Text>
                                        <Text style={styles.savedCardCal}>{sm.calories} kcal</Text>
                                        <Text style={styles.savedCardMacro}>P{sm.protein_g} C{sm.carbs_g} F{sm.fat_g}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {/* Save Meal Button */}
                <TouchableOpacity
                    style={styles.saveMealLink}
                    onPress={() => navigation.navigate('SaveMeal')}
                >
                    <Ionicons name="bookmark-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.saveMealLinkText}>Create a Saved Meal</Text>
                </TouchableOpacity>

                {/* Meal Type */}
                <Text style={styles.fieldLabel}>Meal Type</Text>
                <View style={styles.typeRow}>
                    {MEAL_TYPES.map(({ type, label }) => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.typeChip, mealType === type && styles.typeChipActive]}
                            onPress={() => setMealType(type)}
                        >
                            <Text style={[styles.typeText, mealType === type && styles.typeTextActive]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Smart Description */}
                <View style={styles.descSection}>
                    <View style={styles.descHeader}>
                        <Ionicons name="sparkles" size={16} color={theme.colors.primary} />
                        <Text style={styles.descTitle}>Describe what you ate</Text>
                    </View>
                    <TextInput
                        style={styles.descInput}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="e.g. 2 roti with dal, grilled chicken with rice..."
                        placeholderTextColor={theme.colors.textMuted}
                        multiline
                        numberOfLines={2}
                    />

                    {/* Estimate Button */}
                    <TouchableOpacity
                        style={[styles.estimateBtn, description.trim().length < 3 && styles.estimateBtnDisabled]}
                        onPress={handleEstimate}
                        disabled={description.trim().length < 3 || loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="sparkles" size={14} color="#fff" />
                                <Text style={styles.estimateBtnText}>Estimate Nutrition</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Estimation Result */}
                    {estimation && (
                        <View style={styles.estimationCard}>
                            <View style={styles.estimationHeader}>
                                <Text style={styles.estimationMatch} numberOfLines={2}>
                                    {estimation.items}
                                </Text>
                                <View style={[styles.sourceBadge, {
                                    backgroundColor: estimation.source === 'ai' ? '#ede9fe' : '#e6f9f0',
                                }]}>
                                    <Text style={[styles.sourceText, {
                                        color: estimation.source === 'ai' ? '#7c3aed' : theme.colors.primary,
                                    }]}>
                                        {estimation.source === 'ai' ? '✨ AI' : '📋 Local'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.estimationMacros}>
                                <View style={styles.macroChip}>
                                    <Text style={styles.macroChipLabel}>Cal</Text>
                                    <Text style={styles.macroChipVal}>{estimation.calories}</Text>
                                </View>
                                <View style={styles.macroChip}>
                                    <Text style={styles.macroChipLabel}>Protein</Text>
                                    <Text style={styles.macroChipVal}>{estimation.protein_g}g</Text>
                                </View>
                                <View style={styles.macroChip}>
                                    <Text style={styles.macroChipLabel}>Carbs</Text>
                                    <Text style={styles.macroChipVal}>{estimation.carbs_g}g</Text>
                                </View>
                                <View style={styles.macroChip}>
                                    <Text style={styles.macroChipLabel}>Fat</Text>
                                    <Text style={styles.macroChipVal}>{estimation.fat_g}g</Text>
                                </View>
                            </View>
                            {!didApply ? (
                                <TouchableOpacity style={styles.applyBtn} onPress={applyEstimation}>
                                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                    <Text style={styles.applyBtnText}>Apply Estimate</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.appliedRow}>
                                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                                    <Text style={styles.appliedText}>Applied! Edit values below if needed.</Text>
                                </View>
                            )}
                        </View>
                    )}
                    {!loading && description.trim().length >= 3 && estimation === null && didApply === false && (
                        <Text style={styles.noMatch}>Tap "Estimate Nutrition" to analyze</Text>
                    )}
                    {aiError ? <Text style={styles.aiErrorText}>{aiError}</Text> : null}
                </View>

                <InputField label="Meal Name" value={name} onChangeText={setName} placeholder="Mediterranean Bowl" error={errors.name} />
                <InputField label="Calories" value={calories} onChangeText={setCalories} placeholder="480" keyboardType="numeric" suffix="kcal" error={errors.calories} />

                <Text style={styles.sectionLabel}>Macros (optional)</Text>
                <View style={styles.macroRow}>
                    <InputField label="Protein" value={protein} onChangeText={setProtein} placeholder="0" keyboardType="numeric" suffix="g" style={styles.macroInput} />
                    <InputField label="Carbs" value={carbs} onChangeText={setCarbs} placeholder="0" keyboardType="numeric" suffix="g" style={styles.macroInput} />
                    <InputField label="Fat" value={fat} onChangeText={setFat} placeholder="0" keyboardType="numeric" suffix="g" style={styles.macroInput} />
                </View>

                <View style={{ marginTop: 16, marginBottom: 40 }}>
                    <PrimaryButton title="Log Meal" onPress={handleSave} />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { padding: 24, paddingTop: 60 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28,
    },
    title: { fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary },
    fieldLabel: {
        fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary,
        marginBottom: 8, letterSpacing: 0.3,
    },
    typeRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    typeChip: {
        flex: 1, paddingVertical: 12, alignItems: 'center',
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderWidth: 1, borderColor: theme.colors.outlineVariant,
    },
    typeChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    typeText: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },
    typeTextActive: { color: '#fff' },
    descSection: { marginBottom: 20 },
    descHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    descTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
    descInput: {
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1, borderColor: theme.colors.outlineVariant,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: theme.colors.textPrimary,
        minHeight: 56, textAlignVertical: 'top',
    },
    estimateBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.sm,
        paddingVertical: 12, marginTop: 10,
    },
    estimateBtnDisabled: { opacity: 0.4 },
    estimateBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    estimationCard: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.sm,
        padding: 14, marginTop: 10,
        borderWidth: 1, borderColor: theme.colors.primaryLight,
    },
    estimationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    estimationMatch: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, flex: 1, marginRight: 8 },
    sourceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.borderRadius.pill },
    sourceText: { fontSize: 10, fontWeight: '700' },
    estimationMacros: { flexDirection: 'row', gap: 6, marginBottom: 12 },
    macroChip: {
        flex: 1, backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm, padding: 8, alignItems: 'center',
    },
    macroChipLabel: { fontSize: 10, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    macroChipVal: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 2 },
    applyBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.sm,
        paddingVertical: 10,
    },
    applyBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    appliedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    appliedText: { fontSize: 12, color: theme.colors.primary, fontWeight: '500' },
    noMatch: { fontSize: 12, color: theme.colors.textMuted, marginTop: 8, textAlign: 'center' },
    aiErrorText: { fontSize: 11, color: '#d97706', marginTop: 6, fontWeight: '500' },
    sectionLabel: {
        fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 8, marginTop: 8,
    },
    macroRow: { flexDirection: 'row', gap: 8 },
    macroInput: { flex: 1 },
    savedSection: { marginBottom: 16 },
    savedHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    savedTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
    savedRow: { flexDirection: 'row', gap: 8, paddingRight: 20 },
    savedCard: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.sm,
        padding: 12, minWidth: 120,
        borderWidth: 1, borderColor: theme.colors.outlineVariant,
    },
    savedCardName: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 4 },
    savedCardCal: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
    savedCardMacro: { fontSize: 10, color: theme.colors.textMuted, marginTop: 2, fontWeight: '500' },
    saveMealLink: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 10, marginBottom: 16,
        borderWidth: 1, borderColor: theme.colors.primary, borderStyle: 'dashed',
        borderRadius: theme.borderRadius.sm,
    },
    saveMealLinkText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
});
