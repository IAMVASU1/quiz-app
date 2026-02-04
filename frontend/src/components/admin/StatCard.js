import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StatCard({ title, value, icon, color, trend }) {
    return (
        <View style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={styles.content}>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.title}>{title}</Text>
            </View>
            {trend && (
                <View style={styles.trendContainer}>
                    <Ionicons name={trend > 0 ? "arrow-up" : "arrow-down"} size={12} color={trend > 0 ? "#10B981" : "#EF4444"} />
                    <Text style={[styles.trendText, { color: trend > 0 ? "#10B981" : "#EF4444" }]}>
                        {Math.abs(trend)}%
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        flex: 1,
        minWidth: 100, // Compact width
        margin: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: 100, // Fixed compact height
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    content: {
        flex: 1,
    },
    value: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    title: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        top: 12,
        right: 12,
    },
    trendText: {
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 2,
    },
});
