import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface Props {
  label: string;
  value: string;
  highlight?: 'good' | 'bad' | 'neutral';
  isLast?: boolean;
}

export default function NutritionRow({ label, value, highlight = 'neutral', isLast }: Props) {
  const valueColor =
    highlight === 'good' ? theme.colors.success :
    highlight === 'bad'  ? theme.colors.danger :
    theme.colors.textPrimary;

  return (
    <View style={[styles.row, !isLast && styles.border]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainerLow,
  },
  label: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },
  value: { fontSize: 14, fontWeight: '700' },
});
