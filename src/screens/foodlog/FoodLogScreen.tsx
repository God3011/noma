import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, TextInput, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/types';
import { useFoodLogStore } from '../../store/useFoodLogStore';
import { useUserStore } from '../../store/useUserStore';
import { MealItem } from '../../components/foodlog/MealItem';
import { getToday, getPrevDay, formatDate } from '../../utils/dateHelpers';
import { MealType } from '../../types/food';
import { theme } from '../../constants/theme';
import { loadHistory } from '../../services/scanHistoryService';
import { ScanHistoryItem } from '../../types/foodRating';
import { generateId } from '../../utils/generateId';

type Nav = StackNavigationProp<RootStackParamList>;

const MEAL_SECTIONS: { type: MealType; label: string }[] = [
    { type: 'breakfast', label: 'Breakfast' },
    { type: 'lunch', label: 'Lunch' },
    { type: 'dinner', label: 'Dinner' },
    { type: 'snack', label: 'Snacks' },
];

export function FoodLogScreen() {
    const navigation = useNavigation<Nav>();
    const [selectedDate, setSelectedDate] = useState(getToday());
    const meals = useFoodLogStore((s) => s.meals);
    const deleteMeal = useFoodLogStore((s) => s.deleteMeal);
    const addMeal = useFoodLogStore((s) => s.addMeal);
    const plan = useUserStore((s) => s.plan);

    const [showRecentScans, setShowRecentScans] = useState(false);
    const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([]);
    const [scanSearch, setScanSearch] = useState('');
    const [mealPickerItem, setMealPickerItem] = useState<ScanHistoryItem | null>(null);

    const dayMeals = useMemo(() => meals.filter((m) => m.date === selectedDate), [meals, selectedDate]);
    const totalCalories = dayMeals.reduce((s, m) => s + m.calories, 0);
    const totalProtein = dayMeals.reduce((s, m) => s + m.protein_g, 0);
    const totalCarbs = dayMeals.reduce((s, m) => s + m.carbs_g, 0);
    const totalFat = dayMeals.reduce((s, m) => s + m.fat_g, 0);
    const target = plan?.daily_calories || 2000;
    const progress = Math.min(100, Math.round((totalCalories / target) * 100));

    const toggleRecentScans = async () => {
        if (!showRecentScans) {
            const history = await loadHistory();
            setRecentScans(history);
        }
        setShowRecentScans(!showRecentScans);
        setScanSearch('');
    };

    const filteredScans = recentScans.filter((s) =>
        s.product.name.toLowerCase().includes(scanSearch.toLowerCase())
    );

    const addScannedProduct = (item: ScanHistoryItem) => {
        setMealPickerItem(item);
    };

    const confirmMealType = (type: MealType) => {
        if (!mealPickerItem) return;
        const n = mealPickerItem.product.nutrition;
        addMeal({
            id: generateId(),
            date: selectedDate,
            name: mealPickerItem.product.name,
            calories: Math.round(n.calories_per_100g),
            protein_g: Math.round(n.protein_g),
            carbs_g: Math.round(n.carbs_g),
            fat_g: Math.round(n.fat_g),
            meal_type: type,
            logged_at: new Date().toISOString(),
        });
        setMealPickerItem(null);
        setShowRecentScans(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <Text style={styles.brandTag}>NOMA</Text>
                    <Text style={styles.title}>Daily Log</Text>
                </View>

                {/* Date Picker — no next arrow on today */}
                <View style={styles.datePicker}>
                    <TouchableOpacity onPress={() => setSelectedDate(getPrevDay(selectedDate))}>
                        <Ionicons name="chevron-back" size={22} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelectedDate(getToday())}>
                        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                    </TouchableOpacity>
                    {selectedDate < getToday() ? (
                        <TouchableOpacity onPress={() => setSelectedDate(getNextDayOf(selectedDate))}>
                            <Ionicons name="chevron-forward" size={22} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 22 }} />
                    )}
                </View>

                {/* Hero Progress — smaller */}
                <View style={styles.heroCard}>
                    <View style={styles.heroTop}>
                        <View>
                            <Text style={styles.heroLabel}>DAILY VITALITY</Text>
                            <Text style={styles.heroVal}>
                                {totalCalories.toLocaleString()}{' '}
                                <Text style={styles.heroUnit}>kcal</Text>
                            </Text>
                        </View>
                        <View style={styles.remainingBox}>
                            <Text style={styles.remainingLabel}>Remaining</Text>
                            <Text style={styles.remainingVal}>{Math.max(0, target - totalCalories)}</Text>
                        </View>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` as any }]} />
                    </View>
                    <Text style={styles.progressCaption}>{progress}% of daily target</Text>
                </View>

                {/* Macros */}
                <View style={styles.macroRow}>
                    <View style={styles.macroCard}>
                        <Text style={styles.macroLabel}>Protein</Text>
                        <Text style={styles.macroVal}>{totalProtein}g</Text>
                    </View>
                    <View style={styles.macroCard}>
                        <Text style={styles.macroLabel}>Carbs</Text>
                        <Text style={styles.macroVal}>{totalCarbs}g</Text>
                    </View>
                    <View style={styles.macroCard}>
                        <Text style={styles.macroLabel}>Fat</Text>
                        <Text style={styles.macroVal}>{totalFat}g</Text>
                    </View>
                </View>

                {/* Meal Sections */}
                {dayMeals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="restaurant-outline" size={44} color={theme.colors.surfaceContainerHigh} />
                        <Text style={styles.emptyTitle}>No meals yet</Text>
                        <Text style={styles.emptyStateText}>Tap + to log your first meal</Text>
                    </View>
                ) : (
                    MEAL_SECTIONS.map(({ type, label }) => {
                        const sectionMeals = dayMeals.filter((m) => m.meal_type === type);
                        if (sectionMeals.length === 0) return null;
                        return (
                            <View key={type} style={styles.mealSection}>
                                <Text style={styles.mealSectionTitle}>{label}</Text>
                                {sectionMeals.map((meal) => (
                                    <MealItem key={meal.id} meal={meal} onDelete={deleteMeal} />
                                ))}
                            </View>
                        );
                    })
                )}

                {/* Recent Scans Button */}
                <TouchableOpacity style={styles.recentScansBtn} onPress={toggleRecentScans} activeOpacity={0.8}>
                    <Ionicons name="time-outline" size={13} color={theme.colors.primary} />
                    <Text style={styles.recentScansBtnText}>Recent Scans</Text>
                    <Ionicons name={showRecentScans ? 'chevron-up' : 'chevron-down'} size={12} color={theme.colors.textMuted} />
                </TouchableOpacity>

                {/* Recent Scans Panel */}
                {showRecentScans && (
                    <View style={styles.recentPanel}>
                        <View style={styles.searchRow}>
                            <Ionicons name="search-outline" size={15} color={theme.colors.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                value={scanSearch}
                                onChangeText={setScanSearch}
                                placeholder="Search scanned foods..."
                                placeholderTextColor={theme.colors.textMuted}
                            />
                        </View>
                        {filteredScans.length === 0 ? (
                            <Text style={styles.noScans}>No recent scans found</Text>
                        ) : (
                            filteredScans.slice(0, 8).map((item, i) => (
                                <TouchableOpacity key={i} style={styles.scanItem} onPress={() => addScannedProduct(item)} activeOpacity={0.8}>
                                    <View style={styles.scanItemLeft}>
                                        <Text style={styles.scanItemName} numberOfLines={1}>{item.product.name}</Text>
                                        <Text style={styles.scanItemCal}>{Math.round(item.product.nutrition.calories_per_100g)} kcal / 100g</Text>
                                    </View>
                                    <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddMeal')} activeOpacity={0.85}>
                <LinearGradient colors={['#CC5500', '#FF6B00']} style={styles.fabGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="add" size={28} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>

            {/* Meal Type Picker Modal */}
            <Modal
                visible={!!mealPickerItem}
                transparent
                animationType="fade"
                onRequestClose={() => setMealPickerItem(null)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMealPickerItem(null)}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Add to Meal</Text>
                        <Text style={styles.modalProduct} numberOfLines={1}>{mealPickerItem?.product.name}</Text>
                        <View style={styles.modalGrid}>
                            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={styles.modalMealBtn}
                                    onPress={() => confirmMealType(type)}
                                    activeOpacity={0.75}
                                >
                                    <Ionicons
                                        name={type === 'breakfast' ? 'sunny-outline' : type === 'lunch' ? 'restaurant-outline' : type === 'dinner' ? 'moon-outline' : 'cafe-outline'}
                                        size={18}
                                        color={theme.colors.primary}
                                    />
                                    <Text style={styles.modalMealText}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.modalCancel} onPress={() => setMealPickerItem(null)} activeOpacity={0.7}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

function getNextDayOf(date: string) {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { paddingHorizontal: 20, paddingTop: 60 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.5 },
    brandTag: { fontSize: 20, fontWeight: '900', color: theme.colors.primary, letterSpacing: 2 },
    datePicker: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, paddingVertical: 8, paddingHorizontal: 16,
        backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: theme.borderRadius.pill,
    },
    dateText: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary },
    heroCard: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md, padding: 14, marginBottom: 12,
    },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    heroLabel: { fontSize: 9, fontWeight: '700', color: theme.colors.primary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
    heroVal: { fontSize: 26, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.5 },
    heroUnit: { fontSize: 13, fontWeight: '400', color: theme.colors.textMuted },
    remainingBox: { backgroundColor: theme.colors.surfaceContainerLow, borderRadius: theme.borderRadius.sm, padding: 10, alignItems: 'center' },
    remainingLabel: { fontSize: 10, fontWeight: '600', color: theme.colors.textMuted },
    remainingVal: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary },
    progressBarBg: { height: 5, backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3, backgroundColor: theme.colors.primary },
    progressCaption: { fontSize: 10, color: theme.colors.textMuted, marginTop: 5 },
    macroRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    macroCard: { flex: 1, backgroundColor: theme.colors.surfaceContainerLow, borderRadius: theme.borderRadius.sm, padding: 10, alignItems: 'center' },
    macroLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
    macroVal: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary },
    mealSection: { marginBottom: 14 },
    mealSectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 8 },
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textSecondary },
    emptyStateText: { fontSize: 13, color: theme.colors.textMuted },
    recentScansBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        alignSelf: 'flex-start', marginTop: 4, marginBottom: 8,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.pill,
        paddingHorizontal: 12, paddingVertical: 6,
    },
    recentScansBtnText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
    recentPanel: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md, padding: 12, marginBottom: 12,
    },
    searchRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10,
    },
    searchInput: { flex: 1, fontSize: 13, color: theme.colors.textPrimary },
    noScans: { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center', paddingVertical: 12 },
    scanItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant,
    },
    scanItemLeft: { flex: 1, marginRight: 10 },
    scanItemName: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary },
    scanItemCal: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
    fab: { position: 'absolute', bottom: 100, right: 20, zIndex: 10 },
    fabGradient: {
        width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
        shadowColor: '#FF6B00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.72)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: theme.colors.surfaceContainerLow,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 36,
    },
    modalHandle: {
        width: 36, height: 4, borderRadius: 2,
        backgroundColor: theme.colors.outlineVariant,
        alignSelf: 'center', marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary,
        marginBottom: 4,
    },
    modalProduct: {
        fontSize: 12, color: theme.colors.textMuted, marginBottom: 20,
    },
    modalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    modalMealBtn: {
        width: '47.5%', flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: 14, paddingVertical: 14,
        borderWidth: 1, borderColor: theme.colors.outlineVariant,
    },
    modalMealText: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
    modalCancel: {
        alignItems: 'center', paddingVertical: 12,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    modalCancelText: { fontSize: 14, fontWeight: '600', color: theme.colors.textMuted },
});
