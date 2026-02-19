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

function createLoginTheme(isDark) {
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
      blobBlue: 'rgba(135,152,255,0.2)',
      blobMint: 'rgba(98,117,227,0.22)',
      pillBorder: 'rgba(135,152,255,0.34)',
      cardBg: 'rgba(20,33,62,0.9)',
      cardBorder: 'rgba(86,109,173,0.35)',
      footerLink: '#A7B6FF',
      ring: 'rgba(135,152,255,0.5)',
    };
  }
  return {
    ink: '#12203D',
    muted: '#5A6A88',
    line: '#D7E1F6',
    shell: '#F7FAFF',
    white: '#FFFFFF',
    accentA: '#3C4FE0',
    accentB: '#27368A',
    statusBg: '#E9F0FF',
    bgGradient: ['#E9F0FF', '#F6F9FF', '#EDF5FF'],
    blobBlue: 'rgba(60,79,224,0.16)',
    blobMint: 'rgba(125,154,255,0.16)',
    pillBorder: 'rgba(60,79,224,0.22)',
    cardBg: 'rgba(255,255,255,0.86)',
    cardBorder: 'rgba(255,255,255,0.7)',
    footerLink: '#3C4FE0',
    ring: 'rgba(60,79,224,0.28)',
  };
}

export default function LoginScreen({ navigation }) {
  const { isDark, statusBarStyle } = useAppTheme();
  const THEME = useMemo(() => createLoginTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(THEME), [THEME]);
  const { control, handleSubmit } = useForm();
  const { login, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        duration: 760,
        delay: 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 860,
        delay: 170,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(doodleAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(doodleAnim, {
          toValue: 0,
          duration: 2600,
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
      await login(values.email, values.password);
    } finally {
      setSubmitting(false);
    }
  };

  const doodleShift = doodleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 8],
  });

  const doodleRotate = doodleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-4deg', '4deg'],
  });

  return (
    <View style={styles.page}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={THEME.statusBg} />
      <LinearGradient colors={THEME.bgGradient} style={styles.bg} />

      <Animated.View style={[styles.blob, styles.blobBlue, { transform: [{ translateY: doodleShift }] }]} />
      <Animated.View style={[styles.blob, styles.blobMint, { transform: [{ translateY: doodleShift }] }]} />
      <Animated.View style={[styles.ringDoodle, { transform: [{ rotate: doodleRotate }] }]} />
      <Animated.View style={[styles.sparkDoodle, { transform: [{ rotate: doodleRotate }, { translateY: doodleShift }] }]}>
        <Ionicons name="sparkles" size={20} color={THEME.accentA} />
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View
              style={[
                styles.heroWrap,
                {
                  opacity: heroAnim,
                  transform: [
                    { translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                  ],
                },
              ]}
            >
              <View style={styles.pill}>
                <Ionicons name="planet-outline" size={14} color={THEME.accentA} />
                <Text style={styles.pillText}>QUIZVERSE</Text>
              </View>
              <Text style={styles.heroTitle}>Come Back, Genius.</Text>
              <Text style={styles.heroSub}>Log in and keep your streak alive with daily quiz battles.</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.card,
                {
                  opacity: cardAnim,
                  transform: [
                    { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [36, 0] }) },
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
                    transform: [
                      { translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
                    ],
                  },
                ]}
              >
                <Controller
                  control={control}
                  name="email"
                  rules={{ required: 'Email is required' }}
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.field}>
                      <Text style={styles.label}>Email</Text>
                      <View style={styles.inputWrap}>
                        <Ionicons name="mail-outline" size={18} color={THEME.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="hello@example.com"
                          placeholderTextColor="#8FA0BF"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          value={value}
                          onChangeText={onChange}
                        />
                      </View>
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="password"
                  rules={{ required: 'Password is required' }}
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.field}>
                      <Text style={styles.label}>Password</Text>
                      <View style={styles.inputWrap}>
                        <Ionicons name="lock-closed-outline" size={18} color={THEME.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="Your secure password"
                          placeholderTextColor="#8FA0BF"
                          secureTextEntry={!showPassword}
                          value={value}
                          onChangeText={onChange}
                        />
                        <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeBtn}>
                          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={THEME.muted} />
                        </TouchableOpacity>
                      </View>
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
                        <Text style={styles.primaryBtnText}>Launch My Dashboard</Text>
                        <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>New here?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.footerLink}>Create your account</Text>
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
    alignSelf: 'center',
    width: '100%',
    maxWidth: 540,
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
    fontSize: 34,
    lineHeight: 38,
    color: THEME.ink,
    fontWeight: '900',
    maxWidth: 380,
  },
  heroSub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: THEME.muted,
    maxWidth: 470,
    fontWeight: '600',
  },
  card: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    borderRadius: 30,
    padding: 18,
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    shadowColor: '#0F274E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 9,
  },
  formBlock: {
    backgroundColor: THEME.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.line,
  },
  field: {
    marginBottom: 13,
  },
  label: {
    color: THEME.ink,
    fontWeight: '700',
    marginBottom: 7,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.shell,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: THEME.line,
    height: 52,
    paddingHorizontal: 12,
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
  primaryBtn: {
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 4,
  },
  primaryBtnFill: {
    height: 52,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
  blobBlue: {
    width: 220,
    height: 220,
    top: -70,
    right: -80,
    backgroundColor: THEME.blobBlue,
  },
  blobMint: {
    width: 250,
    height: 250,
    bottom: -140,
    left: -120,
    backgroundColor: THEME.blobMint,
  },
  ringDoodle: {
    position: 'absolute',
    top: 92,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: THEME.ring,
  },
  sparkDoodle: {
    position: 'absolute',
    right: 30,
    top: 140,
  },
});
