import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminLayout from '../../components/admin/AdminLayout';
import { apiGetAttemptHistory } from '../../api/attempts.api';
import { apiGetQuizzesByCreator, apiUpdateQuiz } from '../../api/quizzes.api';
import useAuth from '../../hooks/useAuth';
import MotionContainer from '../../components/admin/MotionContainer';

export default function HistoryScreen({ navigation }) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('joined'); // joined | created
    const [loading, setLoading] = useState(false);
    const [joinedQuizzes, setJoinedQuizzes] = useState([]);
    const [createdQuizzes, setCreatedQuizzes] = useState([]);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'joined') {
                const res = await apiGetAttemptHistory({ limit: 50 });
                setJoinedQuizzes(res.items || []);
            } else {
                if (user?.id) {
                    const res = await apiGetQuizzesByCreator(user.id);
                    setCreatedQuizzes(Array.isArray(res) ? res : (res.items || []));
                }
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (quiz) => {
        const newStatus = quiz.status === 'published' ? 'paused' : 'published';
        try {
            await apiUpdateQuiz(quiz._id, { status: newStatus });
            // Optimistic update
            setCreatedQuizzes(prev => prev.map(q => q._id === quiz._id ? { ...q, status: newStatus } : q));
            Alert.alert('Success', `Quiz ${newStatus === 'published' ? 'is now LIVE' : 'has been PAUSED'}`);
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const renderTab = (key, label) => (
        <TouchableOpacity
            style={[styles.tab, activeTab === key && styles.activeTab]}
            onPress={() => setActiveTab(key)}
        >
            <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderJoinedItem = ({ item, index }) => {
        const date = new Date(item.finishedAt || item.createdAt).toLocaleDateString();
        const score = item.score !== undefined ? item.score : '-';
        const max = item.maxScore || '-';

        // Construct result object for QuizResultScreen
        const resultData = {
            ...item, // Pass full attempt data (questions, answers, etc.)
            score: item.score,
            maxScore: item.maxScore,
            passed: (item.score / item.maxScore) >= 0.5, // Simple pass logic
            percentage: Math.round((item.score / item.maxScore) * 100),
            fromHistory: true
        };

        return (
            <MotionContainer delay={index * 0.05}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('QuizResult', { result: resultData })}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Quiz Attempt</Text>
                            <Text style={styles.cardSubtitle}>Date: {date}</Text>
                        </View>
                        <View style={styles.scoreBadge}>
                            <Text style={styles.scoreText}>{score} / {max}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" style={{ marginLeft: 8 }} />
                    </View>
                </TouchableOpacity>
            </MotionContainer>
        );
    };

    const renderCreatedItem = ({ item, index }) => {
        const date = new Date(item.createdAt).toLocaleDateString();
        const isLive = item.status === 'published';

        return (
            <MotionContainer delay={index * 0.05}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="create-outline" size={24} color="#3B82F6" />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardSubtitle}>Code: {item.quizCode}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: isLive ? '#D1FAE5' : '#FEF3C7' }]}>
                            <Text style={[styles.statusText, { color: isLive ? '#059669' : '#D97706' }]}>
                                {item.status.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.cardFooter}>
                        <View style={styles.metaInfo}>
                            <Text style={styles.footerText}>Created: {date}</Text>
                            <Text style={styles.footerText}>{item.questionsCount || 0} Questions</Text>
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: isLive ? '#FEF2F2' : '#ECFDF5', marginRight: 8 }]}
                                onPress={() => handleToggleStatus(item)}
                            >
                                <Ionicons name={isLive ? "pause-outline" : "play-outline"} size={16} color={isLive ? '#EF4444' : '#10B981'} />
                                <Text style={[styles.actionBtnText, { color: isLive ? '#EF4444' : '#10B981' }]}>
                                    {isLive ? 'Pause' : 'Live'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#EFF6FF' }]}
                                onPress={() => navigation.navigate('EditQuiz', { quizId: item._id })}
                            >
                                <Ionicons name="create-outline" size={16} color="#3B82F6" />
                                <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </MotionContainer>
        );
    };

    return (
        <AdminLayout title="History">
            <View style={styles.container}>
                <View style={styles.tabsContainer}>
                    {renderTab('joined', 'Joined Quizzes')}
                    {renderTab('created', 'Created Quizzes')}
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                    </View>
                ) : (
                    <FlatList
                        data={activeTab === 'joined' ? joinedQuizzes : createdQuizzes}
                        renderItem={activeTab === 'joined' ? renderJoinedItem : renderCreatedItem}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="file-tray-outline" size={48} color="#94A3B8" />
                                <Text style={styles.emptyText}>No records found</Text>
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
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: 4,
        borderRadius: 12,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#EFF6FF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    activeTabText: {
        color: '#3B82F6',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#64748B',
    },
    scoreBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    scoreText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaInfo: {
        flex: 1,
    },
    footerText: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 2,
    },
    actions: {
        flexDirection: 'row',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#94A3B8',
    },
});
