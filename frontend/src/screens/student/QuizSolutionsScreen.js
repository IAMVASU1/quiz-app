import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGetAttemptById } from '../../api/attempts.api';

export default function QuizSolutionsScreen({ route, navigation }) {
    const { attempt } = route.params;
    const [fullAttempt, setFullAttempt] = useState(attempt);
    const [loading, setLoading] = useState(!attempt.questions || attempt.questions.length === 0);

    useEffect(() => {
        if (!attempt.questions || attempt.questions.length === 0) {
            fetchFullAttempt();
        }
    }, []);

    const fetchFullAttempt = async () => {
        try {
            const data = await apiGetAttemptById(attempt._id || attempt.attemptId); // Handle different ID fields
            if (data) {
                setFullAttempt(data);
            }
        } catch (error) {
            console.error('Error fetching attempt details:', error);
        } finally {
            setLoading(false);
        }
    };

    const { questions, answers } = fullAttempt;

    // Create a map of answers for easy lookup
    const answerMap = {};
    if (answers) {
        answers.forEach(a => {
            answerMap[a.questionId] = a.choiceId;
        });
    }

    const renderQuestion = (question, index) => {
        const userChoiceId = answerMap[question.questionId || question._id];
        const correctChoiceId = question.correctChoiceId;

        // Determine if user was correct
        const isCorrect = String(userChoiceId) === String(correctChoiceId);
        const isSkipped = !userChoiceId;

        return (
            <View key={question._id || index} style={styles.questionCard}>
                <View style={styles.headerRow}>
                    <Text style={styles.questionNumber}>Q{index + 1}</Text>
                    <View style={[styles.statusBadge,
                    isSkipped ? styles.statusSkipped :
                        isCorrect ? styles.statusCorrect : styles.statusWrong
                    ]}>
                        <Text style={[styles.statusText,
                        isSkipped ? styles.textSkipped :
                            isCorrect ? styles.textCorrect : styles.textWrong
                        ]}>
                            {isSkipped ? 'SKIPPED' : isCorrect ? 'CORRECT' : 'INCORRECT'}
                        </Text>
                    </View>
                </View>

                <Text style={styles.questionText}>{question.text}</Text>

                <View style={styles.optionsContainer}>
                    {question.choices.map((choice) => {
                        const isSelected = String(userChoiceId) === String(choice.id);
                        const isRightAnswer = String(correctChoiceId) === String(choice.id);

                        let optionStyle = styles.option;
                        let iconName = "ellipse-outline";
                        let iconColor = "#ccc";

                        if (isSelected) {
                            optionStyle = [styles.option, isCorrect ? styles.optionCorrect : styles.optionWrong];
                            iconName = isCorrect ? "checkmark-circle" : "close-circle";
                            iconColor = isCorrect ? "#4CAF50" : "#F44336";
                        } else if (isRightAnswer && !isCorrect) {
                            // Highlight correct answer if user got it wrong
                            optionStyle = [styles.option, styles.optionCorrectLight];
                            iconName = "checkmark-circle-outline";
                            iconColor = "#4CAF50";
                        }

                        return (
                            <View key={choice.id} style={optionStyle}>
                                <Ionicons name={iconName} size={20} color={iconColor} style={{ marginRight: 10 }} />
                                <Text style={[styles.optionText, isSelected && { fontWeight: 'bold' }]}>
                                    {choice.text}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Explanation placeholder if available in future */}
                {question.explanation && (
                    <View style={styles.explanationBox}>
                        <Text style={styles.explanationTitle}>Explanation:</Text>
                        <Text style={styles.explanationText}>{question.explanation}</Text>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading solutions...</Text>
            </View>
        );
    }

    if (!questions || questions.length === 0) {
        return (
            <View style={[styles.container, styles.center]}>
                <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
                <Text style={{ marginTop: 10, color: '#999' }}>No questions found for this attempt.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Text style={{ color: '#2196F3' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Solutions</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {questions.map(renderQuestion)}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    center: { justifyContent: 'center', alignItems: 'center' },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', elevation: 2 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    scrollContent: { padding: 16 },

    questionCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    questionNumber: { fontSize: 14, fontWeight: 'bold', color: '#999' },

    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusCorrect: { backgroundColor: '#E8F5E9' },
    statusWrong: { backgroundColor: '#FFEBEE' },
    statusSkipped: { backgroundColor: '#F5F5F5' },

    statusText: { fontSize: 10, fontWeight: 'bold' },
    textCorrect: { color: '#4CAF50' },
    textWrong: { color: '#F44336' },
    textSkipped: { color: '#9E9E9E' },

    questionText: { fontSize: 16, color: '#333', fontWeight: '600', marginBottom: 16, lineHeight: 22 },

    optionsContainer: { gap: 8 },
    option: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#EEE', backgroundColor: '#FAFAFA' },

    optionCorrect: { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' },
    optionCorrectLight: { borderColor: '#A5D6A7', backgroundColor: '#F1F8E9', borderStyle: 'dashed' },
    optionWrong: { borderColor: '#F44336', backgroundColor: '#FFEBEE' },

    optionText: { fontSize: 14, color: '#555', flex: 1 },

    explanationBox: { marginTop: 16, padding: 12, backgroundColor: '#E3F2FD', borderRadius: 8 },
    explanationTitle: { fontSize: 12, fontWeight: 'bold', color: '#1976D2', marginBottom: 4 },
    explanationText: { fontSize: 13, color: '#0D47A1' },
});
