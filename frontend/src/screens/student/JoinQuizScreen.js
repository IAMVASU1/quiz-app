import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform, useWindowDimensions, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiGetQuizByCode } from '../../api/quizzes.api';
import { apiStartAttempt } from '../../api/attempts.api';
import useAppTheme from '../../hooks/useAppTheme';

function createJoinColors(palette, isDark) {
    return {
        pageBg: palette.pageBg,
        card: palette.surface,
        border: palette.border,
        text: palette.text,
        textMuted: palette.textMuted,
        inputBg: palette.inputBg,
        heroStart: isDark ? '#1A2D57' : '#122A4D',
        heroEnd: isDark ? '#334F95' : '#1C4B84',
        heroEyebrow: isDark ? '#D3DEFF' : '#BCD6F6',
        heroSubtitle: isDark ? '#D9E5FF' : '#D3E4F9',
        iconSoft: isDark ? '#A8B8DA' : '#587195',
        inputPlaceholder: isDark ? '#9EAECE' : '#7A8CA8',
        previewBg: isDark ? '#1C2B4C' : '#F1F5FB',
        primary: palette.primary,
        primaryBorder: isDark ? '#6F82FF' : '#1A58BA',
        tip: isDark ? '#9AAED4' : '#667A99',
    };
}

export default function JoinQuizScreen({ route, navigation }) {
    const { quizCode: initialCode } = route.params || {};
    const { width } = useWindowDimensions();
    const { palette, isDark, statusBarStyle } = useAppTheme();
    const themeColors = useMemo(() => createJoinColors(palette, isDark), [palette, isDark]);
    const styles = useMemo(() => createStyles(themeColors), [themeColors]);
    const isMobile = width < 760;
    const [code, setCode] = useState(initialCode || '');
    const [loading, setLoading] = useState(false);

    const cleanedCode = useMemo(() => code.replace(/\s+/g, '').toUpperCase(), [code]);

    const handleJoin = async () => {
        if (!cleanedCode.trim()) {
            Alert.alert('Required', 'Please enter a quiz code');
            return;
        }

        setLoading(true);
        try {
            const quizData = await apiGetQuizByCode(cleanedCode.trim());

            if (!quizData) {
                Alert.alert('Error', 'Quiz not found. Please check the code.');
                setLoading(false);
                return;
            }

            const attemptData = await apiStartAttempt({ quizCode: cleanedCode.trim() });

            if (attemptData) {
                navigation.replace('QuizPlay', {
                    attemptId: attemptData.attemptId,
                    questions: attemptData.questions,
                    settings: attemptData.quizSettings,
                    quizTitle: quizData.title,
                    quizId: quizData._id || quizData.id
                });
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to join quiz';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <StatusBar barStyle={statusBarStyle} backgroundColor={themeColors.pageBg} />
            <LinearGradient
                colors={[themeColors.heroStart, themeColors.heroEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
            >
                <View style={styles.heroIconWrap}>
                    <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.heroEyebrow}>STUDENT ACCESS</Text>
                <Text style={styles.heroTitle}>Join Quiz</Text>
                <Text style={styles.heroSubtitle}>
                    Enter your faculty quiz code to begin the attempt instantly.
                </Text>
            </LinearGradient>

            <View style={[styles.card, !isMobile && styles.cardDesktop]}>
                <Text style={styles.sectionTitle}>Quiz Code</Text>
                <Text style={styles.sectionSubtitle}>Codes are not case-sensitive. Example: `QZ-1234`</Text>

                <View style={[styles.inputShell, loading && styles.inputShellDisabled]}>
                    <Ionicons name="key-outline" size={18} color={themeColors.iconSoft} />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your quiz code"
                        value={code}
                        onChangeText={setCode}
                        autoCapitalize="characters"
                        editable={!loading}
                        placeholderTextColor={themeColors.inputPlaceholder}
                    />
                </View>

                <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Detected code</Text>
                    <Text style={styles.previewValue}>{cleanedCode || '-----'}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.joinBtn, (!cleanedCode.trim() || loading) && styles.joinBtnDisabled]}
                    onPress={handleJoin}
                    disabled={loading || !cleanedCode.trim()}
                    activeOpacity={0.9}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Text style={styles.joinBtnText}>Start Quiz</Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.tipRow}>
                    <Ionicons name="information-circle-outline" size={15} color={themeColors.tip} />
                    <Text style={styles.tipText}>If this code fails, confirm status with your instructor.</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const createStyles = (themeColors) => StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: themeColors.pageBg,
        padding: 16,
        justifyContent: 'center',
    },
    hero: {
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 18,
        marginBottom: 14,
    },
    heroIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    heroEyebrow: {
        color: themeColors.heroEyebrow,
        fontSize: 11,
        letterSpacing: 0.8,
        fontWeight: '700',
        marginBottom: 6,
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '800',
        marginBottom: 5,
    },
    heroSubtitle: {
        color: themeColors.heroSubtitle,
        fontSize: 13,
        lineHeight: 19,
        maxWidth: 520,
    },
    card: {
        backgroundColor: themeColors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: themeColors.border,
        padding: 16,
        shadowColor: '#102145',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
    },
    cardDesktop: {
        maxWidth: 640,
        alignSelf: 'center',
        width: '100%',
    },
    sectionTitle: {
        color: themeColors.text,
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    sectionSubtitle: {
        color: themeColors.textMuted,
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 14,
    },
    inputShell: {
        height: 54,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: themeColors.border,
        backgroundColor: themeColors.inputBg,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputShellDisabled: {
        opacity: 0.8,
    },
    input: {
        flex: 1,
        marginLeft: 9,
        height: '100%',
        color: themeColors.text,
        fontSize: 16,
        letterSpacing: 1,
        fontWeight: '700',
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
    },
    previewRow: {
        marginTop: 10,
        marginBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 10,
        backgroundColor: themeColors.previewBg,
        borderWidth: 1,
        borderColor: themeColors.border,
        paddingHorizontal: 11,
        paddingVertical: 8,
    },
    previewLabel: {
        color: themeColors.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },
    previewValue: {
        color: themeColors.primary,
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    joinBtn: {
        backgroundColor: themeColors.primary,
        borderRadius: 12,
        height: 50,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: themeColors.primaryBorder,
        elevation: 3,
        shadowColor: '#1A4C96',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.24,
        shadowRadius: 10,
    },
    joinBtnDisabled: {
        opacity: 0.55,
    },
    joinBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.4,
        marginRight: 8,
    },
    tipRow: {
        marginTop: 11,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tipText: {
        marginLeft: 6,
        color: themeColors.tip,
        fontSize: 12,
        lineHeight: 17,
        flex: 1,
    },
});

