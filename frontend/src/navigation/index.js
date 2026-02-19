import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import HistoryScreen from '../screens/student/HistoryScreen';
import useAuth from '../hooks/useAuth';
import useAppTheme from '../hooks/useAppTheme';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { palette } = useAppTheme();
  if (loading) return null;
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.pageBg },
        headerStyle: { backgroundColor: palette.navCard },
        headerTintColor: palette.text,
        headerTitleStyle: { color: palette.text, fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="AppTabs" component={AppTabs} />
          <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: true, title: 'My History' }} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}
