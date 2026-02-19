import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAppTheme from '../../hooks/useAppTheme';

const Button = ({
    title,
    onPress,
    variant = 'primary', // primary, secondary, outline, ghost, danger
    size = 'md', // sm, md, lg
    icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    style,
    textStyle,
}) => {
    const { palette } = useAppTheme();

    // Animation for press effect
    const scaleValue = new Animated.Value(1);

    const onPressIn = () => {
        Animated.spring(scaleValue, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const getVariantStyles = () => {
        switch (variant) {
            case 'secondary':
                return {
                    backgroundColor: palette.primarySoft,
                    borderColor: 'transparent',
                    textColor: palette.primary,
                };
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    borderColor: palette.primary,
                    borderWidth: 1.5,
                    textColor: palette.primary,
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    textColor: palette.textMuted,
                };
            case 'danger':
                return {
                    backgroundColor: palette.danger,
                    borderColor: 'transparent',
                    textColor: '#FFFFFF',
                };
            case 'primary':
            default:
                return {
                    backgroundColor: palette.primary,
                    borderColor: 'transparent',
                    textColor: '#FFFFFF',
                };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return {
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    fontSize: 13,
                    height: 32,
                    iconSize: 16,
                };
            case 'lg':
                return {
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    fontSize: 18,
                    height: 56,
                    iconSize: 24,
                };
            case 'md':
            default:
                return {
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    fontSize: 15,
                    height: 44,
                    iconSize: 20,
                };
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    const isDisabled = disabled || loading;

    return (
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={isDisabled}
                style={[
                    styles.button,
                    {
                        backgroundColor: variantStyles.backgroundColor,
                        borderColor: variantStyles.borderColor,
                        borderWidth: variant === 'outline' ? 1.5 : 0,
                        shadowColor: palette.primary,
                        height: sizeStyles.height,
                        paddingHorizontal: sizeStyles.paddingHorizontal,
                        opacity: isDisabled ? 0.6 : 1,
                    },
                    style,
                ]}
            >
                {loading ? (
                    <ActivityIndicator color={variantStyles.textColor} size="small" />
                ) : (
                    <>
                        {icon && iconPosition === 'left' && (
                            <Ionicons
                                name={icon}
                                size={sizeStyles.iconSize}
                                color={variantStyles.textColor}
                                style={{ marginRight: 8 }}
                            />
                        )}
                        <Text
                            style={[
                                styles.text,
                                {
                                    color: variantStyles.textColor,
                                    fontSize: sizeStyles.fontSize,
                                },
                                textStyle,
                            ]}
                        >
                            {title}
                        </Text>
                        {icon && iconPosition === 'right' && (
                            <Ionicons
                                name={icon}
                                size={sizeStyles.iconSize}
                                color={variantStyles.textColor}
                                style={{ marginLeft: 8 }}
                            />
                        )}
                    </>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        // elevation: 1, // subtle elevation
    },
    text: {
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});

export default Button;
