import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiListQuestions, apiGetSubjects } from '../../api/questions.api';

export default function QuestionsLibraryScreen({ navigation, route }) {
    const [questions, setQuestions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const loadData = async () => {
        try {
            const [qData, sData] = await Promise.all([
                apiListQuestions({ limit: 100, subject: selectedSubject, search: searchQuery }),
                apiGetSubjects()
            ]);

            if (qData && qData.items) setQuestions(qData.items);
            if (sData) setSubjects(sData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [selectedSubject])
    );

    // Reset selection only on initial mount
    React.useEffect(() => {
        setSelectedIds([]);
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return '#4CAF50'; // Green
            case 'medium': return '#FF9800'; // Orange
            case 'hard': return '#F44336'; // Red
            default: return '#9E9E9E'; // Grey
        }
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) return prev.filter(i => i !== id);
            return [...prev, id];
        });
    };

    const handleAddSelected = () => {
        if (selectedIds.length === 0) return;

        // Try to find the previous screen (EditQuiz)
        const state = navigation.getState();
        // The current screen is the last one, so we look at the one before it
        const previousRoute = state.routes[state.routes.length - 2];

        if (previousRoute && previousRoute.name === 'EditQuiz') {
            // Explicitly update params of the previous screen
            navigation.dispatch({
                ...CommonActions.setParams({
                    selectedQuestionIds: selectedIds,
                    quizId: route.params?.quizId // Pass this just in case, though EditQuiz already has it
                }),
                source: previousRoute.key,
            });
            // Pop the current screen to go back
            navigation.goBack();
        } else {
            // Fallback for deep links or unexpected stack state
            navigation.navigate({
                name: 'EditQuiz',
                params: {
                    selectedQuestionIds: selectedIds,
                    quizId: route.params?.quizId
                },
                merge: true,
            });
        }
    };

    const renderItem = ({ item }) => {
        const isExpanded = expandedId === item._id;
        const isSelected = selectedIds.includes(item._id);

        const handlePress = () => {
            if (route.params?.isSelectionMode) {
                toggleSelection(item._id);
            } else {
                toggleExpand(item._id);
            }
        };

        return (
            <TouchableOpacity
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={handlePress}
                activeOpacity={0.9}
            >
                <View style={styles.cardContent}>
                    <View style={styles.headerRow}>
                        <Text style={styles.questionText}>{item.text}</Text>
                        {route.params?.isSelectionMode && (
                            <Ionicons
                                name={isSelected ? "checkbox" : "square-outline"}
                                size={24}
                                color={isSelected ? "#2196F3" : "#ccc"}
                            />
                        )}
                    </View>

                    <View style={styles.metaRow}>
                        {/* Difficulty Badge */}
                        {item.difficulty && (
                            <View style={[styles.badge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
                                <Text style={styles.badgeText}>{item.difficulty}</Text>
                            </View>
                        )}

                        {/* Subject Badge */}
                        {item.subject && (
                            <View style={[styles.badge, styles.badgeSubject]}>
                                <Text style={styles.badgeTextSubject}>{item.subject}</Text>
                            </View>
                        )}

                        {/* Type Badge - Only show if exists */}
                        {item.type && (
                            <View style={[styles.badge, styles.badgeType]}>
                                <Text style={styles.badgeTextType}>{item.type}</Text>
                            </View>
                        )}
                    </View>

                    {isExpanded && !route.params?.isSelectionMode && (
                        <View style={styles.detailsContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.detailsHeader}>Answer Choices</Text>
                            {item.choices && item.choices.length > 0 ? (
                                item.choices.map((choice, index) => {
                                    // Robust comparison: handle string/number and potential whitespace
                                    const isCorrect = String(item.correctChoiceId).trim() === String(choice.id).trim();
                                    return (
                                        <View key={index} style={[styles.choiceRow, isCorrect && styles.correctChoiceRow]}>
                                            <View style={[styles.choiceDot, isCorrect && styles.correctChoiceDot]} />
                                            <Text style={[styles.choiceText, isCorrect && styles.correctChoiceText]}>
                                                {choice.text}
                                            </Text>
                                            {isCorrect && <Ionicons name="checkmark-circle" size={16} color="#2e7d32" style={{ marginLeft: 5 }} />}
                                        </View>
                                    );
                                })
                            ) : (
                                <Text style={{ color: '#999', fontStyle: 'italic', padding: 10 }}>No options available.</Text>
                            )}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#757575" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={() => loadData()}
                    returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => { setSearchQuery(''); loadData(); }}>
                        <Ionicons name="close-circle" size={20} color="#757575" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
                    <TouchableOpacity
                        style={[styles.filterChip, !selectedSubject && styles.filterChipSelected]}
                        onPress={() => setSelectedSubject(null)}
                    >
                        <Text style={[styles.filterChipText, !selectedSubject && styles.filterChipTextSelected]}>All</Text>
                    </TouchableOpacity>
                    {subjects.map(sub => (
                        <TouchableOpacity
                            key={sub}
                            style={[styles.filterChip, selectedSubject === sub && styles.filterChipSelected]}
                            onPress={() => setSelectedSubject(sub)}
                        >
                            <Text style={[styles.filterChipText, selectedSubject === sub && styles.filterChipTextSelected]}>{sub}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? <ActivityIndicator size="large" style={{ marginTop: 50, color: '#2196F3' }} /> : (
                <FlatList
                    data={questions}
                    extraData={selectedIds}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="library-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>No questions found.</Text>
                        </View>
                    }
                />
            )}

            {route.params?.isSelectionMode && selectedIds.length > 0 && (
                <View style={styles.fabContainer}>
                    <TouchableOpacity style={styles.fab} onPress={handleAddSelected}>
                        <Text style={styles.fabText}>Add {selectedIds.length} Questions</Text>
                        <Ionicons name="arrow-forward-circle" size={24} color="white" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 10, paddingHorizontal: 10, borderRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#eee' },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: '#333' },
    filterContainer: { backgroundColor: 'white', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', elevation: 2 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, backgroundColor: '#F0F2F5', marginRight: 10, borderWidth: 1, borderColor: 'transparent' },
    filterChipSelected: { backgroundColor: '#E3F2FD', borderColor: '#2196F3' },
    filterChipText: { color: '#546E7A', fontWeight: '600', fontSize: 14 },
    filterChipTextSelected: { color: '#1976D2' },

    card: { backgroundColor: 'white', borderRadius: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, borderWidth: 2, borderColor: 'transparent' },
    cardSelected: { borderColor: '#2196F3', backgroundColor: '#F5FAFF' },
    cardContent: { padding: 16 },

    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    questionText: { fontSize: 17, fontWeight: '700', color: '#263238', flex: 1, marginRight: 10, lineHeight: 24 },

    metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8, marginBottom: 6 },
    badgeText: { color: 'white', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

    badgeSubject: { backgroundColor: '#E3F2FD' },
    badgeTextSubject: { color: '#1976D2', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

    badgeType: { backgroundColor: '#ECEFF1' },
    badgeTextType: { color: '#455A64', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },

    detailsContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    detailsHeader: { fontSize: 13, fontWeight: '700', color: '#78909C', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 10 },

    choiceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, marginBottom: 4 },
    choiceDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CFD8DC', marginRight: 10 },
    choiceText: { fontSize: 15, color: '#37474F', flex: 1 },

    correctChoiceRow: { backgroundColor: '#E8F5E9' },
    correctChoiceDot: { backgroundColor: '#4CAF50' },
    correctChoiceText: { color: '#2E7D32', fontWeight: '600' },

    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { marginTop: 16, fontSize: 18, color: '#90A4AE', fontWeight: '500' },

    fabContainer: { position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' },
    fab: { flexDirection: 'row', backgroundColor: '#2196F3', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 32, elevation: 8, alignItems: 'center', shadowColor: '#2196F3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    fabText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
