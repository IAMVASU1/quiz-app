import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Button, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { apiGetQuizById, apiUpdateQuiz, apiDeleteQuiz } from '../../api/quizzes.api';
import { apiGetQuestionById } from '../../api/questions.api';

export default function EditQuizScreen({ navigation, route }) {
    const { quizId } = route.params;
    const { control, handleSubmit, reset, getValues, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);

    // Load quiz data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            // If we have selected questions to add, handle that
            if (route.params?.selectedQuestionIds) {
                handleAddQuestions(route.params.selectedQuestionIds);
            }
            // Otherwise, just reload the quiz data to ensure it's fresh (e.g. after editing a question)
            else if (quizId) {
                loadQuiz();
            }
        }, [quizId, route.params?.selectedQuestionIds])
    );

    const loadQuiz = async () => {
        if (!quizId) return;
        try {
            // Don't set loading=true here to avoid flickering on every focus
            // Only set it on initial mount if needed, or rely on initial state
            const data = await apiGetQuizById(quizId);
            setQuiz(data);
            setQuestions(data.questionIds || []);

            // Only reset form if it's the first load or if we want to sync
            // For now, let's sync to ensure latest data
            reset({
                title: data.title,
                description: data.description,
                shuffle: data.settings?.shuffleQuestions
            });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load quiz details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuestions = async (ids) => {
        try {
            setSaving(true);
            // Fetch all new questions
            const newQuestions = await Promise.all(ids.map(id => apiGetQuestionById(id)));

            // Get current questions from state (or fetch fresh if needed, but state should be ok if we just loaded)
            // To be safe, let's use the current state 'questions'
            let currentQuestions = questions;
            if (currentQuestions.length === 0) {
                try {
                    const freshQuiz = await apiGetQuizById(quizId);
                    if (freshQuiz && freshQuiz.questionIds) {
                        currentQuestions = freshQuiz.questionIds;
                    }
                } catch (err) {
                    console.error("Failed to fetch fresh quiz for merging", err);
                }
            }

            const existingIds = new Set(currentQuestions.map(q => q._id));
            const uniqueNewQuestions = newQuestions.filter(q => !existingIds.has(q._id));

            if (uniqueNewQuestions.length === 0) {
                navigation.setParams({ selectedQuestionIds: undefined });
                setSaving(false);
                return;
            }

            const updatedQuestions = [...currentQuestions, ...uniqueNewQuestions];
            setQuestions(updatedQuestions);

            // Save immediately
            const currentValues = getValues();
            const payload = {
                title: currentValues.title,
                description: currentValues.description,
                questionIds: updatedQuestions.map(q => q._id),
                settings: {
                    shuffleQuestions: currentValues.shuffle
                }
            };

            await apiUpdateQuiz(quizId, payload);

            navigation.setParams({ selectedQuestionIds: undefined });
            Alert.alert('Success', `Added ${uniqueNewQuestions.length} questions.`);
        } catch (e) {
            console.error('Failed to add questions:', e);
            Alert.alert('Error', 'Failed to add questions to quiz');
        } finally {
            setSaving(false);
        }
    };



    const handleRemoveQuestion = (qId) => {
        Alert.alert('Remove Question', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                    setQuestions(questions.filter(q => q._id !== qId));
                }
            }
        ]);
    };

    const handleDeleteQuiz = () => {
        Alert.alert('Delete Quiz', 'Are you sure you want to delete this quiz?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await apiDeleteQuiz(quizId);
                        navigation.navigate('ManageQuizzes');
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete quiz');
                    }
                }
            }
        ]);
    };

    const onSubmit = async (data) => {
        try {
            setSaving(true);
            const payload = {
                title: data.title,
                description: data.description,
                questionIds: questions.map(q => q._id),
                settings: {
                    shuffleQuestions: data.shuffle
                }
            };

            await apiUpdateQuiz(quizId, payload);
            Alert.alert('Success', 'Quiz updated successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to update quiz');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>Title</Text>
            <Controller
                control={control}
                name="title"
                rules={{ required: 'Title is required' }}
                render={({ field: { onChange, value } }) => (
                    <TextInput style={styles.input} value={value} onChangeText={onChange} />
                )}
            />

            <Text style={styles.label}>Description</Text>
            <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                    <TextInput style={styles.input} value={value} onChangeText={onChange} multiline />
                )}
            />

            <View style={styles.row}>
                <Text style={styles.label}>Shuffle Questions</Text>
                <Controller
                    control={control}
                    name="shuffle"
                    render={({ field: { onChange, value } }) => (
                        <Switch value={value} onValueChange={onChange} />
                    )}
                />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
                <Text style={styles.sectionTitle}>Questions ({questions.length})</Text>
                <TouchableOpacity onPress={() => navigation.navigate('QuestionsLibrary', { isSelectionMode: true, quizId: quizId, returnKey: route.key })}>
                    <Text style={{ color: '#2196F3' }}>+ Add Question</Text>
                </TouchableOpacity>
            </View>

            {questions.map((q, index) => (
                <TouchableOpacity key={q._id} style={styles.qRow} onPress={() => navigation.navigate('EditQuestion', { questionId: q._id, quizId: quizId })}>
                    <Text style={styles.qText} numberOfLines={1}>{index + 1}. {q.text}</Text>
                    <TouchableOpacity onPress={() => handleRemoveQuestion(q._id)}>
                        <Ionicons name="trash-outline" size={20} color="#d9534f" />
                    </TouchableOpacity>
                </TouchableOpacity>
            ))}

            <View style={styles.divider} />

            <Button title="Save Changes" onPress={handleSubmit(onSubmit)} color="#2196F3" disabled={saving} />

            <View style={{ marginTop: 15 }}>
                <Button title="Delete Quiz" onPress={handleDeleteQuiz} color="#d9534f" />
            </View>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 15, fontSize: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold' },
    qRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    qText: { flex: 1, marginRight: 10, color: '#333' },
});
