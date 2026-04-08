import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  confidence?: 'low' | 'medium' | 'high';
  notes?: string;
}

export default function AIMarkerBadge({ confidence, notes }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Ionicons name="sparkles" size={15} color="#7c3aed" />
        <Text style={styles.title}>AI Estimated</Text>
        {confidence && (
          <View style={styles.confidencePill}>
            <Text style={styles.confidenceText}>{confidence} confidence</Text>
          </View>
        )}
      </View>
      <Text style={styles.sub}>
        Product not found in database. Nutrition values are estimated by AI and may not be accurate.
      </Text>
      {notes ? <Text style={styles.notes}>{notes}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#c4b5fd',
    gap: 6,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 13, fontWeight: '700', color: '#7c3aed', flex: 1 },
  confidencePill: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 99,
  },
  confidenceText: { fontSize: 11, fontWeight: '600', color: '#7c3aed' },
  sub: { fontSize: 12, color: '#6d28d9', lineHeight: 17 },
  notes: { fontSize: 12, color: '#7c3aed', fontStyle: 'italic', lineHeight: 17 },
});
