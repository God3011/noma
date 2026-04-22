import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Animated,
    Modal, TextInput, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import NutritionRatingBadge from '../../components/foodrating/NutritionRatingBadge';
import NutritionRow from '../../components/foodrating/NutritionRow';
import AIMarkerBadge from '../../components/foodrating/AIMarkerBadge';
import { FoodRatingStackParamList } from '../../navigation/FoodRatingNavigator';
import { useFoodLogStore } from '../../store/useFoodLogStore';
import { MealType } from '../../types/food';
import { generateId } from '../../utils/generateId';
import { getToday } from '../../utils/dateHelpers';

type Nav = StackNavigationProp<FoodRatingStackParamList, 'ProductResult'>;
type Route = RouteProp<FoodRatingStackParamList, 'ProductResult'>;

const RATING_DESCRIPTIONS: Record<string, string> = {
    A: 'Excellent nutritional quality',
    B: 'Good nutritional quality',
    C: 'Average nutritional quality',
    D: 'Poor nutritional quality',
    E: 'Very poor nutritional quality',
};

const RATING_BG: Record<string, string> = {
    A: '#1a4d2e', B: '#3f4b23', C: '#653e00', D: '#6b3622', E: '#93000a',
};


interface BubbleData {
    label: string;
    value: number;
    unit: string;
    color: string;
    maxVal: number;
    delay: number;
}

const ClusterBubble = ({
    label, value, unit, color, delay, size, x, y,
}: BubbleData & { size: number; x: number; y: number }) => {
    const floatAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const float = Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: 2600 + Math.random() * 900,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 2600 + Math.random() * 900,
                    useNativeDriver: true,
                }),
            ])
        );
        setTimeout(() => float.start(), delay);
        return () => float.stop();
    }, [floatAnim, delay]);

    const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });

    return (
        <Animated.View style={{
            position: 'absolute', left: x, top: y,
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: color,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
            elevation: 8,
            transform: [{ translateY }],
        }}>
            <Text style={{
                color: '#fff',
                fontSize: size > 95 ? 15 : 11,
                fontWeight: '800',
            }}>
                {Math.round(value)}{unit}
            </Text>
            <Text style={{
                color: 'rgba(255,255,255,0.75)',
                fontSize: size > 95 ? 10 : 8,
                fontWeight: '600',
                marginTop: 1,
            }} numberOfLines={1}>
                {label}
            </Text>
        </Animated.View>
    );
};

const CLUSTER_SIZE = 310;
const OVERLAP = -10; // negative = gap between bubbles

