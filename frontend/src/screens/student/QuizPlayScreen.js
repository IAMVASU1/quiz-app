import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, BackHandler, StatusBar, AppState, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';
import { apiSubmitAttempt } from '../../api/attempts.api';
import { apiGetQuizById } from '../../api/quizzes.api';

export default function QuizPlayScreen({ route, navigation }) {
    const { attemptId, questions = [], quizTitle, quizId } = route.params;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: choiceId }
    const [submitting, setSubmitting] = useState(false);
    const answersRef = useRef({});
    const hasSubmittedRef = useRef(false);
    const isSubmittingRef = useRef(false);
    const allowExitRef = useRef(false);

    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;

    const handleSubmit = useCallback(async (auto = false, reason = 'manual') => {
        if (isSubmittingRef.current || hasSubmittedRef.current) return;

        if (!auto) {
            const answeredCount = Object.keys(answersRef.current).length;
            if (answeredCount < totalQuestions) {
                const confirm = await new Promise(resolve => {
                    Alert.alert(
                        "Submit Quiz?",
                        `You have answered ${answeredCount} out of ${totalQuestions} questions.`,
                        [
                            { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
                            { text: "Submit", onPress: () => resolve(true) }
                        ]
                    );
                });
                if (!confirm) return;
            }
        }

        isSubmittingRef.current = true;
        setSubmitting(true);
        try {
            const formattedAnswers = Object.entries(answersRef.current).map(([qId, cId]) => ({
                questionId: qId,
                choiceId: cId
            }));

            const result = await apiSubmitAttempt(attemptId, formattedAnswers);
            hasSubmittedRef.current = true;
            allowExitRef.current = true;
            navigation.replace('QuizResult', { result });
        } catch (error) {
            console.error(`Submit Error (${reason}):`, error);
            if (!auto) {
                Alert.alert('Error', error.response?.data?.message || 'Failed to submit quiz. Please try again.');
            }
            isSubmittingRef.current = false;
            setSubmitting(false);
        }
    }, [attemptId, navigation, totalQuestions]);

    // Polling Logic to check if quiz is paused
    useEffect(() => {
        if (!quizId) return;

        const interval = setInterval(async () => {
            try {
                const quiz = await apiGetQuizById(quizId);
                if (quiz && quiz.status === 'paused') {
                    clearInterval(interval);
                    Alert.alert('Quiz Paused', 'The instructor has paused the quiz. Your answers will be submitted automatically.');
                    handleSubmit(true, 'paused-by-faculty');
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [quizId, handleSubmit]);

    // Prevent screenshots/screen recording while quiz is active
    useEffect(() => {
        let screenshotSubscription;
        let isMounted = true;

        const enableScreenProtection = async () => {
            try {
                await ScreenCapture.preventScreenCaptureAsync();
            } catch (error) {
                console.warn('Could not enable screen capture protection:', error);
            }

            try {
                screenshotSubscription = ScreenCapture.addScreenshotListener(() => {
                    if (!isMounted || hasSubmittedRef.current) return;
                    Alert.alert('Security Alert', 'Screen capture is blocked during the quiz. Your attempt is being submitted.');
                    handleSubmit(true, 'screenshot-attempt');
                });
            } catch (error) {
                console.warn('Could not attach screenshot listener:', error);
            }
        };

        enableScreenProtection();

        return () => {
            isMounted = false;
            screenshotSubscription?.remove();
            ScreenCapture.allowScreenCaptureAsync().catch(() => { });
        };
    }, [handleSubmit]);

    // Block browser copy shortcuts/context menu while on quiz screen
    useEffect(() => {
        if (Platform.OS !== 'web' || typeof document === 'undefined') return;

        const preventDefault = (event) => event.preventDefault();
        const preventCopyShortcuts = (event) => {
            const key = event.key?.toLowerCase();
            if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'x'].includes(key)) {
                event.preventDefault();
            }
        };

        document.addEventListener('copy', preventDefault);
        document.addEventListener('cut', preventDefault);
        document.addEventListener('contextmenu', preventDefault);
        document.addEventListener('keydown', preventCopyShortcuts);

        return () => {
            document.removeEventListener('copy', preventDefault);
            document.removeEventListener('cut', preventDefault);
            document.removeEventListener('contextmenu', preventDefault);
            document.removeEventListener('keydown', preventCopyShortcuts);
        };
    }, []);

    // Auto-submit if app is backgrounded/hidden (student leaves quiz screen or closes app)
    useEffect(() => {
        const appStateSubscription = AppState.addEventListener('change', (nextState) => {
            if ((nextState === 'inactive' || nextState === 'background') && !hasSubmittedRef.current) {
                handleSubmit(true, 'app-backgrounded');
            }
        });

        const unsubscribeBlur = navigation.addListener('blur', () => {
            if (!hasSubmittedRef.current) {
                handleSubmit(true, 'screen-blur');
            }
        });

        let onVisibilityChange;
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
            onVisibilityChange = () => {
                if (document.hidden && !hasSubmittedRef.current) {
                    handleSubmit(true, 'tab-hidden');
                }
            };
            document.addEventListener('visibilitychange', onVisibilityChange);
        }

        return () => {
            appStateSubscription.remove();
            unsubscribeBlur();
            if (onVisibilityChange && typeof document !== 'undefined') {
                document.removeEventListener('visibilitychange', onVisibilityChange);
            }
        };
    }, [handleSubmit, navigation]);

    // Prevent Back Button
    useEffect(() => {
        const backAction = () => {
            Alert.alert("Quiz Locked", "You cannot leave this screen until the quiz is submitted.");
            return true;
        };
        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => backHandler.remove();
    }, []);

    // Prevent navigation away from this screen while quiz is active
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (event) => {
            if (allowExitRef.current) return;
            event.preventDefault();
            Alert.alert('Quiz Locked', 'Navigation is disabled during an active quiz.');
        });

        return unsubscribe;
    }, [navigation]);

    const handleSelectOption = (choiceId) => {
        // Use .id because backend sends 'id' for questions, not '_id'
        const qId = currentQuestion.id || currentQuestion._id;
        const nextAnswers = {
            ...answersRef.current,
            [qId]: choiceId
        };
        answersRef.current = nextAnswers;
        setAnswers(nextAnswers);
    };

    const handleNext = () => {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2D3436" />
            <SafeAreaView style={[styles.safeArea, styles.secureContent]}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.quizTitle, styles.noCopyText]} selectable={false} numberOfLines={1}>{quizTitle}</Text>
                        <Text style={[styles.progressText, styles.noCopyText]} selectable={false}>Question {currentIndex + 1} / {totalQuestions}</Text>
                    </View>
                </View>

                {/* Question Card */}
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.questionCard}>
                        <Text style={[styles.questionText, styles.noCopyText]} selectable={false}>{currentQuestion?.text}</Text>

                        <View style={styles.optionsContainer}>
                            {(currentQuestion?.choices || []).map((choice) => {
                                const qId = currentQuestion?.id || currentQuestion?._id;
                                const isSelected = answers[qId] === choice.id;
                                return (
                                    <TouchableOpacity
                                        key={choice.id}
                                        style={[styles.optionBtn, isSelected && styles.optionSelected]}
                                        onPress={() => handleSelectOption(choice.id)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.radioCircle, isSelected && styles.radioSelected]}>
                                            {isSelected && <View style={styles.radioDot} />}
                                        </View>
                                        <Text selectable={false} style={[styles.optionText, styles.noCopyText, isSelected && styles.optionTextSelected]}>
                                            {choice.text}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>

                {/* Footer Navigation */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
                        onPress={handlePrev}
                        disabled={currentIndex === 0}
                    >
                        <Ionicons name="arrow-back" size={24} color={currentIndex === 0 ? '#ccc' : '#333'} />
                    </TouchableOpacity>

                    {currentIndex === totalQuestions - 1 ? (
                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={() => handleSubmit(false, 'manual')}
                            disabled={submitting}
                        >
                            <Text style={styles.submitText}>{submitting ? 'SUBMITTING...' : 'SUBMIT'}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.navBtn} onPress={handleNext}>
                            <Ionicons name="arrow-forward" size={24} color="#333" />
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    safeArea: { flex: 1 },
    secureContent: Platform.OS === 'web' ? { userSelect: 'none' } : {},
    header: { backgroundColor: '#2D3436', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4 },
    quizTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', maxWidth: '70%' },
    progressText: { color: '#B2BEC3', fontSize: 12, marginTop: 4 },
    timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00B894', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5 },
    timerWarning: { backgroundColor: '#FF7675' },
    timerText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

    scrollContent: { padding: 20 },
    questionCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 2 },
    questionText: { fontSize: 18, fontWeight: '600', color: '#2D3436', marginBottom: 25, lineHeight: 26 },

    optionsContainer: { gap: 12 },
    optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 2, borderColor: '#F0F0F0', backgroundColor: '#FAFAFA' },
    optionSelected: { borderColor: '#2196F3', backgroundColor: '#E3F2FD' },
    radioCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ccc', marginRight: 15, justifyContent: 'center', alignItems: 'center' },
    radioSelected: { borderColor: '#2196F3' },
    radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2196F3' },
    optionText: { fontSize: 16, color: '#636E72', flex: 1 },
    noCopyText: Platform.OS === 'web' ? { userSelect: 'none' } : {},
    optionTextSelected: { color: '#2D3436', fontWeight: '600' },

    footer: { flexDirection: 'row', padding: 20, backgroundColor: 'white', elevation: 10, justifyContent: 'space-between', alignItems: 'center' },
    navBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
    navBtnDisabled: { opacity: 0.5 },
    submitBtn: { backgroundColor: '#00B894', paddingHorizontal: 30, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    submitText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});
