import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiGetDashboardStats, apiGetAttemptTrend } from '../../api/admin.api';
import AdminLayout from '../../components/admin/AdminLayout';
import StatCard from '../../components/admin/StatCard';
import DashboardGraph from '../../components/admin/DashboardGraph';
import MotionContainer from '../../components/admin/MotionContainer';
import { adminTheme } from '../../components/admin/theme';

const QUICK_ACTIONS = [
    { label: 'Manage Learners', caption: 'Users and roles', icon: 'people-outline', route: 'UsersManagement', tone: '#FFC06E' },
    { label: 'Create Quiz', caption: 'Build practice sets', icon: 'add-circle-outline', route: 'CreateQuizChoice', tone: '#79D3FF' },
    { label: 'Question Bank', caption: 'Curate quality', icon: 'book-outline', route: 'QuestionsLibrary', tone: '#90E6BE' },
];

export default function AdminDashboardScreen() {
    const navigation = useNavigation();
    const { width: viewportWidth } = useWindowDimensions();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalAdmins: 0,
        totalFaculty: 0,
        totalStudents: 0,
        totalQuizzes: 0,
        totalAttempts: 0,
        topSubjects: []
    });
    const [trendData, setTrendData] = useState([]);

    const totals = useMemo(() => ({
        totalUsers: Number(stats.totalUsers) || 0,
        totalAdmins: Number(stats.totalAdmins) || 0,
        totalFaculty: Number(stats.totalFaculty) || 0,
        totalStudents: Number(stats.totalStudents) || 0,
        totalQuizzes: Number(stats.totalQuizzes) || 0,
        totalAttempts: Number(stats.totalAttempts) || 0,
    }), [stats]);
    const subjectChips = useMemo(() => Array.isArray(stats.topSubjects) ? stats.topSubjects : [], [stats.topSubjects]);

    const insightData = useMemo(() => {
        const safeUsers = totals.totalUsers || 1;
        const safeQuizzes = totals.totalQuizzes || 1;
        const safeAdmins = totals.totalAdmins || 1;

        return {
            studentShare: Math.round((totals.totalStudents / safeUsers) * 100),
            facultyShare: Math.round((totals.totalFaculty / safeUsers) * 100),
            attemptsPerQuiz: (totals.totalAttempts / safeQuizzes).toFixed(1),
            usersPerAdmin: Math.ceil(totals.totalUsers / safeAdmins),
        };
    }, [totals]);

    const attemptTrendPercent = useMemo(() => {
        if (!Array.isArray(trendData) || trendData.length < 2) {
            return null;
        }

        const first = Number(trendData[0]?.attempts) || 0;
        const last = Number(trendData[trendData.length - 1]?.attempts) || 0;
        if (first === 0) {
            return last > 0 ? 100 : 0;
        }
        return Math.round(((last - first) / first) * 100);
    }, [trendData]);

    const statsColumns = viewportWidth >= 1100 ? 3 : 2;
    const statItemStyle = useMemo(() => ({
        width: `${100 / statsColumns}%`,
        paddingHorizontal: 6,
        marginBottom: 10,
    }), [statsColumns]);

    const loadData = async () => {
        try {
            const [statsRes, trendRes] = await Promise.all([
                apiGetDashboardStats(),
                apiGetAttemptTrend()
            ]);

            if (statsRes && statsRes.success) {
                setStats(prev => ({
                    ...prev,
                    ...statsRes.data,
                    topSubjects: Array.isArray(statsRes.data?.topSubjects) ? statsRes.data.topSubjects : [],
                }));
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
            setLoading(true);
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
                    <ActivityIndicator size="large" color={adminTheme.accent} />
                    <Text style={styles.loadingText}>Preparing your study dashboard...</Text>
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
                <MotionContainer delay={0}>
                    <LinearGradient
                        colors={['#112C59', '#1C66D8', '#35B2FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCard}
                    >
                        <View style={styles.heroDoodleBlobA} />
                        <View style={styles.heroDoodleBlobB} />
                        <View style={styles.heroDoodleRing} />

                        <View style={styles.heroTopRow}>
                            <Text style={styles.heroEyebrow}>STUDY APP COMMAND CENTER</Text>
                            <View style={styles.livePill}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>Live</Text>
                            </View>
                        </View>

                        <Text style={styles.heroTitle}>Keep every classroom session in rhythm.</Text>
                        <Text style={styles.heroSubtitle}>
                            {totals.totalStudents} learners are active with {totals.totalAttempts} attempts logged across {totals.totalQuizzes} quizzes.
                        </Text>

                        <View style={styles.heroPillsRow}>
                            <View style={styles.heroStatPill}>
                                <Ionicons name="school-outline" size={14} color="#FFFFFF" />
                                <Text style={styles.heroStatText}>{totals.totalFaculty} faculty</Text>
                            </View>
                            <View style={styles.heroStatPill}>
                                <Ionicons name="people-outline" size={14} color="#FFFFFF" />
                                <Text style={styles.heroStatText}>{totals.totalStudents} students</Text>
                            </View>
                            <View style={styles.heroStatPill}>
                                <Ionicons name="library-outline" size={14} color="#FFFFFF" />
                                <Text style={styles.heroStatText}>{totals.totalQuizzes} quizzes</Text>
                            </View>
                        </View>

                        <View style={styles.quickActionRow}>
                            {QUICK_ACTIONS.map((action) => (
                                <TouchableOpacity
                                    key={action.route}
                                    activeOpacity={0.9}
                                    style={styles.quickActionCard}
                                    onPress={() => navigation.navigate(action.route)}
                                >
                                    <View style={[styles.quickActionIcon, { backgroundColor: `${action.tone}30` }]}>
                                        <Ionicons name={action.icon} size={16} color="#FFFFFF" />
                                    </View>
                                    <Text style={styles.quickActionTitle}>{action.label}</Text>
                                    <Text style={styles.quickActionCaption}>{action.caption}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </LinearGradient>
                </MotionContainer>

                <MotionContainer delay={0.14}>
                    <View style={styles.insightCard}>
                        <View style={styles.insightHeader}>
                            <View style={styles.insightBadge}>
                                <Ionicons name="sparkles" size={12} color={adminTheme.accent} />
                                <Text style={styles.insightBadgeText}>Study Pulse</Text>
                            </View>
                            <Text style={styles.insightTitle}>Today at a glance</Text>
                            <Text style={styles.insightSubtitle}>
                                A quick health check for learner activity and mentor coverage.
                            </Text>
                        </View>

                        <View style={styles.pulseRow}>
                            <View style={[styles.pulseIcon, { backgroundColor: '#ECF4FF' }]}>
                                <Ionicons name="people" size={15} color="#286DD9" />
                            </View>
                            <View style={styles.pulseTextWrap}>
                                <Text style={styles.pulseTitle}>Learner composition</Text>
                                <Text style={styles.pulseDescription}>
                                    {insightData.studentShare}% students and {insightData.facultyShare}% faculty guiding practice.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.pulseRow}>
                            <View style={[styles.pulseIcon, { backgroundColor: '#FFF3E2' }]}>
                                <Ionicons name="analytics" size={15} color="#D98A1F" />
                            </View>
                            <View style={styles.pulseTextWrap}>
                                <Text style={styles.pulseTitle}>Quiz intensity</Text>
                                <Text style={styles.pulseDescription}>
                                    {insightData.attemptsPerQuiz} attempts per quiz on average.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.pulseRow}>
                            <View style={[styles.pulseIcon, { backgroundColor: '#EAFBEF' }]}>
                                <Ionicons name="shield-checkmark" size={15} color="#0D9C68" />
                            </View>
                            <View style={styles.pulseTextWrap}>
                                <Text style={styles.pulseTitle}>Admin coverage</Text>
                                <Text style={styles.pulseDescription}>
                                    Around {insightData.usersPerAdmin} users managed per admin account.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.subjectChipRow}>
                            {subjectChips.length ? (
                                subjectChips.map((subject) => (
                                    <View key={subject} style={styles.subjectChip}>
                                        <Text style={styles.subjectChipText}>{subject}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.subjectChipFallback}>No subject data yet.</Text>
                            )}
                        </View>

                        <View style={styles.insightDoodle} />
                    </View>
                </MotionContainer>

                <View style={styles.statsGrid}>
                    <MotionContainer delay={0.2} style={statItemStyle}>
                        <StatCard title="Admins" subtitle="Platform control" value={totals.totalAdmins} icon="shield-checkmark" color="#1D6BFF" />
                    </MotionContainer>
                    <MotionContainer delay={0.26} style={statItemStyle}>
                        <StatCard title="Faculty" subtitle="Learning mentors" value={totals.totalFaculty} icon="school" color="#EA9B25" />
                    </MotionContainer>
                    <MotionContainer delay={0.32} style={statItemStyle}>
                        <StatCard title="Students" subtitle="Active learners" value={totals.totalStudents} icon="people" color="#0FA56E" />
                    </MotionContainer>
                    <MotionContainer delay={0.38} style={statItemStyle}>
                        <StatCard title="Quizzes" subtitle="Published sets" value={totals.totalQuizzes} icon="library" color="#2053C8" />
                    </MotionContainer>
                    <MotionContainer delay={0.44} style={statItemStyle}>
                        <StatCard
                            title="Attempts"
                            subtitle="Practice interactions"
                            value={totals.totalAttempts}
                            icon="stats-chart"
                            color="#0B8BD7"
                            trend={attemptTrendPercent}
                        />
                    </MotionContainer>
                    <MotionContainer delay={0.5} style={statItemStyle}>
                        <StatCard title="Users" subtitle="All registered" value={totals.totalUsers} icon="person" color="#318FFB" />
                    </MotionContainer>
                </View>

                <MotionContainer delay={0.62}>
                    <DashboardGraph data={trendData} />
                </MotionContainer>

                <MotionContainer delay={0.74}>
                    <View style={styles.tipCard}>
                        <View style={styles.tipIconWrap}>
                            <Ionicons name="bulb-outline" size={16} color="#E38A1B" />
                        </View>
                        <View style={styles.tipTextWrap}>
                            <Text style={styles.tipTitle}>Doodle Tip</Text>
                            <Text style={styles.tipText}>
                                Keep quizzes short and frequent to boost retention. A quick daily challenge works better than one long weekly test.
                            </Text>
                        </View>
                        <View style={styles.tipDoodleCircle} />
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: adminTheme.textMuted,
        fontWeight: '600',
    },
    heroCard: {
        borderRadius: 26,
        padding: 20,
        marginBottom: 14,
        shadowColor: '#0A1630',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.24,
        shadowRadius: 20,
        elevation: 9,
        overflow: 'hidden',
    },
    heroDoodleBlobA: {
        position: 'absolute',
        width: 190,
        height: 190,
        borderRadius: 95,
        backgroundColor: 'rgba(255,255,255,0.14)',
        right: -44,
        top: -56,
    },
    heroDoodleBlobB: {
        position: 'absolute',
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(255,255,255,0.1)',
        left: -28,
        bottom: -28,
    },
    heroDoodleRing: {
        position: 'absolute',
        width: 88,
        height: 88,
        borderRadius: 44,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.34)',
        right: 48,
        bottom: 66,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heroEyebrow: {
        color: '#DCEAFF',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.1,
        marginBottom: 8,
    },
    livePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#9DFFBC',
        marginRight: 6,
    },
    liveText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 27,
        fontWeight: '800',
        marginBottom: 6,
        lineHeight: 32,
        maxWidth: 560,
    },
    heroSubtitle: {
        color: '#E6F1FF',
        fontSize: 14,
        lineHeight: 20,
        maxWidth: 560,
    },
    heroPillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 14,
    },
    heroStatPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.17)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.24)',
        marginRight: 8,
        marginBottom: 8,
    },
    heroStatText: {
        marginLeft: 5,
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
    },
    quickActionRow: {
        marginTop: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
    },
    quickActionCard: {
        margin: 4,
        borderRadius: 16,
        minWidth: 160,
        paddingVertical: 10,
        paddingHorizontal: 11,
        backgroundColor: 'rgba(8,24,56,0.24)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        flex: 1,
    },
    quickActionIcon: {
        width: 30,
        height: 30,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickActionTitle: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    quickActionCaption: {
        color: '#CCE2FF',
        fontSize: 11,
        marginTop: 2,
    },
    insightCard: {
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderWidth: 1,
        borderColor: '#DDE8FF',
        padding: 18,
        shadowColor: adminTheme.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
        overflow: 'hidden',
        marginBottom: 6,
    },
    insightHeader: {
        marginBottom: 10,
    },
    insightBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDF4FF',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#D8E8FF',
    },
    insightBadgeText: {
        marginLeft: 5,
        fontSize: 11,
        color: adminTheme.accent,
        fontWeight: '700',
    },
    insightTitle: {
        marginTop: 9,
        color: adminTheme.title,
        fontSize: 20,
        fontWeight: '800',
    },
    insightSubtitle: {
        marginTop: 4,
        color: adminTheme.textMuted,
        fontSize: 12,
        lineHeight: 18,
    },
    pulseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFF',
        borderWidth: 1,
        borderColor: '#E6ECFB',
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 9,
        marginTop: 8,
    },
    pulseIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 9,
    },
    pulseTextWrap: {
        flex: 1,
    },
    pulseTitle: {
        color: adminTheme.title,
        fontSize: 13,
        fontWeight: '700',
    },
    pulseDescription: {
        marginTop: 2,
        color: adminTheme.textMuted,
        fontSize: 12,
    },
    subjectChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    subjectChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#EFF5FF',
        marginRight: 7,
        marginTop: 6,
        borderWidth: 1,
        borderColor: '#DCE8FF',
    },
    subjectChipText: {
        color: '#355D9D',
        fontSize: 11,
        fontWeight: '700',
    },
    subjectChipFallback: {
        color: adminTheme.textMuted,
        fontSize: 12,
        marginTop: 4,
    },
    insightDoodle: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: 'rgba(61,123,226,0.15)',
        right: -24,
        top: -24,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
        marginTop: 10,
        marginBottom: 10,
        alignItems: 'flex-start',
    },
    tipCard: {
        marginTop: 4,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#F6DEBF',
        backgroundColor: '#FFF9EF',
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    tipIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#FFEACC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    tipTextWrap: {
        flex: 1,
    },
    tipTitle: {
        color: '#81562A',
        fontWeight: '800',
        fontSize: 13,
    },
    tipText: {
        marginTop: 2,
        color: '#8C6742',
        fontSize: 12,
        lineHeight: 17,
    },
    tipDoodleCircle: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,205,138,0.3)',
        right: -24,
        top: -20,
    },
});
