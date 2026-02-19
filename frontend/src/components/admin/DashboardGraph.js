import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { adminTheme } from './theme';

export default function DashboardGraph({ data }) {
    const { width: screenWidth } = useWindowDimensions();
    const isCompact = screenWidth < 420;

    const chartData = Array.isArray(data) ? data : [];

    const nativeData = chartData.map((item, index) => {
        const rawLabel = item?.name || item?.label || item?.day || item?.date || `D${index + 1}`;
        const label = String(rawLabel).slice(0, 3);
        const rawValue = Number(item?.attempts ?? item?.value ?? 0);

        return {
            value: Number.isFinite(rawValue) ? rawValue : 0,
            label,
        };
    });

    const peakValue = nativeData.length ? Math.max(...nativeData.map(point => point.value)) : 0;
    const totalValue = nativeData.reduce((sum, item) => sum + item.value, 0);
    const averageValue = nativeData.length ? (totalValue / nativeData.length).toFixed(1) : '0.0';
    const firstValue = nativeData[0]?.value || 0;
    const lastValue = nativeData[nativeData.length - 1]?.value || 0;
    const trendValue = firstValue === 0 ? (lastValue > 0 ? 100 : 0) : Math.round(((lastValue - firstValue) / firstValue) * 100);
    const chartWidth = Math.max(206, Math.min(screenWidth - (isCompact ? 92 : 124), 860));
    const chartSpacing = nativeData.length > 1
        ? Math.max(24, Math.min(38, Math.floor((chartWidth - 32) / (nativeData.length - 1))))
        : 30;
    const hasChartData = nativeData.length > 0;

    return (
        <View style={styles.container}>
            <View style={styles.doodleCircle} />
            <View style={styles.doodleRing} />

            <View style={styles.header}>
                <View style={styles.headerTextWrap}>
                    <View style={styles.badge}>
                        <Ionicons name="stats-chart-outline" size={12} color={adminTheme.accent} />
                        <Text style={styles.badgeText}>Practice Trend</Text>
                    </View>
                    <Text style={styles.title}>Attempt rhythm this week</Text>
                    <Text style={styles.subtitle}>Track consistency and make study streaks stronger</Text>
                </View>
                <View style={[styles.summaryCard, isCompact && styles.summaryCardCompact]}>
                    <Text style={styles.summaryLabel}>Avg / day</Text>
                    <Text style={styles.summaryValue}>{averageValue}</Text>
                </View>
            </View>

            <View style={styles.legendRow}>
                <View style={styles.legendPill}>
                    <View style={[styles.legendDot, { backgroundColor: '#2576FF' }]} />
                    <Text style={styles.legendText}>Attempts</Text>
                </View>
                <View style={styles.legendPill}>
                    <View style={[styles.legendDot, { backgroundColor: '#89B9FF' }]} />
                    <Text style={styles.legendText}>Study momentum</Text>
                </View>
            </View>

            <View style={styles.chartFrame}>
                {hasChartData ? (
                    <LineChart
                        data={nativeData}
                        width={chartWidth}
                        height={isCompact ? 180 : 210}
                        color="#2576FF"
                        thickness={3}
                        dataPointsColor="#2576FF"
                        textColor={adminTheme.textMuted}
                        hideRules
                        hideYAxisText={isCompact}
                        yAxisTextStyle={{ color: adminTheme.textMuted, fontSize: 10 }}
                        xAxisLabelTextStyle={{ color: adminTheme.textMuted, fontSize: 10 }}
                        initialSpacing={12}
                        spacing={chartSpacing}
                        hideDataPoints={false}
                        dataPointsRadius={3}
                        xAxisThickness={0}
                        yAxisThickness={0}
                        curved
                        isAnimated
                        areaChart
                        startFillColor="#7FB1FF"
                        endFillColor="#FFFFFF"
                        startOpacity={0.26}
                        endOpacity={0.03}
                        hideOrigin
                    />
                ) : (
                    <View style={styles.emptyStateWrap}>
                        <Text style={styles.emptyStateText}>No attempt trend available yet.</Text>
                    </View>
                )}
            </View>

            <View style={styles.footerRow}>
                <Text style={styles.footerNote}>Peak attempts: {peakValue}</Text>
                <Text style={[styles.footerTrend, { color: trendValue >= 0 ? adminTheme.success : adminTheme.danger }]}>
                    {trendValue >= 0 ? '+' : ''}{trendValue}% vs start
                </Text>
            </View>
            <Text style={styles.footerTotal}>Total tracked attempts: {totalValue}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderRadius: 24,
        paddingVertical: 18,
        paddingHorizontal: 15,
        minHeight: 310,
        borderWidth: 1.2,
        borderColor: '#DFE8FB',
        shadowColor: adminTheme.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
        marginTop: 8,
        alignItems: 'stretch',
        overflow: 'visible',
    },
    doodleCircle: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(55,118,219,0.08)',
        right: -38,
        top: -42,
    },
    doodleRing: {
        position: 'absolute',
        width: 74,
        height: 74,
        borderRadius: 37,
        borderWidth: 2,
        borderColor: 'rgba(45,109,210,0.16)',
        left: -20,
        bottom: 56,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    headerTextWrap: {
        flexShrink: 1,
        minWidth: 170,
    },
    badge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAF2FF',
        borderWidth: 1,
        borderColor: '#DCEAFF',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 5,
        marginBottom: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: adminTheme.accent,
        marginLeft: 5,
        letterSpacing: 0.3,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: adminTheme.title,
        marginBottom: 3,
    },
    subtitle: {
        fontSize: 12,
        color: adminTheme.textMuted,
    },
    summaryCard: {
        backgroundColor: adminTheme.accentSoft,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 9,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDE9FF',
    },
    summaryCardCompact: {
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    summaryLabel: {
        fontSize: 9,
        color: adminTheme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    summaryValue: {
        fontSize: 16,
        color: adminTheme.accent,
        fontWeight: '800',
    },
    legendRow: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    legendPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F6F9FF',
        borderWidth: 1,
        borderColor: '#E5ECFA',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 8,
        marginBottom: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    legendText: {
        color: adminTheme.textMuted,
        fontSize: 10,
        fontWeight: '700',
    },
    chartFrame: {
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#FBFDFF',
        paddingTop: 6,
        paddingBottom: 4,
    },
    emptyStateWrap: {
        height: 170,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    emptyStateText: {
        color: adminTheme.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },
    footerRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingHorizontal: 6,
    },
    footerNote: {
        fontSize: 12,
        color: adminTheme.textMuted,
        fontWeight: '600',
    },
    footerTrend: {
        fontSize: 12,
        fontWeight: '700',
    },
    footerTotal: {
        width: '100%',
        paddingHorizontal: 6,
        marginTop: 3,
        fontSize: 12,
        color: adminTheme.textMuted,
    },
});
