import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiGetDashboardStats, apiGetAttemptTrend } from '../../api/admin.api';
import AdminLayout from '../../components/admin/AdminLayout';
import StatCard from '../../components/admin/StatCard';
import DashboardGraph from '../../components/admin/DashboardGraph';
import MotionContainer from '../../components/admin/MotionContainer';

export default function AdminDashboardScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalAdmins: 0,
        totalFaculty: 0,
        totalStudents: 0,
        totalQuizzes: 0,
        totalAttempts: 0
    });
    const [trendData, setTrendData] = useState([]);

    const loadData = async () => {
        try {
            const [statsRes, trendRes] = await Promise.all([
                apiGetDashboardStats(),
                apiGetAttemptTrend()
            ]);

            if (statsRes && statsRes.success) {
                setStats(statsRes.data);
            }
            if (trendRes && trendRes.success) {
                setTrendData(trendRes.data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    if (loading) {
        return (
            <AdminLayout title="Dashboard">
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Dashboard">
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.statsGrid}>
                    <MotionContainer delay={0.1} style={styles.statWrapper}>
                        <StatCard
                            title="Admins"
                            value={stats.totalAdmins}
                            icon="shield-checkmark"
                            color="#3B82F6"
                        />
                    </MotionContainer>
                    <MotionContainer delay={0.2} style={styles.statWrapper}>
                        <StatCard
                            title="Faculty"
                            value={stats.totalFaculty}
                            icon="school"
                            color="#F59E0B"
                        />
                    </MotionContainer>
                    <MotionContainer delay={0.3} style={styles.statWrapper}>
                        <StatCard
                            title="Students"
                            value={stats.totalStudents}
                            icon="people"
                            color="#10B981"
                        />
                    </MotionContainer>
                </View>

                <View style={styles.statsGrid}>
                    <MotionContainer delay={0.4} style={styles.statWrapper}>
                        <StatCard
                            title="Quizzes"
                            value={stats.totalQuizzes}
                            icon="library"
                            color="#6366F1"
                        />
                    </MotionContainer>
                    <MotionContainer delay={0.5} style={styles.statWrapper}>
                        <StatCard
                            title="Attempts"
                            value={stats.totalAttempts}
                            icon="stats-chart"
                            color="#8B5CF6"
                        />
                    </MotionContainer>
                    <MotionContainer delay={0.6} style={styles.statWrapper}>
                        <StatCard
                            title="Users"
                            value={stats.totalUsers}
                            icon="person"
                            color="#EC4899"
                        />
                    </MotionContainer>
                </View>

                <MotionContainer delay={0.8}>
                    <DashboardGraph data={trendData} />
                </MotionContainer>

                <View style={{ height: 40 }} />
            </ScrollView>
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
        marginBottom: 6,
    },
    statWrapper: {
        flex: 1,
        minWidth: 100,
    },
});
