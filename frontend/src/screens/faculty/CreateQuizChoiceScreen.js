import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const CREATE_OPTIONS = [
    {
        id: 'manual',
        title: 'Manual Creation',
        description: 'Build each question yourself for full academic control.',
        icon: 'create-outline',
        screen: 'CreateManualQuiz',
        tone: '#0E8F62',
        chip: 'Highest control',
        pace: '5-12 min',
        fit: 'Custom exams',
    },
    {
        id: 'excel',
        title: 'Excel Upload',
        description: 'Import a spreadsheet and publish large quizzes quickly.',
        icon: 'document-text-outline',
        screen: 'CreateExcelQuiz',
        tone: '#1C62DC',
        chip: 'Fastest setup',
        pace: '2-5 min',
        fit: 'Bulk question sets',
    },
    {
        id: 'builtin',
        title: 'Built-in Quiz',
        description: 'Generate a quiz from your existing question bank.',
        icon: 'flash-outline',
        screen: 'CreateBuiltInQuiz',
        tone: '#CA7B11',
        chip: 'Smart generator',
        pace: '1-2 min',
        fit: 'Practice sessions',
    },
];

const HERO_POINTS = ['Manual precision', 'Bulk import flow', 'Auto generation'];

export default function CreateQuizChoiceScreen({ navigation }) {
    const { width } = useWindowDimensions();
    const isMobile = width < 860;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <LinearGradient
                colors={['#0F2A4D', '#18477E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
            >
                <View style={styles.heroHeader}>
                    <View>
                        <Text style={styles.heroEyebrow}>QUIZ BUILDER</Text>
                        <Text style={styles.heroTitle}>Create Quiz</Text>
                        <Text style={styles.heroSubtitle}>
                            Select the path that matches your workflow and publish with confidence.
                        </Text>
                    </View>
                    <View style={styles.heroCountBadge}>
                        <Text style={styles.heroCountValue}>{CREATE_OPTIONS.length}</Text>
                        <Text style={styles.heroCountLabel}>Paths</Text>
                    </View>
                </View>

                <View style={styles.heroPillRow}>
                    {HERO_POINTS.map((point) => (
                        <View key={point} style={styles.heroPill}>
                            <Text style={styles.heroPillLabel}>{point}</Text>
                        </View>
                    ))}
                </View>
            </LinearGradient>

            <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Choose Your Creation Method</Text>
                <Text style={styles.sectionSubtitle}>Each option keeps the same publishing pipeline and results dashboard.</Text>
            </View>

            <View style={styles.grid}>
                {CREATE_OPTIONS.map((option, index) => (
                    <TouchableOpacity
                        key={option.id}
                        style={[
                            styles.cardWrap,
                            !isMobile && (index < 2 ? styles.cardHalf : styles.cardFull),
                            isMobile && styles.cardFull,
                        ]}
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate(option.screen)}
                    >
                        <View style={styles.card}>
                            <View style={styles.cardTop}>
                                <View style={[styles.iconContainer, { backgroundColor: `${option.tone}14` }]}>
                                    <Ionicons name={option.icon} size={22} color={option.tone} />
                                </View>
                                <View style={[styles.badge, { borderColor: `${option.tone}3D` }]}>
                                    <Text style={[styles.badgeText, { color: option.tone }]}>{option.chip}</Text>
                                </View>
                            </View>

                            <Text style={styles.cardTitle}>{option.title}</Text>
                            <Text style={styles.cardDesc}>{option.description}</Text>

                            <View style={styles.metaRow}>
                                <View style={styles.metaCell}>
                                    <Text style={styles.metaLabel}>Typical Time</Text>
                                    <Text style={styles.metaValue}>{option.pace}</Text>
                                </View>
                                <View style={styles.metaDivider} />
                                <View style={styles.metaCell}>
                                    <Text style={styles.metaLabel}>Best For</Text>
                                    <Text style={styles.metaValue}>{option.fit}</Text>
                                </View>
                            </View>

                            <View style={[styles.cta, { borderColor: `${option.tone}45` }]}>
                                <Text style={[styles.ctaText, { color: option.tone }]}>Continue</Text>
                                <Ionicons name="arrow-forward" size={15} color={option.tone} />
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.tipCard}>
                <Ionicons name="information-circle-outline" size={16} color="#5F6F8E" />
                <Text style={styles.tipText}>
                    Recommended flow: start with Excel for bulk upload, then refine quality in manual mode.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6FB',
    },
    content: {
        padding: 16,
        paddingBottom: 28,
    },
    hero: {
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    heroEyebrow: {
        color: '#BFD7F5',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 6,
    },
    heroSubtitle: {
        color: '#D2E3F8',
        fontSize: 13,
        lineHeight: 19,
        maxWidth: 560,
    },
    heroCountBadge: {
        minWidth: 70,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 9,
        alignItems: 'center',
    },
    heroCountValue: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
        lineHeight: 22,
    },
    heroCountLabel: {
        color: '#DDEBFC',
        fontSize: 11,
        fontWeight: '600',
    },
    heroPillRow: {
        marginTop: 14,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    heroPill: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.24)',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 11,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    heroPillLabel: {
        color: '#E8F2FF',
        fontSize: 11,
        fontWeight: '700',
    },
    sectionHead: {
        marginBottom: 10,
    },
    sectionTitle: {
        color: '#1A2A45',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    sectionSubtitle: {
        color: '#64748E',
        fontSize: 13,
        lineHeight: 19,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    cardWrap: {
        paddingHorizontal: 6,
        marginBottom: 12,
    },
    cardHalf: {
        width: '50%',
    },
    cardFull: {
        width: '100%',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#DCE5F2',
        padding: 16,
        minHeight: 215,
        shadowColor: '#102145',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    cardTitle: {
        color: '#102341',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 6,
    },
    cardDesc: {
        color: '#5D6E8B',
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 14,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    metaCell: {
        flex: 1,
    },
    metaDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#E6ECF5',
        marginHorizontal: 10,
    },
    metaLabel: {
        color: '#7A89A3',
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 2,
    },
    metaValue: {
        color: '#1E2F4B',
        fontSize: 13,
        fontWeight: '700',
    },
    cta: {
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ctaText: {
        fontSize: 13,
        fontWeight: '800',
    },
    tipCard: {
        marginTop: 2,
        backgroundColor: '#E9EEF6',
        borderWidth: 1,
        borderColor: '#D7E0ED',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tipText: {
        marginLeft: 8,
        color: '#4B5A77',
        fontSize: 12,
        lineHeight: 17,
        flex: 1,
    },
});
