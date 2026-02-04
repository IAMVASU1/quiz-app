import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '../../hooks/useAuth';
import client from '../../api/client';
import AdminLayout from '../../components/admin/AdminLayout';
import StatCard from '../../components/admin/StatCard';
import MotionContainer from '../../components/admin/MotionContainer';

export default function ProfileScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.role === 'student') {
            const userId = user.id || user._id;
            if (userId) {
                setLoading(true);
                client.get(`/leaderboard/${userId}`)
                    .then(res => {
                        if (res.data.success) {
                            setStats(res.data.data);
                        }
                    })
                    .catch(err => console.error('Error fetching stats:', err))
                    .finally(() => setLoading(false));
            }
        }
    }, [user]);

    const handleLogout = async () => {
        await logout();
    };

    const renderInfoRow = (icon, label, value) => (
        <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
                <Ionicons name={icon} size={20} color="#64748B" />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value || 'N/A'}</Text>
            </View>
        </View>
    );

    return (
        <AdminLayout title="My Profile">
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Profile Header Card */}
                <MotionContainer delay={0.1}>
                    <View style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </Text>
                            </View>
                            <View style={styles.badgeContainer}>
                                <View style={[styles.roleBadge, { backgroundColor: '#EFF6FF' }]}>
                                    <Text style={[styles.roleText, { color: '#3B82F6' }]}>
                                        {user?.role || 'User'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <Text style={styles.userName}>{user?.name}</Text>
                        <Text style={styles.userEmail}>{user?.email}</Text>

                        <View style={styles.divider} />

                        <View style={styles.infoSection}>
                            {renderInfoRow('calendar-outline', 'Joined', user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A')}
                            {renderInfoRow('id-card-outline', 'User ID', user?._id || user?.id)}
                        </View>
                    </View>
                </MotionContainer>

                {/* Student Stats */}
                {user?.role === 'student' && (
                    <View style={styles.statsGrid}>
                        <MotionContainer delay={0.2} style={styles.statWrapper}>
                            <StatCard
                                title="Rank"
                                value={`#${stats?.rank || '-'}`}
                                icon="podium"
                                color="#F59E0B"
                            />
                        </MotionContainer>
                        <MotionContainer delay={0.3} style={styles.statWrapper}>
                            <StatCard
                                title="Score"
                                value={stats?.totalScore || 0}
                                icon="trophy"
                                color="#10B981"
                            />
                        </MotionContainer>
                        <MotionContainer delay={0.4} style={styles.statWrapper}>
                            <StatCard
                                title="Attempts"
                                value={stats?.attempts || 0}
                                icon="repeat"
                                color="#3B82F6"
                            />
                        </MotionContainer>
                        <MotionContainer delay={0.5} style={styles.statWrapper}>
                            <StatCard
                                title="Accuracy"
                                value={`${stats?.accuracy || 0}%`}
                                icon="analytics"
                                color="#8B5CF6"
                            />
                        </MotionContainer>
                    </View>
                )}

                {/* Actions */}
                <MotionContainer delay={0.6}>
                    <View style={styles.actionCard}>
                        <TouchableOpacity style={styles.actionBtn} onPress={handleLogout}>
                            <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                            </View>
                            <Text style={[styles.actionText, { color: '#EF4444' }]}>Logout</Text>
                            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                    </View>
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
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#F1F5F9',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    badgeContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    roleText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 24,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#E2E8F0',
        marginBottom: 24,
    },
    infoSection: {
        width: '100%',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#0F172A',
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
        marginBottom: 24,
    },
    statWrapper: {
        flex: 1,
        minWidth: 150,
    },
    actionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '500',
    },
});
