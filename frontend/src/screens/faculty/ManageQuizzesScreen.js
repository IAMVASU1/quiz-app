import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiListQuizzes, apiDeleteQuiz, apiUpdateQuiz } from '../../api/quizzes.api';
import { apiGetAttemptsByQuiz } from '../../api/attempts.api';

export default function ManageQuizzesScreen({ navigation }) {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadQuizzes = async () => {
        try {
            const data = await apiListQuizzes({ limit: 100 }); // Fetch more for management
            if (data && data.items) {
                setQuizzes(data.items);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch quizzes');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadQuizzes();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadQuizzes();
    };

    const handleChangeStatus = (quiz) => {
        Alert.alert(
            'Change Status',
            `Current Status: ${quiz.status.toUpperCase()}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Set to LIVE',
                    onPress: () => updateStatus(quiz._id, 'published')
                },
                {
                    text: 'Set to PAUSED',
                    onPress: () => updateStatus(quiz._id, 'paused')
                },
                {
                    text: 'Set to DRAFT',
                    onPress: () => updateStatus(quiz._id, 'draft')
                }
            ]
        );
    };

    const updateStatus = async (id, status) => {
        try {
            await apiUpdateQuiz(id, { status });
            // Optimistic update
            setQuizzes(quizzes.map(q => q._id === id ? { ...q, status } : q));
            Alert.alert('Success', `Quiz status updated to ${status.toUpperCase()}`);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update status');
            loadQuizzes(); // Revert on error
        }
    };

    const handleDelete = (quiz) => {
        Alert.alert(
            'Delete Quiz',
            `Are you sure you want to permanently delete "${quiz.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiDeleteQuiz(quiz._id);
                            setQuizzes(quizzes.filter(q => q._id !== quiz._id));
                            Alert.alert('Success', 'Quiz deleted');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete quiz');
                        }
                    },
                },
            ]
        );
    };

    const copyCode = async (code) => {
        await Clipboard.setStringAsync(code);
        Alert.alert('Copied', `Quiz Code ${code} copied to clipboard`);
    };

    const handleDownloadReport = async (quiz) => {
        try {
            Alert.alert('Generating Report', 'Please wait...');
            const attempts = await apiGetAttemptsByQuiz(quiz._id);

            if (!attempts || attempts.length === 0) {
                Alert.alert('Info', 'No attempts found for this quiz.');
                return;
            }

            // Prepare Data for Excel
            const data = attempts.map(attempt => {
                const dateObj = new Date(attempt.finishedAt || attempt.createdAt);
                return {
                    "Email": attempt.userId?.email || 'Unknown',
                    "Name": attempt.userId?.name || 'Unknown',
                    "Marks": attempt.score,
                    "Max Marks": attempt.maxScore,
                    "Date": dateObj.toLocaleDateString('en-GB'),
                    "Time": dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
                };
            });

            // Create Workbook
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Report");

            // Generate Excel File (Base64)
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

            // Save to file
            const fileName = `Report_${quiz.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
            const fileUri = FileSystem.documentDirectory + fileName;

            await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType ? FileSystem.EncodingType.Base64 : 'base64' });

            // Share
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to generate report');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.title}>{item.title}</Text>
                <TouchableOpacity
                    onPress={() => handleChangeStatus(item)}
                    style={[styles.badge, { backgroundColor: item.status === 'published' ? '#4CAF50' : item.status === 'paused' ? '#FF9800' : '#999' }]}
                >
                    <Text style={styles.badgeText}>{item.status === 'published' ? 'LIVE' : item.status.toUpperCase()}</Text>
                    <Ionicons name="chevron-down" size={12} color="white" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
            </View>

            <Text style={styles.desc} numberOfLines={2}>{item.description || 'No description'}</Text>

            <View style={styles.dateRow}>
                <Text style={styles.dateText}>Created: {new Date(item.createdAt).toLocaleDateString()}</Text>
                {item.updatedAt !== item.createdAt && (
                    <Text style={styles.dateText}> | Edited: {new Date(item.updatedAt).toLocaleDateString()}</Text>
                )}
            </View>

            <View style={styles.metaRow}>
                <TouchableOpacity onPress={() => copyCode(item.quizCode)} style={styles.codeBtn}>
                    <Text style={styles.codeText}>Code: {item.quizCode}</Text>
                    <Ionicons name="copy-outline" size={14} color="#2196F3" style={{ marginLeft: 5 }} />
                </TouchableOpacity>
                <Text style={styles.type}>{item.type}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('EditQuiz', { quizId: item._id })}>
                    <Ionicons name="create-outline" size={20} color="#2196F3" />
                    <Text style={[styles.actionText, { color: '#2196F3' }]}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDownloadReport(item)}>
                    <Ionicons name="download-outline" size={20} color="#4CAF50" />
                    <Text style={[styles.actionText, { color: '#4CAF50' }]}>Report</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                    <Ionicons name="trash-outline" size={20} color="#d9534f" />
                    <Text style={[styles.actionText, { color: '#d9534f' }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={quizzes}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ padding: 15 }}
                ListEmptyComponent={<Text style={styles.empty}>No quizzes found.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    card: { backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 15, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    title: { fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 10 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    desc: { color: '#666', marginBottom: 5 },
    dateRow: { flexDirection: 'row', marginBottom: 10 },
    dateText: { fontSize: 11, color: '#999' },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    codeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3f2fd', padding: 5, borderRadius: 5 },
    codeText: { color: '#2196F3', fontWeight: '600', fontSize: 12 },
    type: { color: '#999', fontSize: 12, textTransform: 'uppercase' },
    divider: { height: 1, backgroundColor: '#eee', marginBottom: 10 },
    actions: { flexDirection: 'row', justifyContent: 'flex-end' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', marginLeft: 20 },
    actionText: { marginLeft: 5, fontWeight: '600' },
    empty: { textAlign: 'center', marginTop: 50, color: '#888' },
});
