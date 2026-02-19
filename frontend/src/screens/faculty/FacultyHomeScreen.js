import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, StatusBar, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { apiListQuizzes } from '../../api/quizzes.api';
import useAuth from '../../hooks/useAuth';
import useAppTheme from '../../hooks/useAppTheme';
import Avatar from '../../components/common/Avatar';

function createFacultyColors(palette, isDark) {
    return {
        pageBg: palette.pageBg,
        card: palette.surface,
        border: palette.border,
        text: palette.text,
        textSoft: palette.textMuted,
        primary: palette.primary,
        success: palette.success,
        warning: palette.warning,
        muted: palette.textMuted,
        ghostSurface: isDark ? '#1D2C4B' : '#F1F5FB',
        statSurface: isDark ? '#1A2948' : '#F8FAFD',
        actionInner: isDark ? '#1A2948' : '#FBFCFF',
        arrowMuted: isDark ? '#A3B2CF' : '#8FA0BA',
        metaSep: isDark ? '#7E8FAE' : '#93A2BA',
        emptyMuted: isDark ? '#9AADCE' : '#8B9BB6',
        emptyText: isDark ? '#A4B5D6' : '#7A8AA5',
        accentRow: isDark ? '#2D4373' : '#ECF2FC',
        accentSuccess: isDark ? '#1C4B46' : '#ECF7F3',
        accentNeutral: isDark ? '#202C48' : '#F1F1F7',
        accentWarning: isDark ? '#4A3822' : '#F9F2E8',
    };
}

const ACTIONS = [
    {
        id: 'create',
        title: 'Create Quiz',
        subtitle: 'Design a new assessment',
        icon: 'add-circle-outline',
        screen: 'CreateQuizChoice',
        tone: '#ECF2FC',
        iconColor: '#1F4E95',
    },
    {
        id: 'manage',
        title: 'Manage Quizzes',
        subtitle: 'Edit and publish quizzes',
        icon: 'albums-outline',
        screen: 'ManageQuizzes',
        tone: '#ECF7F3',
        iconColor: '#167451',
    },
    {
        id: 'bank',
        title: 'Question Bank',
        subtitle: 'Maintain question quality',
        icon: 'library-outline',
        screen: 'QuestionsLibrary',
        tone: '#F1F1F7',
        iconColor: '#55607A',
    },
    {
        id: 'upload',
        title: 'Bulk Upload',
        subtitle: 'Import from spreadsheet',
        icon: 'cloud-upload-outline',
        screen: 'BulkUpload',
        tone: '#F9F2E8',
        iconColor: '#B97B21',
    },
];

function statusTone(status) {
    if (status === 'published') return { bg: '#E8F5EF', text: '#167451' };
    if (status === 'paused') return { bg: '#FBF1E3', text: '#B97B21' };
    return { bg: '#EDF1F7', text: '#6D7E99' };
}

function formatDate(value) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
}

