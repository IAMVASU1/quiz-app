import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiGetAttemptHistory } from '../../api/attempts.api';
import { apiListQuizzes } from '../../api/quizzes.api';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '../../hooks/useAuth';

export default function HistoryScreen({ navigation }) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('joined'); // 'joined' | 'created'
    const [attempts, setAttempts] = useState([]);
    const [createdQuizzes, setCreatedQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load Attempts (Joined)
            const attemptsData = await apiGetAttemptHistory({ limit: 50 });
            if (attemptsData && attemptsData.items) {
                setAttempts(attemptsData.items);
            } else if (Array.isArray(attemptsData)) {
                setAttempts(attemptsData);
            }

            // Load Created Quizzes (Only if Admin/Faculty)
            if (user?.role === 'admin' || user?.role === 'faculty') {
                const quizzesData = await apiListQuizzes(1, 50);
                if (quizzesData && quizzesData.items) {
                    setCreatedQuizzes(quizzesData.items);
                }
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const renderAttemptItem = ({ item }) => {
        const percentage = item.maxScore > 0 ? (item.score / item.maxScore) * 100 : 0;
        const passed = percentage >= 50;

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('AppTabs', {
                    screen: 'Home',
                    params: {
                        screen: 'QuizResult',
                        params: { result: item }
                    }
                })}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.quizTitle} numberOfLines={1}>
                            {item.metadata?.quizSnapshot?.title || item.quiz?.title || 'Unknown Quiz'}
                        </Text>
                        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={[styles.scoreBadge, { backgroundColor: passed ? '#E8F5E9' : '#FFF3E0' }]}>
                        <Text style={[styles.scoreText, { color: passed ? '#2E7D32' : '#EF6C00' }]}>
                            {item.score}/{item.maxScore}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.statusContainer}>
                        <Ionicons
                            name={passed ? "checkmark-circle" : "alert-circle"}
                            size={16}
                            color={passed ? "#4CAF50" : "#FF9800"}
                        />
                        <Text style={[styles.statusText, { color: passed ? "#4CAF50" : "#FF9800" }]}>
                            {passed ? "Passed" : "Needs Improvement"}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </View>
            </TouchableOpacity>
        );
    };

    const renderCreatedItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('AppTabs', {
                screen: 'Home',
                params: {
                    screen: 'EditQuiz',
                    params: { quizId: item._id }
                }
            })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <Text style={styles.quizTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.dateText}>Created: {formatDate(item.createdAt)}</Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: item.status === 'published' ? '#E3F2FD' : '#F5F5F5' }]}>
                    <Text style={[styles.scoreText, { color: item.status === 'published' ? '#1976D2' : '#616161', fontSize: 10, textTransform: 'uppercase' }]}>
                        {item.status}
                    </Text>
                </View>
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.codeText}>Code: {item.quizCode}</Text>
                <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </View>
        </TouchableOpacity>
    );

    const canCreate = user?.role === 'admin' || user?.role === 'faculty';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

            {canCreate && (
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
                        onPress={() => setActiveTab('joined')}
                    >
                        <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>Joined Quizzes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'created' && styles.activeTab]}
                        onPress={() => setActiveTab('created')}
                    >
                        <Text style={[styles.tabText, activeTab === 'created' && styles.activeTabText]}>Created Quizzes</Text>
                    </TouchableOpacity>
                </View>
            )}

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={activeTab === 'joined' ? attempts : createdQuizzes}
                    keyExtractor={(item) => item._id}
                    renderItem={activeTab === 'joined' ? renderAttemptItem : renderCreatedItem}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name={activeTab === 'joined' ? "documents-outline" : "create-outline"} size={60} color="#ccc" />
                            <Text style={styles.emptyText}>
                                {activeTab === 'joined' ? "No attempts yet." : "No quizzes created yet."}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    tabContainer: { flexDirection: 'row', backgroundColor: 'white', padding: 5, margin: 15, borderRadius: 12, elevation: 2 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    activeTab: { backgroundColor: '#E3F2FD' },
    tabText: { color: '#757575', fontWeight: '600' },
    activeTabText: { color: '#1976D2', fontWeight: 'bold' },

    listContent: { paddingHorizontal: 20, paddingBottom: 20 },
    card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    headerLeft: { flex: 1, marginRight: 10 },
    quizTitle: { fontSize: 16, fontWeight: '700', color: '#2D3436', marginBottom: 4 },
    dateText: { fontSize: 12, color: '#999', fontWeight: '500' },
    scoreBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    scoreText: { fontWeight: '700', fontSize: 13 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F5F7FA', paddingTop: 12 },
    statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusText: { fontSize: 12, fontWeight: '600' },
    codeText: { fontSize: 12, color: '#616161', fontWeight: '500' },

    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#999', marginTop: 10 }
});
