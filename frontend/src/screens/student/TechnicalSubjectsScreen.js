import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiGetSubjects } from '../../api/questions.api';
import { apiStartPractice } from '../../api/attempts.api';

export default function TechnicalSubjectsScreen({ navigation }) {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [questionCount, setQuestionCount] = useState('10');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        try {
            const data = await apiGetSubjects();
            setSubjects(data || []);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load subjects');
        } finally {
            setLoading(false);
        }
    };

    const toggleSubject = (subject) => {
        if (selectedSubjects.includes(subject)) {
            setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
        } else {
            setSelectedSubjects([...selectedSubjects, subject]);
        }
    };

    const handleCreateQuiz = async () => {
        if (selectedSubjects.length === 0) {
            Alert.alert('Select Subject', 'Please select at least one subject');
            return;
        }

        const count = parseInt(questionCount);
        if (isNaN(count) || count < 1 || count > 50) {
            Alert.alert('Invalid Count', 'Please enter a number between 1 and 50');
            return;
        }

        setCreating(true);
        try {
            const attemptData = await apiStartPractice({
                subjects: selectedSubjects,
                limit: count
            });
            navigation.replace('QuizPlay', {
                attemptId: attemptData.attemptId,
                questions: attemptData.questions,
                settings: attemptData.quizSettings,
                quizTitle: attemptData.quizTitle
            });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to create quiz');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.headerTitle}>Select Subjects 🛠️</Text>
                <Text style={styles.subTitle}>Choose topics to practice</Text>

                <View style={styles.grid}>
                    {subjects.map((subject) => {
                        const isSelected = selectedSubjects.includes(subject);
                        return (
                            <TouchableOpacity
                                key={subject}
                                style={[styles.subjectCard, isSelected && styles.selectedCard]}
                                onPress={() => toggleSubject(subject)}
                            >
                                <Text style={[styles.subjectText, isSelected && styles.selectedText]}>
                                    {subject}
                                </Text>
                                {isSelected && (
                                    <View style={styles.checkIcon}>
                                        <Ionicons name="checkmark-circle" size={20} color="#2196F3" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {subjects.length === 0 && (
                    <Text style={styles.emptyText}>No subjects available yet.</Text>
                )}

                <View style={styles.configSection}>
                    <Text style={styles.configTitle}>Number of Questions</Text>
                    <View style={styles.counterContainer}>
                        <TouchableOpacity
                            style={styles.counterBtn}
                            onPress={() => setQuestionCount(String(Math.max(5, parseInt(questionCount || 0) - 5)))}
                        >
                            <Ionicons name="remove" size={24} color="#333" />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.countInput}
                            value={questionCount}
                            onChangeText={setQuestionCount}
                            keyboardType="number-pad"
                            maxLength={2}
                        />
                        <TouchableOpacity
                            style={styles.counterBtn}
                            onPress={() => setQuestionCount(String(Math.min(50, parseInt(questionCount || 0) + 5)))}
                        >
                            <Ionicons name="add" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.createBtn, creating && styles.disabledBtn]}
                    onPress={handleCreateQuiz}
                    disabled={creating}
                >
                    {creating ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text style={styles.createBtnText}>Start Quiz</Text>
                            <Ionicons name="arrow-forward" size={20} color="white" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20, paddingBottom: 100 },

    headerTitle: { fontSize: 24, fontWeight: '800', color: '#2D3436', marginBottom: 5 },
    subTitle: { fontSize: 14, color: '#636E72', marginBottom: 25 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    subjectCard: {
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 8
    },
    selectedCard: { backgroundColor: '#E3F2FD', borderColor: '#2196F3' },
    subjectText: { fontSize: 14, fontWeight: '600', color: '#333' },
    selectedText: { color: '#2196F3' },
    checkIcon: { position: 'absolute', top: -8, right: -8, backgroundColor: 'white', borderRadius: 10 },

    emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },

    configSection: { marginTop: 40, backgroundColor: 'white', padding: 20, borderRadius: 16, elevation: 2 },
    configTitle: { fontSize: 16, fontWeight: '700', color: '#2D3436', marginBottom: 15 },
    counterContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
    counterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
    countInput: { fontSize: 24, fontWeight: 'bold', color: '#2196F3', textAlign: 'center', minWidth: 50 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    createBtn: { backgroundColor: '#2196F3', height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 4, shadowColor: '#2196F3', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    disabledBtn: { backgroundColor: '#B0BEC5' },
    createBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
