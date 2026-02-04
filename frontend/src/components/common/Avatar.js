import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

export default function Avatar({ uri, name, size = 50, color = '#2196F3' }) {
    const initials = name ? name.charAt(0).toUpperCase() : 'U';

    if (uri) {
        return (
            <Image
                source={{ uri }}
                style={{ width: size, height: size, borderRadius: size / 2 }}
                contentFit="cover"
                transition={200}
            />
        );
    }

    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '20' }]}>
            <Text style={[styles.text, { fontSize: size * 0.4, color: color }]}>
                {initials}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    text: {
        fontWeight: 'bold',
    }
});
