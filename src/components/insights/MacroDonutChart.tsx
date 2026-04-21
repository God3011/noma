import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { theme } from '../../constants/theme';

const CHART_WIDTH = Dimensions.get('window').width - 40;
const NO_DATA_MSG = 'No data yet — start logging to see this chart';

interface Props {
    data: { protein_g: number; carbs_g: number; fat_g: number };
}

export default function MacroDonutChart({ data }: Props) {
    const total = (data.protein_g + data.carbs_g + data.fat_g) || 0;

    if (total === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{NO_DATA_MSG}</Text>
            </View>
        );
    }

    const chartData = [
        {
            name: 'Protein',
            grams: Math.round(data.protein_g),
            color: theme.colors.primary,
            legendFontColor: theme.colors.textSecondary,
            legendFontSize: 12,
        },
        {
            name: 'Carbs',
            grams: Math.round(data.carbs_g),
            color: theme.colors.tertiary,
            legendFontColor: theme.colors.textSecondary,
            legendFontSize: 12,
        },
        {
            name: 'Fat',
            grams: Math.round(data.fat_g),
            color: theme.colors.danger,
            legendFontColor: theme.colors.textSecondary,
            legendFontSize: 12,
        },
    ].filter(d => d.grams > 0);

    if (chartData.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{NO_DATA_MSG}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <PieChart
                data={chartData}
                width={CHART_WIDTH}
                height={180}
                chartConfig={{
                    color: () => theme.colors.textPrimary,
                    labelColor: () => theme.colors.textSecondary,
                    backgroundColor: theme.colors.background,
                    backgroundGradientFrom: theme.colors.background,
                    backgroundGradientTo: theme.colors.background,
                }}
                accessor="grams"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20 },
    emptyContainer: {
        marginHorizontal: 20,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.md,
        padding: 24,
        alignItems: 'center',
    },
    emptyText: { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center' },
});
