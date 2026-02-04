import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Button, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { apiGetQuestionById, apiUpdateQuestion, apiCreateQuestion } from '../../api/questions.api';
import { apiGetQuizById, apiUpdateQuiz } from '../../api/quizzes.api';

export default function EditQuestionScreen({ navigation, route }) {
    const { questionId, quizId } = route.params;
    const { control, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: {
            text: '',
            choices: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
            correctChoiceIndex: 0
        }
    });
    const { fields, append, remove } = useFieldArray({ control, name: 'choices' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updateGlobal, setUpdateGlobal] = useState(false); // Default to local edit (clone)

    const correctChoiceIndex = watch('correctChoiceIndex');

    useEffect(() => {
        loadQuestion();
    }, []);

    const loadQuestion = async () => {
        try {
            const data = await apiGetQuestionById(questionId);
            // Map choices to array
            const loadedChoices = data.choices.map(c => ({ text: c.text, id: c.id }));
            // Find index of correct choice
            const correctIndex = loadedChoices.findIndex(c => String(c.id) === String(data.correctChoiceId));

            reset({
                text: data.text,
                choices: loadedChoices,
                correctChoiceIndex: correctIndex >= 0 ? correctIndex : 0
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to load question');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            setSaving(true);

            const choices = data.choices.map((c, i) => ({
                id: String(i + 1),
                text: c.text
            }));

            const payload = {
                text: data.text,
                choices: choices,
                correctChoiceId: String(data.correctChoiceIndex + 1)
            };

            if (updateGlobal) {
                // Update the existing question globally
                await apiUpdateQuestion(questionId, payload);
                Alert.alert('Success', 'Question updated in Question Bank', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                // Local Edit: Create new question and swap it in the quiz
                if (!quizId) {
                    Alert.alert('Error', 'Quiz ID missing. Cannot perform local edit.');
                    return;
                }

                // 1. Create new question
                // We might want to copy other fields like subject/difficulty if they exist in the original question
                // For now, we just send the payload. The backend might require subject/difficulty/type.
                // Let's fetch the original question again to get those fields or assume backend handles defaults.
                // Better: Fetch original question data to copy metadata.
                const originalQuestion = await apiGetQuestionById(questionId);

                const newQuestionPayload = {
                    ...payload,
                    subject: originalQuestion.subject || 'General', // Fallback
                    difficulty: originalQuestion.difficulty || 'Medium',
                    type: originalQuestion.type || 'MCQ'
                };

                const newQuestion = await apiCreateQuestion(newQuestionPayload);

                // 2. Fetch current quiz
                const currentQuiz = await apiGetQuizById(quizId);

                // 3. Swap IDs
                const updatedQuestionIds = currentQuiz.questionIds.map(q =>
                    q._id === questionId ? newQuestion._id : q._id
                );

                // 4. Update Quiz
                await apiUpdateQuiz(quizId, {
                    ...currentQuiz, // Be careful not to overwrite other fields if apiUpdateQuiz expects partial or full
                    // Usually apiUpdateQuiz expects the fields to update.
                    // Let's send just what we need + required fields.
                    // Based on EditQuizScreen, we send title, description, settings, questionIds.
                    title: currentQuiz.title,
                    description: currentQuiz.description,
                    settings: currentQuiz.settings,
                    questionIds: updatedQuestionIds
                });

                Alert.alert('Success', 'Question updated for this quiz only.', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update question');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Update in Question Bank also?</Text>
                <Switch value={updateGlobal} onValueChange={setUpdateGlobal} />
            </View>

            {updateGlobal ? (
                <View style={styles.warningBox}>
                    <Ionicons name="warning-outline" size={20} color="#856404" />
                    <Text style={styles.warningText}>
                        Warning: This will update the question in ALL quizzes.
                    </Text>
                </View>
            ) : (
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color="#0c5460" />
                    <Text style={styles.infoText}>
                        This will create a copy of the question for this quiz only. The original question in the bank will remain unchanged.
                    </Text>
                </View>
            )}

            <Text style={styles.label}>Question Text</Text>
            <Controller
                control={control}
                name="text"
                rules={{ required: 'Question text is required' }}
                render={({ field: { onChange, value } }) => (
                    <TextInput style={styles.input} value={value} onChangeText={onChange} multiline />
                )}
            />

            <Text style={styles.label}>Choices</Text>
            {fields.map((field, index) => (
                <View key={field.id} style={styles.choiceRow}>
                    <TouchableOpacity
                        style={[styles.radio, correctChoiceIndex === index && styles.radioSelected]}
                        onPress={() => setValue('correctChoiceIndex', index)}
                    >
                        {correctChoiceIndex === index && <View style={styles.radioInner} />}
                    </TouchableOpacity>

                    <Controller
                        control={control}
                        name={`choices.${index}.text`}
                        rules={{ required: 'Choice text is required' }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={[styles.input, styles.choiceInput]}
                                value={value}
                                onChangeText={onChange}
                                placeholder={`Choice ${index + 1}`}
                            />
                        )}
                    />

                    {fields.length > 2 && (
                        <TouchableOpacity onPress={() => remove(index)} style={{ marginLeft: 10 }}>
                            <Ionicons name="trash-outline" size={20} color="#d9534f" />
                        </TouchableOpacity>
                    )}
                </View>
            ))}

            {fields.length < 6 && (
                <Button title="+ Add Choice" onPress={() => append({ text: '' })} />
            )}

            <Button title="Save Changes" onPress={handleSubmit(onSubmit)} disabled={saving} />
            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, fontSize: 16, backgroundColor: '#fff' },
    choiceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    choiceInput: { flex: 1, marginBottom: 0 },
    radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#2196F3', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
    radioSelected: { borderColor: '#2196F3' },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2196F3' },
    warningBox: { flexDirection: 'row', backgroundColor: '#fff3cd', padding: 10, borderRadius: 5, marginBottom: 15, alignItems: 'center' },
    warningText: { color: '#856404', marginLeft: 10, flex: 1 },
    infoBox: { flexDirection: 'row', backgroundColor: '#d1ecf1', padding: 10, borderRadius: 5, marginBottom: 15, alignItems: 'center' },
    infoText: { color: '#0c5460', marginLeft: 10, flex: 1 },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, padding: 10, backgroundColor: '#f8f9fa', borderRadius: 8 },
    switchLabel: { fontSize: 16, fontWeight: '600' },
});