export default function FacultyHomeScreen({ navigation }) {
    const { user } = useAuth();
    const { palette, statusBarStyle, isDark } = useAppTheme();
    const themeColors = useMemo(() => createFacultyColors(palette, isDark), [palette, isDark]);
    const styles = useMemo(() => createStyles(themeColors), [themeColors]);
    const { width } = useWindowDimensions();
    const isCompact = width < 365;
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const translateX = useSharedValue(0);
    const contextX = useSharedValue(0);

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
                runOnJS(() => navigation.navigate('Profile'))();
            }
            translateX.value = withSpring(0);
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const loadData = async () => {
        try {
            const data = await apiListQuizzes(1, 120);
            const items = data?.items || [];
            const sorted = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setQuizzes(sorted);
        } catch (error) {
            console.error(error);
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

    const summary = useMemo(() => {
        const total = quizzes.length;
        const published = quizzes.filter((q) => q.status === 'published').length;
        const paused = quizzes.filter((q) => q.status === 'paused').length;
        const draft = quizzes.filter((q) => q.status === 'draft').length;

        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());

        const thisWeek = quizzes.filter((q) => {
            const created = q?.createdAt ? new Date(q.createdAt) : null;
            return created && !Number.isNaN(created.getTime()) && created >= weekStart;
        }).length;

        const publishedThisWeek = quizzes.filter((q) => {
            const created = q?.createdAt ? new Date(q.createdAt) : null;
            return q?.status === 'published' && created && !Number.isNaN(created.getTime()) && created >= weekStart;
        }).length;

        return { total, published, paused, draft, thisWeek, publishedThisWeek };
    }, [quizzes]);

    const recent = quizzes.slice(0, 8);
    const displayName = (user?.name || 'Faculty').trim().split(' ')[0];
    const actionCards = useMemo(
        () => ACTIONS.map((item) => {
            if (item.id === 'create') return { ...item, tone: themeColors.accentRow, iconColor: themeColors.primary };
            if (item.id === 'manage') return { ...item, tone: themeColors.accentSuccess, iconColor: themeColors.success };
            if (item.id === 'upload') return { ...item, tone: themeColors.accentWarning, iconColor: themeColors.warning };
            return { ...item, tone: themeColors.accentNeutral, iconColor: themeColors.textSoft };
        }),
        [themeColors]
    );

    const renderActionCard = (item) => (
        <TouchableOpacity
            key={item.id}
            style={[styles.actionCard, isCompact ? styles.actionCardCompact : styles.actionCardRegular]}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.9}
        >
            <View style={styles.actionInner}>
                <View style={[styles.actionIconWrap, { backgroundColor: item.tone }]}>
                    <Ionicons name={item.icon} size={20} color={item.iconColor} />
                </View>
                <View style={styles.actionCopy}>
                    <Text style={styles.actionTitle}>{item.title}</Text>
                    <Text style={styles.actionSub}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={themeColors.arrowMuted} style={styles.actionArrow} />
            </View>
        </TouchableOpacity>
    );

    const renderQuizItem = ({ item }) => {
        const tone = statusTone(item.status);
        if (isDark) {
            if (item.status === 'published') tone.bg = '#1C4B46';
            else if (item.status === 'paused') tone.bg = '#4A3822';
            else tone.bg = '#223355';
        }
        const questionsCount = Array.isArray(item.questions) ? item.questions.length : 0;

        return (
            <TouchableOpacity
                style={styles.quizItem}
                onPress={() => navigation.navigate('EditQuiz', { quizId: item._id })}
                activeOpacity={0.9}
            >
                <View style={[styles.quizIcon, { backgroundColor: tone.bg }]}>
                    <Ionicons name="document-text-outline" size={18} color={tone.text} />
                </View>

                <View style={styles.quizInfo}>
                    <Text style={styles.quizTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.quizMetaRow}>
                        <Text style={styles.quizMeta} numberOfLines={1}>Code {item.quizCode || '-'}</Text>
                        <Text style={styles.quizMetaSep}>|</Text>
                        <Text style={styles.quizMeta}>{questionsCount} Qs</Text>
                        <Text style={styles.quizMetaSep}>|</Text>
                        <Text style={styles.quizMeta}>{formatDate(item.createdAt)}</Text>
                    </View>
                </View>

                <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.statusText, { color: tone.text }]}>{String(item.status || 'draft').toUpperCase()}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View>
            <View style={styles.hero}>
                <View style={styles.heroAccent} />
                <View style={styles.heroTopRow}>
                    <View style={styles.heroIdentity}>
                        <Avatar
                            uri={user?.avatar}
                            name={user?.name || 'Faculty'}
                            size={44}
                            color={themeColors.primary}
                        />
                        <View style={styles.heroTextWrap}>
                            <Text style={styles.heroEyebrow}>FACULTY DASHBOARD</Text>
                            <Text style={styles.heroTitle}>Hello, {displayName}</Text>
                            <Text style={styles.heroSubtitle}>Manage and monitor assessments.</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
                        <Ionicons name="person-outline" size={18} color={themeColors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.heroStatRow}>
                    <View style={styles.heroStat}>
                        <Text style={styles.heroStatValue}>{summary.total}</Text>
                        <Text style={styles.heroStatLabel}>Total</Text>
                    </View>
                    <View style={styles.heroStat}>
                        <Text style={styles.heroStatValue}>{summary.published}</Text>
                        <Text style={styles.heroStatLabel}>Live</Text>
                    </View>
                    <View style={styles.heroStat}>
                        <Text style={styles.heroStatValue}>{summary.draft}</Text>
                        <Text style={styles.heroStatLabel}>Draft</Text>
                    </View>
                    <View style={styles.heroStatNoGap}>
                        <Text style={styles.heroStatValue}>{summary.paused}</Text>
                        <Text style={styles.heroStatLabel}>Paused</Text>
                    </View>
                </View>
            </View>

            <View style={styles.insightCard}>
                <View style={styles.insightCol}>
                    <Text style={styles.insightTitle}>Created This Week</Text>
                    <Text style={styles.insightText}>{summary.thisWeek} quizzes</Text>
                </View>
                <View style={styles.insightDivider} />
                <View style={styles.insightCol}>
                    <Text style={styles.insightTitle}>Published This Week</Text>
                    <Text style={styles.insightText}>{summary.publishedThisWeek} quizzes</Text>
                </View>
            </View>

            <View style={styles.actionSection}>
                <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                </View>
                <View style={styles.actionGrid}>
                    {actionCards.map(renderActionCard)}
                </View>
            </View>

            <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Recent Quizzes</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ManageQuizzes')}>
                    <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.mainContainer, animatedStyle]}>
                <StatusBar barStyle={statusBarStyle} backgroundColor={themeColors.pageBg} />
                <SafeAreaView style={styles.safeArea}>
                    <FlatList
                        data={recent}
                        keyExtractor={(item) => item._id}
                        renderItem={renderQuizItem}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />}
                        ListHeaderComponent={renderHeader}
                        ListEmptyComponent={
                            loading ? (
                                <View style={styles.emptyContainer}>
                                    <ActivityIndicator size="small" color={themeColors.primary} />
                                    <Text style={styles.emptyText}>Loading quizzes...</Text>
                                </View>
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="document-outline" size={30} color={themeColors.emptyMuted} />
                                    <Text style={styles.emptyText}>No quizzes yet. Create your first quiz.</Text>
                                    <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('CreateQuizChoice')}>
                                        <Text style={styles.emptyBtnText}>Create Quiz</Text>
                                    </TouchableOpacity>
                                </View>
                            )
                        }
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                </SafeAreaView>
            </Animated.View>
        </GestureDetector>
    );
}

