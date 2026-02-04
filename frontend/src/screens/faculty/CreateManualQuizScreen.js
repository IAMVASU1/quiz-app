import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Button, TouchableOpacity, Alert, Switch } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { apiCreateQuestion } from '../../api/questions.api';
import { apiCreateQuiz } from '../../api/quizzes.api';

export default function CreateManualQuizScreen({ navigation }) {
    const { control, handleSubmit, formState: { errors } } = useForm();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Question Form State
    const [qText, setQText] = useState('');
    const [choices, setChoices] = useState([
        { text: '', id: '1' },
        { text: '', id: '2' },
        { text: '', id: '3' },
        { text: '', id: '4' }
    ]);
    const [correctId, setCorrectId] = useState('1');

    const addChoice = () => {
        const newId = String(choices.length + 1);
        setChoices([...choices, { text: '', id: newId }]);
    };

    const removeChoice = (index) => {
        if (choices.length <= 2) {
            Alert.alert('Info', 'Minimum 2 choices required');
            return;
        }
        const newChoices = choices.filter((_, i) => i !== index);
        setChoices(newChoices);
        // If we removed the selected correct answer, reset to first
        // This is a simple heuristic. Ideally we track IDs better but for now this is safe.
        if (choices[index].id === correctId) {
            setCorrectId(newChoices[0].id);
        }
    };

    const updateChoice = (text, index) => {
        const newChoices = [...choices];
        newChoices[index].text = text;
        setChoices(newChoices);
    };

    const handleAddQuestion = async () => {
        if (!qText || choices.some(c => !c.text)) {
            Alert.alert('Error', 'Please fill question text and all choices');
            return;
        }

        try {
            setLoading(true);
            const questionData = {
                text: qText,
                choices: choices.map(c => ({ text: c.text })),
                correctChoiceId: String(parseInt(correctId) - 1), // Backend expects 0-based index usually, or check backend logic. 
                // Wait, backend model uses 'id' in choices. Let's assume simple index for now or check backend.
                // Backend Question model: choices: [{ id: String, text: String }]
                // Backend create: correctChoiceId matches one of the choice IDs.
                // Let's send choices with explicit IDs.
            };

            // Actually, let's refine this. The backend `create` controller expects `choices` array and `correctChoiceId`.
            // Let's send choices as is, but ensure IDs are consistent.
            const formattedChoices = choices.map((c, idx) => ({ id: String(idx + 1), text: c.text }));

            const payload = {
                text: qText,
                choices: formattedChoices,
                correctChoiceId: correctId,
                difficulty: 'medium', // Default
                type: 'multiple-choice'
            };

            const newQ = await apiCreateQuestion(payload);
            setQuestions([...questions, newQ]);

            // Reset Form
            setQText('');
            setChoices([
                { text: '', id: '1' },
                { text: '', id: '2' },
                { text: '', id: '3' },
                { text: '', id: '4' }
            ]);
            setCorrectId('1');
            Alert.alert('Success', 'Question added!');
        } catch (error) {
            Alert.alert('Error', 'Failed to add question');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        if (questions.length === 0) {
            Alert.alert('Error', 'Please add at least one question');
            return;
        }

        try {
            setLoading(true);
            const quizData = {
                title: data.title,
                description: data.description,
                type: 'custom',
                questionIds: questions.map(q => q._id),
                settings: {
                    shuffleQuestions: data.shuffle || false
                }
            };

            await apiCreateQuiz(quizData);
            Alert.alert('Success', 'Quiz created successfully!', [
                { text: 'OK', onPress: () => navigation.popToTop() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to create quiz');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.sectionTitle}>Quiz Details</Text>

            <Text style={styles.label}>Title</Text>
            <Controller
                control={control}
                name="title"
                rules={{ required: 'Title is required' }}
                render={({ field: { onChange, value } }) => (
                    <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder="Quiz Title" />
                )}
            />
            {errors.title && <Text style={styles.error}>{errors.title.message}</Text>}

            <Text style={styles.label}>Description</Text>
            <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                    <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder="Description" multiline />
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

            <Text style={styles.sectionTitle}>Add Questions ({questions.length} added)</Text>

            <TextInput
                style={[styles.input, { height: 60 }]}
                value={qText}
                onChangeText={setQText}
                placeholder="Question Text"
                multiline
            />

            {choices.map((choice, index) => (
                <View key={index} style={styles.choiceRow}>
                    <TouchableOpacity
                        style={[styles.radio, correctId === choice.id && styles.radioSelected]}
                        onPress={() => setCorrectId(choice.id)}
                    />
                    <TextInput
                        style={styles.choiceInput}
                        value={choice.text}
                        onChangeText={(text) => updateChoice(text, index)}
                        placeholder={`Option ${index + 1}`}
                    />
                    {choices.length > 2 && (
                        <TouchableOpacity onPress={() => removeChoice(index)} style={{ marginLeft: 10 }}>
                            <Ionicons name="trash-outline" size={20} color="#d9534f" />
                        </TouchableOpacity>
                    )}
                </View>
            ))}

            <Button title="+ Add Option" onPress={addChoice} />

            <View style={{ marginTop: 10 }}>
                <Button title="Add Question to Quiz" onPress={handleAddQuestion} color="#4CAF50" disabled={loading} />
            </View>

            <View style={styles.divider} />

            <Button title="Save Quiz" onPress={handleSubmit(onSubmit)} color="#2196F3" disabled={loading} />
            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 10 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 15, fontSize: 16 },
    error: { color: 'red', marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
    choiceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', marginRight: 10 },
    radioSelected: { borderColor: '#4CAF50', backgroundColor: '#4CAF50' },
    choiceInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 },
});
