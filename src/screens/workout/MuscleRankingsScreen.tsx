import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { theme } from '../../constants/theme';
import {
    computeMuscleStats,
    computeOverallXP,
    getTierForXP,
    getNextTierThreshold,
    getCurrentTierThreshold,
    TIER_COLORS,
    UPPER_BODY_MUSCLES,
    LOWER_BODY_MUSCLES,
    CORE_MUSCLES,
    ALL_MUSCLES,
    MuscleGroup,
    MuscleStats,
} from '../../utils/muscleXP';

type Tab = 'All' | 'Upper Body' | 'Lower Body' | 'Core';

const TABS: Tab[] = ['All', 'Upper Body', 'Lower Body', 'Core'];

function getMusclesForTab(tab: Tab): MuscleGroup[] {
    switch (tab) {
        case 'Upper Body': return UPPER_BODY_MUSCLES;
        case 'Lower Body': return LOWER_BODY_MUSCLES;
        case 'Core': return CORE_MUSCLES;
        default: return ALL_MUSCLES;
    }
}

function ProgressBar({ xp }: { xp: number }) {
    const current = getCurrentTierThreshold(xp);
    const next = getNextTierThreshold(xp);
    const isMax = xp >= 15000;
    const progress = isMax ? 1 : (xp - current) / (next - current);

    return (
        <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` as any }]} />
        </View>
    );
}

function TierBadge({ tier }: { tier: ReturnType<typeof getTierForXP> }) {
    const color = TIER_COLORS[tier];
    return (
        <View style={[styles.tierBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
            <Text style={[styles.tierText, { color }]}>{tier}</Text>
        </View>
    );
}

function MuscleRow({ stats }: { stats: MuscleStats }) {
    const isMax = stats.xp >= 15000;
    const next = getNextTierThreshold(stats.xp);
    const remaining = isMax ? 0 : next - stats.xp;

    return (
        <View style={styles.muscleRow}>
            <View style={styles.muscleLeft}>
                <Text style={styles.muscleName}>{stats.muscle}</Text>
                <View style={styles.muscleMetaRow}>
                    <Text style={styles.muscleXP}>{stats.xp.toLocaleString()} XP</Text>
                    {!isMax && (
                        <Text style={styles.muscleNext}>
                            {' '}· {remaining.toLocaleString()} to next tier
                        </Text>
                    )}
                </View>
                <ProgressBar xp={stats.xp} />
                <Text style={styles.muscleVolume}>
                    {stats.totalVolume.toLocaleString()} {stats.volumeUnit} total
                </Text>
            </View>
            <TierBadge tier={stats.tier} />
        </View>
    );
}

export function MuscleRankingsScreen() {
    const navigation = useNavigation();
    const workouts = useWorkoutStore((s) => s.workouts);
    const [activeTab, setActiveTab] = useState<Tab>('All');

    const stats = useMemo(() => computeMuscleStats(workouts), [workouts]);
    const overallXP = useMemo(() => computeOverallXP(stats), [stats]);
    const overallTier = getTierForXP(overallXP);
    const overallColor = TIER_COLORS[overallTier];

    const visibleMuscles = getMusclesForTab(activeTab);
    const rows = visibleMuscles.map((m) => stats[m]).sort((a, b) => b.xp - a.xp);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#1a1a1a', theme.colors.background]}
                style={styles.headerGradient}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Muscle Rankings</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Overall Rank Badge */}
                <View style={[styles.overallCard, { borderColor: overallColor + '66' }]}>
                    <LinearGradient
                        colors={[overallColor + '22', overallColor + '08']}
                        style={styles.overallGradient}
                    >
                        <View style={styles.overallLeft}>
                            <Text style={styles.overallLabel}>OVERALL RANK</Text>
                            <Text style={[styles.overallTier, { color: overallColor }]}>{overallTier}</Text>
                            <Text style={styles.overallXP}>{overallXP.toLocaleString()} avg XP</Text>
                        </View>
                        <View style={[styles.overallIcon, { backgroundColor: overallColor + '22' }]}>
                            <Ionicons name="trophy" size={32} color={overallColor} />
                        </View>
                    </LinearGradient>
                </View>
            </LinearGradient>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Muscle List */}
            <ScrollView
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {rows.map((s) => (
                    <MuscleRow key={s.muscle} stats={s} />
                ))}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    headerGradient: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surfaceContainerLow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary },
    overallCard: {
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        overflow: 'hidden',
    },
    overallGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    overallLeft: { gap: 4 },
    overallLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
    },
    overallTier: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    overallXP: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
    overallIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabsContainer: { backgroundColor: theme.colors.background },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.pill,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
    },
    tabActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    tabText: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },
    tabTextActive: { color: '#fff' },
    listContent: { paddingHorizontal: 20, paddingTop: 4 },
    muscleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
    },
    muscleLeft: { flex: 1, marginRight: 12 },
    muscleName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        marginBottom: 4,
    },
    muscleMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    muscleXP: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
    muscleNext: { fontSize: 12, color: theme.colors.textMuted },
    progressTrack: {
        height: 4,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: 2,
        marginBottom: 6,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 2,
    },
    muscleVolume: { fontSize: 11, color: theme.colors.textMuted, fontWeight: '500' },
    tierBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: theme.borderRadius.pill,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 76,
    },
    tierText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
