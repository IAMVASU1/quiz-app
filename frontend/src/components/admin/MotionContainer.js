import React from 'react';
import { View, Platform } from 'react-native';

let Motion;
if (Platform.OS === 'web') {
    try {
        Motion = require('framer-motion').motion;
    } catch (e) {
        console.warn('Framer Motion not found');
    }
}

export default function MotionContainer({ children, style, delay = 0 }) {
    if (Platform.OS === 'web' && Motion) {
        // Convert React Native style object to CSS style object if needed, 
        // but framer-motion accepts style prop. 
        // Note: React Native Web handles style prop on HTML elements usually.
        return (
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay }}
                style={{ ...style, display: 'flex', flexDirection: 'column' }} // Ensure flex behavior matches View
            >
                {children}
            </Motion.div>
        );
    }
    return <View style={style}>{children}</View>;
}
