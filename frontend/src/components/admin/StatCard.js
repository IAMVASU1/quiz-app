import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminTheme } from './theme';

export default function StatCard({ title, value, icon, color, trend, subtitle }) {
    const hasTrend = typeof trend === 'number' && Number.isFinite(trend) && trend !== 0;

    return (
        <View style={styles.shell}>
            <View style={[styles.topAccent, { backgroundColor: `${color}20` }]} />
            <View style={[styles.glow, { backgroundColor: `${color}20` }]} />
            <View style={styles.doodleDot} />

            <View style={styles.topRow}>
                <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                    <Ionicons name={icon} size={18} color={color} />
                </View>

                {hasTrend && (
                    <View style={styles.trendContainer}>
                        <Ionicons name={trend > 0 ? 'trending-up' : 'trending-down'} size={12} color={trend > 0 ? adminTheme.success : adminTheme.danger} />
                        <Text style={[styles.trendText, { color: trend > 0 ? adminTheme.success : adminTheme.danger }]}>
                            {Math.abs(trend)}%
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.title}>{title}</Text>
                {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    shell: {
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderRadius: 20,
        padding: 12,
        margin: 0,
        borderWidth: 1.2,
        borderColor: '#DFE9FF',
        shadowColor: adminTheme.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
        minHeight: 118,
        overflow: 'hidden',
    },
    topAccent: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 5,
    },
    glow: {
        position: 'absolute',
        width: 110,
        height: 110,
        borderRadius: 55,
        right: -44,
        top: -44,
    },
    doodleDot: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        right: 14,
        top: 16,
        backgroundColor: '#D9E7FF',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flexGrow: 0,
    },
    value: {
        fontSize: 24,
        fontWeight: '800',
        color: adminTheme.title,
    },
    title: {
        fontSize: 13,
        color: adminTheme.textStrong,
        marginTop: 3,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 11,
        color: adminTheme.textMuted,
        marginTop: 3,
        lineHeight: 15,
        fontWeight: '600',
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7FAFF',
        borderRadius: 999,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#E8EEFF',
    },
    trendText: {
        fontSize: 10,
        fontWeight: '700',
        marginLeft: 2,
    },
});
