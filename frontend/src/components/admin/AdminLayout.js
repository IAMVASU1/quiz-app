import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Modal, Animated, Easing, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { adminTheme } from './theme';

const DRAWER_WIDTH = 280;
const OPEN_EASING = Easing.bezier(0.22, 1, 0.36, 1);
const CLOSE_EASING = Easing.bezier(0.4, 0, 0.2, 1);

export default function AdminLayout({ children, title, hideDefaultHeader = false }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const sidebarOpacity = useRef(new Animated.Value(0.92)).current;
    const sidebarScale = useRef(new Animated.Value(0.985)).current;
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isDesktopWeb = Platform.OS === 'web' && !isMobile;

    useEffect(() => {
        if (isDesktopWeb) {
            setIsSidebarOpen(false);
            setIsSidebarVisible(false);
            slideAnim.setValue(-DRAWER_WIDTH);
            overlayOpacity.setValue(0);
            sidebarOpacity.setValue(1);
            sidebarScale.setValue(1);
            return;
        }

        if (isSidebarOpen) {
            setIsSidebarVisible(true);
            requestAnimationFrame(() => {
                Animated.parallel([
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 320,
                        useNativeDriver: true,
                        easing: OPEN_EASING,
                    }),
                    Animated.timing(overlayOpacity, {
                        toValue: 1,
                        duration: 260,
                        useNativeDriver: true,
                        easing: OPEN_EASING,
                    }),
                    Animated.timing(sidebarOpacity, {
                        toValue: 1,
                        duration: 250,
                        useNativeDriver: true,
                        easing: OPEN_EASING,
                    }),
                    Animated.timing(sidebarScale, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                        easing: OPEN_EASING,
                    }),
                ]).start();
            });
        } else if (isSidebarVisible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -DRAWER_WIDTH,
                    duration: 240,
                    useNativeDriver: true,
                    easing: CLOSE_EASING,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                    easing: CLOSE_EASING,
                }),
                Animated.timing(sidebarOpacity, {
                    toValue: 0.92,
                    duration: 200,
                    useNativeDriver: true,
                    easing: CLOSE_EASING,
                }),
                Animated.timing(sidebarScale, {
                    toValue: 0.985,
                    duration: 220,
                    useNativeDriver: true,
                    easing: CLOSE_EASING,
                }),
            ]).start(({ finished }) => {
                if (finished) {
                    setIsSidebarVisible(false);
                }
            });
        }
    }, [isSidebarOpen, isSidebarVisible, isDesktopWeb, slideAnim, overlayOpacity, sidebarOpacity, sidebarScale]);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);
    const openSidebar = () => setIsSidebarOpen(true);

    return (
        <View style={styles.shell}>
            <View style={styles.bgOrbLeft} />
            <View style={styles.bgOrbRight} />

            {isDesktopWeb ? (
                <View style={styles.sidebarContainer}>
                    <Sidebar />
                </View>
            ) : (
                <Modal
                    visible={isSidebarVisible}
                    animationType="none"
                    transparent={true}
                    onRequestClose={closeSidebar}
                >
                    <View style={styles.modalRoot}>
                        <Animated.View
                            style={[
                                styles.mobileSidebar,
                                {
                                    opacity: sidebarOpacity,
                                    transform: [{ translateX: slideAnim }, { scale: sidebarScale }],
                                },
                            ]}
                        >
                            <SafeAreaView style={{ flex: 1 }}>
                                <Sidebar onItemPress={closeSidebar} />
                            </SafeAreaView>
                        </Animated.View>
                        <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
                            <TouchableOpacity style={styles.overlayTapTarget} activeOpacity={1} onPress={closeSidebar} />
                        </Animated.View>
                    </View>
                </Modal>
            )}

            <View style={styles.mainContent}>
                {isMobile ? (
                    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                        {!hideDefaultHeader && (
                            <TopBar title={title} onMenuPress={openSidebar} showMenu={true} />
                        )}
                        <View style={[styles.contentContainer, hideDefaultHeader && styles.contentNoHeader]}>
                            {children}
                        </View>
                    </SafeAreaView>
                ) : (
                    <>
                        {!hideDefaultHeader && (
                            <TopBar title={title} onMenuPress={toggleSidebar} showMenu={false} />
                        )}
                        <View style={[styles.contentContainer, hideDefaultHeader && styles.contentNoHeader]}>
                            {children}
                        </View>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    shell: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: adminTheme.pageBg,
        overflow: 'hidden',
    },
    bgOrbLeft: {
        position: 'absolute',
        width: 320,
        height: 320,
        borderRadius: 160,
        backgroundColor: '#D8E7FF',
        top: -140,
        left: -120,
    },
    bgOrbRight: {
        position: 'absolute',
        width: 420,
        height: 420,
        borderRadius: 210,
        backgroundColor: '#EAF4FF',
        bottom: -220,
        right: -140,
    },
    sidebarContainer: {
        width: 272,
        height: '100%',
        zIndex: 40,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    mainContent: {
        flex: 1,
        flexDirection: 'column',
        height: '100%',
        zIndex: 10,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 18,
        paddingBottom: 18,
    },
    contentNoHeader: {
        paddingTop: 18,
    },
    modalRoot: {
        flex: 1,
        flexDirection: 'row',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(8,16,35,0.52)',
    },
    overlayTapTarget: {
        flex: 1,
    },
    mobileSidebar: {
        width: DRAWER_WIDTH,
        height: '100%',
        backgroundColor: 'transparent',
        shadowColor: adminTheme.shadow,
        shadowOffset: {
            width: 6,
            height: 0,
        },
        shadowOpacity: 0.34,
        shadowRadius: 22,
        elevation: 12,
    },
});
