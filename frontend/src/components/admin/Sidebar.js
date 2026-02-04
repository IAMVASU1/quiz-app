import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import useAuth from '../../hooks/useAuth';

const MENU_ITEMS = [
    {
        title: 'Main',
        items: [
            { name: 'Dashboard', icon: 'grid-outline', route: 'AdminDashboard' },
            { name: 'Users', icon: 'people-outline', route: 'UsersManagement' },
            { name: 'History', icon: 'time-outline', route: 'History' },
        ]
    },
    {
        title: 'Quiz Management',
        items: [
            { name: 'Create Quiz', icon: 'add-circle-outline', route: 'CreateQuizChoice' },
            { name: 'Manage Quiz', icon: 'list-outline', route: 'ManageQuizzes' },
            { name: 'Upload Quiz', icon: 'cloud-upload-outline', route: 'BulkUpload' },
        ]
    },
    {
        title: 'Student Tools',
        items: [
            { name: 'Join Quiz', icon: 'play-outline', route: 'JoinQuiz' },
            { name: 'Aptitude', icon: 'bulb-outline', route: 'AptitudeCategory' },
            { name: 'Technical', icon: 'code-slash-outline', route: 'TechnicalSubjects' },
        ]
    }
];

export default function Sidebar({ onItemPress }) {
    const navigation = useNavigation();
    const route = useRoute();
    const { logout } = useAuth();

    const isActive = (routeName) => {
        // Simple check, can be more robust
        return route.name === routeName;
    };

    const handleNavigation = (route) => {
        navigation.navigate(route);
        if (onItemPress) {
            onItemPress();
        }
    };

    const handleLogout = async () => {
        await logout();
        if (onItemPress) {
            onItemPress();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Ionicons name="school" size={32} color="#3B82F6" />
                <Text style={styles.logoText}>QuizAdmin</Text>
            </View>

            <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
                {MENU_ITEMS.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        {section.items.map((item, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[
                                    styles.menuItem,
                                    isActive(item.route) && styles.menuItemActive
                                ]}
                                onPress={() => handleNavigation(item.route)}
                            >
                                <Ionicons
                                    name={item.icon}
                                    size={20}
                                    color={isActive(item.route) ? '#3B82F6' : '#64748B'}
                                />
                                <Text style={[
                                    styles.menuText,
                                    isActive(item.route) && styles.menuTextActive
                                ]}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%', // Full width of parent (which is 250px or 280px)
        backgroundColor: '#FFFFFF',
        borderRightWidth: 1,
        borderRightColor: '#E2E8F0',
        height: '100%',
        paddingVertical: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 30,
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0F172A',
        marginLeft: 10,
    },
    menuContainer: {
        flex: 1,
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
        marginBottom: 8,
        paddingHorizontal: 12,
        textTransform: 'uppercase',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 4,
    },
    menuItemActive: {
        backgroundColor: '#EFF6FF',
    },
    menuText: {
        fontSize: 14,
        color: '#64748B',
        marginLeft: 12,
        fontWeight: '500',
    },
    menuTextActive: {
        color: '#3B82F6',
        fontWeight: '600',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    logoutText: {
        marginLeft: 10,
        color: '#EF4444',
        fontWeight: '500',
    }
});
