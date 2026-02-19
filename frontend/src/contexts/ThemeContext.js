import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';

const STORAGE_KEY = 'ugsf_theme_mode';

const LIGHT_PALETTE = {
    pageBg: '#EDF2FF',
    surface: '#F9FBFF',
    card: '#FFFFFF',
    cardMuted: '#F5F8FF',
    border: '#D8E3F7',
    text: '#1E2B47',
    textMuted: '#6E7F9D',
    primary: '#4F66F8',
    primarySoft: '#E9EDFF',
    secondary: '#15B49E',
    secondarySoft: '#E6F8F4',
    accent: '#7F69F2',
    danger: '#E24C4B',
    warning: '#EA9B25',
    success: '#10A36E',
    overlay: 'rgba(10,17,33,0.35)',
    inputBg: '#F7FAFF',
    navCard: '#FFFFFF',
    tabBar: '#FFFFFF',
    tabBarBorder: '#D6E3FB',
    tabInactive: '#7B8AA6',
};

const DARK_PALETTE = {
    pageBg: '#0B1224',
    surface: '#111B33',
    card: '#16223F',
    cardMuted: '#1A294A',
    border: '#2A385E',
    text: '#E8EEFF',
    textMuted: '#A0AECF',
    primary: '#8798FF',
    primarySoft: '#263865',
    secondary: '#4FD8C3',
    secondarySoft: '#1B4A47',
    accent: '#B095FF',
    danger: '#FF7A8E',
    warning: '#FFC972',
    success: '#56D9A7',
    overlay: 'rgba(1,6,15,0.62)',
    inputBg: '#1A294A',
    navCard: '#101A31',
    tabBar: '#101A31',
    tabBarBorder: '#24355C',
    tabInactive: '#8D9BB7',
};

const ThemeContext = createContext({
    mode: 'light',
    isDark: false,
    ready: false,
    palette: LIGHT_PALETTE,
    statusBarStyle: 'dark-content',
    navigationTheme: NavigationDefaultTheme,
    toggleTheme: () => { },
    setThemeMode: () => { },
});

function buildNavigationTheme(mode, palette) {
    const isDark = mode === 'dark';
    const base = isDark ? NavigationDarkTheme : NavigationDefaultTheme;
    return {
        ...base,
        dark: isDark,
        colors: {
            ...base.colors,
            primary: palette.primary,
            background: palette.pageBg,
            card: palette.navCard,
            text: palette.text,
            border: palette.border,
            notification: palette.accent,
        },
    };
}

export function ThemeProvider({ children }) {
    const [mode, setMode] = useState('light');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const storedMode = await AsyncStorage.getItem(STORAGE_KEY);
                if (mounted && (storedMode === 'light' || storedMode === 'dark')) {
                    setMode(storedMode);
                }
            } catch (error) {
                console.error('Failed to load theme mode:', error);
            } finally {
                if (mounted) setReady(true);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!ready) return;
        AsyncStorage.setItem(STORAGE_KEY, mode).catch((error) => {
            console.error('Failed to save theme mode:', error);
        });
    }, [mode, ready]);

    const toggleTheme = useCallback(() => {
        setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const value = useMemo(() => {
        const isDark = mode === 'dark';
        const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
        return {
            mode,
            isDark,
            ready,
            palette,
            statusBarStyle: isDark ? 'light-content' : 'dark-content',
            navigationTheme: buildNavigationTheme(mode, palette),
            toggleTheme,
            setThemeMode: setMode,
        };
    }, [mode, ready, toggleTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export default ThemeContext;