const createStyles = (themeColors) => StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: themeColors.pageBg,
    },
    safeArea: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 24,
    },
    hero: {
        backgroundColor: themeColors.card,
        borderWidth: 1,
        borderColor: themeColors.border,
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
    },
    heroAccent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        backgroundColor: themeColors.primary,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 4,
    },
    heroIdentity: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    heroTextWrap: {
        marginLeft: 10,
        flex: 1,
        paddingRight: 8,
    },
    heroEyebrow: {
        color: themeColors.textSoft,
        fontSize: 10.5,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    heroTitle: {
        color: themeColors.text,
        fontSize: 23,
        fontWeight: '800',
    },
    heroSubtitle: {
        color: themeColors.textSoft,
        fontSize: 12,
        marginTop: 2,
        fontWeight: '600',
    },
    profileBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: themeColors.ghostSurface,
        borderWidth: 1,
        borderColor: themeColors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroStatRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    heroStat: {
        flex: 1,
        minHeight: 58,
        backgroundColor: themeColors.statSurface,
        borderWidth: 1,
        borderColor: themeColors.border,
        borderRadius: 10,
        marginRight: 7,
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    heroStatNoGap: {
        flex: 1,
        minHeight: 58,
        backgroundColor: themeColors.statSurface,
        borderWidth: 1,
        borderColor: themeColors.border,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    heroStatValue: {
        color: themeColors.text,
        fontSize: 19,
        fontWeight: '800',
    },
    heroStatLabel: {
        color: themeColors.textSoft,
        fontSize: 11,
        fontWeight: '600',
    },
    insightCard: {
        backgroundColor: themeColors.card,
        borderWidth: 1,
        borderColor: themeColors.border,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    insightCol: {
        flex: 1,
    },
    insightDivider: {
        width: 1,
        height: 34,
        backgroundColor: themeColors.border,
        marginHorizontal: 10,
    },
    insightTitle: {
        color: themeColors.textSoft,
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 2,
    },
    insightText: {
        color: themeColors.text,
        fontSize: 14,
        fontWeight: '700',
    },
    actionSection: {
        backgroundColor: themeColors.card,
        borderWidth: 1,
        borderColor: themeColors.border,
        borderRadius: 14,
        padding: 10,
        marginBottom: 10,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -5,
    },
    actionCard: {
        paddingHorizontal: 5,
        marginBottom: 10,
    },
    actionCardRegular: {
        width: '50%',
    },
    actionCardCompact: {
        width: '100%',
    },
    actionInner: {
        backgroundColor: themeColors.actionInner,
        borderWidth: 1,
        borderColor: themeColors.border,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 10,
        minHeight: 106,
    },
    actionIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionCopy: {
        paddingRight: 16,
    },
    actionTitle: {
        color: themeColors.text,
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    actionSub: {
        color: themeColors.textSoft,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '600',
    },
    actionArrow: {
        position: 'absolute',
        right: 9,
        bottom: 9,
        color: themeColors.arrowMuted,
    },
    sectionTitleRow: {
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        color: themeColors.text,
        fontSize: 20,
        fontWeight: '800',
    },
    seeAllText: {
        color: themeColors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    quizItem: {
        backgroundColor: themeColors.card,
        borderWidth: 1,
        borderColor: themeColors.border,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    quizIcon: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    quizInfo: {
        flex: 1,
        marginRight: 8,
    },
    quizTitle: {
        color: themeColors.text,
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 3,
    },
    quizMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quizMeta: {
        color: themeColors.textSoft,
        fontSize: 11.5,
        fontWeight: '600',
    },
    quizMetaSep: {
        color: themeColors.metaSep,
        marginHorizontal: 4,
        fontSize: 11,
    },
    statusPill: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    statusText: {
        fontSize: 10.5,
        fontWeight: '800',
    },
    emptyContainer: {
        marginTop: 24,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 8,
        color: themeColors.emptyText,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptyBtn: {
        marginTop: 10,
        borderRadius: 999,
        backgroundColor: themeColors.primary,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    emptyBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
});

