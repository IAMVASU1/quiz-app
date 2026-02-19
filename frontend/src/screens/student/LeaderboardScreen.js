import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, StatusBar, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { getTopLeaderboard, getStudentProfile } from '../../api/leaderboard.api';
import { Ionicons } from '@expo/vector-icons';
import useAppTheme from '../../hooks/useAppTheme';

function createLeaderboardColors(palette, isDark) {
    return {
        pageBg: palette.pageBg,
        surface: palette.surface,
        card: palette.card,
        cardMuted: palette.cardMuted || palette.surface,
        border: palette.border,
        text: palette.text,
        textMuted: palette.textMuted,
        primary: palette.primary,
        primarySoft: palette.primarySoft,
        secondary: palette.secondary,
        accent: palette.accent,
        modalOverlay: palette.overlay,
        heroStart: palette.primary,
        heroEnd: palette.accent,
        heroSoft: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)',
        heroSoft2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)',
        heroEyebrow: isDark ? '#CFDBFF' : '#DDE6FF',
        heroSub: isDark ? '#CDD8FF' : '#DFE8FF',
        heroStatBorder: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.24)',
        heroStatBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)',
        modalCloseBg: isDark ? '#1D2B4B' : '#FFFFFF',
    };
}

function formatAccuracy(value) {
    return value !== null && value !== undefined ? `${value}%` : '-';
}

function getRankVisual(index, themeColors, isDark) {
    if (index === 0) return { icon: 'trophy', color: '#F2A90D', soft: isDark ? '#4B3D1D' : '#FFF4DC' };
    if (index === 1) return { icon: 'medal', color: '#9BA8C4', soft: isDark ? '#2A3756' : '#EEF2F9' };
    if (index === 2) return { icon: 'medal', color: '#C77A34', soft: isDark ? '#4A3424' : '#FFF1E6' };
    return { icon: null, color: themeColors.textMuted, soft: isDark ? '#24355B' : '#EEF2FA' };
}

