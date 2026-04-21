import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { theme } from '../../constants/theme';

const CHART_WIDTH = Dimensions.get('window').width - 40;
const NO_DATA_MSG = 'No data yet — start logging to see this chart';

interface Props {
    data: { label: string; calories: number }[];
    target: number;
}

export default function CalorieTrendChart({ data, target }: Props) {
    const hasData = data.some(d => d.calories > 0);

    if (!hasData) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{NO_DATA_MSG}</Text>
            </View>
        );
    }

    const chartData = {
        labels: data.map(d => d.label),
        datasets: [{ data: data.map(d => Math.round(d.calories) || 0) }],
    };

    return (
        <View style={styles.container}>
            <BarChart
                data={chartData}
                width={CHART_WIDTH}
                height={200}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                    backgroundColor: theme.colors.surfaceContainerLow,
                    backgroundGradientFrom: theme.colors.surfaceContainerLow,
                    backgroundGradientTo: theme.colors.surfaceContainerLow,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    labelColor: () => theme.colors.textSecondary,
                    style: { borderRadius: theme.borderRadius.md },
                    barPercentage: 0.65,
                    propsForBackgroundLines: {
                        strokeDasharray: '',
                        stroke: theme.colors.outlineVariant,
                        strokeWidth: 0.5,
                    },
                    propsForLabels: { fontSize: 10 },
                }}
                style={styles.chart}
                showValuesOnTopOfBars={false}
                withInnerLines
                fromZero
            />
            <Text style={styles.targetLabel}>Target: {Math.round(target)} kcal / day</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20 },
    chart: { borderRadius: theme.borderRadius.md, overflow: 'hidden' },
    targetLabel: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4, textAlign: 'right' },
    emptyContainer: {
        marginHorizontal: 20,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.md,
        padding: 24,
        alignItems: 'center',
    },
    emptyText: { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center' },
});
