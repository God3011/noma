import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, KeyboardAvoidingView, Platform, TextInput, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { generateId } from '../../utils/generateId';
import { estimateFromText } from '../../utils/foodEstimator';
import { estimateWithAI } from '../../utils/aiEstimator';
import { useFoodLogStore } from '../../store/useFoodLogStore';
import { useSavedMealsStore } from '../../store/useSavedMealsStore';
import { getToday } from '../../utils/dateHelpers';
import { MealType } from '../../types/food';
import { theme } from '../../constants/theme';

const MEAL_TYPES: { type: MealType; label: string }[] = [
    { type: 'breakfast', label: 'Breakfast' },
    { type: 'lunch', label: 'Lunch' },
    { type: 'dinner', label: 'Dinner' },
    { type: 'snack', label: 'Snack' },
];

export function AddMealScreen() {
    const navigation = useNavigation();
    const addMeal = useFoodLogStore((s) => s.addMeal);
    const savedMeals = useSavedMealsStore((s) => s.savedMeals);

    const [mealType, setMealType] = useState<MealType>('lunch');

    // AI estimate state
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiError, setAiError] = useState('');
    const [estimateReady, setEstimateReady] = useState(false);

    // AI estimate editable fields
    const [aiName, setAiName] = useState('');
    const [aiCalories, setAiCalories] = useState('');
    const [aiProtein, setAiProtein] = useState('');
    const [aiCarbs, setAiCarbs] = useState('');
    const [aiFat, setAiFat] = useState('');

    // Manual entry fields (independent)
    const [manualOpen, setManualOpen] = useState(false);
    const [manualName, setManualName] = useState('');
    const [manualCalories, setManualCalories] = useState('');
    const [manualProtein, setManualProtein] = useState('');
    const [manualCarbs, setManualCarbs] = useState('');
    const [manualFat, setManualFat] = useState('');

    const handleEstimate = useCallback(async () => {
        if (description.trim().length < 3) return;
        setLoading(true);
        setEstimateReady(false);
        setAiError('');

        try {
            const aiResult = await estimateWithAI(description.trim());
            if (aiResult) {
                setAiName(aiResult.items);
                setAiCalories(aiResult.calories.toString());
                setAiProtein(aiResult.protein_g.toString());
                setAiCarbs(aiResult.carbs_g.toString());
                setAiFat(aiResult.fat_g.toString());
                setEstimateReady(true);
                setLoading(false);
                return;
            }
            setAiError('AI unavailable — using local estimation');
        } catch (e: any) {
            setAiError(`AI error: ${e?.message || 'unknown'}`);
        }

        const localResult = estimateFromText(description.trim());
        if (localResult) {
            setAiName(localResult.matchedItem);
            setAiCalories(localResult.calories.toString());
            setAiProtein(localResult.protein_g.toString());
            setAiCarbs(localResult.carbs_g.toString());
            setAiFat(localResult.fat_g.toString());
            setEstimateReady(true);
        }
        setLoading(false);
    }, [description]);

    const handleLogAI = () => {
        if (!aiName.trim() || !aiCalories) return;
        addMeal({
            id: generateId(),
            date: getToday(),
            name: aiName.trim(),
            calories: parseInt(aiCalories) || 0,
            protein_g: parseInt(aiProtein) || 0,
            carbs_g: parseInt(aiCarbs) || 0,
            fat_g: parseInt(aiFat) || 0,
            meal_type: mealType,
            logged_at: new Date().toISOString(),
        });
        navigation.goBack();
    };

    const handleLogManual = () => {
        if (!manualName.trim() || !manualCalories) return;
        addMeal({
            id: generateId(),
            date: getToday(),
            name: manualName.trim(),
            calories: parseInt(manualCalories) || 0,
            protein_g: parseInt(manualProtein) || 0,
            carbs_g: parseInt(manualCarbs) || 0,
            fat_g: parseInt(manualFat) || 0,
            meal_type: mealType,
            logged_at: new Date().toISOString(),
        });
        navigation.goBack();
    };

    const canLogAI = aiName.trim().length > 0 && aiCalories.length > 0;
    const canLogManual = manualName.trim().length > 0 && manualCalories.length > 0;

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
                                            setManualName(sm.name);
                                            setManualCalories(sm.calories.toString());
                                            setManualProtein(sm.protein_g.toString());
                                            setManualCarbs(sm.carbs_g.toString());
                                            setManualFat(sm.fat_g.toString());
                                            setManualOpen(true);
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

                {/* AI Describe Section */}
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
                    {aiError ? <Text style={styles.aiErrorText}>{aiError}</Text> : null}
                </View>

                {/* Editable fields shown after estimation */}
                {estimateReady && (
                    <View style={styles.estimateResultCard}>
                        <View style={styles.estimateResultHeader}>
                            <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                            <Text style={styles.estimateResultTitle}>Nutrition Estimated — Edit if needed</Text>
                        </View>

                        <Text style={styles.fieldLabel}>Meal Name</Text>
                        <TextInput
                            style={styles.input}
                            value={aiName}
                            onChangeText={setAiName}
                            placeholder="Meal name"
                            placeholderTextColor={theme.colors.textMuted}
                        />

                        <Text style={styles.fieldLabel}>Calories</Text>
                        <TextInput
                            style={styles.input}
                            value={aiCalories}
                            onChangeText={setAiCalories}
                            placeholder="0 kcal"
                            placeholderTextColor={theme.colors.textMuted}
                            keyboardType="numeric"
                        />

                        <Text style={styles.fieldLabel}>Macros</Text>
                        <View style={styles.macroRow}>
                            <View style={styles.macroInputWrap}>
                                <Text style={styles.macroInputLabel}>Protein (g)</Text>
                                <TextInput
                                    style={styles.macroInput}
                                    value={aiProtein}
                                    onChangeText={setAiProtein}
                                    placeholder="0"
                                    placeholderTextColor={theme.colors.textMuted}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.macroInputWrap}>
                                <Text style={styles.macroInputLabel}>Carbs (g)</Text>
                                <TextInput
                                    style={styles.macroInput}
                                    value={aiCarbs}
                                    onChangeText={setAiCarbs}
                                    placeholder="0"
                                    placeholderTextColor={theme.colors.textMuted}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.macroInputWrap}>
                                <Text style={styles.macroInputLabel}>Fat (g)</Text>
                                <TextInput
                                    style={styles.macroInput}
                                    value={aiFat}
                                    onChangeText={setAiFat}
                                    placeholder="0"
                                    placeholderTextColor={theme.colors.textMuted}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.logBtn, !canLogAI && styles.logBtnDisabled]}
                            onPress={handleLogAI}
                            disabled={!canLogAI}
                        >
                            <Ionicons name="add-circle" size={18} color="#fff" />
                            <Text style={styles.logBtnText}>Log Food</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Manual Entry Dropdown */}
                <TouchableOpacity
                    style={styles.manualHeader}
                    onPress={() => setManualOpen(!manualOpen)}
                    activeOpacity={0.7}
                >
                    <View style={styles.manualHeaderLeft}>
                        <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                        <Text style={styles.manualTitle}>Manual Entry</Text>
                    </View>
                    <Ionicons
                        name={manualOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={theme.colors.textMuted}
                    />
                </TouchableOpacity>

                {manualOpen && (
                    <View style={styles.manualBody}>
                        <Text style={styles.fieldLabel}>Meal Name</Text>
                        <TextInput
                            style={styles.input}
                            value={manualName}
                            onChangeText={setManualName}
                            placeholder="e.g. Chicken Salad"
                            placeholderTextColor={theme.colors.textMuted}
                        />

                        <Text style={styles.fieldLabel}>Calories</Text>
                        <TextInput
                            style={styles.input}
                            value={manualCalories}
                            onChangeText={setManualCalories}
                            placeholder="0 kcal"
                            placeholderTextColor={theme.colors.textMuted}
                            keyboardType="numeric"
                        />

                        <Text style={styles.fieldLabel}>Macros (optional)</Text>
                        <View style={styles.macroRow}>
                            <View style={styles.macroInputWrap}>
                                <Text style={styles.macroInputLabel}>Protein (g)</Text>
                                <TextInput
                                    style={styles.macroInput}
                                    value={manualProtein}
                                    onChangeText={setManualProtein}
                                    placeholder="0"
                                    placeholderTextColor={theme.colors.textMuted}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.macroInputWrap}>
                                <Text style={styles.macroInputLabel}>Carbs (g)</Text>
                                <TextInput
                                    style={styles.macroInput}
                                    value={manualCarbs}
                                    onChangeText={setManualCarbs}
                                    placeholder="0"
                                    placeholderTextColor={theme.colors.textMuted}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.macroInputWrap}>
                                <Text style={styles.macroInputLabel}>Fat (g)</Text>
                                <TextInput
                                    style={styles.macroInput}
                                    value={manualFat}
                                    onChangeText={setManualFat}
                                    placeholder="0"
                                    placeholderTextColor={theme.colors.textMuted}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.logBtn, !canLogManual && styles.logBtnDisabled]}
                            onPress={handleLogManual}
                            disabled={!canLogManual}
                        >
                            <Ionicons name="add-circle" size={18} color="#fff" />
                            <Text style={styles.logBtnText}>Log Food</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 60 }} />
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

    // Saved meals
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

    // Meal type
    fieldLabel: {
        fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary,
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

    // AI describe section
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
    aiErrorText: { fontSize: 11, color: '#d97706', marginTop: 6, fontWeight: '500' },

    // Estimate result card
    estimateResultCard: {
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1, borderColor: theme.colors.primaryLight,
        padding: 16, marginBottom: 20,
    },
    estimateResultHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16,
    },
    estimateResultTitle: {
        fontSize: 13, fontWeight: '600', color: theme.colors.primary,
    },

    // Shared inputs
    input: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1, borderColor: theme.colors.outlineVariant,
        paddingHorizontal: 14, paddingVertical: 11,
        fontSize: 15, color: theme.colors.textPrimary, marginBottom: 14,
    },
    macroRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    macroInputWrap: { flex: 1 },
    macroInputLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 6 },
    macroInput: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1, borderColor: theme.colors.outlineVariant,
        paddingHorizontal: 10, paddingVertical: 10,
        fontSize: 14, color: theme.colors.textPrimary, textAlign: 'center',
    },

    // Log button
    logBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.sm,
        paddingVertical: 13, marginTop: 4,
    },
    logBtnDisabled: { opacity: 0.4 },
    logBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

    // Manual Entry accordion
    manualHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 16,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1, borderColor: theme.colors.outlineVariant,
        marginBottom: 0,
    },
    manualHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    manualTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
    manualBody: {
        backgroundColor: theme.colors.surfaceContainerLow,
        borderWidth: 1, borderTopWidth: 0, borderColor: theme.colors.outlineVariant,
        borderBottomLeftRadius: theme.borderRadius.sm, borderBottomRightRadius: theme.borderRadius.sm,
        padding: 16, marginBottom: 20,
    },
});