export default function LeaderboardScreen() {
    const { palette, statusBarStyle, isDark } = useAppTheme();
    const themeColors = useMemo(() => createLeaderboardColors(palette, isDark), [palette, isDark]);
    const styles = useMemo(() => createStyles(themeColors), [themeColors]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);

    const loadData = async () => {
        try {
            const response = await getTopLeaderboard(50);
            if (response && response.data && response.data.items) {
                setUsers(response.data.items);
            } else {
                setUsers([]);
            }
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

    const handleUserPress = async (userId) => {
        setSelectedStudent(null);
        setProfileLoading(true);
        setModalVisible(true);
        try {
            const response = await getStudentProfile(userId);
            if (response && response.data) {
                setSelectedStudent(response.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProfileLoading(false);
        }
    };

    const topThree = useMemo(() => users.slice(0, 3), [users]);

    const summary = useMemo(() => {
        const totalPlayers = users.length;
        const highestScore = totalPlayers > 0 ? Math.max(...users.map((u) => u.totalScore || 0)) : 0;
        const validAccuracies = users.filter((u) => typeof u.accuracy === 'number').map((u) => u.accuracy);
        const avgAccuracy = validAccuracies.length
            ? Math.round(validAccuracies.reduce((sum, val) => sum + val, 0) / validAccuracies.length)
            : 0;

        return { totalPlayers, highestScore, avgAccuracy };
    }, [users]);

    const renderHeader = () => (
        <View>
            <LinearGradient
                colors={[themeColors.heroStart, themeColors.heroEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
            >
                <View style={styles.heroDoodleA} />
                <View style={styles.heroDoodleB} />

                <Text style={styles.heroEyebrow}>STUDENT LEADERBOARD</Text>
                <Text style={styles.heroTitle}>Rankings</Text>
                <Text style={styles.heroSubtitle}>Live standings based on real quiz performance.</Text>

                <View style={styles.heroStatsRow}>
                    <View style={styles.heroStat}>
                        <Text style={styles.heroStatValue}>{summary.totalPlayers}</Text>
                        <Text style={styles.heroStatLabel}>Players</Text>
                    </View>
                    <View style={styles.heroStat}>
                        <Text style={styles.heroStatValue}>{summary.highestScore}</Text>
                        <Text style={styles.heroStatLabel}>Top Score</Text>
                    </View>
                    <View style={styles.heroStat}>
                        <Text style={styles.heroStatValue}>{summary.avgAccuracy}%</Text>
                        <Text style={styles.heroStatLabel}>Avg Accuracy</Text>
                    </View>
                </View>
            </LinearGradient>

            {topThree.length > 0 && (
                <View style={styles.podiumCard}>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle}>Top Performers</Text>
                    </View>

                    <View style={styles.podiumRow}>
                        {topThree.map((player, index) => {
                            const tone = getRankVisual(index, themeColors, isDark);
                            return (
                                <TouchableOpacity
                                    key={player.id || player._id}
                                    style={styles.podiumItem}
                                    onPress={() => handleUserPress(player.id || player._id)}
                                >
                                    <View style={[styles.podiumIconWrap, { backgroundColor: tone.soft }]}>
                                        <Ionicons name={tone.icon} size={16} color={tone.color} />
                                    </View>
                                    <Text style={styles.podiumRank}>#{index + 1}</Text>
                                    <Text style={styles.podiumName} numberOfLines={1}>{player.name}</Text>
                                    <Text style={styles.podiumMeta}>{player.totalScore || 0} pts</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}

            <View style={styles.listTitleRow}>
                <Text style={styles.listTitle}>All Rankings</Text>
                <Text style={styles.listSub}>Tap a student to view profile</Text>
            </View>
        </View>
    );

    const renderItem = ({ item, index }) => {
        const visual = getRankVisual(index, themeColors, isDark);
        const rankNumber = index + 1;
        const userId = item.id || item._id;

        return (
            <TouchableOpacity style={styles.card} onPress={() => handleUserPress(userId)}>
                <View style={styles.rankContainer}>
                    {visual.icon ? (
                        <View style={[styles.rankBadge, { backgroundColor: visual.soft }]}>
                            <Ionicons name={visual.icon} size={16} color={visual.color} />
                        </View>
                    ) : (
                        <Text style={styles.rankText}>#{rankNumber}</Text>
                    )}
                </View>

                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.stats}>Accuracy: {formatAccuracy(item.accuracy)}</Text>
                </View>

                <View style={styles.scoreContainer}>
                    <Text style={styles.score}>{item.totalScore || 0}</Text>
                    <Text style={styles.pts}>pts</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderProfileModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <LinearGradient
                        colors={[themeColors.cardMuted || themeColors.surface, themeColors.surface]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalHero}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Student Profile</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={20} color={themeColors.text} />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    {profileLoading ? (
                        <ActivityIndicator size="large" color={themeColors.primary} style={{ padding: 26 }} />
                    ) : selectedStudent ? (
                        <View style={styles.profileBody}>
                            <View style={styles.profileAvatarLarge}>
                                <Text style={styles.profileAvatarTextLarge}>
                                    {selectedStudent.name?.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.profileName}>{selectedStudent.name}</Text>
                            <Text style={styles.profileEmail}>{selectedStudent.email}</Text>

                            <View style={styles.statsGrid}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>{selectedStudent.rank ? `#${selectedStudent.rank}` : '-'}</Text>
                                    <Text style={styles.statLabel}>Rank</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>{selectedStudent.totalScore || 0}</Text>
                                    <Text style={styles.statLabel}>Total Score</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>{formatAccuracy(selectedStudent.accuracy)}</Text>
                                    <Text style={styles.statLabel}>Accuracy</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>{selectedStudent.totalQuestionsAnswered || 0}</Text>
                                    <Text style={styles.statLabel}>Questions</Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.modalFallback}>Failed to load profile</Text>
                    )}
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle={statusBarStyle} backgroundColor={themeColors.pageBg} />

            <FlatList
                data={users}
                keyExtractor={(item) => item.id || item._id}
                renderItem={renderItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.emptyContainer}>
                            <ActivityIndicator size="small" color={themeColors.primary} />
                            <Text style={styles.emptyText}>Loading rankings...</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No players yet.</Text>
                        </View>
                    )
                }
                showsVerticalScrollIndicator={false}
            />
            {renderProfileModal()}
        </View>
    );
}

const createStyles = (themeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: themeColors.pageBg,
    },
    listContent: {
        padding: 14,
        paddingBottom: 22,
    },
    hero: {
        borderRadius: 20,
        padding: 16,
        overflow: 'hidden',
        marginBottom: 12,
    },
    heroDoodleA: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: themeColors.heroSoft,
        right: -40,
        top: -40,
    },
    heroDoodleB: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: themeColors.heroSoft2,
        left: -20,
        bottom: -20,
    },
    heroEyebrow: {
        color: themeColors.heroEyebrow,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: 5,
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 29,
        fontWeight: '800',
        marginBottom: 4,
    },
    heroSubtitle: {
        color: themeColors.heroSub,
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 12,
    },
    heroStatsRow: {
        flexDirection: 'row',
    },
    heroStat: {
        flex: 1,
        borderWidth: 1,
        borderColor: themeColors.heroStatBorder,
        borderRadius: 10,
        backgroundColor: themeColors.heroStatBg,
        paddingVertical: 8,
        paddingHorizontal: 8,
        marginRight: 8,
    },
    heroStatValue: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
    },
    heroStatLabel: {
        color: themeColors.heroSub,
        fontSize: 11,
        fontWeight: '600',
    },
    podiumCard: {
        backgroundColor: themeColors.surface,
        borderWidth: 1,
        borderColor: themeColors.border,
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
    },
    sectionHead: {
        marginBottom: 10,
    },
    sectionTitle: {
        color: themeColors.text,
        fontSize: 18,
        fontWeight: '800',
    },
    podiumRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    podiumItem: {
        width: '31.5%',
        borderWidth: 1,
        borderColor: themeColors.border,
        backgroundColor: themeColors.card,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    podiumIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    podiumRank: {
        color: themeColors.text,
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 2,
    },
    podiumName: {
        color: themeColors.text,
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 1,
    },
    podiumMeta: {
        color: themeColors.textMuted,
        fontSize: 11,
        fontWeight: '600',
    },
    listTitleRow: {
        marginBottom: 8,
    },
    listTitle: {
        color: themeColors.text,
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 2,
    },
    listSub: {
        color: themeColors.textMuted,
        fontSize: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: themeColors.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: themeColors.border,
        padding: 12,
        marginBottom: 9,
    },
    rankContainer: {
        width: 42,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankBadge: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankText: {
        fontSize: 14,
        fontWeight: '800',
        color: themeColors.textMuted,
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: themeColors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    avatarText: {
        fontSize: 17,
        fontWeight: '800',
        color: themeColors.primary,
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: 15,
        fontWeight: '800',
        color: themeColors.text,
    },
    stats: {
        fontSize: 12,
        color: themeColors.textMuted,
        marginTop: 1,
    },
    scoreContainer: {
        alignItems: 'flex-end',
        minWidth: 46,
    },
    score: {
        fontSize: 18,
        fontWeight: '800',
        color: themeColors.primary,
        lineHeight: 20,
    },
    pts: {
        fontSize: 10,
        color: themeColors.textMuted,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: themeColors.modalOverlay,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: themeColors.card,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        minHeight: 380,
        overflow: 'hidden',
    },
    modalHero: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: themeColors.text,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: themeColors.modalCloseBg,
        borderWidth: 1,
        borderColor: themeColors.border,
    },
    profileBody: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
    },
    profileAvatarLarge: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: themeColors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    profileAvatarTextLarge: {
        fontSize: 30,
        fontWeight: '800',
        color: themeColors.primary,
    },
    profileName: {
        fontSize: 22,
        fontWeight: '800',
        color: themeColors.text,
        marginBottom: 3,
    },
    profileEmail: {
        fontSize: 13,
        color: themeColors.textMuted,
        marginBottom: 16,
    },
    statsGrid: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statBox: {
        width: '48.5%',
        alignItems: 'center',
        backgroundColor: themeColors.surface,
        borderWidth: 1,
        borderColor: themeColors.border,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: themeColors.primary,
        marginBottom: 3,
    },
    statLabel: {
        fontSize: 11,
        color: themeColors.textMuted,
        fontWeight: '600',
    },
    modalFallback: {
        padding: 20,
        textAlign: 'center',
        color: themeColors.textMuted,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: themeColors.textMuted,
        fontSize: 14,
        marginTop: 8,
        fontWeight: '600',
    },
});

