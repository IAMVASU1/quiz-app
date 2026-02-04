import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminLayout from '../../components/admin/AdminLayout';
import { apiListUsers } from '../../api/users.api';
import Button from '../../components/common/Button';
import { colors } from '../../constants/colors';

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
            // For Admin: ONLY Name and Email
            return common;
        } else if (role === 'faculty') {
            // Faculty: Only Name
            return [
                { id: 'name', label: 'Name', flex: 2 }
            ];
        } else {
            // Student: Name + Accuracy
            return [
                { id: 'name', label: 'Name', flex: 2 },
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
            {/* Remove Action column for Admins as the whole row is clickable */}
            {!isAdminView && <Text style={[styles.columnHeader, { width: 80, textAlign: 'center' }]}>Action</Text>}
        </View>
    );

    const renderItem = ({ item }) => {
        const RowComponent = isAdminView ? TouchableOpacity : View;
        const rowProps = isAdminView ? { onPress: () => navigation.navigate('UserDetails', { user: item }) } : {};

        return (
            <RowComponent style={styles.tableRow} {...rowProps}>
                {columns.map((col, index) => (
                    <Text key={index} style={[styles.cell, { flex: col.flex }]} numberOfLines={1}>
                        {col.render ? col.render(item) : item[col.id]}
                    </Text>
                ))}

                {/* For non-admins, keep the button. For admins, row click handles it. */}
                {!isAdminView && (
                    <Button
                        title="View"
                        size="sm"
                        variant="ghost"
                        onPress={() => navigation.navigate('UserDetails', { user: item })}
                        style={{ width: 80 }}
                    />
                )}
                {isAdminView && (
                    <Ionicons name="chevron-forward" size={16} color={colors.neutral[400]} />
                )}
            </RowComponent>
        );
    };

    return (
        <AdminLayout title={`${role.charAt(0).toUpperCase() + role.slice(1)}s List`}>
            <View style={styles.container}>
                <View style={styles.toolbar}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color={colors.neutral[400]} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={`Search ${role}s...`}
                            placeholderTextColor={colors.neutral[400]}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    {/* Filter button removed as per requirements - Search only */}
                </View>

                <View style={styles.tableContainer}>
                    {renderHeader()}
                    {loading ? (
                        <ActivityIndicator size="large" color={colors.primary[500]} style={{ marginTop: 50 }} />
                    ) : (
                        <FlatList
                            data={users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()))}
                            keyExtractor={item => item.id || item._id}
                            renderItem={renderItem}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
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
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 24,
        shadowColor: colors.neutral[900],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.border,
    },
    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.neutral[50],
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44, // Match button height
        maxWidth: 400,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: colors.text.primary,
        outlineStyle: 'none',
    },
    tableContainer: {
        flex: 1,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: 12,
        marginBottom: 8,
        alignItems: 'center',
    },
    columnHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral[100],
    },
    cell: {
        fontSize: 14,
        color: colors.text.primary,
        paddingRight: 8,
    },
});
