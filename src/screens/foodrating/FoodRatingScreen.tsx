import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { loadHistory, formatScanTime } from '../../services/scanHistoryService';
import NutritionRatingBadge from '../../components/foodrating/NutritionRatingBadge';
import { theme } from '../../constants/theme';
import { ScanHistoryItem } from '../../types/foodRating';
import { FoodRatingStackParamList } from '../../navigation/FoodRatingNavigator';

type Nav = StackNavigationProp<FoodRatingStackParamList, 'FoodRatingHome'>;

export default function FoodRatingScreen() {
    const navigation = useNavigation<Nav>();
    const isFocused = useIsFocused();
    const [history, setHistory] = useState<ScanHistoryItem[]>([]);

    useEffect(() => {
        if (isFocused) {
            loadHistory().then(setHistory);
        }
    }, [isFocused]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Food Rating</Text>
                    <Text style={styles.subtitle}>Scan any packaged food to get a nutrition score</Text>
                </View>

                {/* Scan button */}
                <TouchableOpacity
                    style={styles.scanBtnWrap}
                    onPress={() => navigation.navigate('Scanner')}
                    activeOpacity={0.88}
                >
                    <LinearGradient
                        colors={['#006c49', '#10b981']}
                        style={styles.scanBtn}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="barcode-outline" size={52} color="#fff" />
                        <Text style={styles.scanBtnText}>Scan Barcode</Text>
                        <Text style={styles.scanBtnSub}>Point at any packaged food product</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Rating legend */}
                <View style={styles.legendCard}>
                    <Text style={styles.legendTitle}>Rating Guide</Text>
                    <View style={styles.legendRow}>
                        {(['A', 'B', 'C', 'D', 'E'] as const).map((r) => (
                            <View key={r} style={styles.legendItem}>
                                <NutritionRatingBadge rating={r} size="small" />
                                <Text style={styles.legendLabel}>{RATING_LABELS[r]}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Recent scans */}
                {history.length > 0 && (
                    <View style={styles.historySection}>
                        <Text style={styles.sectionTitle}>Recent Scans</Text>
                        {history.slice(0, 5).map((item, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.historyItem}
                                onPress={() => navigation.navigate('ProductResult', { product: item.product })}
                                activeOpacity={0.75}
                            >
                                <View style={styles.historyLeft}>
                                    <Text style={styles.historyName} numberOfLines={1}>
                                        {item.product.name}
                                    </Text>
                                    <Text style={styles.historyBrand} numberOfLines={1}>
                                        {item.product.brand || 'Unknown brand'}
                                    </Text>
                                    <View style={styles.historyMeta}>
                                        <Ionicons
                                            name={item.product.source === 'database' ? 'cloud-done-outline' : 'sparkles'}
                                            size={11}
                                            color={item.product.source === 'database' ? theme.colors.textMuted : '#7c3aed'}
                                        />
                                        <Text style={styles.historyTime}>{formatScanTime(item.scanned_at)}</Text>
                                    </View>
                                </View>
                                <View style={styles.historyRight}>
                                    <NutritionRatingBadge rating={item.product.rating} size="small" />
                                    <Ionicons name="chevron-forward" size={14} color={theme.colors.textMuted} style={{ marginTop: 4 }} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
}

const RATING_LABELS: Record<string, string> = {
    A: 'Excellent', B: 'Good', C: 'Average', D: 'Poor', E: 'Very Poor',
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { paddingHorizontal: 20, paddingTop: 60 },

    header: { marginBottom: 24 },
    title: { fontSize: 26, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: theme.colors.textMuted, marginTop: 4, fontWeight: '500' },

    scanBtnWrap: { marginBottom: 20 },
    scanBtn: {
        borderRadius: theme.borderRadius.lg,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#006c49',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    scanBtnText: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 12 },
    scanBtnSub:  { color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 4, fontWeight: '500' },

    legendCard: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md,
        padding: 16, marginBottom: 20,
    },
    legendTitle: {
        fontSize: 11, fontWeight: '700', color: theme.colors.primary,
        letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12,
    },
    legendRow: { flexDirection: 'row', justifyContent: 'space-between' },
    legendItem: { alignItems: 'center', gap: 6 },
    legendLabel: { fontSize: 10, fontWeight: '600', color: theme.colors.textMuted },

    historySection: {},
    sectionTitle: {
        fontSize: 11, fontWeight: '700', color: theme.colors.primary,
        letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10,
    },
    historyItem: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md,
        padding: 14, marginBottom: 8,
        flexDirection: 'row', alignItems: 'center',
    },
    historyLeft: { flex: 1, marginRight: 12 },
    historyName:  { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 2 },
    historyBrand: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 },
    historyMeta:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
    historyTime:  { fontSize: 11, color: theme.colors.textMuted },
    historyRight: { alignItems: 'center', gap: 2 },
});
