import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, KeyboardAvoidingView, Platform, TextInput, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { generateId } from '../../utils/generateId';
import { estimateRecipe } from '../../utils/recipeEstimator';
import { useSavedMealsStore } from '../../store/useSavedMealsStore';
import { InputField } from '../../components/common/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { theme } from '../../constants/theme';

export function SaveMealScreen() {
    const navigation = useNavigation();
    const addSavedMeal = useSavedMealsStore((s) => s.addSavedMeal);

    const [name, setName] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [cookingMethod, setCookingMethod] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiNote, setAiNote] = useState('');
    const [aiError, setAiError] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleAnalyze = async () => {
        if (!ingredients.trim()) return;
        setLoading(true);
        setAiError('');
        setAiNote('');

        try {
            const result = await estimateRecipe(ingredients.trim(), cookingMethod.trim());
            if (result) {
                setCalories(result.calories.toString());
                setProtein(result.protein_g.toString());
                setCarbs(result.carbs_g.toString());
                setFat(result.fat_g.toString());
                setAiNote(result.per_serving_note);
            } else {
                setAiError('AI estimation failed — enter values manually');
            }
        } catch (e: any) {
            setAiError(`Error: ${e?.message || 'unknown'}`);
        }
        setLoading(false);
    };

    const handleSave = () => {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = 'Enter meal name';
        if (!calories || parseInt(calories) <= 0) errs.calories = 'Enter valid calories';
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        addSavedMeal({
            id: generateId(),
            name: name.trim(),
            ingredients: ingredients.trim() || undefined,
            cooking_method: cookingMethod.trim() || undefined,
            calories: parseInt(calories),
            protein_g: parseInt(protein) || 0,
            carbs_g: parseInt(carbs) || 0,
            fat_g: parseInt(fat) || 0,
            created_at: new Date().toISOString(),
        });
        navigation.goBack();
    };

    const hasIngredients = ingredients.trim().length > 0;

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
                    <Text style={styles.title}>Save a Meal</Text>
                    <View style={{ width: 28 }} />
                </View>

                <InputField
                    label="Meal Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Mom's Dal Fry"
                    error={errors.name}
                />

                {/* Nutrition — always visible */}
                <Text style={styles.nutritionLabel}>Nutrition per serving</Text>
                <InputField label="Calories" value={calories} onChangeText={setCalories} placeholder="0" keyboardType="numeric" suffix="kcal" error={errors.calories} />
                <View style={styles.macroRow}>
                    <InputField label="Protein" value={protein} onChangeText={setProtein} placeholder="0" keyboardType="numeric" suffix="g" style={styles.macroInput} />
                    <InputField label="Carbs" value={carbs} onChangeText={setCarbs} placeholder="0" keyboardType="numeric" suffix="g" style={styles.macroInput} />
                    <InputField label="Fat" value={fat} onChangeText={setFat} placeholder="0" keyboardType="numeric" suffix="g" style={styles.macroInput} />
                </View>

                {/* AI Section — optional */}
                <View style={styles.aiSection}>
                    <View style={styles.aiSectionHeader}>
                        <Ionicons name="sparkles" size={16} color="#7c3aed" />
                        <Text style={styles.aiSectionTitle}>Or let AI estimate (optional)</Text>
                    </View>
                    <Text style={styles.hint}>Add ingredients and cooking method for AI-powered estimation</Text>

                    <Text style={styles.fieldLabel}>Ingredients</Text>
                    <TextInput
                        style={styles.textArea}
                        value={ingredients}
                        onChangeText={setIngredients}
                        placeholder={"200g chicken breast\n1 tbsp olive oil\n2 cloves garlic\n1 cup rice"}
                        placeholderTextColor={theme.colors.textMuted}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <Text style={styles.fieldLabel}>Cooking Method</Text>
                    <TextInput
                        style={[styles.textArea, { minHeight: 70 }]}
                        value={cookingMethod}
                        onChangeText={setCookingMethod}
                        placeholder={"Pan-fry in oil, boil rice separately"}
                        placeholderTextColor={theme.colors.textMuted}
                        multiline
                        numberOfLines={2}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={[styles.analyzeBtn, !hasIngredients && styles.analyzeBtnDisabled]}
                        onPress={handleAnalyze}
                        disabled={!hasIngredients || loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="sparkles" size={16} color="#fff" />
                                <Text style={styles.analyzeBtnText}>Analyze with AI</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {aiNote ? (
                        <View style={styles.aiNoteCard}>
                            <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                            <Text style={styles.aiNoteText}>AI estimated · {aiNote}</Text>
                        </View>
                    ) : null}
                    {aiError ? <Text style={styles.aiErrorText}>{aiError}</Text> : null}
                </View>

                <View style={{ marginTop: 20, marginBottom: 40 }}>
                    <PrimaryButton title="Save Meal" onPress={handleSave} />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { padding: 24, paddingTop: 60 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
    },
    title: { fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary },
    fieldLabel: {
        fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary,
        marginBottom: 6, marginTop: 10, letterSpacing: 0.3,
    },
    nutritionLabel: {
        fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary,
        marginBottom: 8, marginTop: 8,
    },
    macroRow: { flexDirection: 'row', gap: 8 },
    macroInput: { flex: 1 },
    aiSection: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outlineVariant,
    },
    aiSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    aiSectionTitle: { fontSize: 14, fontWeight: '700', color: '#7c3aed' },
    hint: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 8 },
    textArea: {
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1, borderColor: theme.colors.outlineVariant,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 14, color: theme.colors.textPrimary,
        minHeight: 90, lineHeight: 20,
    },
    analyzeBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#7c3aed', borderRadius: theme.borderRadius.sm,
        paddingVertical: 14, marginTop: 12, marginBottom: 8,
    },
    analyzeBtnDisabled: { opacity: 0.4 },
    analyzeBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    aiNoteCard: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#e6f9f0', borderRadius: theme.borderRadius.sm,
        padding: 10, marginBottom: 8,
    },
    aiNoteText: { fontSize: 12, fontWeight: '500', color: theme.colors.primary },
    aiErrorText: { fontSize: 11, color: '#d97706', marginBottom: 8, fontWeight: '500' },
});
