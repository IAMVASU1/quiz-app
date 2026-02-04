import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CreateQuizChoiceScreen({ navigation }) {
    const renderOption = (title, description, icon, screen, color) => (
        <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigation.navigate(screen)}
        >
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
                <Ionicons name={icon} size={30} color="white" />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.optionTitle}>{title}</Text>
                <Text style={styles.optionDesc}>{description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Create New Quiz</Text>
            <Text style={styles.subHeader}>Choose how you want to create your quiz</Text>

            {renderOption(
                'Manual Creation',
                'Add questions one by one manually.',
                'create-outline',
                'CreateManualQuiz',
                '#4CAF50'
            )}

            {renderOption(
                'Excel Upload',
                'Upload a spreadsheet with questions.',
                'document-text-outline',
                'CreateExcelQuiz',
                '#2196F3'
            )}

            {renderOption(
                'Built-in Quiz',
                'Auto-generate from question bank.',
                'flash-outline',
                'CreateBuiltInQuiz',
                '#FF9800'
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, color: '#333' },
    subHeader: { fontSize: 16, color: '#666', marginBottom: 30 },
    optionCard: { flexDirection: 'row', backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 15, alignItems: 'center', elevation: 2 },
    iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    textContainer: { flex: 1 },
    optionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    optionDesc: { fontSize: 14, color: '#666', marginTop: 2 },
});
