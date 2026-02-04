import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function QuizResultScreen({ route, navigation }) {
    const { result } = route.params;
    const { score, maxScore, percentage, passed } = result; // Assuming backend returns these

    // Calculate percentage if not provided
    const calcPercentage = percentage || Math.round((score / maxScore) * 100);
    const isPassed = passed !== undefined ? passed : calcPercentage >= 50;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={isPassed ? '#00B894' : '#FF7675'} />
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <View style={styles.resultCard}>
                        <View style={[styles.iconCircle, { backgroundColor: isPassed ? '#E8F5E9' : '#FFEBEE' }]}>
                            <Ionicons
                                name={isPassed ? "trophy" : "alert-circle"}
                                size={60}
                                color={isPassed ? '#4CAF50' : '#F44336'}
                            />
                        </View>

                        <Text style={styles.title}>{isPassed ? 'Quiz Completed!' : 'Keep Practicing!'}</Text>
                        <Text style={styles.subtitle}>
                            {isPassed ? 'Great job on finishing the quiz.' : 'Don\'t give up, try again!'}
                        </Text>

                        <View style={styles.scoreContainer}>
                            <Text style={styles.scoreLabel}>YOUR SCORE</Text>
                            <Text style={[styles.scoreValue, { color: isPassed ? '#4CAF50' : '#F44336' }]}>
                                {score} <Text style={styles.maxScore}>/ {maxScore}</Text>
                            </Text>
                            <View style={styles.percentBadge}>
                                <Text style={styles.percentText}>{calcPercentage}%</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.actionsContainer}>
                        {!result.fromHistory && (
                            <>
                                <TouchableOpacity
                                    style={[styles.btn, styles.primaryBtn]}
                                    onPress={() => navigation.navigate('StudentHome')}
                                >
                                    <Text style={styles.primaryBtnText}>GO TO DASHBOARD</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.btn, styles.secondaryBtn]}
                                    onPress={() => navigation.navigate('History')}
                                >
                                    <Text style={styles.secondaryBtnText}>VIEW HISTORY</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.btn, result.fromHistory ? styles.primaryBtn : styles.outlineBtn]}
                            onPress={() => navigation.navigate('QuizSolutions', { attempt: result })}
                        >
                            <Text style={result.fromHistory ? styles.primaryBtnText : styles.outlineBtnText}>VIEW SOLUTIONS</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    safeArea: { flex: 1 },
    scrollContent: { padding: 20, flexGrow: 1, paddingBottom: 40 },

    resultCard: { backgroundColor: 'white', borderRadius: 25, padding: 30, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, marginBottom: 30 },
    iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#2D3436', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#636E72', textAlign: 'center', marginBottom: 30 },

    scoreContainer: { alignItems: 'center' },
    scoreLabel: { fontSize: 12, fontWeight: 'bold', color: '#B2BEC3', letterSpacing: 1, marginBottom: 5 },
    scoreValue: { fontSize: 48, fontWeight: '900' },
    maxScore: { fontSize: 24, color: '#B2BEC3', fontWeight: '400' },
    percentBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, marginTop: 10 },
    percentText: { fontWeight: 'bold', color: '#636E72' },

    actionsContainer: { width: '100%' },
    btn: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 2, marginBottom: 15 },
    primaryBtn: { backgroundColor: '#2196F3' },
    primaryBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
    secondaryBtn: { backgroundColor: 'white', borderWidth: 1, borderColor: '#DDD', elevation: 0 },
    secondaryBtnText: { color: '#636E72', fontWeight: 'bold', fontSize: 16 },
    outlineBtn: { backgroundColor: 'white', borderWidth: 2, borderColor: '#2196F3', elevation: 0 },
    outlineBtnText: { color: '#2196F3', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 }
});
