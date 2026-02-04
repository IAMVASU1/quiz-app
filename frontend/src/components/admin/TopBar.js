import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function TopBar({ title, onMenuPress, showMenu }) {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                {showMenu && (
                    <TouchableOpacity onPress={onMenuPress} style={styles.menuBtn}>
                        <Ionicons name="menu" size={28} color="#0F172A" />
                    </TouchableOpacity>
                )}
                <Text style={styles.title} numberOfLines={1}>{title || 'Dashboard'}</Text>
            </View>

            <View style={styles.rightSection}>
                {!isMobile && (
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
                        <TextInput
                            placeholder="Search..."
                            placeholderTextColor="#94A3B8"
                            style={styles.searchInput}
                        />
                    </View>
                )}



                <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>A</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 64,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 0 : 0,
    },
    leftSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuBtn: {
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0F172A',
        flexShrink: 1,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
        marginRight: 12,
        width: 200,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        color: '#0F172A',
        outlineStyle: 'none',
    },
    iconBtn: {
        padding: 8,
        marginRight: 8,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 1,
        borderColor: '#FFFFFF',
    },
    profileBtn: {
        marginLeft: 4,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
