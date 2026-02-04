import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Image, StatusBar, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTopLeaderboard, getStudentProfile } from '../../api/leaderboard.api';
import { Ionicons } from '@expo/vector-icons';

export default function LeaderboardScreen() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);

    const loadData = async () => {
        try {
            const response = await getTopLeaderboard(50);
            // API returns { success: true, data: { items: [...] } }
            if (response && response.data && response.data.items) {
                setUsers(response.data.items);
            } else {
                setUsers([]);
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

    const handleUserPress = async (userId) => {
        setProfileLoading(true);
        setModalVisible(true);
        try {
            const response = await getStudentProfile(userId);
            if (response && response.data) {
                setSelectedStudent(response.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProfileLoading(false);
        }
    };

    const renderItem = ({ item, index }) => {
        let rankColor = '#333';
        let rankIcon = null;

        if (index === 0) {
            rankColor = '#FFD700'; // Gold
            rankIcon = 'trophy';
        } else if (index === 1) {
            rankColor = '#C0C0C0'; // Silver
            rankIcon = 'medal';
        } else if (index === 2) {
            rankColor = '#CD7F32'; // Bronze
            rankIcon = 'medal';
        }

        return (
            <TouchableOpacity style={styles.card} onPress={() => handleUserPress(item.id)}>
                <View style={styles.rankContainer}>
                    {rankIcon ? (
                        <Ionicons name={rankIcon} size={24} color={rankColor} />
                    ) : (
                        <Text style={styles.rankText}>#{index + 1}</Text>
                    )}
                </View>

                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.stats}>
                        {item.accuracy !== null ? `Accuracy: ${item.accuracy}%` : 'No attempts'}
                    </Text>
                </View>

                <View style={styles.scoreContainer}>
                    <Text style={styles.score}>{item.totalScore || 0}</Text>
                    <Text style={styles.pts}>pts</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderProfileModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Student Profile</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {profileLoading ? (
                        <ActivityIndicator size="large" color="#2196F3" style={{ padding: 20 }} />
                    ) : selectedStudent ? (
                        <View style={styles.profileBody}>
                            <View style={styles.profileAvatarLarge}>
                                <Text style={styles.profileAvatarTextLarge}>
                                    {selectedStudent.name?.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.profileName}>{selectedStudent.name}</Text>
                            <Text style={styles.profileEmail}>{selectedStudent.email}</Text>

                            <View style={styles.statsGrid}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>{selectedStudent.totalScore}</Text>
                                    <Text style={styles.statLabel}>Total Score</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>
                                        {selectedStudent.accuracy !== null ? `${selectedStudent.accuracy}%` : '-'}
                                    </Text>
                                    <Text style={styles.statLabel}>Accuracy</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>{selectedStudent.totalQuestionsAnswered}</Text>
                                    <Text style={styles.statLabel}>Questions</Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <Text style={{ padding: 20, textAlign: 'center' }}>Failed to load profile</Text>
                    )}
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
            {/* <View style={styles.header}>
                <Text style={styles.headerTitle}>Top Players 🏆</Text>
            </View> */}
            {/* Header is handled by navigation options now, or we can keep custom one if we hide header in stack */}

            <FlatList
                data={users}
                keyExtractor={(item) => item.id || item._id} // Handle both id formats
                renderItem={renderItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No players yet.</Text>
                    </View>
                }
            />
            {renderProfileModal()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: { padding: 20, backgroundColor: 'white', elevation: 2 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3436', textAlign: 'center' },
    listContent: { padding: 20 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 15, padding: 15, marginBottom: 10, elevation: 2 },
    rankContainer: { width: 40, alignItems: 'center', justifyContent: 'center' },
    rankText: { fontSize: 16, fontWeight: 'bold', color: '#666' },
    avatarContainer: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: '#2196F3' },
    infoContainer: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    stats: { fontSize: 12, color: '#666', marginTop: 2 },
    scoreContainer: { alignItems: 'flex-end' },
    score: { fontSize: 18, fontWeight: 'bold', color: '#2196F3' },
    pts: { fontSize: 10, color: '#999' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: 400, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    profileBody: { alignItems: 'center' },
    profileAvatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    profileAvatarTextLarge: { fontSize: 32, fontWeight: 'bold', color: '#2196F3' },
    profileName: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    profileEmail: { fontSize: 14, color: '#666', marginBottom: 25 },
    statsGrid: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    statBox: { flex: 1, alignItems: 'center', backgroundColor: '#F5F7FA', padding: 15, borderRadius: 12, marginHorizontal: 5 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#2196F3', marginBottom: 5 },
    statLabel: { fontSize: 12, color: '#666' },

    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#999', fontSize: 16 }
});