const BubbleCluster = ({ bubbles }: { bubbles: BubbleData[] }) => {
    if (bubbles.length === 0) return null;

    const sized = bubbles.map(b => {
        const safe = isNaN(b.value) ? 0 : Math.max(0, b.value);
        const ratio = Math.max(0.18, Math.min(1, Math.sqrt(safe / b.maxVal)));
        const size = 64 + ratio * 58;
        return { ...b, size };
    }).sort((a, b) => b.size - a.size);

    const [center, ...rest] = sized;
    const cx = CLUSTER_SIZE / 2;
    const cy = CLUSTER_SIZE / 2;

    return (
        <View style={{ width: CLUSTER_SIZE, height: CLUSTER_SIZE }}>
            {/* Surrounding bubbles first so center renders on top */}
            {rest.map((b, i) => {
                const angle = (i * 2 * Math.PI / rest.length) - Math.PI / 2;
                const dist = center.size / 2 + b.size / 2 - OVERLAP;
                return (
                    <ClusterBubble
                        key={b.label}
                        {...b}
                        x={cx + Math.cos(angle) * dist - b.size / 2}
                        y={cy + Math.sin(angle) * dist - b.size / 2}
                    />
                );
            })}
            {/* Center (largest) bubble on top */}
            <ClusterBubble
                {...center}
                x={cx - center.size / 2}
                y={cy - center.size / 2}
            />
        </View>
    );
};

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function ProductResultScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<Route>();
    const { product } = route.params;
    const { nutrition: n } = product;
    const addMeal = useFoodLogStore((s) => s.addMeal);

    const [logModalVisible, setLogModalVisible] = useState(false);
    const [servingGrams, setServingGrams] = useState('100');
    const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');

    const handleLog = () => {
        const grams = parseFloat(servingGrams) || 100;
        const ratio = grams / 100;
        addMeal({
            id: generateId(),
            date: getToday(),
            name: product.brand ? `${product.name} (${product.brand})` : product.name,
            calories: Math.round(n.calories_per_100g * ratio),
            protein_g: Math.round((n.protein_g ?? 0) * ratio * 10) / 10,
            carbs_g: Math.round((n.carbs_g ?? 0) * ratio * 10) / 10,
            fat_g: Math.round((n.fat_g ?? 0) * ratio * 10) / 10,
            meal_type: selectedMealType,
            logged_at: new Date().toISOString(),
        });
        setLogModalVisible(false);
        Alert.alert('Logged!', `${product.name} added to your ${selectedMealType}.`);
    };

    const bubbles: BubbleData[] = [
        ...(n.calories_per_100g > 0 ? [{ label: 'Calories', value: n.calories_per_100g, unit: 'kcal', color: theme.colors.secondaryContainer, maxVal: 500, delay: 0 }] : []),
        ...(Number(n.carbs_g) > 0 ? [{ label: 'Carbs', value: Number(n.carbs_g), unit: 'g', color: theme.colors.tertiary, maxVal: 100, delay: 200 }] : []),
        ...(Number(n.protein_g) > 0 ? [{ label: 'Protein', value: Number(n.protein_g), unit: 'g', color: theme.colors.primary, maxVal: 100, delay: 400 }] : []),
        ...(Number(n.fat_g) > 0 ? [{ label: 'Fat', value: Number(n.fat_g), unit: 'g', color: theme.colors.outline, maxVal: 100, delay: 100 }] : []),
        ...(Number(n.sugar_g) > 0 ? [{ label: 'Sugar', value: Number(n.sugar_g), unit: 'g', color: theme.colors.danger, maxVal: 50, delay: 500 }] : []),
        ...(Number(n.sodium_mg) > 0 ? [{ label: 'Sodium', value: Number(n.sodium_mg), unit: 'mg', color: theme.colors.onSurfaceVariant, maxVal: 1500, delay: 300 }] : []),
        ...(Number(n.fiber_g) > 0 ? [{ label: 'Fiber', value: Number(n.fiber_g), unit: 'g', color: theme.colors.success, maxVal: 30, delay: 600 }] : []),
    ];

    return (
        <LinearGradient
            colors={[`${theme.colors.primaryContainer}80`, theme.colors.background]}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nutrition Score</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {product.source === 'ai' && (
                    <AIMarkerBadge
                        confidence={product.gemini_confidence}
                        notes={product.gemini_notes}
                    />
                )}

                {product.source === 'noma_verified' && (
                    <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>✓ NOMA Verified</Text>
                    </View>
                )}

                {/* Product identity */}
                <View style={styles.productCard}>
                    <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                        {product.brand ? <Text style={styles.brandName}>{product.brand}</Text> : null}
                        <Text style={styles.barcode}>Barcode: {product.barcode}</Text>
                    </View>
                    <View style={styles.sourcePill}>
                        <Ionicons
                            name={
                                product.source === 'noma_verified' ? 'shield-checkmark'
                                : product.source === 'database' ? 'cloud-done-outline'
                                : 'sparkles'
                            }
                            size={12}
                            color={
                                product.source === 'noma_verified' ? '#00E5A0'
                                : product.source === 'database' ? theme.colors.primary
                                : '#7c3aed'
                            }
                        />
                        <Text style={[
                            styles.sourceText,
                            product.source === 'ai' && { color: '#7c3aed' },
                            product.source === 'noma_verified' && { color: '#00E5A0' },
                        ]}>
                            {product.source === 'noma_verified' ? 'NOMA Verified'
                                : product.source === 'database' ? 'Open Food Facts'
                                : 'AI Estimated'}
                        </Text>
                    </View>
                </View>

                {/* Rating hero */}
                <View style={[styles.ratingCard, { backgroundColor: RATING_BG[product.rating] ?? '#f9fafb' }]}>
                    <NutritionRatingBadge rating={product.rating} size="large" />
                    <View style={styles.ratingText}>
                        <Text style={styles.ratingGrade}>Grade {product.rating}</Text>
                        <Text style={styles.ratingDesc}>{RATING_DESCRIPTIONS[product.rating]}</Text>
                    </View>
                </View>

                {/* Nutrition Profile bubble cluster — hide entirely when no non-zero values */}
                {bubbles.length > 0 && (
                    <View style={styles.fullScreenBubbles}>
                        <Text style={styles.bubblesHeaderTitle}>Nutrition Profile</Text>
                        <BubbleCluster bubbles={bubbles} />
                    </View>
                )}

                {/* Reasons */}
                {product.rating_reasons.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Why this rating?</Text>
                        <View style={styles.card}>
                            {product.rating_reasons.map((reason, i) => (
                                <View key={i} style={[styles.reasonRow, i > 0 && styles.reasonBorder]}>
                                    <Ionicons
                                        name={
                                            reason.toLowerCase().includes('good') ||
                                                reason.toLowerCase().includes('high in fiber') ||
                                                reason.toLowerCase().includes('low in')
                                                ? 'checkmark-circle'
                                                : 'alert-circle'
                                        }
                                        size={16}
                                        color={
                                            reason.toLowerCase().includes('good') ||
                                                reason.toLowerCase().includes('high in fiber') ||
                                                reason.toLowerCase().includes('low in')
                                                ? theme.colors.success
                                                : theme.colors.warning
                                        }
                                    />
                                    <Text style={styles.reasonText}>{reason}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* Log to Food Log */}
                <TouchableOpacity style={styles.logBtn} onPress={() => setLogModalVisible(true)}>
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                    <Text style={styles.logBtnText}>Log to Food Log</Text>
                </TouchableOpacity>

                {/* Scan again */}
                <TouchableOpacity style={styles.scanAgainBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="barcode-outline" size={20} color="#fff" />
                    <Text style={styles.scanAgainText}>Scan Another</Text>
                </TouchableOpacity>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Log Modal */}
            <Modal visible={logModalVisible} transparent animationType="slide">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLogModalVisible(false)}>
                    <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Log to Food Log</Text>
                        <Text style={styles.modalProduct} numberOfLines={1}>{product.name}</Text>

                        <Text style={styles.modalLabel}>Serving size (grams)</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={servingGrams}
                            onChangeText={setServingGrams}
                            keyboardType="decimal-pad"
                            placeholderTextColor={theme.colors.textMuted}
                            selectTextOnFocus
                        />

                        {/* Calories preview */}
                        <Text style={styles.modalCalPreview}>
                            ≈ {Math.round(n.calories_per_100g * (parseFloat(servingGrams) || 100) / 100)} kcal
                        </Text>

                        <Text style={styles.modalLabel}>Meal type</Text>
                        <View style={styles.mealTypeRow}>
                            {MEAL_TYPES.map((mt) => (
                                <TouchableOpacity
                                    key={mt}
                                    style={[styles.mealTypeChip, selectedMealType === mt && styles.mealTypeChipActive]}
                                    onPress={() => setSelectedMealType(mt)}
                                >
                                    <Text style={[styles.mealTypeText, selectedMealType === mt && styles.mealTypeTextActive]}>
                                        {mt.charAt(0).toUpperCase() + mt.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.modalLogBtn} onPress={handleLog}>
                            <Text style={styles.modalLogBtnText}>Add to Log</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
        backgroundColor: 'transparent',
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: theme.colors.surfaceContainerLow,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.textPrimary },

    scroll: { paddingHorizontal: 20, paddingTop: 4 },

    productCard: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md,
        padding: 18, marginBottom: 12,
    },
    productInfo: { marginBottom: 10 },
    productName: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 4 },
    brandName: { fontSize: 13, fontWeight: '500', color: theme.colors.textSecondary, marginBottom: 2 },
    barcode: { fontSize: 11, color: theme.colors.textMuted },
    sourcePill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.surfaceContainerLow,
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: theme.borderRadius.pill,
    },
    sourceText: { fontSize: 11, fontWeight: '600', color: theme.colors.primary },

    ratingCard: {
        borderRadius: theme.borderRadius.md,
        padding: 20, marginBottom: 20,
        flexDirection: 'row', alignItems: 'center', gap: 20,
    },
    ratingText: { flex: 1 },
    ratingGrade: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 4 },
    ratingDesc: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },

    sectionTitle: {
        fontSize: 11, fontWeight: '700', color: theme.colors.primary,
        letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10,
    },
    card: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: 16, paddingVertical: 4,
        marginBottom: 20,
    },
    fullScreenBubbles: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
        paddingTop: 32,
        paddingBottom: 40,
        marginBottom: 20,
        alignItems: 'center',
    },
    bubblesHeaderTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.textWhite,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 24,
    },

    reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    reasonBorder: { borderTopWidth: 1, borderTopColor: theme.colors.surfaceContainerLow },
    reasonText: { fontSize: 14, color: theme.colors.textSecondary, flex: 1, fontWeight: '500' },

    scanAgainBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: theme.colors.primary,
        borderRadius: 30,
        paddingHorizontal: 32,
        paddingVertical: 18,
        alignSelf: 'center',
        marginTop: 10,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    scanAgainText: { color: '#fff', fontSize: 16, fontWeight: '800' },

    logBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: theme.colors.primaryContainer,
        borderRadius: 30,
        paddingHorizontal: 32, paddingVertical: 16,
        alignSelf: 'center', marginBottom: 12,
        borderWidth: 1, borderColor: theme.colors.primary,
    },
    logBtnText: { color: theme.colors.primary, fontSize: 15, fontWeight: '700' },

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: theme.colors.surfaceContainerLow,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        padding: 24, paddingBottom: 40,
    },
    modalHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: theme.colors.outlineVariant,
        alignSelf: 'center', marginBottom: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 4 },
    modalProduct: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 20 },
    modalLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
    modalInput: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary,
        borderWidth: 1, borderColor: theme.colors.outlineVariant,
        marginBottom: 8,
    },
    modalCalPreview: { fontSize: 13, color: theme.colors.primary, fontWeight: '600', marginBottom: 20 },
    mealTypeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 24 },
    mealTypeChip: {
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: theme.borderRadius.pill,
        borderWidth: 1, borderColor: theme.colors.outlineVariant,
    },
    mealTypeChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    mealTypeText: { fontSize: 13, fontWeight: '500', color: theme.colors.textSecondary },
    mealTypeTextActive: { color: '#fff', fontWeight: '700' },
    modalLogBtn: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.pill,
        paddingVertical: 16, alignItems: 'center',
    },
    modalLogBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

    verifiedBadge: {
        margin: 16,
        padding: 10,
        backgroundColor: '#0A2A1A',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#00E5A0',
        flexDirection: 'row',
        alignItems: 'center',
    },
    verifiedText: {
        color: '#00E5A0',
        fontWeight: '700',
        fontSize: 13,
    },
});
