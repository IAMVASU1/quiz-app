import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminLayout from '../../components/admin/AdminLayout';
import { apiGetUserAttempts } from '../../api/attempts.api';
import { apiGetQuizzesByCreator } from '../../api/quizzes.api';
import { apiCountQuestionsByCreator } from '../../api/questions.api';
import DashboardGraph from '../../components/admin/DashboardGraph'; // Reuse or create specific
import MotionContainer from '../../components/admin/MotionContainer';
import { colors } from '../../constants/colors';

export default function UserDetailsScreen({ route }) {
    const { user } = route.params;
    const [activeTab, setActiveTab] = useState('created'); // created | joined
    const [attempts, setAttempts] = useState([]);
    const [createdQuizzes, setCreatedQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ overallAccuracy: 0, totalAttempts: 0, totalCreated: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const userId = user.id || user._id;
            const promises = [apiGetUserAttempts(userId)];
            if (user.role === 'faculty' || user.role === 'admin') {
                promises.push(apiGetQuizzesByCreator(userId));
            }

            const results = await Promise.all(promises);
            const attemptsData = results[0] || [];
            setAttempts(attemptsData);

            if (attemptsData.length > 0) {
                const totalScore = attemptsData.reduce((sum, item) => sum + (item.score || 0), 0);
                const totalMax = attemptsData.reduce((sum, item) => sum + (item.maxScore || 0), 0);
                const overallAccuracy = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
                setStats(prev => ({
                    ...prev,
                    overallAccuracy: overallAccuracy.toFixed(1),
                    totalAttempts: attemptsData.length
                }));
            }

            if ((user.role === 'faculty' || user.role === 'admin') && results[1]) {
                const created = results[1].items || [];
                setCreatedQuizzes(created);
                setStats(prev => ({ ...prev, totalCreated: created.length }));

                // Fetch Question Count for Faculty
                if (user.role === 'faculty') {
                    try {
                        const qCount = await apiCountQuestionsByCreator(userId);
                        setStats(prev => ({ ...prev, totalQuestions: qCount }));
                    } catch (e) { console.error('Failed to fetch q count', e); }
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderProfileHeader = () => (
        <View style={styles.profileCard}>
            <View style={styles.profileInfo}>
                <View style={[styles.avatar, { backgroundColor: getRoleColor(user.role) }]}>
                    <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{user.role}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.profileStats}>
                {(user.role === 'faculty' || user.role === 'admin') && (
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.totalCreated}</Text>
                        <Text style={styles.statLabel}>Quizzes</Text>
                    </View>
                )}
                {user.role === 'faculty' && (
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.totalQuestions || 0}</Text>
                        <Text style={styles.statLabel}>Questions</Text>
                    </View>
                )}
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalAttempts}</Text>
                    <Text style={styles.statLabel}>Attempts</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.overallAccuracy}%</Text>
                    <Text style={styles.statLabel}>Accuracy</Text>
                </View>
            </View>
        </View>
    );

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return colors.primary[500];
            case 'faculty': return colors.warning[500];
            case 'student': return colors.success[500];
            default: return colors.neutral[500];
        }
    };

    const renderTabs = () => (
        <View style={styles.tabs}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'created' && styles.activeTab]}
                onPress={() => setActiveTab('created')}
            >
                <Text style={[styles.tabText, activeTab === 'created' && styles.activeTabText]}>Quizzes Created</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
                onPress={() => setActiveTab('joined')}
            >
                <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>Quizzes Joined</Text>
            </TouchableOpacity>
        </View>
    );

    const renderContent = () => {
        if (loading) return <ActivityIndicator size="large" color={colors.primary[500]} style={{ marginTop: 50 }} />;

        if (user.role === 'student') {
            return (
                <View>
                    <MotionContainer delay={0.1}>
                        <DashboardGraph
                            data={attempts.map((a, i) => {
                                const val = (a.maxScore > 0 && typeof a.score === 'number')
                                    ? (a.score / a.maxScore) * 100
                                    : 0;
                                return {
                                    name: `Q${i + 1}`,
                                    attempts: isFinite(val) ? val : 0
                                };
                            }).filter(item => item.attempts >= 0)} // double check
                        />
                    </MotionContainer>
                    <Text style={styles.sectionTitle}>Recent Attempts</Text>
                    {attempts.map((attempt, index) => (
                        <View key={index} style={styles.listItem}>
                            <Text style={styles.itemTitle}>{attempt.metadata?.quizSnapshot?.title || 'Quiz'}</Text>
                            <Text style={styles.itemScore}>{attempt.score}/{attempt.maxScore}</Text>
                            <Text style={styles.itemDate}>{new Date(attempt.finishedAt).toLocaleDateString()}</Text>
                        </View>
                    ))}
                </View>
            );
        }

        // Admin/Faculty View
        const showCreated = activeTab === 'created';
        const data = showCreated ? createdQuizzes : attempts;

        return (
            <View>
                {(user.role === 'admin' || user.role === 'faculty') && renderTabs()}

                <View style={styles.listContainer}>
                    {data.length === 0 ? (
                        <Text style={styles.emptyText}>No records found.</Text>
                    ) : (
                        data.map((item, index) => (
                            <View key={index} style={styles.listItem}>
                                <Text style={styles.itemTitle}>
                                    {showCreated ? item.title : (item.metadata?.quizSnapshot?.title || 'Quiz')}
                                </Text>
                                <View style={styles.itemRight}>
                                    {showCreated ? (
                                        <Text style={[styles.statusBadge, { color: item.status === 'published' ? colors.success[600] : colors.warning[600] }]}>
                                            {item.status}
                                        </Text>
                                    ) : (
                                        <Text style={styles.itemScore}>{item.score}/{item.maxScore}</Text>
                                    )}
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </View>
        );
    };

    return (
        <AdminLayout title="User Profile">
            <ScrollView style={styles.container}>
                <MotionContainer delay={0}>
                    {renderProfileHeader()}
                </MotionContainer>
                <View style={styles.content}>
                    {renderContent()}
                </View>
            </ScrollView>
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    profileCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: colors.neutral[900],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 20, // slightly more square
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.neutral[900],
    },
    userEmail: {
        fontSize: 14,
        color: colors.neutral[500],
    },
    roleBadge: {
        backgroundColor: colors.neutral[100],
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    roleText: {
        fontSize: 12,
        color: colors.neutral[600],
        textTransform: 'capitalize',
        fontWeight: '600',
    },
    profileStats: {
        flexDirection: 'row',
    },
    statItem: {
        alignItems: 'center',
        marginLeft: 24,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.neutral[900],
    },
    statLabel: {
        fontSize: 12,
        color: colors.neutral[500],
    },
    tabs: {
        flexDirection: 'row',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 16,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: colors.primary[500],
    },
    tabText: {
        fontSize: 14,
        color: colors.neutral[500],
        fontWeight: '500',
    },
    activeTabText: {
        color: colors.primary[500],
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.neutral[900],
        marginTop: 24,
        marginBottom: 16,
    },
    listContainer: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral[100],
    },
    itemTitle: {
        fontSize: 14,
        color: colors.neutral[700],
        flex: 1,
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemScore: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.neutral[900],
    },
    itemDate: {
        fontSize: 12,
        color: colors.neutral[400],
        marginLeft: 8,
    },
    statusBadge: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    emptyText: {
        textAlign: 'center',
        color: colors.neutral[400],
        padding: 20,
    },
});
