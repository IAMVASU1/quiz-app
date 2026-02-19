import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AdminLayout from '../../components/admin/AdminLayout';
import { apiGetAttemptHistory } from '../../api/attempts.api';
import { apiGetQuizzesByCreator, apiUpdateQuiz } from '../../api/quizzes.api';
import useAuth from '../../hooks/useAuth';
import MotionContainer from '../../components/admin/MotionContainer';
import { adminTheme } from '../../components/admin/theme';

export default function HistoryScreen({ navigation }) {
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [activeTab, setActiveTab] = useState('joined');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [joinedQuizzes, setJoinedQuizzes] = useState([]);
    const [createdQuizzes, setCreatedQuizzes] = useState([]);

    const userId = user?.id || user?._id;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'joined') {
                const res = await apiGetAttemptHistory({ limit: 50 });
                setJoinedQuizzes(Array.isArray(res?.items) ? res.items : []);
            } else if (userId) {
                const res = await apiGetQuizzesByCreator(userId);
                setCreatedQuizzes(Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []));
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab, userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleToggleStatus = async (quiz) => {
        const newStatus = quiz.status === 'published' ? 'paused' : 'published';
        try {
            await apiUpdateQuiz(quiz._id, { status: newStatus });
            setCreatedQuizzes(prev => prev.map(q => (q._id === quiz._id ? { ...q, status: newStatus } : q)));
            Alert.alert('Success', `Quiz ${newStatus === 'published' ? 'is now LIVE' : 'has been PAUSED'}`);
        } catch (_error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const joinedMetrics = useMemo(() => {
        if (!joinedQuizzes.length) {
            return { total: 0, avg: 0, passed: 0 };
        }

        let totalPercent = 0;
        let passedCount = 0;

        joinedQuizzes.forEach(item => {
            const score = Number(item?.score) || 0;
            const maxScore = Number(item?.maxScore) || 0;
            const percent = maxScore > 0 ? (score / maxScore) * 100 : 0;
            totalPercent += percent;
            if (percent >= 50) {
                passedCount += 1;
            }
        });

        return {
            total: joinedQuizzes.length,
            avg: Math.round(totalPercent / joinedQuizzes.length),
            passed: passedCount,
        };
    }, [joinedQuizzes]);

    const createdMetrics = useMemo(() => {
        if (!createdQuizzes.length) {
            return { total: 0, live: 0, drafts: 0 };
        }

        const live = createdQuizzes.filter(q => q.status === 'published').length;
        const drafts = createdQuizzes.filter(q => q.status !== 'published').length;

        return { total: createdQuizzes.length, live, drafts };
    }, [createdQuizzes]);

    const renderTab = (key, label, icon) => {
        const isActive = activeTab === key;
        return (
            <TouchableOpacity
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => setActiveTab(key)}
                activeOpacity={0.9}
            >
                <Ionicons
                    name={icon}
                    size={14}
                    color={isActive ? '#FFFFFF' : adminTheme.textMuted}
                />
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{label}</Text>
            </TouchableOpacity>
        );
    };

    const renderJoinedItem = ({ item, index }) => {
        const date = new Date(item.finishedAt || item.createdAt).toLocaleDateString();
        const score = Number(item?.score) || 0;
        const max = Number(item?.maxScore) || 0;
        const percentage = max > 0 ? Math.round((score / max) * 100) : 0;
        const passed = percentage >= 50;
        const quizTitle = item?.metadata?.quizSnapshot?.title || 'Quiz Attempt';

        const resultData = {
            ...item,
            score,
            maxScore: max,
            passed,
            percentage,
            fromHistory: true,
        };

        return (
            <MotionContainer delay={Math.min(index * 0.04, 0.28)}>
                <TouchableOpacity
                    style={styles.timelineCard}
                    onPress={() => navigation.navigate('QuizResult', { result: resultData })}
                    activeOpacity={0.92}
                >
                    <View style={[styles.timelineDot, { backgroundColor: passed ? '#19AE74' : '#F39C3D' }]} />
                    <View style={styles.timelineConnector} />
                    <View style={styles.cardGlow} />

                    <View style={styles.cardHeaderRow}>
                        <View style={styles.cardTitleWrap}>
                            <Text style={styles.cardTitle}>{quizTitle}</Text>
                            <Text style={styles.cardMetaText}>Completed on {date}</Text>
                        </View>
                        <View style={[styles.scoreBadge, { backgroundColor: passed ? '#E7FAF1' : '#FFF2E3' }]}>
                            <Text style={[styles.scoreText, { color: passed ? '#0F9F65' : '#CD7B18' }]}>
                                {score}/{max}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.progressTrack}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${Math.max(4, percentage)}%`, backgroundColor: passed ? '#18A86F' : '#EAA646' },
                            ]}
                        />
                    </View>

                    <View style={styles.cardFooterRow}>
                        <View style={[styles.statusPill, { backgroundColor: passed ? '#EBFAF2' : '#FFF5EA' }]}>
                            <Ionicons
                                name={passed ? 'checkmark-circle' : 'alert-circle'}
                                size={14}
                                color={passed ? '#18A86F' : '#EAA646'}
                            />
                            <Text style={[styles.statusText, { color: passed ? '#18A86F' : '#C47B1A' }]}>
                                {passed ? 'Passed' : 'Needs Work'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#90A0C2" />
                    </View>
                </TouchableOpacity>
            </MotionContainer>
        );
    };

    const renderCreatedItem = ({ item, index }) => {
        const date = new Date(item.createdAt).toLocaleDateString();
        const isLive = item.status === 'published';
        const questionCount = Number(item?.questionsCount) || (Array.isArray(item?.questionIds) ? item.questionIds.length : 0);

        return (
            <MotionContainer delay={Math.min(index * 0.04, 0.28)}>
                <View style={styles.timelineCard}>
                    <View style={[styles.timelineDot, { backgroundColor: isLive ? '#1D6BFF' : '#EAA646' }]} />
                    <View style={styles.timelineConnector} />
                    <View style={styles.cardGlow} />

                    <View style={styles.cardHeaderRow}>
                        <View style={styles.cardTitleWrap}>
                            <Text style={styles.cardTitle}>{item.title || 'Untitled Quiz'}</Text>
                            <Text style={styles.cardMetaText}>Code: {item.quizCode || 'N/A'}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: isLive ? '#E8F1FF' : '#FFF2E3' }]}>
                            <Text style={[styles.statusBadgeText, { color: isLive ? '#1D6BFF' : '#C57918' }]}>
                                {(item.status || 'draft').toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.metaPill}>
                            <Ionicons name="calendar-outline" size={12} color={adminTheme.textMuted} />
                            <Text style={styles.metaPillText}>{date}</Text>
                        </View>
                        <View style={styles.metaPill}>
                            <Ionicons name="help-circle-outline" size={12} color={adminTheme.textMuted} />
                            <Text style={styles.metaPillText}>{questionCount} Questions</Text>
                        </View>
                    </View>

                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={[styles.quickActionBtn, { backgroundColor: isLive ? '#FFF0F0' : '#E9F9F1' }]}
                            onPress={() => handleToggleStatus(item)}
                        >
                            <Ionicons
                                name={isLive ? 'pause-outline' : 'play-outline'}
                                size={14}
                                color={isLive ? '#D95050' : '#14A56E'}
                            />
                            <Text style={[styles.quickActionText, { color: isLive ? '#D95050' : '#14A56E' }]}>
                                {isLive ? 'Pause' : 'Go Live'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickActionBtn, { backgroundColor: '#EAF2FF' }]}
                            onPress={() => navigation.navigate('EditQuiz', { quizId: item._id })}
                        >
                            <Ionicons name="create-outline" size={14} color="#1D6BFF" />
                            <Text style={[styles.quickActionText, { color: '#1D6BFF' }]}>Edit Quiz</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </MotionContainer>
        );
    };

    const listData = activeTab === 'joined' ? joinedQuizzes : createdQuizzes;

    return (
        <AdminLayout title="History">
            <View style={styles.container}>
                <LinearGradient
                    colors={['#102D5A', '#1C63CC', '#43B9FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    <View style={styles.heroDoodleA} />
                    <View style={styles.heroDoodleB} />

                    <Text style={styles.heroEyebrow}>HISTORY PANEL</Text>
                    <Text style={styles.heroTitle}>Activity Timeline</Text>
                    <Text style={styles.heroSubtitle}>
                        Track quiz participation and creation history in a single workspace.
                    </Text>

                    <View style={styles.metricsRow}>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>Joined</Text>
                            <Text style={styles.metricValue}>{joinedMetrics.total}</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>Created</Text>
                            <Text style={styles.metricValue}>{createdMetrics.total}</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>Live</Text>
                            <Text style={styles.metricValue}>{createdMetrics.live}</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.tabsContainer}>
                    {renderTab('joined', 'Joined Quizzes', 'checkmark-done-outline')}
                    {renderTab('created', 'Created Quizzes', 'library-outline')}
                </View>

                <View style={styles.summaryStrip}>
                    {activeTab === 'joined' ? (
                        <>
                            <Text style={styles.summaryText}>Avg Score: {joinedMetrics.avg}%</Text>
                            <Text style={styles.summaryText}>Passed: {joinedMetrics.passed}</Text>
                            <Text style={styles.summaryText}>Attempts: {joinedMetrics.total}</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.summaryText}>Total: {createdMetrics.total}</Text>
                            <Text style={styles.summaryText}>Live: {createdMetrics.live}</Text>
                            <Text style={styles.summaryText}>Paused/Draft: {createdMetrics.drafts}</Text>
                        </>
                    )}
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={adminTheme.accent} />
                    </View>
                ) : (
                    <FlatList
                        data={listData}
                        renderItem={activeTab === 'joined' ? renderJoinedItem : renderCreatedItem}
                        keyExtractor={(item, idx) => item?._id || item?.id || String(idx)}
                        contentContainerStyle={[styles.listContent, isMobile && styles.listContentMobile]}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="file-tray-outline" size={46} color="#9AACC9" />
                                <Text style={styles.emptyText}>No records found for this section.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    hero: {
        borderRadius: 22,
        paddingHorizontal: 18,
        paddingVertical: 16,
        marginBottom: 12,
        overflow: 'hidden',
    },
    heroDoodleA: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.16)',
        right: -40,
        top: -42,
    },
    heroDoodleB: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        left: -30,
        bottom: -18,
    },
    heroEyebrow: {
        color: '#D7E8FF',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 6,
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 27,
        fontWeight: '800',
        marginBottom: 4,
    },
    heroSubtitle: {
        color: '#DBEBFF',
        fontSize: 13,
        lineHeight: 19,
        maxWidth: 520,
    },
    metricsRow: {
        flexDirection: 'row',
        marginTop: 12,
    },
    metricCard: {
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        minWidth: 86,
    },
    metricLabel: {
        color: '#D7E8FF',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    metricValue: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginTop: 2,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#DCE6FA',
        padding: 5,
        marginBottom: 10,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        paddingVertical: 10,
    },
    activeTab: {
        backgroundColor: adminTheme.accent,
    },
    tabText: {
        marginLeft: 6,
        color: adminTheme.textMuted,
        fontSize: 13,
        fontWeight: '700',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    summaryStrip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderWidth: 1,
        borderColor: '#DFE7F9',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryText: {
        color: adminTheme.textMuted,
        fontSize: 12,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        paddingBottom: 26,
    },
    listContentMobile: {
        paddingBottom: 32,
    },
    timelineCard: {
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#DFE7FA',
        padding: 14,
        marginBottom: 12,
        shadowColor: adminTheme.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
        overflow: 'hidden',
    },
    timelineDot: {
        position: 'absolute',
        width: 11,
        height: 11,
        borderRadius: 6,
        left: 11,
        top: 20,
    },
    timelineConnector: {
        position: 'absolute',
        width: 2,
        left: 15,
        top: 32,
        bottom: -22,
        backgroundColor: '#DBE5FA',
    },
    cardGlow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        top: -55,
        right: -50,
        backgroundColor: 'rgba(98,145,225,0.12)',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 16,
    },
    cardTitleWrap: {
        flex: 1,
        paddingRight: 8,
    },
    cardTitle: {
        color: adminTheme.title,
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 3,
    },
    cardMetaText: {
        color: adminTheme.textMuted,
        fontSize: 12,
        fontWeight: '500',
    },
    scoreBadge: {
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 10,
    },
    scoreText: {
        fontSize: 13,
        fontWeight: '800',
    },
    progressTrack: {
        marginTop: 12,
        marginLeft: 16,
        width: '95%',
        height: 8,
        borderRadius: 6,
        backgroundColor: '#E6EEFC',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 6,
    },
    cardFooterRow: {
        marginTop: 11,
        marginLeft: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    statusText: {
        marginLeft: 6,
        fontSize: 12,
        fontWeight: '700',
    },
    statusBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.6,
    },
    metaRow: {
        marginTop: 12,
        marginLeft: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    metaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F8FF',
        borderWidth: 1,
        borderColor: '#E1EAFB',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 6,
    },
    metaPillText: {
        marginLeft: 5,
        color: adminTheme.textMuted,
        fontSize: 11,
        fontWeight: '700',
    },
    actionsRow: {
        marginTop: 10,
        marginLeft: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    quickActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 11,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 6,
    },
    quickActionText: {
        marginLeft: 5,
        fontSize: 12,
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 34,
    },
    emptyText: {
        marginTop: 10,
        color: adminTheme.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },
});
