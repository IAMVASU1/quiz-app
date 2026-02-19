import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminLayout from '../../components/admin/AdminLayout';
import { apiListUsers } from '../../api/users.api';
import Button from '../../components/common/Button';
import { adminTheme, getRolePalette } from '../../components/admin/theme';

export default function UserListScreen({ route, navigation }) {
    const { role } = route.params || { role: 'student' };
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const isAdminView = role === 'admin';

    useEffect(() => {
        loadUsers();
    }, [role]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await apiListUsers(1, 1000);
            if (data && data.users) {
                const filtered = data.users.filter(u => u.role === role);
                setUsers(filtered);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getColumns = () => {
        const common = [
            { id: 'name', label: 'Name', flex: 2 },
            { id: 'email', label: 'Email', flex: 3 },
        ];

        if (isAdminView) {
            return common;
        } else if (role === 'faculty') {
            return [
                { id: 'name', label: 'Name', flex: 2 },
                { id: 'email', label: 'Email', flex: 3 },
            ];
        } else {
            return [
                { id: 'name', label: 'Name', flex: 2 },
                { id: 'email', label: 'Email', flex: 3 },
                {
                    id: 'accuracy',
                    label: 'Accuracy',
                    flex: 1,
                    render: (u) => u.accuracy !== undefined && u.accuracy !== null ? `${u.accuracy}%` : 'N/A'
                },
            ];
        }
    };

    const columns = getColumns();

    const renderHeader = () => (
        <View style={styles.tableHeader}>
            {columns.map((col, index) => (
                <Text key={index} style={[styles.columnHeader, { flex: col.flex }]}>
                    {col.label}
                </Text>
            ))}
            {!isAdminView && <Text style={[styles.columnHeader, { width: 80, textAlign: 'center' }]}>Action</Text>}
        </View>
    );

    const renderItem = ({ item, index }) => {
        const RowComponent = isAdminView ? TouchableOpacity : View;
        const rowProps = isAdminView ? { onPress: () => navigation.navigate('UserDetails', { user: item }) } : {};

        return (
            <RowComponent style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]} {...rowProps}>
                {columns.map((col, index) => (
                    <Text key={index} style={[styles.cell, { flex: col.flex }]} numberOfLines={1}>
                        {col.render ? col.render(item) : item[col.id]}
                    </Text>
                ))}

                {!isAdminView && (
                    <Button
                        title="View"
                        size="sm"
                        variant="outline"
                        onPress={() => navigation.navigate('UserDetails', { user: item })}
                        style={{ width: 80, borderColor: getRolePalette(role).tone }}
                        textStyle={{ color: getRolePalette(role).tone }}
                    />
                )}
                {isAdminView && (
                    <Ionicons name="chevron-forward" size={16} color={adminTheme.textMuted} />
                )}
            </RowComponent>
        );
    };

    return (
        <AdminLayout title={`${role.charAt(0).toUpperCase() + role.slice(1)}s List`}>
            <View style={styles.container}>
                <View style={styles.headerStrip}>
                    <Text style={styles.headerTitle}>
                        {role.charAt(0).toUpperCase() + role.slice(1)} Directory
                    </Text>
                    <View style={[styles.rolePill, { backgroundColor: getRolePalette(role).soft }]}>
                        <View style={[styles.roleDot, { backgroundColor: getRolePalette(role).tone }]} />
                        <Text style={[styles.rolePillText, { color: getRolePalette(role).tone }]}>{role}</Text>
                    </View>
                </View>

                <View style={styles.toolbar}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={18} color={adminTheme.textMuted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={`Search ${role}s...`}
                            placeholderTextColor={adminTheme.textMuted}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                <View style={styles.tableContainer}>
                    {renderHeader()}
                    {loading ? (
                        <ActivityIndicator size="large" color={adminTheme.accent} style={{ marginTop: 40 }} />
                    ) : (
                        <FlatList
                            data={users.filter(u => {
                                const query = search.trim().toLowerCase();
                                if (!query) return true;
                                return (
                                    (u.name || '').toLowerCase().includes(query) ||
                                    (u.email || '').toLowerCase().includes(query)
                                );
                            })}
                            keyExtractor={item => item.id || item._id}
                            renderItem={renderItem}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={<Text style={styles.emptyText}>No users found for this filter.</Text>}
                        />
                    )}
                </View>
            </View>
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderRadius: 22,
        padding: 18,
        shadowColor: adminTheme.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#DDE5F7',
    },
    headerStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: adminTheme.title,
    },
    rolePill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    roleDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    rolePillText: {
        textTransform: 'capitalize',
        fontWeight: '700',
        fontSize: 12,
    },
    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: adminTheme.surfaceMuted,
        borderWidth: 1,
        borderColor: adminTheme.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 46,
        maxWidth: 460,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: adminTheme.textStrong,
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
    },
    tableContainer: {
        flex: 1,
        backgroundColor: '#F8FAFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E6ECFA',
        paddingHorizontal: 12,
        paddingTop: 6,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5ECFA',
        paddingVertical: 12,
        marginBottom: 8,
        alignItems: 'center',
    },
    columnHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: adminTheme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E8EEFB',
    },
    tableRowAlt: {
        backgroundColor: '#F3F7FF',
    },
    cell: {
        fontSize: 14,
        color: adminTheme.textStrong,
        paddingRight: 8,
        fontWeight: '500',
    },
    emptyText: {
        textAlign: 'center',
        color: adminTheme.textMuted,
        paddingVertical: 28,
    },
});
