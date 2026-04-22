import React, { useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, StatusBar, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { InteractiveMuscleMap } from '../../components/avatar/InteractiveMuscleMap';
import { useUserStore } from '../../store/useUserStore';
import { useFoodLogStore } from '../../store/useFoodLogStore';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { computeBodyState } from '../../utils/bodyState';
import {
    computeMuscleStats, computeOverallXP,
    getTierForXP, getNextTierThreshold, getCurrentTierThreshold,
    TIER_COLORS, TIER_THRESHOLDS, ALL_MUSCLES,
    MuscleGroup, MuscleStats,
} from '../../utils/muscleXP';

export function AvatarScreen() {
    const navigation = useNavigation();
    const profile = useUserStore((s) => s.profile);
    const plan = useUserStore((s) => s.plan);
    const meals = useFoodLogStore((s) => s.meals);
    const workouts = useWorkoutStore((s) => s.workouts);

    const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);

    const bodyState = useMemo(() => computeBodyState(
        meals, workouts,
        plan?.daily_calories ?? 2000,
        profile?.weight_kg ?? 70,
        profile?.body_type ?? 'normal',
        profile?.goal ?? 'athletic',
    ), [meals, workouts, plan, profile]);

    const muscleStats = useMemo(() => computeMuscleStats(workouts), [workouts]);
    const overallXP = useMemo(() => computeOverallXP(muscleStats), [muscleStats]);
    const tier = getTierForXP(overallXP);
    const tierColor = TIER_COLORS[tier];
    const nextThreshold = getNextTierThreshold(overallXP);
    const currentThreshold = getCurrentTierThreshold(overallXP);
    const tierProgress = nextThreshold > currentThreshold
        ? (overallXP - currentThreshold) / (nextThreshold - currentThreshold)
        : 1;

    const fatPct = Math.round(bodyState.fatLevel * 100);
    const musclePct = Math.round(bodyState.muscleLevel * 100);

    // All muscles ranked by XP descending
    const rankedMuscles = useMemo(() =>
        ALL_MUSCLES.map((m) => muscleStats[m]).sort((a, b) => b.xp - a.xp),
        [muscleStats]
    );

    const selectedStat = selectedMuscle ? muscleStats[selectedMuscle] : null;

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="chevron-down" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Muscle Map</Text>
                <View style={[styles.tierBadge, { borderColor: tierColor + '60' }]}>
                    <Text style={[styles.tierText, { color: tierColor }]}>{tier}</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* Interactive body map */}
                <View style={styles.mapCard}>
                    <InteractiveMuscleMap
                        muscleStats={muscleStats}
                        onMusclePress={setSelectedMuscle}
                        selectedMuscle={selectedMuscle}
                    />
                    <Text style={styles.mapHint}>Tap a muscle group to see your progress</Text>
                </View>

                {/* Tier Legend */}
                <View style={styles.legendRow}>
                    {TIER_THRESHOLDS.map(({ tier: t }) => (
                        <View key={t} style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: TIER_COLORS[t] }]} />
                            <Text style={styles.legendLabel}>{t}</Text>
                        </View>
                    ))}
                </View>

                {/* XP Progress */}
                <View style={styles.xpCard}>
                    <View style={styles.xpRow}>
                        <View>
                            <Text style={styles.xpLabel}>Overall XP</Text>
                            <Text style={[styles.xpValue, { color: tierColor }]}>{overallXP.toLocaleString()}</Text>
                        </View>
                        <View style={styles.nextTierBox}>
                            <Text style={styles.nextTierLabel}>Next tier: {nextThreshold.toLocaleString()} XP</Text>
                        </View>
                    </View>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${tierProgress * 100}%` as any, backgroundColor: tierColor }]} />
                    </View>
                    <Text style={styles.progressCaption}>{Math.round(tierProgress * 100)}% to next tier</Text>
                </View>

                {/* Body Composition */}
                <Text style={styles.sectionTitle}>Body Composition</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <LinearGradient colors={['#CC5500', '#FF6B00']} style={styles.statIconBg}>
                            <Ionicons name="flame" size={18} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.statValue}>{fatPct}%</Text>
                        <Text style={styles.statLabel}>Body Fat Est.</Text>
                        <View style={styles.miniBar}>
                            <View style={[styles.miniBarFill, { width: `${fatPct}%` as any, backgroundColor: '#FF6B00' }]} />
                        </View>
                    </View>
                    <View style={styles.statBox}>
                        <LinearGradient colors={['#7c3aed', '#a855f7']} style={styles.statIconBg}>
                            <Ionicons name="barbell" size={18} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.statValue}>{musclePct}%</Text>
                        <Text style={styles.statLabel}>Muscle Est.</Text>
                        <View style={styles.miniBar}>
                            <View style={[styles.miniBarFill, { width: `${musclePct}%` as any, backgroundColor: '#a855f7' }]} />
                        </View>
                    </View>
                </View>

                {/* Muscle Rankings */}
                <Text style={styles.sectionTitle}>Muscle Rankings</Text>
                <View style={styles.rankList}>
                    {rankedMuscles.map((stat, i) => {
                        const color = TIER_COLORS[stat.tier];
                        const nxt = getNextTierThreshold(stat.xp);
                        const cur = getCurrentTierThreshold(stat.xp);
                        const pct = nxt > cur ? (stat.xp - cur) / (nxt - cur) : 1;
                        return (
                            <TouchableOpacity
                                key={stat.muscle}
                                style={[styles.rankRow, selectedMuscle === stat.muscle && styles.rankRowSelected]}
                                onPress={() => setSelectedMuscle(stat.muscle === selectedMuscle ? null : stat.muscle)}
                                activeOpacity={0.75}
                            >
                                <Text style={styles.rankNum}>#{i + 1}</Text>
                                <View style={styles.rankContent}>
                                    <View style={styles.rankTop}>
                                        <Text style={styles.rankName}>{stat.muscle}</Text>
                                        <View style={[styles.rankTierBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                                            <Text style={[styles.rankTierText, { color }]}>{stat.tier}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.rankBarTrack}>
                                        <View style={[styles.rankBarFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
                                    </View>
                                    <Text style={styles.rankXP}>{stat.xp} XP · {stat.totalVolume} {stat.volumeUnit}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Muscle Detail Bottom Sheet */}
            <Modal
                visible={!!selectedStat}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedMuscle(null)}
            >
                <TouchableOpacity
                    style={styles.sheetOverlay}
                    activeOpacity={1}
                    onPress={() => setSelectedMuscle(null)}
                >
                    <View style={styles.sheet}>
                        <View style={styles.sheetHandle} />

                        {selectedStat && <MuscleDetailSheet stat={selectedStat} onClose={() => setSelectedMuscle(null)} />}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

// ─── Muscle detail sheet content ─────────────────────────────────────────────

function MuscleDetailSheet({ stat, onClose }: { stat: MuscleStats; onClose: () => void }) {
    const color = TIER_COLORS[stat.tier];
    const nextXP = getNextTierThreshold(stat.xp);
    const curXP = getCurrentTierThreshold(stat.xp);
    const pct = nextXP > curXP ? (stat.xp - curXP) / (nextXP - curXP) : 1;
    const xpToNext = nextXP - stat.xp;

    // Find next tier name
    const nextTierEntry = TIER_THRESHOLDS.find((t) => t.xp > stat.xp);
    const nextTierName = nextTierEntry?.tier ?? 'MAX';

    return (
        <>
            <View style={sheet.titleRow}>
                <View>
                    <Text style={sheet.muscleName}>{stat.muscle}</Text>
                    <View style={[sheet.tierBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                        <Text style={[sheet.tierText, { color }]}>{stat.tier}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={onClose} style={sheet.closeBtn}>
                    <Ionicons name="close" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
            </View>

            <View style={sheet.xpRow}>
                <Text style={[sheet.xpBig, { color }]}>{stat.xp.toLocaleString()}</Text>
                <Text style={sheet.xpUnit}> XP</Text>
            </View>

            <View style={sheet.progressTrack}>
                <View style={[sheet.progressFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
            </View>
            <Text style={sheet.progressCaption}>
                {stat.xp > 0
                    ? `${xpToNext.toLocaleString()} XP to ${nextTierName}`
                    : `Start training ${stat.muscle} to earn XP`}
            </Text>

            <View style={sheet.statsGrid}>
                <View style={sheet.statItem}>
                    <Ionicons name="barbell-outline" size={16} color={color} />
                    <Text style={sheet.statVal}>{stat.totalVolume.toLocaleString()}</Text>
                    <Text style={sheet.statLbl}>{stat.volumeUnit === 'kg' ? 'kg lifted' : 'min trained'}</Text>
                </View>
                <View style={sheet.statItem}>
                    <Ionicons name="trending-up-outline" size={16} color={color} />
                    <Text style={sheet.statVal}>{Math.round(pct * 100)}%</Text>
                    <Text style={sheet.statLbl}>tier progress</Text>
                </View>
                <View style={sheet.statItem}>
                    <Ionicons name="shield-outline" size={16} color={color} />
                    <Text style={[sheet.statVal, { color }]}>{stat.tier}</Text>
                    <Text style={sheet.statLbl}>current rank</Text>
                </View>
            </View>
        </>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
    },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: theme.colors.surfaceContainerHigh,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
    tierBadge: {
        paddingHorizontal: 12, paddingVertical: 4,
        borderRadius: theme.borderRadius.pill,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderWidth: 1,
    },
    tierText: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    scroll: { paddingHorizontal: 20 },
    mapCard: {
        backgroundColor: '#000000',
        borderRadius: theme.borderRadius.lg,
        paddingVertical: 12,
        paddingHorizontal: 8,
        marginBottom: 12,
        alignItems: 'center',
        overflow: 'hidden',
    },
    mapHint: { fontSize: 11, color: theme.colors.textMuted, marginTop: 4, marginBottom: 4 },
    legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, justifyContent: 'center' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 7, height: 7, borderRadius: 3.5 },
    legendLabel: { fontSize: 10, color: theme.colors.textMuted, fontWeight: '500' },
    xpCard: {
        backgroundColor: theme.colors.surfaceContainerLow, borderRadius: theme.borderRadius.lg,
        padding: 16, marginBottom: 24, gap: 10,
    },
    xpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    xpLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
    xpValue: { fontSize: 28, fontWeight: '800' },
    nextTierBox: {
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.borderRadius.sm, paddingHorizontal: 10, paddingVertical: 6,
    },
    nextTierLabel: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
    progressTrack: { height: 6, backgroundColor: theme.colors.surfaceContainerHighest, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    progressCaption: { fontSize: 12, color: theme.colors.textMuted },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 12 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statBox: {
        flex: 1, backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.lg, padding: 16, gap: 6,
    },
    statIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    statValue: { fontSize: 26, fontWeight: '800', color: theme.colors.textPrimary },
    statLabel: { fontSize: 11, color: theme.colors.textMuted, fontWeight: '500' },
    miniBar: { height: 4, backgroundColor: theme.colors.surfaceContainerHighest, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
    miniBarFill: { height: '100%', borderRadius: 2 },
    rankList: { gap: 8, marginBottom: 8 },
    rankRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.md, padding: 12,
        borderWidth: 1, borderColor: 'transparent',
    },
    rankRowSelected: {
        borderColor: theme.colors.primary + '55',
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    rankNum: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, width: 24, textAlign: 'center' },
    rankContent: { flex: 1, gap: 5 },
    rankTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rankName: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
    rankTierBadge: {
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.pill,
        borderWidth: 1,
    },
    rankTierText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    rankBarTrack: { height: 4, backgroundColor: theme.colors.surfaceContainerHighest, borderRadius: 2, overflow: 'hidden' },
    rankBarFill: { height: '100%', borderRadius: 2 },
    rankXP: { fontSize: 10, color: theme.colors.textMuted, fontWeight: '500' },

    // Modal
    sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: theme.colors.surfaceContainerLow,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 40,
    },
    sheetHandle: {
        width: 36, height: 4, borderRadius: 2,
        backgroundColor: theme.colors.outlineVariant,
        alignSelf: 'center', marginBottom: 20,
    },
});

const sheet = StyleSheet.create({
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    muscleName: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 6 },
    tierBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: theme.borderRadius.pill, borderWidth: 1 },
    tierText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    closeBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: theme.colors.surfaceContainerHigh,
        alignItems: 'center', justifyContent: 'center',
    },
    xpRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
    xpBig: { fontSize: 36, fontWeight: '900' },
    xpUnit: { fontSize: 18, fontWeight: '600', color: theme.colors.textMuted },
    progressTrack: { height: 8, backgroundColor: theme.colors.surfaceContainerHighest, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
    progressFill: { height: '100%', borderRadius: 4 },
    progressCaption: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 20 },
    statsGrid: { flexDirection: 'row', gap: 10 },
    statItem: {
        flex: 1, alignItems: 'center', gap: 4,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.borderRadius.md, paddingVertical: 14,
    },
    statVal: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary },
    statLbl: { fontSize: 10, color: theme.colors.textMuted, fontWeight: '500', textAlign: 'center' },
});
