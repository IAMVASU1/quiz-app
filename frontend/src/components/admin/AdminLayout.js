import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Modal, Dimensions, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const { width } = Dimensions.get('window');

export default function AdminLayout({ children, title }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(-300)).current; // Start off-screen
    const isMobile = width < 768;

    useEffect(() => {
        if (isSidebarOpen) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: -300,
                duration: 250,
                useNativeDriver: true,
                easing: Easing.in(Easing.ease),
            }).start();
        }
    }, [isSidebarOpen]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <View style={styles.container}>
            {/* Sidebar - Permanent on Desktop (Web), Hidden on Mobile */}
            {Platform.OS === 'web' && !isMobile ? (
                <View style={styles.sidebarContainer}>
                    <Sidebar />
                </View>
            ) : (
                <Modal
                    visible={isSidebarOpen}
                    animationType="none" // We handle animation manually
                    transparent={true}
                    onRequestClose={closeSidebar}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={closeSidebar}
                    >
                        <Animated.View
                            style={[
                                styles.mobileSidebar,
                                { transform: [{ translateX: slideAnim }] }
                            ]}
                        >
                            <SafeAreaView style={{ flex: 1 }}>
                                <Sidebar onItemPress={closeSidebar} />
                            </SafeAreaView>
                        </Animated.View>
                    </TouchableOpacity>
                </Modal>
            )}

            {/* Main Content */}
            <View style={styles.mainContent}>
                {isMobile ? (
                    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                        <TopBar
                            title={title}
                            onMenuPress={toggleSidebar}
                            showMenu={true}
                        />
                        <View style={styles.contentContainer}>
                            {children}
                        </View>
                    </SafeAreaView>
                ) : (
                    <>
                        <TopBar
                            title={title}
                            onMenuPress={toggleSidebar}
                            showMenu={false}
                        />
                        <View style={styles.contentContainer}>
                            {children}
                        </View>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
    },
    sidebarContainer: {
        width: 250,
        height: '100%',
        zIndex: 10,
        borderRightWidth: 1,
        borderRightColor: '#E2E8F0',
    },
    mainContent: {
        flex: 1,
        flexDirection: 'column',
        height: '100%',
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
    },
    mobileSidebar: {
        width: 280,
        height: '100%',
        backgroundColor: '#FFF',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});
