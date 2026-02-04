import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminLayout from '../../components/admin/AdminLayout';
import MotionContainer from '../../components/admin/MotionContainer';
import Button from '../../components/common/Button';
import { colors } from '../../constants/colors';
import useAuth from '../../hooks/useAuth';
import Avatar from '../../components/common/Avatar';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function UsersManagementScreen({ navigation }) {
    const { user } = useAuth();

    const categories = [
        {
            id: 'admin',
            title: 'Admins',
            icon: 'shield-checkmark',
            color: colors.primary[500],
            bgColor: '#EFF6FF', // specific light blue
            description: 'Manage system administrators, permissions, and platform settings.',
            action: 'View Admins'
        },
        {
            id: 'faculty',
            title: 'Faculty',
            icon: 'school',
            color: colors.warning[500],
            bgColor: '#FFFBEB', // specific light orange
            description: 'Manage teachers, content creators, course materials, and staff.',
            action: 'View Faculty'
        },
        {
            id: 'student',
            title: 'Students',
            icon: 'people',
            color: colors.success[500],
            bgColor: '#ECFDF5', // specific light green
            description: 'Manage enrolled students, track progress, and view performance stats.',
            action: 'View Students'
        }
    ];

    const handlePress = (role) => {
        navigation.navigate('UserList', { role });
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View>
                <Text style={styles.headerTitle}>User Management</Text>
                <Text style={styles.headerSubtitle}>Admins, Faculty, & Students</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.toggleDrawer && navigation.toggleDrawer()} style={styles.profileButton}>
                <Avatar
                    name={user?.name || 'Admin'}
                    size={40}
                    uri={user?.avatar}
                    color={colors.primary[600]}
                />
            </TouchableOpacity>
        </View>
    );

    return (
        <AdminLayout title="User Management" hideDefaultHeader={true}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {renderHeader()}

                <View style={styles.grid}>
                    {categories.map((cat, index) => (
                        <MotionContainer key={cat.id} delay={index * 0.1} style={styles.cardWrapper}>
                            <View style={styles.card}>
                                <View style={[styles.iconContainer, { backgroundColor: cat.bgColor }]}>
                                    <Ionicons name={cat.icon} size={32} color={cat.color} />
                                </View>

                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>{cat.title}</Text>
                                    <Text style={styles.cardDesc}>{cat.description}</Text>
                                </View>

                                <Button
                                    title={`${cat.action} \u2192`}
                                    onPress={() => handlePress(cat.id)}
                                    variant="primary"
                                    size="lg"
                                    style={[styles.actionButton, { backgroundColor: cat.color, borderColor: cat.color }]}
                                    textStyle={{ fontWeight: 'bold' }}
                                />
                            </View>
                        </MotionContainer>
                    ))}
                </View>
            </ScrollView>
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 40,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: colors.surface,
        padding: 24,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.neutral[900],
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: colors.neutral[500],
        fontWeight: '500',
    },
    profileButton: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -12,
    },
    cardWrapper: {
        width: isMobile ? '100%' : '33.33%',
        padding: 12,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: 28,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.neutral[900],
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
        height: 320, // Taller card for premium feel
        justifyContent: 'space-between'
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32, // Perfect circle
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    cardContent: {
        marginBottom: 24,
        flex: 1,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.neutral[900],
        marginBottom: 12,
    },
    cardDesc: {
        fontSize: 15,
        color: colors.neutral[500],
        lineHeight: 24,
        fontWeight: '400',
    },
    actionButton: {
        width: '100%',
        borderRadius: 16,
        paddingVertical: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    }
});
