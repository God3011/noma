import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, TextInput, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { calculateBMR, calculateTDEE } from '../../utils/calorieCalculator';
import { theme } from '../../constants/theme';
import { UserProfile, CaloriePlan } from '../../types/user';

// ─── Conversion helpers ───────────────────────────────────────────────────────

function kgToLbs(kg: number) { return Math.round(kg * 2.20462); }
function lbsToKg(lbs: number) { return Math.round((lbs / 2.20462) * 10) / 10; }
function cmToFeetInches(cm: number) {
    const total = cm / 2.54;
    return { feet: Math.floor(total / 12), inches: Math.round(total % 12) };
}
function feetInchesToCm(feet: number, inches: number) {
    return Math.round((feet * 12 + inches) * 2.54);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_DEFICITS: Record<string, number> = { aggressive: 750, moderate: 500, easy: 250 };
const TIER_LABELS: Record<string, string> = { aggressive: 'Aggressive', moderate: 'Moderate', easy: 'Easy' };
const TIER_DESCRIPTIONS: Record<string, string> = {
    aggressive: '~1 kg/week deficit',
    moderate: '~0.5 kg/week deficit',
    easy: '~0.25 kg/week deficit',
};
const TIER_COLORS: Record<string, string> = {
    aggressive: '#FF4D6D', moderate: '#f5a623', easy: '#10b981',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function EditableRow({
    icon, label, value, editing, children,
}: {
    icon: string; label: string; value: string;
    editing: boolean; children: React.ReactNode;
}) {
    return (
        <View style={rowStyles.wrap}>
            <View style={rowStyles.left}>
                <Ionicons name={icon as any} size={16} color={theme.colors.textMuted} />
                <Text style={rowStyles.label}>{label}</Text>
            </View>
            {editing ? children : <Text style={rowStyles.value}>{value}</Text>}
        </View>
    );
}

function InlineInput({
    value, onChangeText, keyboardType = 'numeric', suffix,
}: {
    value: string; onChangeText: (v: string) => void;
    keyboardType?: 'numeric' | 'default'; suffix?: string;
}) {
    return (
        <View style={rowStyles.inputWrap}>
            <TextInput
                style={rowStyles.input}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                selectTextOnFocus
                placeholderTextColor={theme.colors.textMuted}
            />
            {suffix ? <Text style={rowStyles.suffix}>{suffix}</Text> : null}
        </View>
    );
}

function ToggleGroup({
    options, selected, onSelect,
}: {
    options: { value: string; label: string }[];
    selected: string;
    onSelect: (v: string) => void;
}) {
    return (
        <View style={rowStyles.toggleGroup}>
            {options.map((o) => (
                <TouchableOpacity
                    key={o.value}
                    style={[rowStyles.toggleBtn, selected === o.value && rowStyles.toggleBtnActive]}
                    onPress={() => onSelect(o.value)}
                >
                    <Text style={[rowStyles.toggleBtnText, selected === o.value && rowStyles.toggleBtnTextActive]}>
                        {o.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function AccountScreen() {
    const navigation = useNavigation();
    const profile = useUserStore((s) => s.profile);
    const plan = useUserStore((s) => s.plan);
    const setProfile = useUserStore((s) => s.setProfile);
    const setPlan = useUserStore((s) => s.setPlan);

    const [editing, setEditing] = useState(false);
    const [error, setError] = useState('');
    const [healthConnected, setHealthConnected] = useState(true);
    const [fitConnected, setFitConnected] = useState(false);

    const isImperial = profile?.unit_preference === 'imperial';

    // ── Draft state (always in display units so inputs feel natural) ──────────
    const initDraft = () => {
        if (!profile) return null;
        if (isImperial) {
            const wt = cmToFeetInches(profile.height_cm);
            return {
                age: String(profile.age),
                weight: String(kgToLbs(profile.weight_kg)),
                goalWeight: String(kgToLbs(profile.goal_weight_kg)),
                heightFt: String(wt.feet),
                heightIn: String(wt.inches),
                sex: profile.sex,
                stepsPerDay: String(profile.steps_per_day),
                workoutDays: String(profile.workout_days_per_week),
                tier: plan?.tier ?? 'moderate',
            };
        }
        return {
            age: String(profile.age),
            weight: String(profile.weight_kg),
            goalWeight: String(profile.goal_weight_kg),
            heightCm: String(profile.height_cm),
            sex: profile.sex,
            stepsPerDay: String(profile.steps_per_day),
            workoutDays: String(profile.workout_days_per_week),
            tier: plan?.tier ?? 'moderate',
        };
    };

    const [draft, setDraft] = useState<ReturnType<typeof initDraft>>(null);

    const startEditing = () => {
        setDraft(initDraft());
        setError('');
        setEditing(true);
    };

    const cancelEditing = () => {
        setEditing(false);
        setError('');
    };

    const saveEdits = () => {
        if (!draft || !profile) return;

        const age = parseInt(draft.age);
        const stepsPerDay = parseInt(draft.stepsPerDay);
        const workoutDays = parseInt(draft.workoutDays);

        let weight_kg: number, goal_weight_kg: number, height_cm: number;

        if (isImperial) {
            const d = draft as any;
            weight_kg = lbsToKg(parseInt(d.weight));
            goal_weight_kg = lbsToKg(parseInt(d.goalWeight));
            height_cm = feetInchesToCm(parseInt(d.heightFt), parseInt(d.heightIn));
        } else {
            const d = draft as any;
            weight_kg = parseFloat(d.weight);
            goal_weight_kg = parseFloat(d.goalWeight);
            height_cm = parseFloat(d.heightCm);
        }

        // Validation
        if (!age || age < 10 || age > 120) { setError('Enter a valid age (10–120).'); return; }
        if (!weight_kg || weight_kg < 30 || weight_kg > 300) { setError('Enter a valid weight.'); return; }
        if (!goal_weight_kg || goal_weight_kg < 30 || goal_weight_kg > 300) { setError('Enter a valid goal weight.'); return; }
        if (!height_cm || height_cm < 100 || height_cm > 250) { setError('Enter a valid height.'); return; }
        if (isNaN(stepsPerDay) || stepsPerDay < 0) { setError('Enter valid steps per day.'); return; }
        if (isNaN(workoutDays) || workoutDays < 0 || workoutDays > 7) { setError('Workout days must be 0–7.'); return; }

        const newProfile: UserProfile = {
            ...profile,
            age,
            weight_kg,
            goal_weight_kg,
            height_cm,
            sex: (draft as any).sex,
            steps_per_day: stepsPerDay,
            workout_days_per_week: workoutDays,
        };

        const bmr = Math.round(calculateBMR(newProfile));
        const tdee = calculateTDEE(newProfile);
        const tier = (draft as any).tier as 'aggressive' | 'moderate' | 'easy';
        const deficit = TIER_DEFICITS[tier];
        const daily_calories = Math.max(1200, Math.round(tdee - deficit));

        const newPlan: CaloriePlan = { tier, daily_calories, tdee, bmr };

        setProfile(newProfile);
        setPlan(newPlan);
        setEditing(false);
        setError('');
    };

    // ─── Display values ───────────────────────────────────────────────────────
    const wt = profile ? cmToFeetInches(profile.height_cm) : null;
    const weightDisplay = profile
        ? isImperial ? `${kgToLbs(profile.weight_kg)} lbs` : `${profile.weight_kg} kg`
        : '—';
    const goalWeightDisplay = profile
        ? isImperial ? `${kgToLbs(profile.goal_weight_kg)} lbs` : `${profile.goal_weight_kg} kg`
        : '—';
    const heightDisplay = profile
        ? isImperial && wt ? `${wt.feet}'${wt.inches}"` : `${profile.height_cm} cm`
        : '—';
    const tierColor = plan ? TIER_COLORS[plan.tier] ?? theme.colors.primary : theme.colors.primary;

    const d = draft as any;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={editing ? cancelEditing : () => navigation.goBack()}
                    style={styles.closeBtn}
                >
                    <Ionicons
                        name={editing ? 'arrow-back' : 'close'}
                        size={20}
                        color={theme.colors.textPrimary}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account</Text>
                {editing ? (
                    <TouchableOpacity style={styles.saveBtn} onPress={saveEdits}>
                        <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.editBtn} onPress={startEditing}>
                        <Ionicons name="pencil" size={15} color={theme.colors.primary} />
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={40} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.avatarLabel}>Your Profile</Text>
                    {editing && (
                        <View style={styles.editingBanner}>
                            <Ionicons name="create-outline" size={13} color={theme.colors.primary} />
                            <Text style={styles.editingBannerText}>Editing — tap Save when done</Text>
                        </View>
                    )}
                </View>

                {error ? (
                    <View style={styles.errorBox}>
                        <Ionicons name="warning-outline" size={15} color={theme.colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* Personal Details */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Personal Details</Text>

                    {/* Sex */}
                    <EditableRow icon="person-outline" label="Sex" value={profile ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : '—'} editing={editing}>
                        <ToggleGroup
                            options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
                            selected={d?.sex ?? 'male'}
                            onSelect={(v) => setDraft({ ...d, sex: v })}
                        />
                    </EditableRow>
                    <View style={styles.divider} />

                    {/* Age */}
                    <EditableRow icon="calendar-outline" label="Age" value={profile ? `${profile.age} yrs` : '—'} editing={editing}>
                        <InlineInput value={d?.age ?? ''} onChangeText={(v) => setDraft({ ...d, age: v })} suffix="yrs" />
                    </EditableRow>
                    <View style={styles.divider} />

                    {/* Height */}
                    <EditableRow icon="resize-outline" label="Height" value={heightDisplay} editing={editing}>
                        {isImperial ? (
                            <View style={rowStyles.inputWrap}>
                                <TextInput
                                    style={[rowStyles.input, { width: 44 }]}
                                    value={d?.heightFt ?? ''}
                                    onChangeText={(v) => setDraft({ ...d, heightFt: v })}
                                    keyboardType="numeric"
                                    selectTextOnFocus
                                />
                                <Text style={rowStyles.suffix}>ft</Text>
                                <TextInput
                                    style={[rowStyles.input, { width: 44 }]}
                                    value={d?.heightIn ?? ''}
                                    onChangeText={(v) => setDraft({ ...d, heightIn: v })}
                                    keyboardType="numeric"
                                    selectTextOnFocus
                                />
                                <Text style={rowStyles.suffix}>in</Text>
                            </View>
                        ) : (
                            <InlineInput value={d?.heightCm ?? ''} onChangeText={(v) => setDraft({ ...d, heightCm: v })} suffix="cm" />
                        )}
                    </EditableRow>
                    <View style={styles.divider} />

                    {/* Weight */}
                    <EditableRow icon="barbell-outline" label="Current Weight" value={weightDisplay} editing={editing}>
                        <InlineInput
                            value={d?.weight ?? ''}
                            onChangeText={(v) => setDraft({ ...d, weight: v })}
                            suffix={isImperial ? 'lbs' : 'kg'}
                        />
                    </EditableRow>
                    <View style={styles.divider} />

                    {/* Goal Weight */}
                    <EditableRow icon="flag-outline" label="Goal Weight" value={goalWeightDisplay} editing={editing}>
                        <InlineInput
                            value={d?.goalWeight ?? ''}
                            onChangeText={(v) => setDraft({ ...d, goalWeight: v })}
                            suffix={isImperial ? 'lbs' : 'kg'}
                        />
                    </EditableRow>
                </View>

                {/* Activity */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Activity</Text>

                    <EditableRow icon="footsteps-outline" label="Daily Step Goal" value={profile ? profile.steps_per_day.toLocaleString() : '—'} editing={editing}>
                        <InlineInput value={d?.stepsPerDay ?? ''} onChangeText={(v) => setDraft({ ...d, stepsPerDay: v })} suffix="steps" />
                    </EditableRow>
                    <View style={styles.divider} />

                    <EditableRow icon="barbell" label="Workout Days / Week" value={profile ? `${profile.workout_days_per_week} days` : '—'} editing={editing}>
                        <ToggleGroup
                            options={[0, 1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: String(n) }))}
                            selected={d?.workoutDays ?? '3'}
                            onSelect={(v) => setDraft({ ...d, workoutDays: v })}
                        />
                    </EditableRow>
                </View>

                {/* Health Sync */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Health Integrations</Text>

                    <View style={rowStyles.wrap}>
                        <View style={rowStyles.left}>
                            <Ionicons name="fitness" size={20} color={theme.colors.textPrimary} />
                            <View>
                                <Text style={rowStyles.label}>Apple Health</Text>
                                <Text style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>Sync steps automatically</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.syncBtn, healthConnected && { backgroundColor: theme.colors.primaryContainer }]}
                            onPress={() => setHealthConnected(!healthConnected)}
                        >
                            <Text style={[styles.syncBtnText, healthConnected && { color: theme.colors.primary }]}>
                                {healthConnected ? 'Connected' : 'Connect'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.divider} />

                    <View style={rowStyles.wrap}>
                        <View style={rowStyles.left}>
                            <Ionicons name="pulse" size={20} color={theme.colors.textPrimary} />
                            <View>
                                <Text style={rowStyles.label}>Google Fit</Text>
                                <Text style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>Sync steps automatically</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.syncBtn, fitConnected && { backgroundColor: theme.colors.primaryContainer }]}
                            onPress={() => setFitConnected(!fitConnected)}
                        >
                            <Text style={[styles.syncBtnText, fitConnected && { color: theme.colors.primary }]}>
                                {fitConnected ? 'Connected' : 'Connect'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Plan */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Current Plan</Text>

                    {editing ? (
                        <View style={styles.tierEditSection}>
                            <Text style={styles.tierEditHint}>Select a deficit tier — calories will recalculate on save.</Text>
                            {(['easy', 'moderate', 'aggressive'] as const).map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[
                                        styles.tierOption,
                                        d?.tier === t && { borderColor: TIER_COLORS[t], backgroundColor: TIER_COLORS[t] + '12' },
                                    ]}
                                    onPress={() => setDraft({ ...d, tier: t })}
                                >
                                    <View style={[styles.tierDot, { backgroundColor: TIER_COLORS[t] }]} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.tierOptionLabel, d?.tier === t && { color: TIER_COLORS[t] }]}>
                                            {TIER_LABELS[t]}
                                        </Text>
                                        <Text style={styles.tierOptionDesc}>{TIER_DESCRIPTIONS[t]}</Text>
                                    </View>
                                    {d?.tier === t && (
                                        <Ionicons name="checkmark-circle" size={18} color={TIER_COLORS[t]} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : plan ? (
                        <>
                            <View style={styles.tierBadgeRow}>
                                <View style={[styles.tierBadge, { backgroundColor: tierColor + '22' }]}>
                                    <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
                                    <Text style={[styles.tierBadgeText, { color: tierColor }]}>
                                        {TIER_LABELS[plan.tier]}
                                    </Text>
                                </View>
                                <Text style={styles.tierDescription}>{TIER_DESCRIPTIONS[plan.tier]}</Text>
                            </View>

                            <View style={styles.planGrid}>
                                <View style={styles.planStat}>
                                    <Text style={styles.planStatValue}>{plan.daily_calories.toLocaleString()}</Text>
                                    <Text style={styles.planStatLabel}>Daily Calories</Text>
                                </View>
                                <View style={styles.planStatDivider} />
                                <View style={styles.planStat}>
                                    <Text style={styles.planStatValue}>{plan.tdee.toLocaleString()}</Text>
                                    <Text style={styles.planStatLabel}>TDEE</Text>
                                </View>
                                <View style={styles.planStatDivider} />
                                <View style={styles.planStat}>
                                    <Text style={styles.planStatValue}>{plan.bmr.toLocaleString()}</Text>
                                    <Text style={styles.planStatLabel}>BMR</Text>
                                </View>
                            </View>

                            <View style={styles.deficitRow}>
                                <Ionicons name="trending-down" size={15} color={theme.colors.textMuted} />
                                <Text style={styles.deficitText}>
                                    {(plan.tdee - plan.daily_calories).toLocaleString()} kcal deficit/day
                                </Text>
                            </View>
                        </>
                    ) : (
                        <Text style={styles.noPlanText}>No plan set up yet.</Text>
                    )}
                </View>

                {editing && (
                    <TouchableOpacity style={styles.saveBlock} onPress={saveEdits}>
                        <Text style={styles.saveBlockText}>Save Changes</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 48 }} />
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const rowStyles = StyleSheet.create({
    wrap: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingVertical: 10,
        flexWrap: 'wrap', gap: 6,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    label: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },
    value: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
    inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    input: {
        width: 72,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 8 : 4,
        fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary,
        textAlign: 'center',
        borderWidth: 1, borderColor: theme.colors.outlineVariant,
    },
    suffix: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '500' },
    toggleGroup: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
    toggleBtn: {
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: theme.borderRadius.pill,
        borderWidth: 1.5, borderColor: theme.colors.outlineVariant,
        backgroundColor: theme.colors.surfaceContainerLow,
    },
    toggleBtnActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryContainer,
    },
    toggleBtnText: { fontSize: 12, fontWeight: '600', color: theme.colors.textMuted },
    toggleBtnTextActive: { color: theme.colors.primary },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
        backgroundColor: theme.colors.background,
    },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: theme.colors.surfaceContainerLow,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.textPrimary },
    editBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: theme.borderRadius.pill,
        borderWidth: 1.5, borderColor: theme.colors.primary,
    },
    editBtnText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
    saveBtn: {
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: theme.borderRadius.pill,
        backgroundColor: theme.colors.primary,
    },
    saveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

    scroll: { paddingHorizontal: 20, paddingTop: 8 },

    avatarSection: { alignItems: 'center', marginBottom: 20 },
    avatar: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: theme.colors.primaryContainer,
        alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    avatarLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
    editingBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6,
        backgroundColor: theme.colors.primaryContainer,
        paddingHorizontal: 12, paddingVertical: 5, borderRadius: theme.borderRadius.pill,
    },
    editingBannerText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },

    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: theme.colors.errorContainer,
        borderRadius: theme.borderRadius.sm, padding: 12, marginBottom: 12,
    },
    errorText: { fontSize: 13, color: theme.colors.error, fontWeight: '500', flex: 1 },

    card: {
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.md, padding: 18, marginBottom: 14,
    },
    cardTitle: {
        fontSize: 11, fontWeight: '700', color: theme.colors.primary,
        letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14,
    },
    divider: { height: 1, backgroundColor: theme.colors.surfaceContainerLow },

    // Tier selector (edit mode)
    tierEditSection: { gap: 8 },
    tierEditHint: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 },
    tierOption: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1.5, borderColor: theme.colors.outlineVariant,
        borderRadius: theme.borderRadius.sm, padding: 12,
    },
    tierDot: { width: 8, height: 8, borderRadius: 4 },
    tierOptionLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
    tierOptionDesc: { fontSize: 12, color: theme.colors.textMuted, marginTop: 1 },

    // Tier display (view mode)
    tierBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
    tierBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.pill,
    },
    tierBadgeText: { fontSize: 13, fontWeight: '700' },
    tierDescription: { fontSize: 13, color: theme.colors.textMuted, fontWeight: '500' },

    planGrid: {
        flexDirection: 'row', backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.sm, padding: 16, marginBottom: 14,
    },
    planStat: { flex: 1, alignItems: 'center' },
    planStatValue: { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 2 },
    planStatLabel: { fontSize: 11, color: theme.colors.textMuted, fontWeight: '500' },
    planStatDivider: { width: 1, backgroundColor: theme.colors.outlineVariant, marginVertical: 4 },

    deficitRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    deficitText: { fontSize: 13, color: theme.colors.textMuted, fontWeight: '500' },

    noPlanText: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', paddingVertical: 16 },

    syncBtn: {
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: theme.borderRadius.pill,
        backgroundColor: theme.colors.surfaceContainerHighest,
        minWidth: 84,
        alignItems: 'center',
    },
    syncBtnText: {
        fontSize: 12, fontWeight: '700', color: theme.colors.textPrimary,
    },

    saveBlock: {
        backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
        padding: 16, alignItems: 'center', marginTop: 4,
    },
    saveBlockText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
