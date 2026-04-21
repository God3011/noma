import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface Props {
    title?: string;
    subtitle?: string;
}

export default function SectionHeader({ title, subtitle }: Props) {
    return (
        <View style={styles.container}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
    title: { fontSize: 18, fontWeight: '600', color: theme.colors.textPrimary },
    subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
});
