import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AdminLayout from '../../components/admin/AdminLayout';
import MotionContainer from '../../components/admin/MotionContainer';
import useAuth from '../../hooks/useAuth';
import Avatar from '../../components/common/Avatar';
import { adminTheme, getRolePalette } from '../../components/admin/theme';
import { apiGetDashboardStats } from '../../api/admin.api';

export default function UsersManagementScreen({ navigation }) {
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalAdmins: 0,
        totalFaculty: 0,
        totalStudents: 0,
    });

    const loadStats = async () => {
        try {
            const response = await apiGetDashboardStats();
            if (response?.success) {
                setStats(prev => ({
                    ...prev,
                    totalUsers: Number(response.data?.totalUsers) || 0,
                    totalAdmins: Number(response.data?.totalAdmins) || 0,
                    totalFaculty: Number(response.data?.totalFaculty) || 0,
                    totalStudents: Number(response.data?.totalStudents) || 0,
                }));
            }
        } catch (error) {
            console.error('Failed to fetch user stats', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadStats();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadStats();
    };

    const categories = useMemo(() => [
        {
            id: 'admin',
            title: 'Administrators',
            icon: 'shield-checkmark',
            description: 'Manage policies, roles, and platform access.',
            action: 'View Admins',
            count: stats.totalAdmins,
        },
        {
            id: 'faculty',
            title: 'Faculty',
            icon: 'school',
            description: 'Monitor quiz creators and teaching contributors.',
            action: 'View Faculty',
            count: stats.totalFaculty,
        },
        {
            id: 'student',
            title: 'Students',
            icon: 'people',
            description: 'Track learner growth, participation, and outcomes.',
            action: 'View Students',
            count: stats.totalStudents,
        }
    ], [stats.totalAdmins, stats.totalFaculty, stats.totalStudents]);

    const roleShare = useMemo(() => {
        const safeTotal = stats.totalUsers || 1;
        return {
            admin: Math.round((stats.totalAdmins / safeTotal) * 100),
            faculty: Math.round((stats.totalFaculty / safeTotal) * 100),
            student: Math.round((stats.totalStudents / safeTotal) * 100),
        };
    }, [stats.totalUsers, stats.totalAdmins, stats.totalFaculty, stats.totalStudents]);

    const handlePress = (role) => {
        navigation.navigate('UserList', { role });
    };

    if (loading) {
        return (
            <AdminLayout title="User Management">
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={adminTheme.accent} />
                    <Text style={styles.loadingText}>Loading user management data...</Text>
                </View>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="User Management" hideDefaultHeader={true}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <MotionContainer delay={0}>
                    <View style={styles.headerContainer}>
                        <View style={styles.headerTopRow}>
                            <View style={styles.headerLeft}>
                                <Text style={styles.headerEyebrow}>USER DIRECTORY</Text>
                                <Text style={[styles.headerTitle, isMobile && styles.headerTitleMobile]}>People Overview</Text>
                                <Text style={styles.headerSubtitle}>
                                    Role distribution and quick access to each user group.
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileButton}>
                                <Avatar
                                    name={user?.name || 'Admin'}
                                    size={46}
                                    uri={user?.avatar}
                                    color={adminTheme.accent}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.metricsRow, isMobile && styles.metricsRowMobile]}>
                            <View style={[styles.metricCard, styles.metricCardPrimary, isMobile && styles.metricCardMobile]}>
                                <Text style={styles.metricLabel}>Total Users</Text>
                                <Text style={styles.metricValuePrimary}>{stats.totalUsers}</Text>
                            </View>

                            <View style={[styles.metricCard, isMobile && styles.metricCardMobile]}>
                                <View style={[styles.metricDot, { backgroundColor: getRolePalette('admin').tone }]} />
                                <Text style={styles.metricLabel}>Admins</Text>
                                <Text style={styles.metricValue}>{roleShare.admin}%</Text>
                            </View>

                            <View style={[styles.metricCard, isMobile && styles.metricCardMobile]}>
                                <View style={[styles.metricDot, { backgroundColor: getRolePalette('faculty').tone }]} />
                                <Text style={styles.metricLabel}>Faculty</Text>
                                <Text style={styles.metricValue}>{roleShare.faculty}%</Text>
                            </View>

                            <View style={[styles.metricCard, isMobile && styles.metricCardMobile]}>
                                <View style={[styles.metricDot, { backgroundColor: getRolePalette('student').tone }]} />
                                <Text style={styles.metricLabel}>Students</Text>
                                <Text style={styles.metricValue}>{roleShare.student}%</Text>
                            </View>
                        </View>
                    </View>
                </MotionContainer>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Browse by Role</Text>
                    <Text style={styles.sectionSubtitle}>Open a role to view all users and details.</Text>
                </View>

                <View style={styles.grid}>
                    {categories.map((cat, index) => {
                        const palette = getRolePalette(cat.id);
                        return (
                            <MotionContainer key={cat.id} delay={index * 0.1} style={[styles.cardWrapper, isMobile ? styles.cardWrapperMobile : styles.cardWrapperDesktop]}>
                                <View style={styles.card}>
                                    <View style={styles.cardTopRow}>
                                        <View style={[styles.iconContainer, { backgroundColor: palette.soft }]}>
                                            <Ionicons name={cat.icon} size={22} color={palette.tone} />
                                        </View>
                                        <View style={[styles.countPill, { borderColor: `${palette.tone}35` }]}>
                                            <Text style={styles.countLabel}>Count</Text>
                                            <Text style={styles.countValue}>{cat.count}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardContent}>
                                        <Text style={styles.cardTitle}>{cat.title}</Text>
                                        <Text style={styles.cardDesc}>{cat.description}</Text>
                                        <View style={styles.shareRow}>
                                            <Text style={styles.shareCaption}>Role Share</Text>
                                            <Text style={styles.sharePercent}>{roleShare[cat.id] || 0}%</Text>
                                        </View>
                                        <View style={styles.shareTrack}>
                                            <View
                                                style={[
                                                    styles.shareFill,
                                                    {
                                                        width: `${Math.max(4, roleShare[cat.id] || 0)}%`,
                                                        backgroundColor: palette.tone,
                                                    },
                                                ]}
                                            />
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        style={[styles.actionButton, { borderColor: `${palette.tone}45` }]}
                                        onPress={() => handlePress(cat.id)}
                                    >
                                        <Text style={[styles.actionText, { color: palette.tone }]}>{cat.action}</Text>
                                        <Ionicons name="arrow-forward" size={15} color={palette.tone} />
                                    </TouchableOpacity>
                                </View>
                            </MotionContainer>
                        );
                    })}
                </View>
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: adminTheme.textMuted,
        fontWeight: '600',
    },
    contentContainer: {
        paddingBottom: 40,
        paddingHorizontal: 2,
        paddingTop: 4,
    },
    headerContainer: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DEE6F3',
        padding: 18,
        borderRadius: 18,
        marginBottom: 18,
        shadowColor: adminTheme.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.09,
        shadowRadius: 18,
        elevation: 5,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flex: 1,
        paddingRight: 10,
    },
    headerEyebrow: {
        color: '#6B7E9D',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: adminTheme.title,
        marginBottom: 3,
    },
    headerTitleMobile: {
        fontSize: 24,
    },
    headerSubtitle: {
        fontSize: 14,
        color: adminTheme.textMuted,
        lineHeight: 20,
    },
    profileButton: {
        marginTop: 2,
    },
    metricsRow: {
        marginTop: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    metricsRowMobile: {
        marginTop: 14,
    },
    metricCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#DEE6F3',
        backgroundColor: '#F8FAFE',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minWidth: 128,
        marginRight: 10,
        marginBottom: 10,
    },
    metricCardPrimary: {
        minWidth: 160,
    },
    metricCardMobile: {
        minWidth: '47%',
    },
    metricDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginBottom: 8,
    },
    metricLabel: {
        color: '#6B7E9D',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.65,
    },
    metricValue: {
        color: adminTheme.title,
        fontSize: 20,
        fontWeight: '800',
        marginTop: 2,
    },
    metricValuePrimary: {
        color: adminTheme.title,
        fontSize: 30,
        fontWeight: '800',
        marginTop: 1,
    },
    sectionHeader: {
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: adminTheme.title,
        marginBottom: 3,
    },
    sectionSubtitle: {
        color: adminTheme.textMuted,
        fontSize: 13,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    cardWrapper: {
        padding: 8,
    },
    cardWrapperMobile: {
        width: '100%',
    },
    cardWrapperDesktop: {
        width: '33.33%',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        alignItems: 'flex-start',
        borderWidth: 1.2,
        borderColor: '#DDE5F7',
        shadowColor: adminTheme.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.11,
        shadowRadius: 18,
        elevation: 6,
        minHeight: 228,
        justifyContent: 'space-between',
    },
    cardTopRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7FAFF',
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 11,
        paddingVertical: 7,
    },
    countLabel: {
        color: '#6E7FA1',
        fontSize: 10,
        fontWeight: '700',
        marginRight: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    countValue: {
        color: adminTheme.title,
        fontSize: 15,
        fontWeight: '800',
    },
    cardContent: {
        marginBottom: 12,
        flex: 1,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: adminTheme.title,
        marginBottom: 5,
    },
    cardDesc: {
        fontSize: 14,
        color: adminTheme.textMuted,
        lineHeight: 21,
        fontWeight: '500',
        marginBottom: 10,
    },
    shareRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    shareCaption: {
        color: '#6A7EA6',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    sharePercent: {
        color: adminTheme.title,
        fontSize: 12,
        fontWeight: '800',
    },
    shareTrack: {
        width: '100%',
        height: 7,
        borderRadius: 6,
        backgroundColor: 'rgba(182,197,226,0.35)',
        overflow: 'hidden',
    },
    shareFill: {
        height: '100%',
        borderRadius: 6,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        paddingVertical: 11,
        paddingHorizontal: 12,
        backgroundColor: '#FBFDFF',
    },
    actionText: {
        fontWeight: '800',
        fontSize: 14,
    },
});
