import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiListQuestions, apiGetSubjects } from '../../api/questions.api';

const COLORS = {
    pageBg: '#F3F5F9',
    card: '#FFFFFF',
    border: '#DDE4EF',
    text: '#16243A',
    textSoft: '#5E6E88',
    primary: '#1F4E95',
    success: '#167451',
    warning: '#B97B21',
    danger: '#BE3F3F',
    muted: '#6D7E99',
};

function difficultyTone(level) {
    switch ((level || '').toLowerCase()) {
        case 'easy':
            return { bg: '#E8F5EF', text: COLORS.success };
        case 'medium':
            return { bg: '#FBF1E3', text: COLORS.warning };
        case 'hard':
            return { bg: '#FCEAEA', text: COLORS.danger };
        default:
            return { bg: '#EDF1F7', text: COLORS.muted };
    }
}

export default function QuestionsLibraryScreen({ navigation, route }) {
    const [questions, setQuestions] = useState([]);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const isSelectionMode = Boolean(route.params?.isSelectionMode);

    const loadData = async () => {
        try {
            const [qData, sData] = await Promise.all([
                apiListQuestions({ limit: 100, subject: selectedSubject, search: searchQuery }),
                apiGetSubjects(),
            ]);

            if (qData?.items) {
                setQuestions(qData.items);
                setTotalQuestions(Number(qData?.meta?.total || 0));
            } else {
                setQuestions([]);
                setTotalQuestions(0);
            }
            if (Array.isArray(sData)) setSubjects(sData);
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
            // Intentional: refetch on focus/subject change; search uses explicit submit.
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [selectedSubject])
    );

    React.useEffect(() => {
        setSelectedIds([]);
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const toggleExpand = (id) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const toggleSelection = (id) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) return prev.filter((itemId) => itemId !== id);
            return [...prev, id];
        });
    };

    const handleAddSelected = () => {
        if (selectedIds.length === 0) return;

        const state = navigation.getState();
        const previousRoute = state.routes[state.routes.length - 2];

        if (previousRoute && previousRoute.name === 'EditQuiz') {
            navigation.dispatch({
                ...CommonActions.setParams({
                    selectedQuestionIds: selectedIds,
                    quizId: route.params?.quizId,
                }),
                source: previousRoute.key,
            });
            navigation.goBack();
            return;
        }

        navigation.navigate({
            name: 'EditQuiz',
            params: {
                selectedQuestionIds: selectedIds,
                quizId: route.params?.quizId,
            },
            merge: true,
        });
    };

    const selectedCountLabel = useMemo(() => {
        if (selectedIds.length === 0) return 'None selected';
        if (selectedIds.length === 1) return '1 selected';
        return `${selectedIds.length} selected`;
    }, [selectedIds.length]);

    const renderQuestionItem = ({ item }) => {
        const isExpanded = expandedId === item._id;
        const isSelected = selectedIds.includes(item._id);
        const difficulty = difficultyTone(item.difficulty);

        const handlePress = () => {
            if (isSelectionMode) {
                toggleSelection(item._id);
                return;
            }
            toggleExpand(item._id);
        };

        return (
            <TouchableOpacity
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={handlePress}
                activeOpacity={0.9}
            >
                <View style={styles.headerRow}>
                    <Text style={styles.questionText} numberOfLines={isExpanded ? undefined : 2}>{item.text}</Text>
                    {isSelectionMode ? (
                        <View style={[styles.selectIconWrap, isSelected && styles.selectIconWrapActive]}>
                            <Ionicons
                                name={isSelected ? 'checkmark' : 'add'}
                                size={16}
                                color={isSelected ? '#FFFFFF' : COLORS.textSoft}
                            />
                        </View>
                    ) : (
                        <Ionicons
                            name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                            size={18}
                            color={COLORS.textSoft}
                        />
                    )}
                </View>

                <View style={styles.metaRow}>
                    {item.difficulty ? (
                        <View style={[styles.badge, { backgroundColor: difficulty.bg }]}>
                            <Text style={[styles.badgeText, { color: difficulty.text }]}>{String(item.difficulty).toUpperCase()}</Text>
                        </View>
                    ) : null}
                    {item.subject ? (
                        <View style={[styles.badge, styles.subjectBadge]}>
                            <Text style={styles.subjectBadgeText}>{String(item.subject).toUpperCase()}</Text>
                        </View>
                    ) : null}
                    {item.type ? (
                        <View style={[styles.badge, styles.typeBadge]}>
                            <Text style={styles.typeBadgeText}>{String(item.type).toUpperCase()}</Text>
                        </View>
                    ) : null}
                </View>

                {isExpanded && !isSelectionMode ? (
                    <View style={styles.detailsContainer}>
                        <Text style={styles.detailsHeader}>Answer Choices</Text>
                        {Array.isArray(item.choices) && item.choices.length > 0 ? (
                            item.choices.map((choice, index) => {
                                const isCorrect = String(item.correctChoiceId).trim() === String(choice.id).trim();
                                return (
                                    <View key={`${choice.id}-${index}`} style={[styles.choiceRow, isCorrect && styles.correctChoiceRow]}>
                                        <Text style={styles.choiceIndex}>{String.fromCharCode(65 + index)}</Text>
                                        <Text style={[styles.choiceText, isCorrect && styles.correctChoiceText]}>{choice.text}</Text>
                                        {isCorrect ? <Ionicons name="checkmark-circle" size={16} color={COLORS.success} /> : null}
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={styles.noChoiceText}>No options available.</Text>
                        )}
                    </View>
                ) : null}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerCard}>
                <View style={styles.headerTitleRow}>
                    <Text style={styles.headerTitle}>Question Bank</Text>
                    <View style={styles.countPill}>
                        <Text style={styles.countPillText}>{totalQuestions} Questions</Text>
                    </View>
                </View>
                <Text style={styles.headerSubtitle}>
                    {isSelectionMode ? `Selection mode active. ${selectedCountLabel}.` : 'Browse, filter, and review your question library.'}
                </Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={COLORS.textSoft} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by question text"
                    placeholderTextColor="#8D9BB2"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={loadData}
                    returnKeyType="search"
                />
                {searchQuery.length > 0 ? (
                    <TouchableOpacity onPress={() => { setSearchQuery(''); loadData(); }}>
                        <Ionicons name="close-circle" size={19} color={COLORS.textSoft} />
                    </TouchableOpacity>
                ) : null}
            </View>

            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <TouchableOpacity
                        style={[styles.filterChip, !selectedSubject && styles.filterChipSelected]}
                        onPress={() => setSelectedSubject(null)}
                    >
                        <Text style={[styles.filterChipText, !selectedSubject && styles.filterChipTextSelected]}>All Subjects</Text>
                    </TouchableOpacity>
                    {subjects.map((subject) => (
                        <TouchableOpacity
                            key={subject}
                            style={[styles.filterChip, selectedSubject === subject && styles.filterChipSelected]}
                            onPress={() => setSelectedSubject(subject)}
                        >
                            <Text style={[styles.filterChipText, selectedSubject === subject && styles.filterChipTextSelected]}>{subject}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.loaderText}>Loading question bank...</Text>
                </View>
            ) : (
                <FlatList
                    data={questions}
                    extraData={selectedIds}
                    keyExtractor={(item) => item._id}
                    renderItem={renderQuestionItem}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="library-outline" size={40} color="#98A7BF" />
                            <Text style={styles.emptyText}>No questions found for current filters.</Text>
                        </View>
                    }
                />
            )}

            {isSelectionMode && selectedIds.length > 0 ? (
                <View style={styles.fabContainer}>
                    <TouchableOpacity style={styles.fab} onPress={handleAddSelected} activeOpacity={0.9}>
                        <Text style={styles.fabText}>Add {selectedIds.length} Questions</Text>
                        <Ionicons name="arrow-forward-circle" size={22} color="#FFFFFF" style={styles.fabIcon} />
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.pageBg,
    },
    headerCard: {
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 10,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        color: COLORS.text,
        fontSize: 22,
        fontWeight: '800',
    },
    headerSubtitle: {
        marginTop: 4,
        color: COLORS.textSoft,
        fontSize: 12.5,
        fontWeight: '600',
    },
    countPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: '#EDF2FB',
        borderWidth: 1,
        borderColor: '#D9E5FA',
    },
    countPillText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        marginHorizontal: 14,
        marginTop: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        color: COLORS.text,
        fontSize: 14.5,
        fontWeight: '600',
    },
    filterContainer: {
        marginTop: 10,
        marginBottom: 8,
    },
    filterScroll: {
        paddingHorizontal: 14,
    },
    filterChip: {
        marginRight: 8,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterChipSelected: {
        backgroundColor: '#EDF2FB',
        borderColor: '#D5E1F6',
    },
    filterChipText: {
        color: COLORS.textSoft,
        fontSize: 12.5,
        fontWeight: '600',
    },
    filterChipTextSelected: {
        color: COLORS.primary,
    },
    loaderWrap: {
        marginTop: 40,
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 8,
        color: COLORS.textSoft,
        fontSize: 13,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 14,
        paddingTop: 2,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
    },
    cardSelected: {
        borderColor: '#BFD3F5',
        backgroundColor: '#F7FAFF',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    questionText: {
        flex: 1,
        marginRight: 10,
        color: COLORS.text,
        fontSize: 15.5,
        lineHeight: 22,
        fontWeight: '700',
    },
    selectIconWrap: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: '#F0F4FB',
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectIconWrapActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    badge: {
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 999,
        marginRight: 6,
        marginBottom: 6,
    },
    badgeText: {
        fontSize: 10.5,
        fontWeight: '700',
    },
    subjectBadge: {
        backgroundColor: '#ECF2FC',
    },
    subjectBadgeText: {
        color: COLORS.primary,
        fontSize: 10.5,
        fontWeight: '700',
    },
    typeBadge: {
        backgroundColor: '#EEF1F6',
    },
    typeBadgeText: {
        color: '#4E5E79',
        fontSize: 10.5,
        fontWeight: '700',
    },
    detailsContainer: {
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 9,
    },
    detailsHeader: {
        color: COLORS.textSoft,
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    choiceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 9,
        borderRadius: 9,
        marginBottom: 5,
        backgroundColor: '#F7F9FD',
        borderWidth: 1,
        borderColor: '#E7EDF8',
    },
    correctChoiceRow: {
        backgroundColor: '#E8F5EF',
        borderColor: '#D2ECDD',
    },
    choiceIndex: {
        color: COLORS.textSoft,
        fontSize: 12,
        fontWeight: '700',
        marginRight: 8,
        width: 12,
    },
    choiceText: {
        flex: 1,
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
    },
    correctChoiceText: {
        color: COLORS.success,
    },
    noChoiceText: {
        color: COLORS.textSoft,
        fontSize: 13,
        fontStyle: 'italic',
        paddingVertical: 4,
    },
    emptyContainer: {
        marginTop: 60,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 10,
        color: COLORS.textSoft,
        fontSize: 14,
        fontWeight: '600',
    },
    fabContainer: {
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: 18,
    },
    fab: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabText: {
        color: '#FFFFFF',
        fontSize: 14.5,
        fontWeight: '700',
    },
    fabIcon: {
        marginLeft: 6,
    },
});
