import React from 'react';
import Svg, { Defs, G, Path, Circle, Text as SvgText, LinearGradient as SvgLinGrad, Stop } from 'react-native-svg';
import { MuscleGroup, MuscleStats, TIER_COLORS } from '../../utils/muscleXP';

interface Props {
    muscleStats: Record<MuscleGroup, MuscleStats>;
    onMusclePress: (muscle: MuscleGroup) => void;
    selectedMuscle?: MuscleGroup | null;
}

// ── Palette — dark atmospheric glow style ────────────────────────────────────
const BODY_BASE = '#141416';           // very dark body silhouette
const BODY_OUTLINE = '#1c1c1e';        // subtle body outline
const ANATOMY_LINE = '#222224';        // anatomy definition lines (very subtle)
const UNTRAINED_COLOR = '#4a8faa';     // muted teal-blue (translucent feel)
const TRAINED_COLOR = '#FF9500';       // bright warm orange
const TRAINED_BRIGHT = '#FFB340';      // brighter orange for highlights
const SEL_STROKE = '#FFFFFF';

// Helpers
function mFill(m: MuscleGroup, stats: Record<MuscleGroup, MuscleStats>): string {
    const s = stats[m];
    if (!s || s.xp === 0) return UNTRAINED_COLOR;
    const tc = TIER_COLORS[s.tier];
    return tc === '#6b7280' ? TRAINED_COLOR : tc;
}

function mIsTrained(m: MuscleGroup, stats: Record<MuscleGroup, MuscleStats>): boolean {
    const s = stats[m];
    return !!s && s.xp > 0;
}

// fill opacity: untrained = very translucent glass, trained = strong glow
function mMainOpacity(m: MuscleGroup, stats: Record<MuscleGroup, MuscleStats>): number {
    return mIsTrained(m, stats) ? 0.88 : 0.42;
}

// glow layer 1 (inner glow) opacity
function mGlow1(m: MuscleGroup, stats: Record<MuscleGroup, MuscleStats>): number {
    return mIsTrained(m, stats) ? 0.45 : 0.15;
}

// glow layer 2 (outer glow) opacity — only for trained muscles
function mGlow2(m: MuscleGroup, stats: Record<MuscleGroup, MuscleStats>): number {
    return mIsTrained(m, stats) ? 0.25 : 0.08;
}

// edge stroke color
function mEdge(m: MuscleGroup, stats: Record<MuscleGroup, MuscleStats>): string {
    if (mIsTrained(m, stats)) return TRAINED_BRIGHT;
    return '#6ab0cc';  // brighter blue edge for untrained
}

// edge stroke opacity
function mEdgeOp(m: MuscleGroup, stats: Record<MuscleGroup, MuscleStats>): number {
    return mIsTrained(m, stats) ? 0.7 : 0.3;
}

// ── Reusable muscle path component with glow ─────────────────────────────────
function GlowMuscle({
    d,
    fill,
    mainOpacity,
    glow1Opacity,
    glow2Opacity,
    edgeColor,
    edgeOpacity,
    selStroke,
    selWidth,
    onPress,
}: {
    d: string;
    fill: string;
    mainOpacity: number;
    glow1Opacity: number;
    glow2Opacity: number;
    edgeColor: string;
    edgeOpacity: number;
    selStroke: string;
    selWidth: number;
    onPress?: () => void;
}) {
    return (
        <G>
            {/* Outer glow layer (widest, most diffuse) */}
            <Path
                d={d}
                fill={fill}
                fillOpacity={glow2Opacity}
                stroke={fill}
                strokeWidth={3}
                strokeOpacity={glow2Opacity * 0.5}
            />
            {/* Inner glow layer */}
            <Path
                d={d}
                fill={fill}
                fillOpacity={glow1Opacity}
                stroke={fill}
                strokeWidth={1.5}
                strokeOpacity={glow1Opacity * 0.6}
            />
            {/* Main fill */}
            <Path
                d={d}
                fill={fill}
                fillOpacity={mainOpacity}
                stroke={selWidth > 0 ? selStroke : edgeColor}
                strokeWidth={selWidth > 0 ? selWidth : 0.6}
                strokeOpacity={selWidth > 0 ? 1 : edgeOpacity}
                onPress={onPress}
            />
        </G>
    );
}

