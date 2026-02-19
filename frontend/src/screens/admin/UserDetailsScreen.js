import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminLayout from '../../components/admin/AdminLayout';
import { apiGetUserAttempts } from '../../api/attempts.api';
import { apiGetQuizzesByCreator } from '../../api/quizzes.api';
import { apiCountQuestionsByCreator } from '../../api/questions.api';
import DashboardGraph from '../../components/admin/DashboardGraph';
import MotionContainer from '../../components/admin/MotionContainer';
import { adminTheme, getRolePalette } from '../../components/admin/theme';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

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
            <View style={[styles.profileGlow, { backgroundColor: `${getRolePalette(user.role).tone}26` }]} />
            <View style={styles.profileInfo}>
                <View style={[styles.avatar, { backgroundColor: getRolePalette(user.role).tone }]}>
                    <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                    <Text style={styles.userEyebrow}>{user.role.toUpperCase()}</Text>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: getRolePalette(user.role).soft }]}>
                        <Text style={[styles.roleText, { color: getRolePalette(user.role).tone }]}>{user.role}</Text>
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

    const renderTabs = () => (
        <View style={styles.tabs}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'created' && styles.activeTab]}
                onPress={() => setActiveTab('created')}
            >
                <Ionicons name="document-text-outline" size={14} color={activeTab === 'created' ? '#FFFFFF' : adminTheme.textMuted} />
                <Text style={[styles.tabText, activeTab === 'created' && styles.activeTabText]}>Quizzes Created</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
                onPress={() => setActiveTab('joined')}
            >
                <Ionicons name="play-circle-outline" size={14} color={activeTab === 'joined' ? '#FFFFFF' : adminTheme.textMuted} />
                <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>Quizzes Joined</Text>
            </TouchableOpacity>
        </View>
    );

    const renderContent = () => {
        if (loading) return <ActivityIndicator size="large" color={adminTheme.accent} style={{ marginTop: 50 }} />;

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
                            <View key={index} style={[styles.listItem, index % 2 === 1 && styles.listItemAlt]}>
                                <Text style={styles.itemTitle}>
                                    {showCreated ? item.title : (item.metadata?.quizSnapshot?.title || 'Quiz')}
                                </Text>
                                <View style={styles.itemRight}>
                                    {showCreated ? (
                                        <Text style={[styles.statusBadge, { color: item.status === 'published' ? adminTheme.success : adminTheme.warning }]}>
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
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderRadius: 22,
        padding: 20,
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#DDE5F7',
        shadowColor: adminTheme.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 18,
        elevation: 5,
        overflow: 'hidden',
    },
    profileGlow: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        top: -90,
        right: -70,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#1A3674',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.26,
        shadowRadius: 12,
        elevation: 6,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    userEyebrow: {
        fontSize: 11,
        fontWeight: '700',
        color: adminTheme.textMuted,
        letterSpacing: 1,
        marginBottom: 4,
    },
    userName: {
        fontSize: 26,
        fontWeight: '800',
        color: adminTheme.title,
    },
    userEmail: {
        fontSize: 14,
        color: adminTheme.textMuted,
    },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    roleText: {
        fontSize: 12,
        textTransform: 'capitalize',
        fontWeight: '700',
    },
    profileStats: {
        flexDirection: 'row',
        marginTop: isMobile ? 18 : 0,
        flexWrap: isMobile ? 'wrap' : 'nowrap',
    },
    statItem: {
        alignItems: 'center',
        marginLeft: isMobile ? 0 : 22,
        marginRight: isMobile ? 18 : 0,
        marginBottom: isMobile ? 12 : 0,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: adminTheme.title,
    },
    statLabel: {
        fontSize: 12,
        color: adminTheme.textMuted,
        fontWeight: '600',
    },
    tabs: {
        flexDirection: 'row',
        marginBottom: 14,
    },
    tab: {
        paddingVertical: 9,
        paddingHorizontal: 12,
        marginRight: 10,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: '#DFE7FA',
        backgroundColor: '#F4F8FF',
        flexDirection: 'row',
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: adminTheme.accent,
        borderColor: adminTheme.accent,
    },
    tabText: {
        fontSize: 14,
        color: adminTheme.textMuted,
        fontWeight: '700',
        marginLeft: 6,
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: adminTheme.title,
        marginTop: 24,
        marginBottom: 16,
    },
    listContainer: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#DFE7FA',
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E9EEFB',
    },
    listItemAlt: {
        backgroundColor: '#F3F7FF',
    },
    itemTitle: {
        fontSize: 14,
        color: adminTheme.textStrong,
        flex: 1,
        fontWeight: '500',
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemScore: {
        fontSize: 14,
        fontWeight: '800',
        color: adminTheme.title,
    },
    itemDate: {
        fontSize: 12,
        color: adminTheme.textMuted,
        marginLeft: 8,
    },
    statusBadge: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    emptyText: {
        textAlign: 'center',
        color: adminTheme.textMuted,
        padding: 20,
    },
    content: {
        paddingBottom: 28,
    },
});
