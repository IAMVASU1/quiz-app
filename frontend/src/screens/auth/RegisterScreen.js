import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAuth from '../../hooks/useAuth';
import useAppTheme from '../../hooks/useAppTheme';

function createRegisterTheme(isDark) {
  if (isDark) {
    return {
      ink: '#E8EEFF',
      muted: '#A2AFCE',
      line: '#2D3D64',
      shell: '#1A2948',
      white: '#16223F',
      accentA: '#8798FF',
      accentB: '#6275E3',
      statusBg: '#0B1224',
      bgGradient: ['#0B1224', '#101A33', '#132241'],
      blobTop: 'rgba(135,152,255,0.2)',
      blobBottom: 'rgba(98,117,227,0.22)',
      pillBorder: 'rgba(135,152,255,0.34)',
      cardBg: 'rgba(20,33,62,0.9)',
      cardBorder: 'rgba(86,109,173,0.35)',
      footerLink: '#A7B6FF',
      zig: 'rgba(135,152,255,0.5)',
      roleActive: '#2A3D74',
      roleErrorBg: '#37233A',
      roleErrorBorder: '#B06A8D',
    };
  }
  return {
    ink: '#17223A',
    muted: '#5F6D85',
    line: '#DCE4F3',
    shell: '#F7F9FF',
    white: '#FFFFFF',
    accentA: '#3C4FE0',
    accentB: '#27368A',
    statusBg: '#E9F0FF',
    bgGradient: ['#E9F0FF', '#F6F9FF', '#EDF5FF'],
    blobTop: 'rgba(60,79,224,0.16)',
    blobBottom: 'rgba(125,154,255,0.16)',
    pillBorder: 'rgba(60,79,224,0.26)',
    cardBg: 'rgba(255,255,255,0.86)',
    cardBorder: 'rgba(255,255,255,0.7)',
    footerLink: '#3C4FE0',
    zig: 'rgba(60,79,224,0.45)',
    roleActive: '#1C2037',
    roleErrorBg: '#FFF2F5',
    roleErrorBorder: '#E55F7B',
  };
}

