import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiStartPractice } from '../../api/attempts.api';

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 50;
const STEP = 5;
const PRESET_COUNTS = [10, 20, 30, 40];

export default function AptitudeCategoryScreen({ navigation }) {
    const [questionCount, setQuestionCount] = useState('10');
    const [creating, setCreating] = useState(false);
    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;

    const parsedCount = useMemo(() => Number.parseInt(questionCount, 10), [questionCount]);

    const clampCount = (value) => Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, value));

    const updateCount = (value) => {
        if (!Number.isFinite(value)) {
            setQuestionCount(String(MIN_QUESTIONS));
            return;
        }
        setQuestionCount(String(clampCount(value)));
    };

    const handleStartQuiz = async () => {
        const count = Number.parseInt(questionCount, 10);
        if (Number.isNaN(count) || count < MIN_QUESTIONS || count > MAX_QUESTIONS) {
            Alert.alert('Invalid Count', `Please enter a number between ${MIN_QUESTIONS} and ${MAX_QUESTIONS}`);
            return;
        }

        setCreating(true);
        try {
            const attemptData = await apiStartPractice({
                subjects: ['Aptitude'],
                limit: count
            });

            navigation.replace('QuizPlay', {
                attemptId: attemptData.attemptId,
                questions: attemptData.questions,
                settings: attemptData.quizSettings,
                quizTitle: attemptData.quizTitle || 'Aptitude Practice'
            });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to create quiz. Make sure there are enough Aptitude questions.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <LinearGradient
                    colors={['#4A2F04', '#8A5A0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    <View style={styles.heroIcon}>
                        <Ionicons name="bulb-outline" size={18} color="#FFFFFF" />
                    </View>
                    <Text style={styles.heroEyebrow}>APTITUDE PRACTICE</Text>
                    <Text style={styles.heroTitle}>Aptitude Mode</Text>
                    <Text style={styles.heroSubtitle}>Sharpen logical reasoning, speed, and decision accuracy.</Text>

                    <View style={styles.heroStats}>
                        <View style={styles.heroStatCard}>
                            <Text style={styles.heroStatValue}>5-50</Text>
                            <Text style={styles.heroStatLabel}>Questions</Text>
                        </View>
                        <View style={styles.heroStatCard}>
                            <Text style={styles.heroStatValue}>Auto</Text>
                            <Text style={styles.heroStatLabel}>Generated</Text>
                        </View>
                        <View style={styles.heroStatCard}>
                            <Text style={styles.heroStatValue}>Instant</Text>
                            <Text style={styles.heroStatLabel}>Start</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={[styles.card, isDesktop && styles.cardDesktop]}>
                    <View style={styles.cardTitleRow}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="speedometer-outline" size={20} color="#B26B00" />
                        </View>
                        <View style={styles.cardTitleWrap}>
                            <Text style={styles.cardTitle}>Configure Session</Text>
                            <Text style={styles.cardSubtitle}>Set how many aptitude questions you want to practice.</Text>
                        </View>
                    </View>

                    <View style={styles.counterShell}>
                        <TouchableOpacity
                            style={styles.counterBtn}
                            onPress={() => updateCount((parsedCount || MIN_QUESTIONS) - STEP)}
                            disabled={creating}
                        >
                            <Ionicons name="remove" size={20} color="#324969" />
                        </TouchableOpacity>

                        <View style={styles.countInputWrap}>
                            <TextInput
                                style={styles.countInput}
                                value={questionCount}
                                onChangeText={(text) => setQuestionCount(text.replace(/[^\d]/g, ''))}
                                keyboardType="number-pad"
                                maxLength={2}
                                editable={!creating}
                                onBlur={() => updateCount(Number.parseInt(questionCount, 10))}
                            />
                            <Text style={styles.countSuffix}>questions</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.counterBtn}
                            onPress={() => updateCount((parsedCount || MIN_QUESTIONS) + STEP)}
                            disabled={creating}
                        >
                            <Ionicons name="add" size={20} color="#324969" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.presetRow}>
                        {PRESET_COUNTS.map((count) => {
                            const isActive = parsedCount === count;
                            return (
                                <TouchableOpacity
                                    key={count}
                                    style={[styles.presetChip, isActive && styles.presetChipActive]}
                                    onPress={() => setQuestionCount(String(count))}
                                    disabled={creating}
                                >
                                    <Text style={[styles.presetText, isActive && styles.presetTextActive]}>{count}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={styles.cardText}>
                        Recommended: start with 10-20 questions for speed drills, then increase gradually.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.createBtn, creating && styles.disabledBtn]}
                    onPress={handleStartQuiz}
                    disabled={creating}
                >
                    {creating ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Text style={styles.createBtnText}>Start Aptitude Practice</Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6FB',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 110,
    },
    hero: {
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
    },
    heroIcon: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: 10,
    },
    heroEyebrow: {
        color: '#F7E3C2',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '800',
        marginBottom: 5,
    },
    heroSubtitle: {
        color: '#F4E7CF',
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 13,
    },
    heroStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    heroStatCard: {
        minWidth: 94,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    heroStatValue: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 1,
    },
    heroStatLabel: {
        color: '#F3E8D4',
        fontSize: 11,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#DEE6F2',
        shadowColor: '#102145',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
    },
    cardDesktop: {
        maxWidth: 720,
        width: '100%',
        alignSelf: 'center',
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#FFF4E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    cardTitleWrap: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        color: '#1A2D4A',
        fontWeight: '800',
        marginBottom: 2,
    },
    cardSubtitle: {
        color: '#617390',
        fontSize: 13,
    },
    counterShell: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DEE6F2',
        backgroundColor: '#F8FAFE',
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    counterBtn: {
        width: 38,
        height: 38,
        borderRadius: 9,
        backgroundColor: '#E9F0FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countInputWrap: {
        flex: 1,
        alignItems: 'center',
    },
    countInput: {
        fontSize: 30,
        color: '#A26000',
        fontWeight: '800',
        textAlign: 'center',
        minWidth: 74,
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
    },
    countSuffix: {
        marginTop: -2,
        fontSize: 11,
        color: '#6C7F9D',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    presetRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    presetChip: {
        borderWidth: 1,
        borderColor: '#D8E2F0',
        backgroundColor: '#EEF3FA',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    presetChipActive: {
        backgroundColor: '#B9740A',
        borderColor: '#B9740A',
    },
    presetText: {
        color: '#61728F',
        fontWeight: '700',
        fontSize: 12,
    },
    presetTextActive: {
        color: '#FFFFFF',
    },
    cardText: {
        color: '#5F7190',
        fontSize: 13,
        lineHeight: 19,
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 14,
        borderTopWidth: 1,
        borderTopColor: '#E2E9F4',
        backgroundColor: '#FFFFFF',
    },
    createBtn: {
        backgroundColor: '#B9740A',
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#A86708',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8B5A08',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.24,
        shadowRadius: 10,
        elevation: 4,
    },
    disabledBtn: {
        opacity: 0.65,
    },
    createBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        marginRight: 8,
    },
});
