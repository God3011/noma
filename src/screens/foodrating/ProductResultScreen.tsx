import React from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Animated,
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
    A: '#005236', B: '#3f4b23', C: '#653e00', D: '#6b3622', E: '#93000a',
};

const HoverBubble = ({ label, value, unit, color, maxVal, delay = 0 }: any) => {
    const safeValue = (value == null || isNaN(value)) ? 0 : Number(value);
    const ratio = Math.max(0.15, Math.min(1, Math.sqrt(Math.max(0, safeValue) / maxVal)));
    const size = 65 + ratio * 60;

    const floatAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const float = Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: 2500 + Math.random() * 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 2500 + Math.random() * 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        setTimeout(() => float.start(), delay);
        return () => float.stop();
    }, [floatAnim, delay]);

    const translateY = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -10]
    });

    return (
        <Animated.View key={label} style={{
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: color, alignItems: 'center', justifyContent: 'center',
            margin: 4, shadowColor: color, shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
            transform: [{ translateY }]
        }}>
            <Text style={{ color: '#fff', fontSize: size > 90 ? 16 : 12, fontWeight: '800' }}>{Math.round(safeValue)}{unit}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: size > 90 ? 11 : 9, fontWeight: '600', marginTop: 1 }} numberOfLines={1}>{label}</Text>
        </Animated.View>
    );
};

export default function ProductResultScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<Route>();
    const { product } = route.params;
    const { nutrition: n } = product;

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

                {/* Product identity */}
                <View style={styles.productCard}>
                    <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                        {product.brand ? <Text style={styles.brandName}>{product.brand}</Text> : null}
                        <Text style={styles.barcode}>Barcode: {product.barcode}</Text>
                    </View>
                    <View style={styles.sourcePill}>
                        <Ionicons
                            name={product.source === 'database' ? 'cloud-done-outline' : 'sparkles'}
                            size={12}
                            color={product.source === 'database' ? theme.colors.primary : '#7c3aed'}
                        />
                        <Text style={[styles.sourceText, product.source === 'ai' && { color: '#7c3aed' }]}>
                            {product.source === 'database' ? 'Open Food Facts' : 'AI Estimated'}
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

                {/* Full Screen Nutrition Layout */}
                <View style={styles.fullScreenBubbles}>
                    <Text style={styles.bubblesHeaderTitle}>Nutrition Profile</Text>
                    <View style={styles.bubblesContainer}>
                        {(n.calories_per_100g > 0) && <HoverBubble label="Calories" value={n.calories_per_100g} unit="kcal" color={theme.colors.secondaryContainer} maxVal={500} delay={0} />}
                        {(Number(n.carbs_g) > 0) && <HoverBubble label="Carbs" value={n.carbs_g} unit="g" color={theme.colors.tertiary} maxVal={100} delay={200} />}
                        {(Number(n.protein_g) > 0) && <HoverBubble label="Protein" value={n.protein_g} unit="g" color={theme.colors.primary} maxVal={100} delay={400} />}
                        {(Number(n.fat_g) > 0) && <HoverBubble label="Fat" value={n.fat_g} unit="g" color={theme.colors.outline} maxVal={100} delay={100} />}
                        {(Number(n.sugar_g) > 0) && <HoverBubble label="Sugar" value={n.sugar_g} unit="g" color={theme.colors.danger} maxVal={50} delay={500} />}
                        {(Number(n.sodium_mg) > 0) && <HoverBubble label="Sodium" value={n.sodium_mg} unit="mg" color={theme.colors.onSurfaceVariant} maxVal={1500} delay={300} />}
                        {(Number(n.fiber_g) > 0) && <HoverBubble label="Fiber" value={n.fiber_g} unit="g" color={theme.colors.success} maxVal={30} delay={600} />}
                    </View>
                </View>

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

                {/* Scan again */}
                <TouchableOpacity style={styles.scanAgainBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="barcode-outline" size={20} color="#fff" />
                    <Text style={styles.scanAgainText}>Scan Another</Text>
                </TouchableOpacity>

                <View style={{ height: 120 }} />
            </ScrollView>
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
        marginHorizontal: -20, // go edge-to-edge ignoring scroll view padding
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
    bubblesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },

    reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    reasonBorder: { borderTopWidth: 1, borderTopColor: theme.colors.surfaceContainerLow },
    reasonText: { fontSize: 14, color: theme.colors.textSecondary, flex: 1, fontWeight: '500' },

    scanAgainBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: theme.colors.primary,
        borderRadius: 30, // pill radius to make it hover-style
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
});