export default function RegisterScreen({ navigation }) {
  const { isDark, statusBarStyle } = useAppTheme();
  const THEME = useMemo(() => createRegisterTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(THEME), [THEME]);
  const { control, handleSubmit, watch, formState: { errors } } = useForm();
  const { register, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const doodleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 780,
        delay: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 880,
        delay: 180,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(doodleAnim, {
          toValue: 1,
          duration: 2700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(doodleAnim, {
          toValue: 0,
          duration: 2700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [cardAnim, doodleAnim, formAnim, heroAnim]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role || 'student',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const doodleShift = doodleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, -10],
  });

  const doodleRotate = doodleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['5deg', '-5deg'],
  });

  return (
    <View style={styles.page}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={THEME.statusBg} />
      <LinearGradient colors={THEME.bgGradient} style={styles.bg} />

      <Animated.View style={[styles.blob, styles.blobTop, { transform: [{ translateY: doodleShift }] }]} />
      <Animated.View style={[styles.blob, styles.blobBottom, { transform: [{ translateY: doodleShift }] }]} />
      <Animated.View style={[styles.zigDoodle, { transform: [{ rotate: doodleRotate }] }]}>
        <Text style={styles.zigText}>~ ~ ~</Text>
      </Animated.View>
      <Animated.View style={[styles.starDoodle, { transform: [{ translateY: doodleShift }] }]}>
        <Ionicons name="sparkles-outline" size={22} color={THEME.accentA} />
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View
              style={[
                styles.heroWrap,
                {
                  opacity: heroAnim,
                  transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
                },
              ]}
            >
              <View style={styles.pill}>
                <Ionicons name="rocket-outline" size={14} color={THEME.accentA} />
                <Text style={styles.pillText}>NEW PLAYER</Text>
              </View>
              <Text style={styles.heroTitle}>Build Your Quiz Identity.</Text>
              <Text style={styles.heroSub}>Set up your profile and jump into a smarter, faster learning arena.</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.card,
                {
                  opacity: cardAnim,
                  transform: [
                    { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [34, 0] }) },
                    { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.formBlock,
                  {
                    opacity: formAnim,
                    transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
                  },
                ]}
              >
                <Controller
                  control={control}
                  name="name"
                  rules={{ required: 'Full name is required' }}
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.field}>
                      <Text style={styles.label}>Full Name</Text>
                      <View style={[styles.inputWrap, errors.name && styles.inputWrapError]}>
                        <Ionicons name="person-outline" size={18} color={THEME.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="Your name"
                          placeholderTextColor="#8E9CB6"
                          value={value}
                          onChangeText={onChange}
                        />
                      </View>
                      {errors.name ? <Text style={styles.errorText}>{errors.name.message}</Text> : null}
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="email"
                  rules={{ required: 'Email is required' }}
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.field}>
                      <Text style={styles.label}>Email</Text>
                      <View style={[styles.inputWrap, errors.email && styles.inputWrapError]}>
                        <Ionicons name="mail-outline" size={18} color={THEME.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="name@campus.edu"
                          placeholderTextColor="#8E9CB6"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          value={value}
                          onChangeText={onChange}
                        />
                      </View>
                      {errors.email ? <Text style={styles.errorText}>{errors.email.message}</Text> : null}
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="role"
                  defaultValue="student"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.field}>
                      <Text style={styles.label}>Role</Text>
                      <View style={styles.roleRow}>
                        {['student', 'faculty'].map((role) => {
                          const isActive = value === role;
                          return (
                            <TouchableOpacity
                              key={role}
                              style={[styles.roleChip, isActive && styles.roleChipActive]}
                              onPress={() => onChange(role)}
                              activeOpacity={0.9}
                            >
                              <Ionicons
                                name={role === 'student' ? 'school-outline' : 'briefcase-outline'}
                                size={14}
                                color={isActive ? '#FFFFFF' : THEME.muted}
                              />
                              <Text style={[styles.roleChipText, isActive && styles.roleChipTextActive]}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="password"
                  rules={{
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.field}>
                      <Text style={styles.label}>Password</Text>
                      <View style={[styles.inputWrap, errors.password && styles.inputWrapError]}>
                        <Ionicons name="lock-closed-outline" size={18} color={THEME.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="Create a password"
                          placeholderTextColor="#8E9CB6"
                          secureTextEntry={!showPassword}
                          value={value}
                          onChangeText={onChange}
                        />
                        <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeBtn}>
                          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={THEME.muted} />
                        </TouchableOpacity>
                      </View>
                      {errors.password ? <Text style={styles.errorText}>{errors.password.message}</Text> : null}
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  rules={{
                    validate: (val) => val === watch('password') || 'Passwords do not match',
                  }}
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.field}>
                      <Text style={styles.label}>Confirm Password</Text>
                      <View style={[styles.inputWrap, errors.confirmPassword && styles.inputWrapError]}>
                        <Ionicons name="shield-checkmark-outline" size={18} color={THEME.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="Type it again"
                          placeholderTextColor="#8E9CB6"
                          secureTextEntry={!showConfirmPassword}
                          value={value}
                          onChangeText={onChange}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)} style={styles.eyeBtn}>
                          <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={THEME.muted} />
                        </TouchableOpacity>
                      </View>
                      {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword.message}</Text> : null}
                    </View>
                  )}
                />

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleSubmit(onSubmit)}
                  disabled={submitting || loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient colors={[THEME.accentA, THEME.accentB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtnFill}>
                    {submitting || loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>Create Account</Text>
                        <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Already registered?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Sign in instead</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (THEME) => StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: THEME.statusBg,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  kav: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  heroWrap: {
    marginBottom: 14,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: THEME.pillBorder,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pillText: {
    marginLeft: 6,
    fontSize: 11,
    color: THEME.accentA,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 33,
    lineHeight: 38,
    fontWeight: '900',
    color: THEME.ink,
    maxWidth: 430,
  },
  heroSub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: THEME.muted,
    fontWeight: '600',
    maxWidth: 490,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderRadius: 30,
    padding: 18,
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    shadowColor: '#2C2035',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
    elevation: 9,
  },
  formBlock: {
    backgroundColor: THEME.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.line,
    padding: 16,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    color: THEME.ink,
    fontWeight: '700',
    marginBottom: 7,
    fontSize: 13,
  },
  inputWrap: {
    height: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: THEME.line,
    backgroundColor: THEME.shell,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputWrapError: {
    borderColor: THEME.roleErrorBorder,
    backgroundColor: THEME.roleErrorBg,
  },
  input: {
    flex: 1,
    marginLeft: 9,
    height: '100%',
    color: THEME.ink,
    fontSize: 15,
    fontWeight: '600',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 6,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '700',
    color: '#CC395B',
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleChip: {
    width: '48.5%',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.line,
    backgroundColor: THEME.shell,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleChipActive: {
    backgroundColor: THEME.roleActive,
    borderColor: THEME.roleActive,
  },
  roleChipText: {
    marginLeft: 6,
    color: THEME.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  primaryBtn: {
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 4,
  },
  primaryBtnFill: {
    height: 52,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginRight: 8,
    letterSpacing: 0.2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  footerText: {
    color: THEME.muted,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 5,
  },
  footerLink: {
    color: THEME.footerLink,
    fontSize: 13,
    fontWeight: '800',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTop: {
    width: 250,
    height: 250,
    right: -110,
    top: -100,
    backgroundColor: THEME.blobTop,
  },
  blobBottom: {
    width: 240,
    height: 240,
    left: -110,
    bottom: -120,
    backgroundColor: THEME.blobBottom,
  },
  zigDoodle: {
    position: 'absolute',
    top: 104,
    left: 20,
  },
  zigText: {
    color: THEME.zig,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
  },
  starDoodle: {
    position: 'absolute',
    right: 26,
    top: 146,
  },
});
