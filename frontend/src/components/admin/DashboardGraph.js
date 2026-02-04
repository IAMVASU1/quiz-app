import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

export default function DashboardGraph({ data }) {
    const screenWidth = Dimensions.get('window').width;

    // Mock data if none provided
    const chartData = data || [
        { name: 'Mon', attempts: 40 },
        { name: 'Tue', attempts: 30 },
        { name: 'Wed', attempts: 20 },
        { name: 'Thu', attempts: 27 },
        { name: 'Fri', attempts: 18 },
        { name: 'Sat', attempts: 23 },
        { name: 'Sun', attempts: 34 },
    ];

    const nativeData = chartData
        .map(d => ({ value: Number(d.attempts) || 0, label: d.name }))
        .map(d => ({ ...d, value: isFinite(d.value) ? d.value : 0 }));

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Quiz Attempts Trend</Text>
            <LineChart
                data={nativeData}
                width={screenWidth - 80}
                height={220}
                color="#3B82F6"
                thickness={3}
                dataPointsColor="#3B82F6"
                textColor="#64748B"
                hideRules
                hideYAxisText={false}
                yAxisTextStyle={{ color: '#64748B', fontSize: 10 }}
                xAxisLabelTextStyle={{ color: '#64748B', fontSize: 10 }}
                initialSpacing={10}
                spacing={40}
                hideDataPoints={false}
                curved
                isAnimated
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        height: 350,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
        marginTop: 24,
        alignItems: 'center'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 20,
        alignSelf: 'flex-start'
    },
});
