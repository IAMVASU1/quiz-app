export const adminTheme = {
    pageBg: '#EEF3FF',
    pageBgSecondary: '#F7FAFF',
    surface: '#FFFFFF',
    surfaceMuted: '#F6F8FF',
    border: '#DDE5F7',
    textStrong: '#10203F',
    textMuted: '#5A6C8F',
    title: '#0A1633',
    accent: '#1D6BFF',
    accentSoft: '#E7F0FF',
    sidebarBg: '#0D1835',
    sidebarCard: '#132248',
    sidebarText: '#D4DCF1',
    sidebarTextMuted: '#8FA0C7',
    shadow: '#0C1A3A',
    success: '#0FA56E',
    warning: '#EA9B25',
    danger: '#E24C4B',
};

export const getRolePalette = (role = 'student') => {
    if (role === 'admin') {
        return {
            tone: '#1D6BFF',
            soft: '#E7F0FF',
        };
    }
    if (role === 'faculty') {
        return {
            tone: '#EA9B25',
            soft: '#FFF4DE',
        };
    }
    return {
        tone: '#0FA56E',
        soft: '#E8F9F1',
    };
};
