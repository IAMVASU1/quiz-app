import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar, Platform, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';

import { apiGetAttemptHistory } from '../../api/attempts.api';
import { apiGetSubjects } from '../../api/questions.api';
import { getStudentProfile } from '../../api/leaderboard.api';
import Avatar from '../../components/common/Avatar';
import useAuth from '../../hooks/useAuth';
import useAppTheme from '../../hooks/useAppTheme';

const ACTIVITY_DAYS = 84;

function createHomeColors(palette, isDark) {
    return {
        pageBg: palette.pageBg,
        surface: palette.surface,
        card: palette.card,
        border: palette.border,
        text: palette.text,
        textMuted: palette.textMuted,
        primary: palette.primary,
        primarySoft: palette.primarySoft,
        secondary: palette.secondary,
        secondarySoft: palette.secondarySoft,
        accent: palette.accent,
        topBlob: isDark ? 'rgba(135,152,255,0.2)' : '#CED4FF',
        chipBorder: isDark ? '#324A7A' : '#D7E0FF',
        todayBorder: isDark ? '#A8B6FF' : '#9BB0F8',
        emptyDashed: isDark ? '#405480' : '#D4DEF0',
        actionTitle: isDark ? '#E8EEFF' : '#223654',
    };
}

function dateKey(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function getHeatCellTone(count, maxCount, themeColors, isDark) {
    if (count <= 0) return { bg: isDark ? '#1E2C4F' : '#F4F7FD', border: isDark ? '#314168' : '#DDE6F4' };
    const ratio = maxCount > 0 ? count / maxCount : 0;
    if (ratio <= 0.25) return { bg: isDark ? '#2D4373' : '#DDE5FF', border: isDark ? '#3A5488' : '#C8D5FF' };
    if (ratio <= 0.5) return { bg: isDark ? '#425FA0' : '#BCCBFF', border: isDark ? '#5577BD' : '#A9BEFF' };
    if (ratio <= 0.75) return { bg: isDark ? '#5F7BC6' : '#8FA5FF', border: isDark ? '#7592E4' : '#7E98FF' };
    return { bg: themeColors.primary, border: isDark ? '#A4B3FF' : '#4258EE' };
}

function getLegendTones(isDark, themeColors) {
    if (isDark) {
        return [
            { bg: '#1E2C4F', border: '#314168' },
            { bg: '#2D4373', border: '#3A5488' },
            { bg: '#5F7BC6', border: '#7592E4' },
            { bg: themeColors.primary, border: '#A4B3FF' },
        ];
    }
    return [
        { bg: '#F4F7FD', border: '#DDE6F4' },
        { bg: '#DDE5FF', border: '#C8D5FF' },
        { bg: '#8FA5FF', border: '#7E98FF' },
        { bg: themeColors.primary, border: '#4258EE' },
    ];
}

export default function StudentHomeScreen({ navigation }) {
    const { user } = useAuth();
    const { palette, statusBarStyle, isDark } = useAppTheme();
    const themeColors = useMemo(() => createHomeColors(palette, isDark), [palette, isDark]);
    const styles = useMemo(() => createStyles(themeColors), [themeColors]);
    const legendTones = useMemo(() => getLegendTones(isDark, themeColors), [isDark, themeColors]);
    const [refreshing, setRefreshing] = useState(false);
    const [quizCode, setQuizCode] = useState('');
    const [recentAttempts, setRecentAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dashboard, setDashboard] = useState({
        totalAttempts: 0,
        todayAttempts: 0,
        weekAverage: 0,
        subjectCount: 0,
        rank: null,
        accuracy: null,
        totalScore: 0,
        activityColumns: [],
        activeDays: 0,
        streak: 0,
        maxDayAttempts: 0,
    });

    const displayName = useMemo(() => {
        const raw = (user?.name || 'Student').trim();
        return raw.split(' ')[0] || 'Student';
    }, [user?.name]);

    const todayLabel = useMemo(() => {
        const now = new Date();
        return now.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    }, []);

    const translateX = useSharedValue(0);
    const contextX = useSharedValue(0);

    const navigateToProfile = () => {
        navigation.navigate('Profile');
    };

    const gesture = Gesture.Pan()
        .activeOffsetX([-20, 20])
        .onStart(() => {
            contextX.value = translateX.value;
        })
        .onUpdate((event) => {
            translateX.value = event.translationX + contextX.value;
        })
        .onEnd((event) => {
            if (event.translationX < -100) {
                runOnJS(navigateToProfile)();
            }
            translateX.value = withSpring(0);
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const loadData = useCallback(async () => {
        const userId = user?.id || user?._id;
        try {
            const [historyRes, subjectsRes, profileRes] = await Promise.all([
                apiGetAttemptHistory({ limit: 200 }),
                apiGetSubjects().catch(() => []),
                userId ? getStudentProfile(userId).catch(() => null) : Promise.resolve(null),
            ]);

            const attempts = historyRes?.items || (Array.isArray(historyRes) ? historyRes : []);
            setRecentAttempts(attempts.slice(0, 5));

            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfTomorrow = new Date(startOfToday);
            startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

            const activityStart = new Date(startOfToday);
            activityStart.setDate(activityStart.getDate() - (ACTIVITY_DAYS - 1));

            const weekStart = new Date(startOfToday);
            weekStart.setDate(weekStart.getDate() - 6);

            const dayCounts = {};
            let todayAttempts = 0;
            const weekAccuracies = [];

            attempts.forEach((attempt) => {
                const rawDate = attempt.finishedAt || attempt.createdAt;
                const date = new Date(rawDate);
                if (Number.isNaN(date.getTime())) return;

                if (date >= startOfToday && date < startOfTomorrow) {
                    todayAttempts += 1;
                }

                if (date >= activityStart && date < startOfTomorrow) {
                    const key = dateKey(date);
                    dayCounts[key] = (dayCounts[key] || 0) + 1;
                }

                if (date >= weekStart && date < startOfTomorrow && typeof attempt.score === 'number' && typeof attempt.maxScore === 'number' && attempt.maxScore > 0) {
                    weekAccuracies.push((attempt.score / attempt.maxScore) * 100);
                }
            });

            const weekAverage = weekAccuracies.length
                ? Math.round(weekAccuracies.reduce((sum, value) => sum + value, 0) / weekAccuracies.length)
                : 0;

            let streak = 0;
            for (let i = 0; i < ACTIVITY_DAYS; i += 1) {
                const check = new Date(startOfToday);
                check.setDate(startOfToday.getDate() - i);
                const key = dateKey(check);
                if ((dayCounts[key] || 0) > 0) streak += 1;
                else break;
            }

            const gridStart = new Date(activityStart);
            gridStart.setDate(gridStart.getDate() - gridStart.getDay());
            const totalGridDays = Math.ceil((ACTIVITY_DAYS + activityStart.getDay()) / 7) * 7;

            const columns = [];
            let activeDays = 0;
            let maxDayAttempts = 0;

            for (let c = 0; c < totalGridDays / 7; c += 1) {
                const col = [];
                for (let r = 0; r < 7; r += 1) {
                    const date = new Date(gridStart);
                    date.setDate(gridStart.getDate() + c * 7 + r);
                    const inRange = date >= activityStart && date < startOfTomorrow;
                    const key = dateKey(date);
                    const count = inRange ? (dayCounts[key] || 0) : null;
                    if (inRange && count > 0) {
                        activeDays += 1;
                        if (count > maxDayAttempts) maxDayAttempts = count;
                    }
                    col.push({
                        key,
                        count,
                        isToday: key === dateKey(startOfToday),
                    });
                }
                columns.push(col);
            }

            const profile = profileRes?.data || null;
            const accuracy = typeof profile?.accuracy === 'number' ? Math.round(profile.accuracy) : null;
            const subjectCount = Array.isArray(subjectsRes) ? subjectsRes.length : 0;

            setDashboard({
                totalAttempts: attempts.length,
                todayAttempts,
                weekAverage,
                subjectCount,
                rank: profile?.rank ?? null,
                accuracy,
                totalScore: profile?.totalScore || 0,
                activityColumns: columns,
                activeDays,
                streak,
                maxDayAttempts,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id, user?._id]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleJoin = () => {
        if (!quizCode.trim()) {
            Alert.alert('Enter Quiz Code', 'Please enter a quiz code to continue.');
            return;
        }
        navigation.navigate('JoinQuiz', { quizCode: quizCode.trim() });
    };

    const renderTopCard = () => (
        <View style={styles.topCard}>
            <View style={styles.topBlob} />
            <View style={styles.topRow}>
                <View style={styles.userRow}>
                    <Avatar
                        uri={user?.avatar}
                        name={user?.name || 'Student'}
                        size={44}
                        color={themeColors.primary}
                    />
                    <View style={styles.userTextWrap}>
                        <Text style={styles.greetingText}>Hello, {displayName}</Text>
                        <Text style={styles.dateText}>Today | {todayLabel}</Text>
                    </View>
                </View>

                <View style={styles.statusBadge}>
                    <Ionicons name="sparkles-outline" size={13} color={themeColors.primary} />
                    <Text style={styles.statusBadgeText}>{dashboard.streak > 0 ? `${dashboard.streak} day streak` : 'Ready'}</Text>
                </View>
            </View>

            <View style={styles.profileStatRow}>
                <View style={styles.profileStatPill}>
                    <Text style={styles.profileStatLabel}>Rank</Text>
                    <Text style={styles.profileStatValue}>{dashboard.rank ? `#${dashboard.rank}` : '-'}</Text>
                </View>
                <View style={styles.profileStatPill}>
                    <Text style={styles.profileStatLabel}>Accuracy</Text>
                    <Text style={styles.profileStatValue}>{dashboard.accuracy !== null ? `${dashboard.accuracy}%` : '-'}</Text>
                </View>
                <View style={styles.profileStatPill}>
                    <Text style={styles.profileStatLabel}>Score</Text>
                    <Text style={styles.profileStatValue}>{dashboard.totalScore}</Text>
                </View>
            </View>

            <View style={styles.challengeCard}>
                <View style={styles.challengeLeft}>
                    <Text style={styles.challengeTitle}>Daily Challenge</Text>
                    <Text style={styles.challengeSub}>Weekly average accuracy: {dashboard.weekAverage}%</Text>
                    <View style={styles.challengeMetaPill}>
                        <Ionicons name="time-outline" size={13} color={themeColors.primary} />
                        <Text style={styles.challengeMetaText}>{dashboard.todayAttempts} attempts today</Text>
                    </View>
                </View>
                <LinearGradient
                    colors={[themeColors.primary, themeColors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.challengeArt}
                >
                    <Ionicons name="flash-outline" size={18} color="#FFFFFF" />
                </LinearGradient>
            </View>
        </View>
    );

    const renderOverallActivity = () => (
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeadRow}>
                <Text style={styles.sectionTitle}>Overall Activity</Text>
                <Text style={styles.sectionHint}>{dashboard.totalAttempts} total attempts</Text>
            </View>

            <View style={styles.activityGridWrap}>
                <View style={styles.yLabelsCol}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, idx) => (
                        <Text key={`${label}-${idx}`} style={styles.yLabelText}>{label}</Text>
                    ))}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.heatScrollContent}>
                    <View style={styles.heatColumnsRow}>
                        {dashboard.activityColumns.map((weekColumn, weekIndex) => (
                            <View key={`w-${weekIndex}`} style={styles.heatWeekColumn}>
                                {weekColumn.map((cell, dayIndex) => {
                                    if (cell.count === null) {
                                        return <View key={`e-${weekIndex}-${dayIndex}`} style={styles.heatCellEmpty} />;
                                    }
                                    const tone = getHeatCellTone(cell.count, dashboard.maxDayAttempts, themeColors, isDark);
                                    return (
                                        <View
                                            key={`c-${weekIndex}-${dayIndex}`}
                                            style={[
                                                styles.heatCell,
                                                { backgroundColor: tone.bg, borderColor: tone.border },
                                                cell.isToday && cell.count === 0 && styles.heatCellToday,
                                            ]}
                                        />
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>

            <View style={styles.legendRow}>
                <Text style={styles.legendText}>{dashboard.activeDays}/{ACTIVITY_DAYS} active days</Text>
                <View style={styles.legendScale}>
                    <Text style={styles.legendText}>Less</Text>
                    <View style={[styles.legendBox, { backgroundColor: legendTones[0].bg, borderColor: legendTones[0].border }]} />
                    <View style={[styles.legendBox, { backgroundColor: legendTones[1].bg, borderColor: legendTones[1].border }]} />
                    <View style={[styles.legendBox, { backgroundColor: legendTones[2].bg, borderColor: legendTones[2].border }]} />
                    <View style={[styles.legendBox, { backgroundColor: legendTones[3].bg, borderColor: legendTones[3].border }]} />
                    <Text style={styles.legendText}>More</Text>
                </View>
            </View>
        </View>
    );

    const renderQuickJoin = () => (
        <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Quick Join</Text>
            <Text style={styles.sectionHint}>Enter faculty code to start instantly.</Text>

            <View style={styles.joinInputWrap}>
                <Ionicons name="key-outline" size={17} color={themeColors.textMuted} />
                <TextInput
                    style={styles.joinInput}
                    placeholder="e.g. QZ-1234"
                    placeholderTextColor="#8A99B3"
                    value={quizCode}
                    onChangeText={setQuizCode}
                    autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.joinMiniBtn} onPress={handleJoin}>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderQuickActions = () => (
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeadRow}>
                <Text style={styles.sectionTitle}>Practice Modes</Text>
            </View>

            <View style={styles.actionGrid}>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AptitudeCategory')}>
                    <View style={[styles.actionIcon, { backgroundColor: themeColors.primarySoft }]}>
                        <Ionicons name="bulb-outline" size={18} color={themeColors.primary} />
                    </View>
                    <Text style={styles.actionTitle}>Aptitude</Text>
                    <Text style={styles.actionSub}>{dashboard.todayAttempts} attempts today</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TechnicalSubjects')}>
                    <View style={[styles.actionIcon, { backgroundColor: themeColors.secondarySoft }]}>
                        <Ionicons name="code-slash-outline" size={18} color={themeColors.secondary} />
                    </View>
                    <Text style={styles.actionTitle}>Technical</Text>
                    <Text style={styles.actionSub}>{dashboard.subjectCount} subjects available</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Leaderboard')}>
                    <View style={[styles.actionIcon, { backgroundColor: themeColors.primarySoft }]}>
                        <Ionicons name="trophy-outline" size={18} color={themeColors.accent} />
                    </View>
                    <Text style={styles.actionTitle}>Rankings</Text>
                    <Text style={styles.actionSub}>{dashboard.rank ? `Current #${dashboard.rank}` : 'View leaderboard'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderRecentActivity = () => (
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeadRow}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <TouchableOpacity onPress={() => navigation.navigate('History')}>
                    <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={themeColors.primary} />
                    <Text style={styles.loadingLabel}>Loading activity...</Text>
                </View>
            ) : recentAttempts.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No attempts yet. Start with a quick quiz.</Text>
                </View>
            ) : (
                recentAttempts.map((item) => {
                    const percentage = item.maxScore > 0 ? (item.score / item.maxScore) * 100 : 0;
                    const passed = percentage >= 50;
                    return (
                        <TouchableOpacity
                            key={item._id}
                            style={styles.activityCard}
                            onPress={() => navigation.navigate('QuizResult', { result: item })}
                        >
                            <View style={[styles.activityIcon, { backgroundColor: passed ? themeColors.secondarySoft : themeColors.primarySoft }]}>
                                <Ionicons name={passed ? 'trophy-outline' : 'time-outline'} size={18} color={passed ? themeColors.secondary : themeColors.primary} />
                            </View>

                            <View style={styles.activityInfo}>
                                <Text style={styles.activityTitle} numberOfLines={1}>
                                    {item.metadata?.quizSnapshot?.title || item.quiz?.title || 'Quiz Attempt'}
                                </Text>
                                <Text style={styles.activityMeta}>
                                    {new Date(item.createdAt).toLocaleDateString()} | {item.score}/{item.maxScore}
                                </Text>
                            </View>

                            <View style={[styles.scorePill, { backgroundColor: passed ? themeColors.secondarySoft : themeColors.primarySoft }]}>
                                <Text style={[styles.scorePillText, { color: passed ? themeColors.secondary : themeColors.primary }]}>{Math.round(percentage)}%</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })
            )}
        </View>
    );

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.container, animatedStyle]}>
                <StatusBar barStyle={statusBarStyle} backgroundColor={themeColors.pageBg} />
                <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        showsVerticalScrollIndicator={false}
                    >
                        {renderTopCard()}
                        {renderOverallActivity()}
                        {renderQuickJoin()}
                        {renderQuickActions()}
                        {renderRecentActivity()}
                    </ScrollView>
                </SafeAreaView>
            </Animated.View>
        </GestureDetector>
    );
}

const createStyles = (themeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: themeColors.pageBg,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 14,
        paddingTop: 4,
        paddingBottom: 22,
    },
    topCard: {
        marginTop: 2,
        backgroundColor: themeColors.surface,
        borderRadius: 24,
        padding: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: themeColors.border,
    },
    topBlob: {
        position: 'absolute',
        width: 170,
        height: 105,
        borderRadius: 74,
        backgroundColor: themeColors.topBlob,
        right: -35,
        top: -25,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userTextWrap: {
        marginLeft: 10,
    },
    greetingText: {
        fontSize: 23,
        fontWeight: '800',
        color: themeColors.text,
        marginBottom: 2,
    },
    dateText: {
        color: themeColors.textMuted,
        fontSize: 12,
        fontWeight: '500',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        backgroundColor: themeColors.card,
        borderWidth: 1,
        borderColor: themeColors.border,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    statusBadgeText: {
        marginLeft: 4,
        color: themeColors.primary,
        fontSize: 11,
        fontWeight: '700',
    },
    profileStatRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    profileStatPill: {
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: themeColors.card,
        borderWidth: 1,
        borderColor: themeColors.border,
        marginRight: 8,
    },
    profileStatLabel: {
        color: themeColors.textMuted,
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    profileStatValue: {
        color: themeColors.text,
        fontSize: 13,
        fontWeight: '800',
    },
    challengeCard: {
        backgroundColor: themeColors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: themeColors.border,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    challengeLeft: {
        flex: 1,
        paddingRight: 8,
    },
    challengeTitle: {
        fontSize: 30,
        lineHeight: 32,
        color: themeColors.text,
        fontWeight: '800',
        marginBottom: 4,
    },
    challengeSub: {
        color: themeColors.textMuted,
        fontSize: 12,
        lineHeight: 17,
        marginBottom: 8,
    },
    challengeMetaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: themeColors.primarySoft,
        borderWidth: 1,
        borderColor: themeColors.chipBorder,
    },
    challengeMetaText: {
        marginLeft: 4,
        color: themeColors.primary,
        fontSize: 11,
        fontWeight: '700',
    },
    challengeArt: {
        width: 56,
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionCard: {
        marginTop: 12,
        backgroundColor: themeColors.surface,
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: themeColors.border,
    },
    sectionHeadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: themeColors.text,
    },
    sectionHint: {
        color: themeColors.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },
    activityGridWrap: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    yLabelsCol: {
        width: 14,
        marginRight: 6,
        justifyContent: 'space-between',
        paddingVertical: 2,
    },
    yLabelText: {
        fontSize: 9,
        color: themeColors.textMuted,
        textAlign: 'center',
        fontWeight: '600',
    },
    heatScrollContent: {
        paddingRight: 6,
    },
    heatColumnsRow: {
        flexDirection: 'row',
    },
    heatWeekColumn: {
        justifyContent: 'space-between',
        marginRight: 4,
    },
    heatCellEmpty: {
        width: 12,
        height: 12,
        marginBottom: 4,
    },
    heatCell: {
        width: 12,
        height: 12,
        borderRadius: 3,
        borderWidth: 1,
        marginBottom: 4,
    },
    heatCellToday: {
        borderColor: themeColors.todayBorder,
        borderWidth: 1.3,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: themeColors.border,
        paddingTop: 9,
    },
    legendScale: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendText: {
        color: themeColors.textMuted,
        fontSize: 11,
        fontWeight: '600',
    },
    legendBox: {
        width: 11,
        height: 11,
        borderRadius: 3,
        borderWidth: 1,
        marginHorizontal: 3,
    },
    joinInputWrap: {
        marginTop: 2,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: themeColors.border,
        backgroundColor: themeColors.card,
        paddingHorizontal: 11,
        flexDirection: 'row',
        alignItems: 'center',
    },
    joinInput: {
        flex: 1,
        marginLeft: 7,
        fontSize: 14,
        color: themeColors.text,
        fontWeight: '700',
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
    },
    joinMiniBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: themeColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionCard: {
        width: '31.5%',
        backgroundColor: themeColors.card,
        borderWidth: 1,
        borderColor: themeColors.border,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    actionIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: themeColors.actionTitle,
        marginBottom: 2,
    },
    actionSub: {
        color: themeColors.textMuted,
        fontSize: 11,
        lineHeight: 15,
    },
    seeAllText: {
        color: themeColors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    loadingLabel: {
        marginLeft: 8,
        color: themeColors.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: themeColors.emptyDashed,
        borderRadius: 12,
        paddingVertical: 16,
        backgroundColor: themeColors.card,
    },
    emptyText: {
        textAlign: 'center',
        color: themeColors.textMuted,
        fontSize: 13,
    },
    activityCard: {
        marginBottom: 8,
        backgroundColor: themeColors.card,
        borderWidth: 1,
        borderColor: themeColors.border,
        borderRadius: 13,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    activityIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 9,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 13,
        color: themeColors.actionTitle,
        fontWeight: '700',
        marginBottom: 2,
    },
    activityMeta: {
        fontSize: 11,
        color: themeColors.textMuted,
        fontWeight: '500',
    },
    scorePill: {
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: themeColors.border,
    },
    scorePillText: {
        fontSize: 11,
        fontWeight: '800',
    },
});

