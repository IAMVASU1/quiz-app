import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';

export default function ForgotPasswordScreen({ navigation }) {
    const { control, handleSubmit } = useForm();
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (values) => {
        setSubmitting(true);
        // TODO: Implement actual API call
        setTimeout(() => {
            setSubmitting(false);
            Alert.alert('Reset Link Sent', 'If an account exists with this email, you will receive a password reset link.');
            navigation.goBack();
        }, 1000);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a reset link</Text>

            <Controller
                control={control}
                name="email"
                defaultValue=""
                rules={{ required: 'Email is required' }}
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={value}
                        onChangeText={onChange}
                    />
                )}
            />

            <View style={{ marginTop: 10 }}>
                <Button
                    title={submitting ? "Sending..." : "Send Reset Link"}
                    onPress={handleSubmit(onSubmit)}
                    disabled={submitting}
                />
            </View>

            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => navigation.goBack()}>
                <Text style={styles.link}>Back to Login</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, flex: 1, justifyContent: 'center' },
    title: { fontSize: 28, marginBottom: 10, textAlign: 'center' },
    subtitle: { fontSize: 16, marginBottom: 20, textAlign: 'center', color: '#666' },
    input: { borderWidth: 1, padding: 12, marginBottom: 12, borderRadius: 6 },
    link: { color: '#2b6cb0' },
});
