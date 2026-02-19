import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import useAuth from '../../hooks/useAuth';
import { adminTheme } from './theme';

const MENU_ITEMS = [
    {
        title: 'Overview',
        items: [
            { name: 'Dashboard', icon: 'grid-outline', route: 'AdminDashboard', matches: ['AdminDashboard'] },
            { name: 'Users', icon: 'people-outline', route: 'UsersManagement', matches: ['UsersManagement', 'UserList', 'UserDetails'] },
            { name: 'History', icon: 'time-outline', route: 'History', matches: ['History'] },
        ],
    },
    {
        title: 'Quiz Operations',
        items: [
            { name: 'Create Quiz', icon: 'add-circle-outline', route: 'CreateQuizChoice', matches: ['CreateQuizChoice', 'CreateManualQuiz', 'CreateExcelQuiz', 'CreateBuiltInQuiz'] },
            { name: 'Manage Quiz', icon: 'layers-outline', route: 'ManageQuizzes', matches: ['ManageQuizzes', 'EditQuiz', 'EditQuestion', 'QuestionsLibrary'] },
            { name: 'Upload Quiz', icon: 'cloud-upload-outline', route: 'BulkUpload', matches: ['BulkUpload'] },
        ],
    },
    {
        title: 'Student Tools',
        items: [
            { name: 'Join Quiz', icon: 'play-outline', route: 'JoinQuiz', matches: ['JoinQuiz', 'QuizPlay', 'QuizResult', 'QuizSolutions'] },
            { name: 'Aptitude', icon: 'bulb-outline', route: 'AptitudeCategory', matches: ['AptitudeCategory'] },
            { name: 'Technical', icon: 'code-slash-outline', route: 'TechnicalSubjects', matches: ['TechnicalSubjects'] },
        ],
    },
];

export default function Sidebar({ onItemPress }) {
    const navigation = useNavigation();
    const route = useRoute();
    const { logout } = useAuth();

    const isActive = (item) => (item.matches || [item.route]).includes(route.name);

    const handleNavigation = (routeName) => {
        navigation.navigate(routeName);
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
                <View style={styles.logoIconWrap}>
                    <Ionicons name="flash" size={18} color="#FFFFFF" />
                </View>
                <View>
                    <Text style={styles.logoText}>Quiz Control</Text>
                    <Text style={styles.logoSubText}>Admin Console</Text>
                </View>
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
                                    isActive(item) && styles.menuItemActive,
                                ]}
                                onPress={() => handleNavigation(item.route)}
                            >
                                <Ionicons
                                    name={item.icon}
                                    size={20}
                                    color={isActive(item) ? '#FFFFFF' : adminTheme.sidebarTextMuted}
                                />
                                <Text style={[styles.menuText, isActive(item) && styles.menuTextActive]}>
                                    {item.name}
                                </Text>
                                {isActive(item) && <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#FF8E8B" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
                <Text style={styles.footerMeta}>v2.0 admin</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: adminTheme.sidebarBg,
        borderRadius: 28,
        height: '100%',
        paddingVertical: 18,
        paddingHorizontal: 12,
        shadowColor: '#081024',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.24,
        shadowRadius: 24,
        elevation: 12,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: adminTheme.sidebarCard,
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 18,
    },
    logoIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: adminTheme.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    logoText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    logoSubText: {
        fontSize: 11,
        color: adminTheme.sidebarTextMuted,
        marginTop: 1,
        letterSpacing: 0.2,
    },
    menuContainer: {
        flex: 1,
    },
    section: {
        marginBottom: 12,
        paddingHorizontal: 2,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '600',
        color: adminTheme.sidebarTextMuted,
        marginBottom: 8,
        paddingHorizontal: 10,
        textTransform: 'uppercase',
        letterSpacing: 1.1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginBottom: 6,
        backgroundColor: 'transparent',
    },
    menuItemActive: {
        backgroundColor: adminTheme.accent,
        shadowColor: adminTheme.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 14,
        elevation: 6,
    },
    menuText: {
        fontSize: 14,
        color: adminTheme.sidebarText,
        marginLeft: 10,
        fontWeight: '600',
        flex: 1,
    },
    menuTextActive: {
        color: '#FFFFFF',
    },
    footer: {
        paddingHorizontal: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#21335E',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A2B53',
        borderRadius: 12,
        padding: 10,
    },
    logoutText: {
        marginLeft: 8,
        color: '#FF8E8B',
        fontWeight: '700',
    },
    footerMeta: {
        color: adminTheme.sidebarTextMuted,
        fontSize: 11,
        marginTop: 10,
        textAlign: 'center',
    },
});
