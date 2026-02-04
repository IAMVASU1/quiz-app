import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar, Platform, TextInput, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';

import { apiGetAttemptHistory } from '../../api/attempts.api';
import Avatar from '../../components/common/Avatar';
import useAuth from '../../hooks/useAuth';

const { width } = Dimensions.get('window');

export default function StudentHomeScreen({ navigation }) {
    const [refreshing, setRefreshing] = useState(false);
    const [quizCode, setQuizCode] = useState('');
    const [recentAttempts, setRecentAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Swipe Logic
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
                // Left swipe -> Profile
                runOnJS(navigateToProfile)();
            } else if (event.translationX > 100) {
                // Right swipe -> Home (Already here)
            }
            translateX.value = withSpring(0);
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    const loadData = async () => {
        try {
            // Parallel fetch
            const history = await apiGetAttemptHistory({ limit: 5 });

            // Handle history response which returns { items: [...] }
            if (history && history.items) {
                setRecentAttempts(history.items);
            } else if (Array.isArray(history)) {
                setRecentAttempts(history);
            } else {
                setRecentAttempts([]);
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

    const handleJoin = () => {
        if (!quizCode.trim()) {
            Alert.alert('Error', 'Please enter a quiz code');
            return;
        }
        navigation.navigate('JoinQuiz', { quizCode: quizCode.trim() });
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View>
                <Text style={styles.greeting}>Welcome back! 🎓</Text>
                <Text style={styles.subGreeting}>Ready to learn something new?</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <Avatar
                    uri={useAuth().user?.avatar}
                    name={useAuth().user?.name}
                    size={45}
                    color="#2196F3"
                />
            </TouchableOpacity>
        </View>
    );

    const renderJoinCard = () => (
        <View style={styles.joinCard}>
            <Text style={styles.cardTitle}>Join a Quiz</Text>
            <Text style={styles.cardSub}>Enter the code shared by your faculty</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: QZ-1234"
                    placeholderTextColor="#999"
                    value={quizCode}
                    onChangeText={setQuizCode}
                    autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.joinBtn} onPress={handleJoin}>
                    <Text style={styles.joinBtnText}>JOIN</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderQuickActions = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Practice Now 🚀</Text>
            <View style={styles.grid}>
                <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: '#E3F2FD' }]}
                    onPress={() => navigation.navigate('AptitudeCategory')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: '#2196F3' }]}>
                        <Ionicons name="bulb" size={24} color="white" />
                    </View>
                    <Text style={styles.actionTitle}>Aptitude</Text>
                    <Text style={styles.actionSub}>Sharpen logic</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: '#E0F2F1' }]}
                    onPress={() => navigation.navigate('TechnicalSubjects')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: '#009688' }]}>
                        <Ionicons name="code-slash" size={24} color="white" />
                    </View>
                    <Text style={styles.actionTitle}>Technical</Text>
                    <Text style={styles.actionSub}>Master stack</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: '#FFF3E0' }]}
                    onPress={() => navigation.navigate('Leaderboard')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: '#FF9800' }]}>
                        <Ionicons name="trophy" size={24} color="white" />
                    </View>
                    <Text style={styles.actionTitle}>Rankings</Text>
                    <Text style={styles.actionSub}>Top players</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.container, animatedStyle]}>
                <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
                <SafeAreaView style={styles.safeArea}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        showsVerticalScrollIndicator={false}
                    >
                        {renderHeader()}
                        {renderJoinCard()}
                        {renderQuickActions()}

                        {/* Recent Activity Placeholder */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Recent Activity 🕒</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('History')}>
                                    <Text style={styles.seeAll}>See All</Text>
                                </TouchableOpacity>
                            </View>
                            {recentAttempts.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No recent attempts. Start a quiz!</Text>
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
                                            <View style={[styles.activityIcon, { backgroundColor: passed ? '#E8F5E9' : '#FFF3E0' }]}>
                                                <Ionicons
                                                    name={passed ? "trophy" : "time"}
                                                    size={20}
                                                    color={passed ? "#4CAF50" : "#FF9800"}
                                                />
                                            </View>
                                            <View style={styles.activityInfo}>
                                                <Text style={styles.activityTitle} numberOfLines={1}>
                                                    {item.metadata?.quizSnapshot?.title || item.quiz?.title || 'Unknown Quiz'}
                                                </Text>
                                                <Text style={styles.activityDate}>
                                                    {new Date(item.createdAt).toLocaleDateString()} • Score: {item.score}/{item.maxScore}
                                                </Text>
                                            </View>
                                            <View style={styles.arrowContainer}>
                                                <Ionicons name="chevron-forward" size={18} color="#ccc" />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </View>

                    </ScrollView>
                </SafeAreaView>
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    scrollContent: { padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    greeting: { fontSize: 24, fontWeight: '800', color: '#2D3436' },
    subGreeting: { fontSize: 14, color: '#636E72', marginTop: 4 },
    profileBtn: { width: 45, height: 45, borderRadius: 25, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 2 },

    joinCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 25, elevation: 4, shadowColor: '#2196F3', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3436', marginBottom: 5 },
    cardSub: { fontSize: 13, color: '#636E72', marginBottom: 15 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    input: { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 16, fontWeight: '600', color: '#333', borderWidth: 1, borderColor: '#E0E0E0' },
    joinBtn: { backgroundColor: '#2196F3', borderRadius: 12, height: 50, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
    joinBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

    section: { marginBottom: 25 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2D3436' },
    grid: { flexDirection: 'row', gap: 15 },
    actionCard: { flex: 1, padding: 15, borderRadius: 16, alignItems: 'center' },
    iconCircle: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    actionTitle: { fontSize: 15, fontWeight: '700', color: '#2D3436', marginBottom: 2 },
    actionSub: { fontSize: 11, color: '#636E72' },

    seeAll: { color: '#2196F3', fontWeight: '600', fontSize: 13 },
    emptyState: { padding: 20, alignItems: 'center', backgroundColor: 'white', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
    emptyText: { color: '#999', fontSize: 14 },

    activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 16, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
    activityIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    activityInfo: { flex: 1 },
    activityTitle: { fontSize: 15, fontWeight: '700', color: '#2D3436', marginBottom: 2 },
    activityDate: { fontSize: 12, color: '#999', fontWeight: '500' },
    arrowContainer: { padding: 5 }
});