// ── Simpler glow muscle (no press, no selection) ─────────────────────────────
function GlowMuscleSimple({
    d,
    fill,
    mainOpacity,
    glow1Opacity,
    glow2Opacity,
}: {
    d: string;
    fill: string;
    mainOpacity: number;
    glow1Opacity: number;
    glow2Opacity: number;
}) {
    return (
        <G>
            <Path d={d} fill={fill} fillOpacity={glow2Opacity} stroke={fill} strokeWidth={2.5} strokeOpacity={glow2Opacity * 0.4} />
            <Path d={d} fill={fill} fillOpacity={glow1Opacity} stroke={fill} strokeWidth={1.2} strokeOpacity={glow1Opacity * 0.5} />
            <Path d={d} fill={fill} fillOpacity={mainOpacity} />
        </G>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// FRONT BODY
// ─────────────────────────────────────────────────────────────────────────────

function FrontBody({ stats, sc, sw, press }: {
    stats: Record<MuscleGroup, MuscleStats>;
    sc: (m: MuscleGroup) => string;
    sw: (m: MuscleGroup) => number;
    press: (m: MuscleGroup) => () => void;
}) {
    const m = (muscle: MuscleGroup) => ({
        fill: mFill(muscle, stats),
        mainOpacity: mMainOpacity(muscle, stats),
        glow1Opacity: mGlow1(muscle, stats),
        glow2Opacity: mGlow2(muscle, stats),
        edgeColor: mEdge(muscle, stats),
        edgeOpacity: mEdgeOp(muscle, stats),
        selStroke: sc(muscle),
        selWidth: sw(muscle),
        onPress: press(muscle),
    });

    return (
        <G>
            {/* ── Body silhouette ── */}
            <Circle cx={50} cy={14} r={10} fill={BODY_BASE} />
            <Path d="M 45 22 L 55 22 L 56 28 L 44 28 Z" fill={BODY_BASE} />
            <Path
                d={`
                    M 30 28 C 22 30 16 32 12 36 L 8 60 C 7 70 8 78 10 86
                    L 14 94 C 13 100 13 104 14 108 L 18 120
                    C 17 124 17 128 18 132 L 14 136 L 10 140 L 8 144
                    L 10 148 L 18 148 L 22 140 L 25 130 L 28 118
                    L 30 108 L 32 96 L 32 92 L 33 100 L 34 120
                    L 34 145 L 33 160 L 32 180 L 33 195 L 36 202
                    L 38 206 L 34 208 L 32 210 L 34 212 L 46 212
                    L 48 208 L 49 200 L 49 160 L 50 140 L 51 160
                    L 51 200 L 52 208 L 54 212 L 66 212 L 68 210
                    L 66 208 L 62 206 L 64 202 L 67 195 L 68 180
                    L 67 160 L 66 145 L 66 120 L 67 100 L 68 92
                    L 68 96 L 70 108 L 72 118 L 75 130 L 78 140
                    L 82 148 L 90 148 L 92 144 L 90 140 L 86 136
                    L 82 132 C 83 128 83 124 82 120 L 86 108
                    C 87 104 87 100 86 94 L 90 86 C 92 78 93 70 92 60
                    L 88 36 C 84 32 78 30 70 28 L 65 28
                    C 60 27 55 27 50 27 C 45 27 40 27 35 28 Z
                `}
                fill={BODY_BASE}
            />

            {/* ── Anatomy lines (visible through translucent fills) ── */}
            <Path d="M 50 34 L 50 58" stroke={ANATOMY_LINE} strokeWidth={0.5} />
            <Path d="M 36 60 Q 43 62 50 60 Q 57 62 64 60" stroke={ANATOMY_LINE} strokeWidth={0.4} />
            <Path d="M 43 64 L 57 64" stroke={ANATOMY_LINE} strokeWidth={0.35} />
            <Path d="M 43 72 L 57 72" stroke={ANATOMY_LINE} strokeWidth={0.35} />
            <Path d="M 43 80 L 57 80" stroke={ANATOMY_LINE} strokeWidth={0.35} />
            <Path d="M 50 60 L 50 92" stroke={ANATOMY_LINE} strokeWidth={0.4} />
            <Path d="M 38 110 L 40 148" stroke={ANATOMY_LINE} strokeWidth={0.35} />
            <Path d="M 62 110 L 60 148" stroke={ANATOMY_LINE} strokeWidth={0.35} />

            {/* ── Muscle overlays with glow ── */}

            {/* Trapezius → Shoulders */}
            <GlowMuscle d="M 40 28 Q 50 30 60 28 L 58 34 Q 50 32 42 34 Z" {...m('Shoulders')} />
            {/* Left Deltoid */}
            <GlowMuscle d="M 30 30 Q 20 30 14 38 Q 12 46 16 52 Q 22 50 28 44 Q 32 38 30 30 Z" {...m('Shoulders')} />
            {/* Right Deltoid */}
            <GlowMuscle d="M 70 30 Q 80 30 86 38 Q 88 46 84 52 Q 78 50 72 44 Q 68 38 70 30 Z" {...m('Shoulders')} />

            {/* Left Chest */}
            <GlowMuscle d="M 48 34 Q 36 36 32 44 Q 30 54 36 60 Q 44 60 48 56 Q 50 46 48 34 Z" {...m('Chest')} />
            {/* Right Chest */}
            <GlowMuscle d="M 52 34 Q 64 36 68 44 Q 70 54 64 60 Q 56 60 52 56 Q 50 46 52 34 Z" {...m('Chest')} />

            {/* Left Bicep */}
            <GlowMuscle d="M 14 52 Q 10 56 10 66 Q 11 76 16 82 Q 22 78 22 68 Q 22 58 18 52 Z" {...m('Biceps')} />
            {/* Right Bicep */}
            <GlowMuscle d="M 86 52 Q 90 56 90 66 Q 89 76 84 82 Q 78 78 78 68 Q 78 58 82 52 Z" {...m('Biceps')} />

            {/* Left Forearm */}
            <GlowMuscleSimple
                d="M 12 86 Q 8 96 10 110 Q 12 120 16 128 Q 22 124 22 114 Q 22 98 18 86 Z"
                fill={UNTRAINED_COLOR} mainOpacity={0.35} glow1Opacity={0.12} glow2Opacity={0.06}
            />
            {/* Right Forearm */}
            <GlowMuscleSimple
                d="M 88 86 Q 92 96 90 110 Q 88 120 84 128 Q 78 124 78 114 Q 78 98 82 86 Z"
                fill={UNTRAINED_COLOR} mainOpacity={0.35} glow1Opacity={0.12} glow2Opacity={0.06}
            />

            {/* Core / Abs */}
            <G onPress={press('Core')}>
                <GlowMuscleSimple
                    d="M 42 60 Q 46 58 50 58 Q 54 58 58 60 L 58 68 Q 54 68 50 68 Q 46 68 42 68 Z"
                    fill={mFill('Core', stats)} mainOpacity={mMainOpacity('Core', stats)}
                    glow1Opacity={mGlow1('Core', stats)} glow2Opacity={mGlow2('Core', stats)}
                />
                <GlowMuscleSimple
                    d="M 42 70 L 58 70 L 58 78 Q 54 78 50 78 Q 46 78 42 78 Z"
                    fill={mFill('Core', stats)} mainOpacity={mMainOpacity('Core', stats)}
                    glow1Opacity={mGlow1('Core', stats)} glow2Opacity={mGlow2('Core', stats)}
                />
                <GlowMuscleSimple
                    d="M 42 80 L 58 80 L 58 90 Q 54 92 50 92 Q 46 92 42 90 Z"
                    fill={mFill('Core', stats)} mainOpacity={mMainOpacity('Core', stats)}
                    glow1Opacity={mGlow1('Core', stats)} glow2Opacity={mGlow2('Core', stats)}
                />
                <Path d="M 50 60 L 50 92" stroke={BODY_BASE} strokeWidth={0.5} />
            </G>

            {/* Obliques */}
            <GlowMuscleSimple
                d="M 34 58 Q 30 70 32 88 L 40 92 L 42 70 L 40 60 Z"
                fill={UNTRAINED_COLOR} mainOpacity={0.3} glow1Opacity={0.1} glow2Opacity={0.05}
            />
            <GlowMuscleSimple
                d="M 66 58 Q 70 70 68 88 L 60 92 L 58 70 L 60 60 Z"
                fill={UNTRAINED_COLOR} mainOpacity={0.3} glow1Opacity={0.1} glow2Opacity={0.05}
            />

            {/* Left Quad */}
            <GlowMuscle d="M 33 100 Q 30 120 32 140 Q 36 152 42 152 Q 46 140 46 120 Q 46 104 44 100 Z" {...m('Quadriceps')} />
            {/* Right Quad */}
            <GlowMuscle d="M 67 100 Q 70 120 68 140 Q 64 152 58 152 Q 54 140 54 120 Q 54 104 56 100 Z" {...m('Quadriceps')} />

            {/* Left Calf */}
            <GlowMuscle d="M 35 160 Q 32 178 34 196 L 40 200 L 44 196 Q 44 178 42 160 Z" {...m('Calves')} />
            {/* Right Calf */}
            <GlowMuscle d="M 65 160 Q 68 178 66 196 L 60 200 L 56 196 Q 56 178 58 160 Z" {...m('Calves')} />
        </G>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// BACK BODY
// ─────────────────────────────────────────────────────────────────────────────

function BackBody({ stats, sc, sw, press }: {
    stats: Record<MuscleGroup, MuscleStats>;
    sc: (m: MuscleGroup) => string;
    sw: (m: MuscleGroup) => number;
    press: (m: MuscleGroup) => () => void;
}) {
    const m = (muscle: MuscleGroup) => ({
        fill: mFill(muscle, stats),
        mainOpacity: mMainOpacity(muscle, stats),
        glow1Opacity: mGlow1(muscle, stats),
        glow2Opacity: mGlow2(muscle, stats),
        edgeColor: mEdge(muscle, stats),
        edgeOpacity: mEdgeOp(muscle, stats),
        selStroke: sc(muscle),
        selWidth: sw(muscle),
        onPress: press(muscle),
    });

    return (
        <G>
            {/* ── Body silhouette ── */}
            <Circle cx={50} cy={14} r={10} fill={BODY_BASE} />
            <Path d="M 45 22 L 55 22 L 56 28 L 44 28 Z" fill={BODY_BASE} />
            <Path
                d={`
                    M 30 28 C 22 30 16 32 12 36 L 8 60 C 7 70 8 78 10 86
                    L 14 94 C 13 100 13 104 14 108 L 18 120
                    C 17 124 17 128 18 132 L 14 136 L 10 140 L 8 144
                    L 10 148 L 18 148 L 22 140 L 25 130 L 28 118
                    L 30 108 L 32 96 L 32 92 L 33 100 L 34 120
                    L 34 145 L 33 160 L 32 180 L 33 195 L 36 202
                    L 38 206 L 34 208 L 32 210 L 34 212 L 46 212
                    L 48 208 L 49 200 L 49 160 L 50 140 L 51 160
                    L 51 200 L 52 208 L 54 212 L 66 212 L 68 210
                    L 66 208 L 62 206 L 64 202 L 67 195 L 68 180
                    L 67 160 L 66 145 L 66 120 L 67 100 L 68 92
                    L 68 96 L 70 108 L 72 118 L 75 130 L 78 140
                    L 82 148 L 90 148 L 92 144 L 90 140 L 86 136
                    L 82 132 C 83 128 83 124 82 120 L 86 108
                    C 87 104 87 100 86 94 L 90 86 C 92 78 93 70 92 60
                    L 88 36 C 84 32 78 30 70 28 L 65 28
                    C 60 27 55 27 50 27 C 45 27 40 27 35 28 Z
                `}
                fill={BODY_BASE}
            />

            {/* ── Anatomy lines ── */}
            <Path d="M 50 30 L 50 96" stroke={ANATOMY_LINE} strokeWidth={0.5} />
            <Path d="M 36 42 Q 32 60 34 80" stroke={ANATOMY_LINE} strokeWidth={0.35} />
            <Path d="M 64 42 Q 68 60 66 80" stroke={ANATOMY_LINE} strokeWidth={0.35} />
            <Path d="M 50 98 L 50 118" stroke={ANATOMY_LINE} strokeWidth={0.4} />
            <Path d="M 39 170 L 39 196" stroke={ANATOMY_LINE} strokeWidth={0.35} />
            <Path d="M 61 170 L 61 196" stroke={ANATOMY_LINE} strokeWidth={0.35} />

            {/* ── Muscle overlays with glow ── */}

            {/* Traps → Shoulders */}
            <GlowMuscle d="M 40 26 Q 50 32 60 26 L 62 38 Q 50 42 38 38 Z" {...m('Shoulders')} />
            {/* Left Rear Deltoid */}
            <GlowMuscle d="M 30 30 Q 20 30 14 38 Q 12 46 16 52 Q 22 50 28 44 Q 32 38 30 30 Z" {...m('Shoulders')} />
            {/* Right Rear Deltoid */}
            <GlowMuscle d="M 70 30 Q 80 30 86 38 Q 88 46 84 52 Q 78 50 72 44 Q 68 38 70 30 Z" {...m('Shoulders')} />

            {/* Left Lat */}
            <GlowMuscle d="M 48 38 Q 36 40 30 52 Q 28 68 34 82 Q 42 86 46 78 Q 50 62 50 48 Z" {...m('Back')} />
            {/* Right Lat */}
            <GlowMuscle d="M 52 38 Q 64 40 70 52 Q 72 68 66 82 Q 58 86 54 78 Q 50 62 50 48 Z" {...m('Back')} />
            {/* Spine */}
            <Path d="M 50 40 L 50 86" stroke={BODY_BASE} strokeWidth={0.8} />

            {/* Lower back */}
            <GlowMuscleSimple
                d="M 42 84 L 58 84 L 56 98 Q 50 100 44 98 Z"
                fill={mFill('Back', stats)} mainOpacity={mMainOpacity('Back', stats) * 0.75}
                glow1Opacity={mGlow1('Back', stats) * 0.6} glow2Opacity={mGlow2('Back', stats) * 0.5}
            />

            {/* Left Tricep */}
            <GlowMuscle d="M 14 52 Q 10 60 12 74 Q 14 82 18 82 Q 22 76 22 66 Q 22 58 18 52 Z" {...m('Triceps')} />
            {/* Right Tricep */}
            <GlowMuscle d="M 86 52 Q 90 60 88 74 Q 86 82 82 82 Q 78 76 78 66 Q 78 58 82 52 Z" {...m('Triceps')} />

            {/* Forearms */}
            <GlowMuscleSimple
                d="M 12 86 Q 8 96 10 110 Q 12 120 16 128 Q 22 124 22 114 Q 22 98 18 86 Z"
                fill={UNTRAINED_COLOR} mainOpacity={0.35} glow1Opacity={0.12} glow2Opacity={0.06}
            />
            <GlowMuscleSimple
                d="M 88 86 Q 92 96 90 110 Q 88 120 84 128 Q 78 124 78 114 Q 78 98 82 86 Z"
                fill={UNTRAINED_COLOR} mainOpacity={0.35} glow1Opacity={0.12} glow2Opacity={0.06}
            />

            {/* Left Glute */}
            <GlowMuscle d="M 33 96 Q 30 106 34 116 Q 42 120 48 116 Q 50 108 48 98 Q 40 94 33 96 Z" {...m('Glutes')} />
            {/* Right Glute */}
            <GlowMuscle d="M 67 96 Q 70 106 66 116 Q 58 120 52 116 Q 50 108 52 98 Q 60 94 67 96 Z" {...m('Glutes')} />
            {/* Glute separator */}
            <Path d="M 50 98 L 50 118" stroke={BODY_BASE} strokeWidth={0.8} />

            {/* Left Hamstring */}
            <GlowMuscle d="M 33 118 Q 30 134 32 152 Q 36 158 42 156 Q 46 144 46 128 Q 46 120 44 118 Z" {...m('Hamstrings')} />
            {/* Right Hamstring */}
            <GlowMuscle d="M 67 118 Q 70 134 68 152 Q 64 158 58 156 Q 54 144 54 128 Q 54 120 56 118 Z" {...m('Hamstrings')} />

            {/* Left Calf */}
            <GlowMuscle d="M 34 162 Q 30 178 34 196 L 40 200 L 44 196 Q 46 180 42 162 Z" {...m('Calves')} />
            {/* Right Calf */}
            <GlowMuscle d="M 66 162 Q 70 178 66 196 L 60 200 L 56 196 Q 54 180 58 162 Z" {...m('Calves')} />
        </G>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

export function InteractiveMuscleMap({ muscleStats, onMusclePress, selectedMuscle }: Props) {
    const sw = (m: MuscleGroup) => (selectedMuscle === m ? 1.5 : 0);
    const sc = (m: MuscleGroup) => (selectedMuscle === m ? SEL_STROKE : 'transparent');
    const press = (m: MuscleGroup) => () => onMusclePress(m);

    return (
        <Svg width="100%" height={320} viewBox="0 0 220 220">
            {/* FRONT (left) */}
            <G transform="translate(10, 0)">
                <FrontBody stats={muscleStats} sc={sc} sw={sw} press={press} />
                <SvgText x={50} y={220} textAnchor="middle" fill="#333" fontSize={5} fontWeight="700" letterSpacing={1}>FRONT</SvgText>
            </G>

            {/* BACK (right) */}
            <G transform="translate(115, 0)">
                <BackBody stats={muscleStats} sc={sc} sw={sw} press={press} />
                <SvgText x={50} y={220} textAnchor="middle" fill="#333" fontSize={5} fontWeight="700" letterSpacing={1}>BACK</SvgText>
            </G>
        </Svg>
    );
}
