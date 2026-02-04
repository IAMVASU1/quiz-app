import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import * as DocumentPicker from 'expo-document-picker';
import { apiCreateQuiz } from '../../api/quizzes.api';

export default function CreateExcelQuizScreen({ navigation }) {
    const { control, handleSubmit, formState: { errors } } = useForm();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                copyToCacheDirectory: true,
            });

            if (!result.canceled) {
                setFile(result.assets[0]);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick file');
        }
    };

    const onSubmit = async (data) => {
        if (!file) {
            Alert.alert('Error', 'Please select an Excel file');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('description', data.description || '');
            formData.append('type', 'custom'); // Excel upload is a form of custom quiz
            if (data.questionsCount) {
                formData.append('questionsCount', data.questionsCount);
            }

            // Append file
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });

            await apiCreateQuiz(formData);

            Alert.alert('Success', 'Quiz created from Excel!', [
                { text: 'OK', onPress: () => navigation.popToTop() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to upload quiz. Ensure the Excel format is correct.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Upload Excel Quiz</Text>

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

            <Text style={styles.label}>Questions Count (Optional - for random sampling)</Text>
            <Controller
                control={control}
                name="questionsCount"
                render={({ field: { onChange, value } }) => (
                    <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder="e.g. 10" keyboardType="numeric" />
                )}
            />

            <View style={styles.instructionsCard}>
                <Text style={styles.cardTitle}>Excel Format Instructions</Text>
                <Text style={styles.instructionText}>Mandatory Fields (Columns):</Text>
                <Text style={[styles.instructionText, { fontSize: 12, marginBottom: 5, color: '#555' }]}>
                    (Order should be maintained)
                </Text>
                <View style={styles.columnList}>
                    <Text style={styles.columnItem}>Column 1: Question Description</Text>
                    <Text style={styles.columnItem}>Column 2: Option A</Text>
                    <Text style={styles.columnItem}>Column 3: Option B</Text>
                    <Text style={styles.columnItem}>Column 4: Option C</Text>
                    <Text style={styles.columnItem}>Column 5: Option D</Text>
                    <Text style={styles.columnItem}>Column 6: Correct Answer</Text>
                    <Text style={styles.columnItem}>Column 7: Subject</Text>
                </View>
                <Text style={[styles.instructionText, { marginTop: 5, fontStyle: 'italic', color: '#d9534f' }]}>
                    * These are mandatory fields in excel.
                </Text>
            </View>

            <View style={styles.fileContainer}>
                <Button title="Select Excel File (.xlsx)" onPress={pickDocument} />
                {file && (
                    <View style={styles.fileInfo}>
                        <Text style={styles.fileName}>{file.name}</Text>
                        <Text style={styles.fileSize}>{(file.size / 1024).toFixed(2)} KB</Text>
                    </View>
                )}
            </View>

            <View style={styles.spacer} />

            {loading ? (
                <ActivityIndicator size="large" color="#2196F3" />
            ) : (
                <Button title="Upload & Create Quiz" onPress={handleSubmit(onSubmit)} color="#2196F3" disabled={!file} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 15, fontSize: 16 },
    error: { color: 'red', marginBottom: 10 },
    fileContainer: { marginVertical: 20, padding: 15, borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 10, alignItems: 'center' },
    fileInfo: { marginTop: 10, alignItems: 'center' },
    fileName: { fontWeight: 'bold', color: '#333' },
    fileSize: { color: '#666', fontSize: 12 },
    fileSize: { color: '#666', fontSize: 12 },
    spacer: { height: 20 },
    instructionsCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    instructionText: { fontSize: 14, color: '#555', marginBottom: 5 },
    columnList: { marginLeft: 10, marginTop: 5 },
    columnItem: { fontSize: 13, color: '#444', marginBottom: 2 },
});
