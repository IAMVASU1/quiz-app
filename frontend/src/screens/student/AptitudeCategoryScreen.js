import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiStartPractice } from '../../api/attempts.api';

export default function AptitudeCategoryScreen({ navigation }) {
    const [questionCount, setQuestionCount] = useState('10');
    const [creating, setCreating] = useState(false);

    const handleStartQuiz = async () => {
        const count = parseInt(questionCount);
        if (isNaN(count) || count < 1 || count > 50) {
            Alert.alert('Invalid Count', 'Please enter a number between 1 and 50');
            return;
        }

        setCreating(true);
        try {
            // "Aptitude" is the fixed subject for this screen
            // Also include "Apptitude" to handle common typo in uploaded data
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
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Aptitude Practice 🧠</Text>
                    <Text style={styles.subTitle}>Sharpen your logical reasoning skills</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="bulb" size={40} color="#FF9800" />
                    </View>
                    <Text style={styles.cardText}>
                        Practice aptitude questions to improve your problem-solving speed and accuracy.
                    </Text>
                </View>

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
                    <Text style={styles.hintText}>Min: 5, Max: 50</Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.createBtn, creating && styles.disabledBtn]}
                    onPress={handleStartQuiz}
                    disabled={creating}
                >
                    {creating ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text style={styles.createBtnText}>Start Practice</Text>
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
    scrollContent: { padding: 20, paddingBottom: 100 },

    header: { marginBottom: 30 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#2D3436', marginBottom: 5 },
    subTitle: { fontSize: 16, color: '#636E72' },

    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF3E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15
    },
    cardText: {
        fontSize: 16,
        color: '#455A64',
        textAlign: 'center',
        lineHeight: 24
    },

    configSection: { backgroundColor: 'white', padding: 25, borderRadius: 16, elevation: 2 },
    configTitle: { fontSize: 18, fontWeight: '700', color: '#2D3436', marginBottom: 20, textAlign: 'center' },
    counterContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 10 },
    counterBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
    countInput: { fontSize: 28, fontWeight: 'bold', color: '#FF9800', textAlign: 'center', minWidth: 60 },
    hintText: { textAlign: 'center', color: '#999', fontSize: 12 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    createBtn: { backgroundColor: '#FF9800', height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 4, shadowColor: '#FF9800', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    disabledBtn: { backgroundColor: '#FFCC80' },
    createBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
