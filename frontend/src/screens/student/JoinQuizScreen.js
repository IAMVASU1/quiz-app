import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiGetQuizByCode } from '../../api/quizzes.api'; // Need to verify this exists
import { apiStartAttempt } from '../../api/attempts.api'; // Need to create/verify this

export default function JoinQuizScreen({ route, navigation }) {
    const { quizCode: initialCode } = route.params || {};
    const [code, setCode] = useState(initialCode || '');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (!code.trim()) {
            Alert.alert('Required', 'Please enter a quiz code');
            return;
        }

        setLoading(true);
        try {
            // 1. Verify Quiz Exists & Get Details (for Title)
            const quizData = await apiGetQuizByCode(code.trim());

            if (!quizData) {
                Alert.alert('Error', 'Quiz not found. Please check the code.');
                setLoading(false);
                return;
            }

            // 2. Start Attempt
            const attemptData = await apiStartAttempt({ quizCode: code.trim() });

            if (attemptData) {
                navigation.replace('QuizPlay', {
                    attemptId: attemptData.attemptId,
                    questions: attemptData.questions,
                    settings: attemptData.quizSettings,
                    quizTitle: quizData.title,
                    quizId: quizData._id || quizData.id
                });
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to join quiz';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Join Quiz</Text>
                <Text style={styles.subtitle}>Enter the unique code to start</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Enter Code (e.g. QZ-1234)"
                    value={code}
                    onChangeText={setCode}
                    autoCapitalize="characters"
                    editable={!loading}
                />

                <TouchableOpacity
                    style={styles.joinBtn}
                    onPress={handleJoin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text style={styles.joinBtnText}>JOIN QUIZ</Text>
                            <Ionicons name="arrow-forward" size={20} color="white" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 20, backgroundColor: '#F5F7FA', justifyContent: 'center' },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 25, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#2D3436', textAlign: 'center', marginBottom: 5 },
    subtitle: { fontSize: 14, color: '#636E72', textAlign: 'center', marginBottom: 25 },

    input: {
        backgroundColor: '#F5F7FA',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        fontSize: 18,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 20,
        textAlign: 'center',
        letterSpacing: 1,
        fontWeight: 'bold'
    },

    joinBtn: {
        backgroundColor: '#2196F3',
        borderRadius: 15,
        height: 55,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        elevation: 3,
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    joinBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 }
});
