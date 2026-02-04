import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { apiBulkUploadQuestions } from '../../api/questions.api';

export default function BulkUploadScreen({ navigation }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            setFile(asset);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to pick file');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            Alert.alert('Error', 'Please select a file first');
            return;
        }

        setUploading(true);
        try {
            console.log('File to upload:', file);
            // Pass file object directly for FileSystem.uploadAsync
            const response = await apiBulkUploadQuestions(file);
            Alert.alert('Success', response.message, [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            const msg = error.message || 'Upload failed';
            const errors = error.errors ? '\n' + error.errors.join('\n') : '';
            Alert.alert('Upload Failed', msg + errors);
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#2D3436" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Bulk Upload Questions</Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.instructionsCard}>
                        <Text style={styles.cardTitle}>Instructions</Text>
                        <Text style={styles.instructionText}>
                            1. Upload an Excel file (.xlsx)
                        </Text>
                        <Text style={styles.instructionText}>
                            2. Mandatory Fields (Columns):
                        </Text>
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
                        <Text style={[styles.instructionText, { marginTop: 10, fontStyle: 'italic', color: '#d9534f' }]}>
                            * These are mandatory fields in excel.
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
                        {file ? (
                            <>
                                <Ionicons name="document-text" size={48} color="#4CAF50" />
                                <Text style={styles.fileName}>{file.name}</Text>
                                <Text style={styles.changeText}>Tap to change file</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="cloud-upload-outline" size={48} color="#2196F3" />
                                <Text style={styles.uploadText}>Select Excel File</Text>
                                <Text style={styles.subText}>.xlsx or .xls</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.submitBtn, (!file || uploading) && styles.disabledBtn]}
                        onPress={handleUpload}
                        disabled={!file || uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text style={styles.submitBtnText}>Upload Questions</Text>
                                <Ionicons name="cloud-upload" size={20} color="white" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'white', elevation: 2 },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3436' },
    content: { padding: 20, flex: 1 },
    instructionsCard: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 2 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3436', marginBottom: 10 },
    instructionText: { fontSize: 14, color: '#636E72', marginBottom: 5, lineHeight: 20 },
    columnList: { marginTop: 5, marginLeft: 10 },
    columnItem: { fontSize: 13, color: '#2D3436', marginBottom: 2, fontWeight: '500' },
    uploadBox: {
        borderWidth: 2,
        borderColor: '#2196F3',
        borderStyle: 'dashed',
        borderRadius: 20,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        marginBottom: 30
    },
    uploadText: { fontSize: 18, fontWeight: '600', color: '#2196F3', marginTop: 10 },
    subText: { fontSize: 13, color: '#636E72', marginTop: 5 },
    fileName: { fontSize: 16, fontWeight: '600', color: '#2D3436', marginTop: 10, textAlign: 'center', paddingHorizontal: 20 },
    changeText: { fontSize: 13, color: '#2196F3', marginTop: 5 },
    submitBtn: {
        backgroundColor: '#2196F3',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 10,
        elevation: 3
    },
    disabledBtn: { backgroundColor: '#B0BEC5', elevation: 0 },
    submitBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
