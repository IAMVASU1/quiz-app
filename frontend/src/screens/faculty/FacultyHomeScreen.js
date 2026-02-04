import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, StatusBar, Platform, ImageBackground, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { apiListQuizzes } from '../../api/quizzes.api';

const { width } = Dimensions.get('window');

export default function FacultyHomeScreen({ navigation }) {
    const [recentQuizzes, setRecentQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Swipe Logic
    const translateX = useSharedValue(0);
    const contextX = useSharedValue(0);

    const navigateToProfile = () => {
        navigation.navigate('Profile');
    };

    const gesture = Gesture.Pan()
        .activeOffsetX([-20, 20])
        .onStart(() => {
            contextX.value = translateX.value;
        })
        .onUpdate((event) => {
            translateX.value = event.translationX + contextX.value;
        })
        .onEnd((event) => {
            if (event.translationX < -100) {
                // Left swipe -> Profile
                runOnJS(navigateToProfile)();
            } else if (event.translationX > 100) {
                // Right swipe -> Home (Already here)
            }
            translateX.value = withSpring(0);
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    const loadData = async () => {
        try {
            const data = await apiListQuizzes({ page: 1, limit: 5 });
            if (data && data.items) {
                setRecentQuizzes(data.items);
            }
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
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const renderShortcut = (title, icon, screen, color, subTitle) => (
        <TouchableOpacity
            style={[styles.shortcutCard, { backgroundColor: color }]}
            onPress={() => navigation.navigate(screen)}
            activeOpacity={0.9}
        >
            <View style={styles.iconCircle}>
                <Ionicons name={icon} size={32} color={color} />
            </View>
            <Text style={styles.shortcutTitle}>{title}</Text>
            <Text style={styles.shortcutSub}>{subTitle}</Text>
        </TouchableOpacity>
    );

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const renderQuizItem = ({ item }) => (
        <View style={styles.quizItem}>
            <View style={styles.quizLeft}>
                <View style={[styles.quizIcon, { backgroundColor: item.status === 'published' ? '#E8F5E9' : '#FFF3E0' }]}>
                    <Ionicons name="document-text" size={24} color={item.status === 'published' ? '#4CAF50' : '#FF9800'} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.quizTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.quizCode}>Code: <Text style={{ fontWeight: 'bold', color: '#333' }}>{item.quizCode}</Text></Text>
                    <Text style={styles.dateText}>Created: {formatDate(item.createdAt)}</Text>
                    {item.updatedAt !== item.createdAt && (
                        <Text style={styles.dateText}>Edited: {formatDate(item.updatedAt)}</Text>
                    )}
                </View>
            </View>
            <View style={styles.quizRight}>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'published' ? '#C8E6C9' : '#FFE0B2' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'published' ? '#2E7D32' : '#EF6C00' }]}>
                        {item.status}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.mainContainer, animatedStyle]}>
                <StatusBar barStyle="dark-content" backgroundColor="#F0F4F8" />
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.headerContainer}>
                        <View>
                            <Text style={styles.welcomeText}>Hello, Faculty! 👋</Text>
                            <Text style={styles.subWelcome}>Ready to teach today?</Text>
                        </View>
                        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
                            <Ionicons name="person" size={24} color="#555" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={recentQuizzes}
                        keyExtractor={(item) => item._id}
                        renderItem={renderQuizItem}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        ListHeaderComponent={
                            <>
                                <View style={styles.gridContainer}>
                                    {renderShortcut('Create Quiz', 'add', 'CreateQuizChoice', '#FF6B6B', 'New Test')}
                                    {renderShortcut('Manage', 'list', 'ManageQuizzes', '#4ECDC4', 'Edit/Delete')}
                                    {renderShortcut('Q-Bank', 'library', 'QuestionsLibrary', '#FFE66D', 'Library')}
                                    {renderShortcut('Bulk Upload', 'cloud-upload', 'BulkUpload', '#2196F3', 'Excel')}
                                </View>
                                <Text style={styles.sectionTitle}>Recent Activities 🕒</Text>
                            </>
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="planet-outline" size={60} color="#ccc" />
                                <Text style={styles.emptyText}>No quizzes yet. Start creating!</Text>
                            </View>
                        }
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
                        showsVerticalScrollIndicator={false}
                    />
                </SafeAreaView>
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#F0F4F8',
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
        marginTop: 10,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2D3436',
        letterSpacing: 0.5,
    },
    subWelcome: {
        fontSize: 16,
        color: '#636E72',
        fontWeight: '500',
    },
    profileBtn: {
        width: 45,
        height: 45,
        borderRadius: 25,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    gridContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    shortcutCard: {
        width: '48%', // Adjusted for 2 columns or use flexWrap
        marginBottom: 15,
        aspectRatio: 1.2,
        borderRadius: 20,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    shortcutTitle: {
        color: 'white',
        fontWeight: '800',
        fontSize: 14,
        textAlign: 'center',
    },
    shortcutSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 15,
    },
    quizItem: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 15,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    quizLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    quizIcon: {
        width: 45,
        height: 45,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    quizTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 4,
    },
    quizCode: {
        fontSize: 13,
        color: '#636E72',
        marginBottom: 2,
    },
    dateText: {
        fontSize: 11,
        color: '#90A4AE',
        marginTop: 1,
    },
    quizRight: {
        marginLeft: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        marginTop: 10,
        color: '#B2BEC3',
        fontSize: 16,
        fontWeight: '600',
    },
});
