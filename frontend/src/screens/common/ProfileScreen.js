import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '../../hooks/useAuth';
import useAppTheme from '../../hooks/useAppTheme';
import AdminLayout from '../../components/admin/AdminLayout';
import Avatar from '../../components/common/Avatar';
import { getStudentProfile } from '../../api/leaderboard.api';
import { apiListQuizzes } from '../../api/quizzes.api';
import { apiGetDashboardStats } from '../../api/admin.api';

const ROLE_THEME = {
    student: {
        page: '#EEF3FF',
        card: '#F9FBFF',
        border: '#D6E1F5',
        band: '#CFE2FF',
        accent: '#4F66F8',
        subtitle: 'Student',
    },
    faculty: {
        page: '#FFF8EF',
        card: '#FFFCF7',
        border: '#F1DEC0',
        band: '#FFE6C3',
        accent: '#D38A21',
        subtitle: 'Faculty',
    },
    admin: {
        page: '#EEF3FF',
        card: '#F9FBFF',
        border: '#D6E1F5',
        band: '#D6E6FF',
        accent: '#1D6BFF',
        subtitle: 'Admin',
    },
};

function getRoleTheme(role) {
    return ROLE_THEME[role] || ROLE_THEME.student;
}

function withAlpha(hexColor, alpha) {
    const hex = hexColor.replace('#', '');
    if (hex.length !== 6) return hexColor;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function getDicebearStyle(role) {
    if (role === 'faculty') return 'lorelei-neutral';
    if (role === 'admin') return 'bottts-neutral';
    return 'adventurer-neutral';
}

function formatJoinedDate(value) {
    if (!value) return 'Not available';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Not available';
    return parsed.toLocaleDateString();
}

function formatMetricValue(value) {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
}

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme, palette } = useAppTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [metrics, setMetrics] = useState([]);

    const role = user?.role || 'student';
    const roleTheme = getRoleTheme(role);
    const theme = useMemo(() => ({
        page: palette.pageBg,
        card: palette.surface,
        border: palette.border,
        band: isDark ? withAlpha(roleTheme.accent, 0.18) : roleTheme.band,
        accent: roleTheme.accent,
        subtitle: roleTheme.subtitle,
        textStrong: palette.text,
        textMuted: palette.textMuted,
        fieldBg: palette.card,
        logoutBg: isDark ? '#2A344D' : '#1F2937',
        danger: palette.danger,
    }), [isDark, palette, roleTheme]);
    const avatarUri = useMemo(() => {
        if (user?.avatar) return user.avatar;
        const seed = user?.id || user?._id || user?.email || user?.name || role;
        const style = getDicebearStyle(role);
        return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    }, [user?.avatar, user?.id, user?._id, user?.email, user?.name, role]);

    const profileMeta = useMemo(() => {
        return [
            { label: 'Email address', value: user?.email || 'Not available', icon: 'mail-outline' },
            { label: 'Role', value: role.toUpperCase(), icon: 'person-circle-outline' },
            { label: 'Joined', value: formatJoinedDate(user?.createdAt), icon: 'calendar-outline' },
        ];
    }, [user?.email, user?.createdAt, role]);

    const loadRoleStats = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            if (role === 'student') {
                const userId = user?.id || user?._id;
                if (!userId) throw new Error('Missing user id');
                const response = await getStudentProfile(userId);
                const profile = response?.data || {};

                setMetrics([
                    { label: 'Rank', value: profile.rank ? `#${profile.rank}` : '-', icon: 'podium-outline' },
                    { label: 'Accuracy', value: profile.accuracy !== null && profile.accuracy !== undefined ? `${Math.round(profile.accuracy)}%` : '-', icon: 'analytics-outline' },
                    { label: 'Score', value: profile.totalScore || 0, icon: 'trophy-outline' },
                    { label: 'Attempts', value: profile.attempts || 0, icon: 'repeat-outline' },
                ]);
            } else if (role === 'faculty') {
                const response = await apiListQuizzes(1, 300);
                const items = response?.items || [];
                const published = items.filter((q) => q.status === 'published').length;
                const draft = items.filter((q) => q.status === 'draft').length;
                const paused = items.filter((q) => q.status === 'paused').length;

                setMetrics([
                    { label: 'Total quizzes', value: items.length, icon: 'albums-outline' },
                    { label: 'Live quizzes', value: published, icon: 'radio-outline' },
                    { label: 'Draft quizzes', value: draft, icon: 'document-text-outline' },
                    { label: 'Paused quizzes', value: paused, icon: 'pause-circle-outline' },
                ]);
            } else {
                const response = await apiGetDashboardStats();
                const data = response?.data || {};

                setMetrics([
                    { label: 'Total users', value: data.totalUsers || 0, icon: 'people-outline' },
                    { label: 'Students', value: data.totalStudents || 0, icon: 'school-outline' },
                    { label: 'Faculty', value: data.totalFaculty || 0, icon: 'person-outline' },
                    { label: 'Admins', value: data.totalAdmins || 0, icon: 'shield-checkmark-outline' },
                ]);
            }
        } catch (err) {
            console.error('Profile stats load failed:', err);
            setError('Unable to load stats right now.');
            setMetrics([]);
        } finally {
            setLoading(false);
        }
    }, [role, user?.id, user?._id]);

    useFocusEffect(
        useCallback(() => {
            loadRoleStats();
        }, [loadRoleStats])
    );

    const handleLogout = async () => {
        await logout();
    };

    const renderFieldRow = (label, value, icon, key) => (
        <View key={key} style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
            <View style={[styles.fieldBox, { borderColor: theme.border, backgroundColor: theme.fieldBg }]}>
                <Text style={[styles.fieldValue, { color: theme.textStrong }]}>{formatMetricValue(value)}</Text>
                <Ionicons name={icon} size={18} color={theme.accent} />
            </View>
        </View>
    );

    const content = (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.page }]}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.topBand, { backgroundColor: theme.band }]}>
                    <View style={[styles.doodleCircle, { borderColor: `${theme.accent}45` }]} />
                </View>

                <View style={[styles.avatar, { borderColor: theme.card, backgroundColor: theme.fieldBg }]}>
                    <Avatar
                        uri={avatarUri}
                        name={user?.name || 'User'}
                        size={96}
                        color={theme.accent}
                    />
                </View>

                <Text style={[styles.userName, { color: theme.textStrong }]}>{user?.name || 'User'}</Text>
                <Text style={[styles.userSubTitle, { color: theme.accent }]}>{theme.subtitle}</Text>

                <View style={[styles.themeCardTop, { borderColor: theme.border, backgroundColor: theme.fieldBg }]}>
                    <View style={styles.themeCopy}>
                        <Text style={[styles.themeTitle, { color: theme.textStrong }]}>Appearance</Text>
                        <Text style={[styles.themeSubtitle, { color: theme.textMuted }]}>
                            {isDark ? 'Dark mode is active' : 'Light mode is active'}
                        </Text>
                    </View>
                    <TouchableOpacity style={[styles.themeToggleBtn, { backgroundColor: theme.accent }]} onPress={toggleTheme}>
                        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={16} color="#FFFFFF" />
                        <Text style={styles.themeToggleText}>{isDark ? 'Light' : 'Dark'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    {profileMeta.map((item, idx) => renderFieldRow(item.label, item.value, item.icon, `meta-${idx}`))}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.textStrong }]}>Performance</Text>
                        {loading && <ActivityIndicator size="small" color={theme.accent} />}
                    </View>

                    {error ? (
                        <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
                    ) : (
                        metrics.map((item, idx) => renderFieldRow(item.label, item.value, item.icon, `metric-${idx}`))
                    )}
                </View>

                <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: theme.logoutBg }]} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    if (role === 'admin') {
        return (
            <AdminLayout title="Profile">
                {content}
            </AdminLayout>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.page }}>
            {content}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 28,
    },
    profileCard: {
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
        paddingBottom: 16,
    },
    topBand: {
        height: 84,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 20,
    },
    doodleCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1.6,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    avatar: {
        width: 86,
        height: 86,
        borderRadius: 43,
        borderWidth: 6,
        alignSelf: 'center',
        marginTop: -44,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10203F',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 4,
    },
    userName: {
        marginTop: 8,
        textAlign: 'center',
        color: '#202939',
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    userSubTitle: {
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 1,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    section: {
        paddingHorizontal: 18,
        marginTop: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    fieldGroup: {
        marginTop: 10,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 5,
    },
    fieldBox: {
        minHeight: 48,
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    fieldValue: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    errorText: {
        fontSize: 13,
        marginTop: 8,
    },
    themeCardTop: {
        marginTop: 12,
        marginHorizontal: 18,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    themeCopy: {
        flex: 1,
        marginRight: 10,
    },
    themeTitle: {
        fontSize: 15,
        fontWeight: '800',
    },
    themeSubtitle: {
        marginTop: 3,
        fontSize: 12,
        fontWeight: '600',
    },
    themeToggleBtn: {
        height: 34,
        borderRadius: 17,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    themeToggleText: {
        color: '#FFFFFF',
        marginLeft: 5,
        fontSize: 12,
        fontWeight: '800',
    },
    logoutBtn: {
        marginTop: 18,
        marginHorizontal: 18,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#1F2937',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutText: {
        color: '#FFFFFF',
        marginLeft: 6,
        fontSize: 15,
        fontWeight: '700',
    },
});
