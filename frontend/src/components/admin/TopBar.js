import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useAuth from '../../hooks/useAuth';
import { adminTheme } from './theme';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function TopBar({ title, onMenuPress, showMenu, subtitle }) {
    const navigation = useNavigation();
    const { user } = useAuth();
    const initials = (user?.name || 'Admin').charAt(0).toUpperCase();
    const dateLabel = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                {showMenu && (
                    <TouchableOpacity onPress={onMenuPress} style={styles.menuBtn}>
                        <Ionicons name="menu" size={22} color={adminTheme.textStrong} />
                    </TouchableOpacity>
                )}
                <View style={styles.titleWrap}>
                    <Text style={styles.title} numberOfLines={1}>{title || 'Dashboard'}</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>{subtitle || 'Command center overview'}</Text>
                </View>
            </View>

            <View style={styles.rightSection}>
                {!isMobile && (
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={18} color={adminTheme.textMuted} style={styles.searchIcon} />
                        <TextInput
                            placeholder="Search..."
                            placeholderTextColor={adminTheme.textMuted}
                            style={styles.searchInput}
                        />
                    </View>
                )}

                {!isMobile && (
                    <View style={styles.datePill}>
                        <Ionicons name="calendar-outline" size={14} color={adminTheme.accent} />
                        <Text style={styles.dateText}>{dateLabel}</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        minHeight: 78,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderWidth: 1,
        borderColor: '#DDE5F7',
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 18,
        marginTop: 14,
        marginBottom: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        shadowColor: adminTheme.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.09,
        shadowRadius: 16,
        elevation: 4,
    },
    leftSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuBtn: {
        marginRight: 10,
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: '#F0F5FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleWrap: {
        flex: 1,
    },
    title: {
        fontSize: 21,
        fontWeight: '800',
        color: adminTheme.title,
        flexShrink: 1,
        letterSpacing: 0.2,
    },
    subtitle: {
        fontSize: 12,
        color: adminTheme.textMuted,
        marginTop: 2,
        letterSpacing: 0.2,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: adminTheme.surfaceMuted,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: adminTheme.border,
        paddingHorizontal: 12,
        height: 40,
        marginRight: 12,
        width: 220,
    },
    searchIcon: {
        marginRight: 6,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        color: adminTheme.textStrong,
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
    },
    datePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECF2FF',
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 36,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#DBE8FF',
    },
    dateText: {
        marginLeft: 6,
        fontSize: 12,
        color: adminTheme.textStrong,
        fontWeight: '600',
    },
    profileBtn: {
        marginLeft: 2,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: adminTheme.accent,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: adminTheme.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    avatarText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 14,
    },
});
