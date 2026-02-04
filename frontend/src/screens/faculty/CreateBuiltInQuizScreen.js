import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { apiCreateQuiz } from '../../api/quizzes.api';
import client from '../../api/client';

const CATEGORIES = ['aptitude', 'technical'];

export default function CreateBuiltInQuizScreen({ navigation }) {
    const { control, handleSubmit, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [fetchingSubjects, setFetchingSubjects] = useState(false);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [category, setCategory] = useState('technical');

    useEffect(() => {
        if (category === 'technical') {
            fetchSubjects();
        }
    }, [category]);

    const fetchSubjects = async () => {
        try {
            setFetchingSubjects(true);
            const res = await client.get('/questions/subjects');
            if (res.data && res.data.data) {
                setSubjects(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch subjects', error);
        } finally {
            setFetchingSubjects(false);
        }
    };

    const toggleSubject = (sub) => {
        if (selectedSubjects.includes(sub)) {
            setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
        } else {
            setSelectedSubjects([...selectedSubjects, sub]);
        }
    };

    const onSubmit = async (data) => {
        if (category === 'technical' && selectedSubjects.length === 0) {
            Alert.alert('Error', 'Please select at least one subject for Technical quiz');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                title: data.title,
                type: 'built-in',
                questionsCount: parseInt(data.questionsCount),
                builtInFilter: JSON.stringify({
                    category,
                    subjects: category === 'technical' ? selectedSubjects : [],
                    difficulty: data.difficulty || null
                })
            };

            await apiCreateQuiz(payload);
            Alert.alert('Success', 'Built-in Quiz Generated!', [
                { text: 'OK', onPress: () => navigation.popToTop() }
            ]);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to generate quiz');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.sectionTitle}>Generate Built-in Quiz</Text>

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

            <Text style={styles.label}>Category</Text>
            <View style={styles.row}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.pill, category === cat && styles.pillSelected]}
                        onPress={() => setCategory(cat)}
                    >
                        <Text style={[styles.pillText, category === cat && styles.pillTextSelected]}>
                            {cat.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {category === 'technical' && (
                <>
                    <Text style={styles.label}>Subjects</Text>
                    {fetchingSubjects ? (
                        <ActivityIndicator size="small" color="#FF9800" />
                    ) : (
                        <View style={styles.rowWrap}>
                            {subjects.length > 0 ? subjects.map(sub => (
                                <TouchableOpacity
                                    key={sub}
                                    style={[styles.pill, selectedSubjects.includes(sub) && styles.pillSelected]}
                                    onPress={() => toggleSubject(sub)}
                                >
                                    <Text style={[styles.pillText, selectedSubjects.includes(sub) && styles.pillTextSelected]}>
                                        {sub}
                                    </Text>
                                </TouchableOpacity>
                            )) : <Text style={{ color: '#666' }}>No subjects found in pool.</Text>}
                        </View>
                    )}
                </>
            )}

            <Text style={styles.label}>Questions Count</Text>
            <Controller
                control={control}
                name="questionsCount"
                rules={{ required: 'Count is required' }}
                render={({ field: { onChange, value } }) => (
                    <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder="e.g. 20" keyboardType="numeric" />
                )}
            />

            <View style={styles.spacer} />
            <Button title="Generate Quiz" onPress={handleSubmit(onSubmit)} color="#FF9800" disabled={loading} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#333', marginTop: 10 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 5, fontSize: 16 },
    error: { color: 'red', marginBottom: 10 },
    row: { flexDirection: 'row', marginBottom: 10 },
    rowWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
    pill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eee', marginRight: 10, marginBottom: 10 },
    pillSelected: { backgroundColor: '#FF9800' },
    pillText: { color: '#333', fontWeight: '600' },
    pillTextSelected: { color: 'white' },
    spacer: { height: 30 },
});
