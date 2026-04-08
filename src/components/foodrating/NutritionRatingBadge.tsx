import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  rating: string;
  size?: 'small' | 'large';
}

const RATING_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: '#00C853', text: '#fff' },
  B: { bg: '#76D900', text: '#fff' },
  C: { bg: '#FFB300', text: '#fff' },
  D: { bg: '#FF6D00', text: '#fff' },
  E: { bg: '#D50000', text: '#fff' },
};

export default function NutritionRatingBadge({ rating, size = 'small' }: Props) {
  const colors = RATING_COLORS[rating] ?? { bg: '#888', text: '#fff' };
  const isLarge = size === 'large';
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, isLarge ? styles.large : styles.small]}>
      <Text style={[styles.letter, { color: colors.text }, isLarge && styles.largeLetter]}>
        {rating}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge:       { borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  small:       { width: 36, height: 36 },
  large:       { width: 88, height: 88, borderRadius: 18 },
  letter:      { fontWeight: '800', fontSize: 18 },
  largeLetter: { fontSize: 44 },
});
