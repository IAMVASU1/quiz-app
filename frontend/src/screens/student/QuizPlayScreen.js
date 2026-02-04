import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, BackHandler, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiSubmitAttempt } from '../../api/attempts.api';
import { apiGetQuizById } from '../../api/quizzes.api';

export default function QuizPlayScreen({ route, navigation }) {
    const { attemptId, questions, settings, quizTitle, quizId } = route.params;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: choiceId }
    const [submitting, setSubmitting] = useState(false);

    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;

    // Polling Logic to check if quiz is paused
    useEffect(() => {
        if (!quizId) return;

        const interval = setInterval(async () => {
            try {
                const quiz = await apiGetQuizById(quizId);
                if (quiz && quiz.status === 'paused') {
                    clearInterval(interval);
                    Alert.alert('Quiz Paused', 'The instructor has paused the quiz. Your answers will be submitted automatically.');
                    handleSubmit(true);
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [quizId]);

    // Prevent Back Button
    useEffect(() => {
        const backAction = () => {
            Alert.alert("Hold on!", "Are you sure you want to quit? Your progress will be lost.", [
                { text: "Cancel", onPress: () => null, style: "cancel" },
                { text: "YES", onPress: () => navigation.goBack() }
            ]);
            return true;
        };
        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => backHandler.remove();
    }, []);

    const handleSelectOption = (choiceId) => {
        // Use .id because backend sends 'id' for questions, not '_id'
        const qId = currentQuestion.id || currentQuestion._id;
        setAnswers(prev => ({
            ...prev,
            [qId]: choiceId
        }));
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

    const handleSubmit = async (auto = false) => {
        if (!auto) {
            const answeredCount = Object.keys(answers).length;
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

        setSubmitting(true);
        try {
            const formattedAnswers = Object.entries(answers).map(([qId, cId]) => ({
                questionId: qId,
                choiceId: cId
            }));

            const result = await apiSubmitAttempt(attemptId, formattedAnswers);
            navigation.replace('QuizResult', { result });
        } catch (error) {
            console.error("Submit Error:", error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit quiz. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2D3436" />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.quizTitle} numberOfLines={1}>{quizTitle}</Text>
                        <Text style={styles.progressText}>Question {currentIndex + 1} / {totalQuestions}</Text>
                    </View>
                </View>

                {/* Question Card */}
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.questionCard}>
                        <Text style={styles.questionText}>{currentQuestion.text}</Text>

                        <View style={styles.optionsContainer}>
                            {currentQuestion.choices.map((choice) => {
                                const qId = currentQuestion.id || currentQuestion._id;
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
                                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
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
                            onPress={() => handleSubmit(false)}
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
    optionTextSelected: { color: '#2D3436', fontWeight: '600' },

    footer: { flexDirection: 'row', padding: 20, backgroundColor: 'white', elevation: 10, justifyContent: 'space-between', alignItems: 'center' },
    navBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
    navBtnDisabled: { opacity: 0.5 },
    submitBtn: { backgroundColor: '#00B894', paddingHorizontal: 30, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    submitText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});
