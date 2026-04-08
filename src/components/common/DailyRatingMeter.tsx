import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { theme } from '../../constants/theme';

interface DailyRatingMeterProps {
    score: number;
    label: string;
    color: string;
    size?: number;
}

export function DailyRatingMeter({
    score,
    label,
    color,
    size = 200,
}: DailyRatingMeterProps) {
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Use standard RN Animated for Expo Go compatibility
    const animatedValue = useRef(new Animated.Value(0)).current;
    const [displayScore, setDisplayScore] = React.useState(0);
    const [dashOffset, setDashOffset] = React.useState(circumference);

    useEffect(() => {
        animatedValue.setValue(0);

        animatedValue.addListener(({ value }) => {
            const currentScore = Math.round(value);
            setDisplayScore(currentScore);
            const offset = circumference - (value / 100) * circumference;
            setDashOffset(offset);
        });

        Animated.timing(animatedValue, {
            toValue: score,
            duration: 1200,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: false,
        }).start();

        return () => {
            animatedValue.removeAllListeners();
        };
    }, [score]);

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Defs>
                    <SvgLinearGradient id="meterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#006c49" />
                        <Stop offset="100%" stopColor="#10b981" />
                    </SvgLinearGradient>
                </Defs>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={theme.colors.surfaceContainerHigh}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#meterGrad)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                />
            </Svg>
            <View style={styles.centerContent}>
                <Text style={[styles.scoreText, { color }]}>{displayScore}</Text>
                <Text style={styles.labelText}>{label}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerContent: {
        position: 'absolute',
        alignItems: 'center',
    },
    scoreText: {
        fontSize: 42,
        fontWeight: '800',
        letterSpacing: -1,
    },
    labelText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: 2,
    },
});
