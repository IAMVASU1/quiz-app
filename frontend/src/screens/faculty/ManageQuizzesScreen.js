import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, TextInput, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiListQuizzes, apiDeleteQuiz, apiUpdateQuiz } from '../../api/quizzes.api';
import { apiGetAttemptsByQuiz } from '../../api/attempts.api';

const STATUS_TONES = {
    published: { color: '#0E8F62', soft: '#E9F8F1', label: 'LIVE' },
    paused: { color: '#C27A11', soft: '#FFF6E8', label: 'PAUSED' },
    draft: { color: '#61708D', soft: '#EEF2F8', label: 'DRAFT' },
};

const FILTER_OPTIONS = ['all', 'published', 'paused', 'draft'];

export default function ManageQuizzesScreen({ navigation }) {
    const { width } = useWindowDimensions();
    const isMobile = width < 820;
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    const loadQuizzes = async () => {
        try {
            const data = await apiListQuizzes({ limit: 100 }); // Fetch more for management
            if (data && data.items) {
                const sortedItems = [...data.items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setQuizzes(sortedItems);
            }
        } catch (_error) {
            Alert.alert('Error', 'Failed to fetch quizzes');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadQuizzes();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadQuizzes();
    };

    const handleChangeStatus = (quiz) => {
        Alert.alert(
            'Change Status',
            `Current Status: ${quiz.status.toUpperCase()}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Set to LIVE',
                    onPress: () => updateStatus(quiz._id, 'published')
                },
                {
                    text: 'Set to PAUSED',
                    onPress: () => updateStatus(quiz._id, 'paused')
                },
                {
                    text: 'Set to DRAFT',
                    onPress: () => updateStatus(quiz._id, 'draft')
                }
            ]
        );
    };

    const updateStatus = async (id, status) => {
        try {
            await apiUpdateQuiz(id, { status });
            // Optimistic update
            setQuizzes(prev => prev.map(q => q._id === id ? { ...q, status } : q));
            Alert.alert('Success', `Quiz status updated to ${status.toUpperCase()}`);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update status');
            loadQuizzes(); // Revert on error
        }
    };

    const handleDelete = (quiz) => {
        Alert.alert(
            'Delete Quiz',
            `Are you sure you want to permanently delete "${quiz.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiDeleteQuiz(quiz._id);
                            setQuizzes(prev => prev.filter(q => q._id !== quiz._id));
                            Alert.alert('Success', 'Quiz deleted');
                        } catch (_error) {
                            Alert.alert('Error', 'Failed to delete quiz');
                        }
                    },
                },
            ]
        );
    };

    const copyCode = async (code) => {
        await Clipboard.setStringAsync(code);
        Alert.alert('Copied', `Quiz Code ${code} copied to clipboard`);
    };

    const handleDownloadReport = async (quiz) => {
        try {
            Alert.alert('Generating Report', 'Please wait...');
            const attempts = await apiGetAttemptsByQuiz(quiz._id);

            if (!attempts || attempts.length === 0) {
                Alert.alert('Info', 'No attempts found for this quiz.');
                return;
            }

            // Prepare Data for Excel
            const data = attempts.map(attempt => {
                const dateObj = new Date(attempt.finishedAt || attempt.createdAt);
                return {
                    "Email": attempt.userId?.email || 'Unknown',
                    "Name": attempt.userId?.name || 'Unknown',
                    "Marks": attempt.score,
                    "Max Marks": attempt.maxScore,
                    "Date": dateObj.toLocaleDateString('en-GB'),
                    "Time": dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
                };
            });

            // Create Workbook
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Report");

            // Generate Excel File (Base64)
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

            // Save to file
            const fileName = `Report_${quiz.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
            const fileUri = FileSystem.documentDirectory + fileName;

            await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType ? FileSystem.EncodingType.Base64 : 'base64' });

            // Share
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to generate report');
        }
    };

    const summary = useMemo(() => {
        return quizzes.reduce((acc, item) => {
            acc.total += 1;
            if (item.status === 'published') acc.live += 1;
            if (item.status === 'paused') acc.paused += 1;
            if (item.status === 'draft') acc.draft += 1;
            return acc;
        }, { total: 0, live: 0, paused: 0, draft: 0 });
    }, [quizzes]);

    const filteredQuizzes = useMemo(() => {
        const query = search.trim().toLowerCase();
        return quizzes.filter((quiz) => {
            const matchesFilter = activeFilter === 'all' || quiz.status === activeFilter;
            if (!matchesFilter) return false;
            if (!query) return true;
            return (
                (quiz.title || '').toLowerCase().includes(query) ||
                (quiz.quizCode || '').toLowerCase().includes(query) ||
                (quiz.description || '').toLowerCase().includes(query)
            );
        });
    }, [quizzes, search, activeFilter]);

    const renderHeader = () => (
        <View>
            <LinearGradient
                colors={['#112A4E', '#1A4C86']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
            >
                <Text style={styles.heroEyebrow}>QUIZ CONTROL CENTER</Text>
                <Text style={styles.heroTitle}>Manage Quizzes</Text>
                <Text style={styles.heroSubtitle}>
                    Review status, edit content, and export reports from one workspace.
                </Text>

                <View style={styles.heroStatsRow}>
                    <View style={styles.heroStat}>
                        <Text style={styles.heroStatValue}>{summary.total}</Text>
                        <Text style={styles.heroStatLabel}>Total</Text>
                    </View>
                    <View style={styles.heroStat}>
                        <Text style={styles.heroStatValue}>{summary.live}</Text>
                        <Text style={styles.heroStatLabel}>Live</Text>
                    </View>
                    <View style={styles.heroStat}>
                        <Text style={styles.heroStatValue}>{summary.paused}</Text>
                        <Text style={styles.heroStatLabel}>Paused</Text>
                    </View>
                    <View style={styles.heroStat}>
                        <Text style={styles.heroStatValue}>{summary.draft}</Text>
                        <Text style={styles.heroStatLabel}>Draft</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.toolbar}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#7A89A3" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by title, code, or description"
                        placeholderTextColor="#7A89A3"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <View style={styles.filtersRow}>
                    {FILTER_OPTIONS.map((status) => {
                        const isActive = activeFilter === status;
                        return (
                            <TouchableOpacity
                                key={status}
                                style={[styles.filterPill, isActive && styles.filterPillActive]}
                                onPress={() => setActiveFilter(status)}
                            >
                                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                                    {status === 'all' ? 'All' : status === 'published' ? 'Live' : status.charAt(0).toUpperCase() + status.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );

    const renderItem = ({ item }) => {
        const statusTone = STATUS_TONES[item.status] || STATUS_TONES.draft;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <TouchableOpacity
                        onPress={() => handleChangeStatus(item)}
                        style={[styles.badge, { backgroundColor: statusTone.soft, borderColor: `${statusTone.color}40` }]}
                    >
                        <Text style={[styles.badgeText, { color: statusTone.color }]}>{statusTone.label}</Text>
                        <Ionicons name="chevron-down" size={12} color={statusTone.color} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.desc} numberOfLines={2}>{item.description || 'No description provided.'}</Text>

                <View style={styles.infoGrid}>
                    <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Created</Text>
                        <Text style={styles.infoValue}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Updated</Text>
                        <Text style={styles.infoValue}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Type</Text>
                        <Text style={styles.infoValue}>{(item.type || 'custom').toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.metaRow}>
                    <TouchableOpacity onPress={() => copyCode(item.quizCode)} style={styles.codeBtn}>
                        <Ionicons name="copy-outline" size={13} color="#1D63D0" />
                        <Text style={styles.codeText}>Code {item.quizCode}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                <View style={[styles.actions, isMobile && styles.actionsMobile]}>
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => navigation.navigate('EditQuiz', { quizId: item._id })}>
                        <Ionicons name="create-outline" size={16} color="#1D63D0" />
                        <Text style={[styles.actionText, { color: '#1D63D0' }]}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDownloadReport(item)}>
                        <Ionicons name="download-outline" size={16} color="#0E8F62" />
                        <Text style={[styles.actionText, { color: '#0E8F62' }]}>Report</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                        <Ionicons name="trash-outline" size={16} color="#C43E3A" />
                        <Text style={[styles.actionText, { color: '#C43E3A' }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#1D63D0" />
                    <Text style={styles.loadingText}>Loading quizzes...</Text>
                </View>
            ) : (
            <FlatList
                data={filteredQuizzes}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={<Text style={styles.empty}>No quizzes match this filter.</Text>}
                showsVerticalScrollIndicator={false}
            />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6FB',
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#5E6F8C',
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 28,
    },
    hero: {
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
    },
    heroEyebrow: {
        color: '#BFD5F4',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 4,
    },
    heroSubtitle: {
        color: '#D1E2F8',
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 14,
    },
    heroStatsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    heroStat: {
        minWidth: 90,
        marginRight: 10,
        marginBottom: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        backgroundColor: 'rgba(255,255,255,0.11)',
    },
    heroStatValue: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
        lineHeight: 22,
    },
    heroStatLabel: {
        color: '#DCEBFC',
        fontSize: 11,
        fontWeight: '600',
    },
    toolbar: {
        marginBottom: 12,
    },
    searchBar: {
        height: 46,
        borderWidth: 1,
        borderColor: '#D8E3F2',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    searchInput: {
        flex: 1,
        marginLeft: 9,
        color: '#1B2D4A',
        fontSize: 14,
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
    },
    filtersRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    filterPill: {
        borderWidth: 1,
        borderColor: '#D6E0EE',
        backgroundColor: '#EEF3FA',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
        marginRight: 8,
        marginBottom: 8,
    },
    filterPillActive: {
        backgroundColor: '#1D63D0',
        borderColor: '#1D63D0',
    },
    filterText: {
        color: '#5F6F8D',
        fontSize: 12,
        fontWeight: '700',
    },
    filterTextActive: {
        color: '#FFFFFF',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#DDE6F2',
        padding: 14,
        marginBottom: 12,
        shadowColor: '#102145',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 19,
        fontWeight: '800',
        color: '#132A4A',
        flex: 1,
        marginRight: 10,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 10.5,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    desc: {
        color: '#5C6E8C',
        fontSize: 13.5,
        lineHeight: 20,
        marginBottom: 12,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    infoCell: {
        minWidth: 120,
        marginRight: 14,
        marginBottom: 8,
    },
    infoLabel: {
        color: '#7889A5',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 2,
    },
    infoValue: {
        color: '#20324F',
        fontSize: 13,
        fontWeight: '700',
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    codeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAF1FF',
        borderWidth: 1,
        borderColor: '#D4E0FA',
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 9,
    },
    codeText: {
        color: '#1D63D0',
        fontWeight: '700',
        fontSize: 12,
        marginLeft: 6,
    },
    divider: {
        height: 1,
        backgroundColor: '#E8EEF7',
        marginBottom: 10,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionsMobile: {
        justifyContent: 'space-between',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DFE7F3',
        backgroundColor: '#F8FBFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginLeft: 8,
    },
    actionBtnPrimary: {
        borderColor: '#CFE0FB',
        backgroundColor: '#EEF5FF',
    },
    actionText: {
        marginLeft: 5,
        fontSize: 12,
        fontWeight: '700',
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
        color: '#7A89A3',
        fontSize: 14,
    },
});
