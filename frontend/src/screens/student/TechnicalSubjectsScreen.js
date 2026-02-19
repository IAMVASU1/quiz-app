import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiGetSubjects } from '../../api/questions.api';
import { apiStartPractice } from '../../api/attempts.api';

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 50;
const STEP = 5;
const PRESET_COUNTS = [10, 20, 30, 40];

export default function TechnicalSubjectsScreen({ navigation }) {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [questionCount, setQuestionCount] = useState('10');
    const [subjectSearch, setSubjectSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;

    useEffect(() => {
        loadSubjects();
    }, []);

    const parsedCount = useMemo(() => Number.parseInt(questionCount, 10), [questionCount]);

    const filteredSubjects = useMemo(() => {
        const query = subjectSearch.trim().toLowerCase();
        if (!query) return subjects;
        return subjects.filter((subject) => subject.toLowerCase().includes(query));
    }, [subjects, subjectSearch]);

    const clampCount = (value) => Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, value));

    const updateCount = (value) => {
        if (!Number.isFinite(value)) {
            setQuestionCount(String(MIN_QUESTIONS));
            return;
        }
        setQuestionCount(String(clampCount(value)));
    };

    const loadSubjects = async () => {
        try {
            const data = await apiGetSubjects();
            setSubjects(data || []);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load subjects');
        } finally {
            setLoading(false);
        }
    };

    const toggleSubject = (subject) => {
        if (selectedSubjects.includes(subject)) {
            setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
        } else {
            setSelectedSubjects([...selectedSubjects, subject]);
        }
    };

    const handleCreateQuiz = async () => {
        if (selectedSubjects.length === 0) {
            Alert.alert('Select Subject', 'Please select at least one subject');
            return;
        }

        const count = Number.parseInt(questionCount, 10);
        if (Number.isNaN(count) || count < MIN_QUESTIONS || count > MAX_QUESTIONS) {
            Alert.alert('Invalid Count', `Please enter a number between ${MIN_QUESTIONS} and ${MAX_QUESTIONS}`);
            return;
        }

        setCreating(true);
        try {
            const attemptData = await apiStartPractice({
                subjects: selectedSubjects,
                limit: count
            });
            navigation.replace('QuizPlay', {
                attemptId: attemptData.attemptId,
                questions: attemptData.questions,
                settings: attemptData.quizSettings,
                quizTitle: attemptData.quizTitle || 'Technical Practice'
            });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to create quiz');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1D63D0" />
                <Text style={styles.loadingText}>Loading subjects...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <LinearGradient
                    colors={['#112A4E', '#1A4C86']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    <View style={styles.heroIcon}>
                        <Ionicons name="code-slash-outline" size={18} color="#FFFFFF" />
                    </View>
                    <Text style={styles.heroEyebrow}>TECHNICAL PRACTICE</Text>
                    <Text style={styles.heroTitle}>Technical Mode</Text>
                    <Text style={styles.heroSubtitle}>Build confidence topic by topic and practice with focused sets.</Text>

                    <View style={styles.heroStats}>
                        <View style={styles.heroStatCard}>
                            <Text style={styles.heroStatValue}>{subjects.length}</Text>
                            <Text style={styles.heroStatLabel}>Subjects</Text>
                        </View>
                        <View style={styles.heroStatCard}>
                            <Text style={styles.heroStatValue}>{selectedSubjects.length}</Text>
                            <Text style={styles.heroStatLabel}>Selected</Text>
                        </View>
                        <View style={styles.heroStatCard}>
                            <Text style={styles.heroStatValue}>5-50</Text>
                            <Text style={styles.heroStatLabel}>Questions</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={[styles.card, isDesktop && styles.cardDesktop]}>
                    <Text style={styles.cardTitle}>Choose Subjects</Text>
                    <Text style={styles.cardSubtitle}>Select one or more topics for this practice attempt.</Text>

                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={17} color="#6B7F9E" />
                        <TextInput
                            style={styles.searchInput}
                            value={subjectSearch}
                            onChangeText={setSubjectSearch}
                            placeholder="Search subjects"
                            placeholderTextColor="#7A8CA8"
                        />
                    </View>

                    <View style={styles.subjectsGrid}>
                        {filteredSubjects.map((subject) => {
                            const isSelected = selectedSubjects.includes(subject);
                            return (
                                <TouchableOpacity
                                    key={subject}
                                    style={[styles.subjectChip, isSelected && styles.subjectChipSelected]}
                                    onPress={() => toggleSubject(subject)}
                                >
                                    <Text style={[styles.subjectText, isSelected && styles.subjectTextSelected]}>
                                        {subject}
                                    </Text>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={16} color="#1D63D0" />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {filteredSubjects.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No subjects match this search.</Text>
                        </View>
                    )}
                </View>

                <View style={[styles.card, isDesktop && styles.cardDesktop]}>
                    <Text style={styles.cardTitle}>Question Count</Text>
                    <Text style={styles.cardSubtitle}>Control session length based on your current goal.</Text>

                    <View style={styles.counterShell}>
                        <TouchableOpacity
                            style={styles.counterBtn}
                            onPress={() => updateCount((parsedCount || MIN_QUESTIONS) - STEP)}
                            disabled={creating}
                        >
                            <Ionicons name="remove" size={20} color="#324969" />
                        </TouchableOpacity>

                        <View style={styles.countInputWrap}>
                            <TextInput
                                style={styles.countInput}
                                value={questionCount}
                                onChangeText={(text) => setQuestionCount(text.replace(/[^\d]/g, ''))}
                                keyboardType="number-pad"
                                maxLength={2}
                                editable={!creating}
                                onBlur={() => updateCount(Number.parseInt(questionCount, 10))}
                            />
                            <Text style={styles.countSuffix}>questions</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.counterBtn}
                            onPress={() => updateCount((parsedCount || MIN_QUESTIONS) + STEP)}
                            disabled={creating}
                        >
                            <Ionicons name="add" size={20} color="#324969" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.presetRow}>
                        {PRESET_COUNTS.map((count) => {
                            const isActive = parsedCount === count;
                            return (
                                <TouchableOpacity
                                    key={count}
                                    style={[styles.presetChip, isActive && styles.presetChipActive]}
                                    onPress={() => setQuestionCount(String(count))}
                                    disabled={creating}
                                >
                                    <Text style={[styles.presetText, isActive && styles.presetTextActive]}>{count}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.createBtn, creating && styles.disabledBtn]}
                    onPress={handleCreateQuiz}
                    disabled={creating}
                >
                    {creating ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Text style={styles.createBtnText}>Start Technical Quiz</Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6FB',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F6FB',
    },
    loadingText: {
        marginTop: 10,
        color: '#607492',
        fontWeight: '600',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 116,
    },
    hero: {
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
    },
    heroIcon: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: 10,
    },
    heroEyebrow: {
        color: '#C0D9F6',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '800',
        marginBottom: 5,
    },
    heroSubtitle: {
        color: '#D7E6F9',
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 13,
    },
    heroStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    heroStatCard: {
        minWidth: 94,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    heroStatValue: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 1,
    },
    heroStatLabel: {
        color: '#DCEBFC',
        fontSize: 11,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#DEE6F2',
        shadowColor: '#102145',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
        marginBottom: 12,
    },
    cardDesktop: {
        maxWidth: 760,
        width: '100%',
        alignSelf: 'center',
    },
    cardTitle: {
        fontSize: 18,
        color: '#1A2D4A',
        fontWeight: '800',
        marginBottom: 3,
    },
    cardSubtitle: {
        color: '#617390',
        fontSize: 13,
        marginBottom: 12,
    },
    searchBar: {
        height: 44,
        borderWidth: 1,
        borderColor: '#D8E2F0',
        borderRadius: 11,
        backgroundColor: '#F8FAFE',
        paddingHorizontal: 11,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        color: '#1B2D4A',
        fontSize: 14,
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
    },
    subjectsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
    },
    subjectChip: {
        borderWidth: 1,
        borderColor: '#D8E2F0',
        backgroundColor: '#F8FAFE',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginHorizontal: 4,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    subjectChipSelected: {
        borderColor: '#BCD3F6',
        backgroundColor: '#EAF2FF',
    },
    subjectText: {
        color: '#30496E',
        fontSize: 13,
        fontWeight: '700',
    },
    subjectTextSelected: {
        color: '#1D63D0',
        marginRight: 6,
    },
    emptyState: {
        borderWidth: 1,
        borderColor: '#DFE7F3',
        borderStyle: 'dashed',
        borderRadius: 10,
        paddingVertical: 16,
        marginTop: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: '#7385A2',
        fontSize: 13,
    },
    counterShell: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DEE6F2',
        backgroundColor: '#F8FAFE',
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    counterBtn: {
        width: 38,
        height: 38,
        borderRadius: 9,
        backgroundColor: '#E9F0FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countInputWrap: {
        flex: 1,
        alignItems: 'center',
    },
    countInput: {
        fontSize: 30,
        color: '#1852AB',
        fontWeight: '800',
        textAlign: 'center',
        minWidth: 74,
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
    },
    countSuffix: {
        marginTop: -2,
        fontSize: 11,
        color: '#6C7F9D',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    presetRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    presetChip: {
        borderWidth: 1,
        borderColor: '#D8E2F0',
        backgroundColor: '#EEF3FA',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    presetChipActive: {
        backgroundColor: '#1D63D0',
        borderColor: '#1D63D0',
    },
    presetText: {
        color: '#61728F',
        fontWeight: '700',
        fontSize: 12,
    },
    presetTextActive: {
        color: '#FFFFFF',
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 14,
        borderTopWidth: 1,
        borderTopColor: '#E2E9F4',
        backgroundColor: '#FFFFFF',
    },
    createBtn: {
        backgroundColor: '#1D63D0',
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1958BA',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1A4C96',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.24,
        shadowRadius: 10,
        elevation: 4,
    },
    disabledBtn: {
        opacity: 0.65,
    },
    createBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        marginRight: 8,
    },
});
