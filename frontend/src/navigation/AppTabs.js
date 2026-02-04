import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '../hooks/useAuth';

import StudentStack from './StudentStack';
import FacultyStack from './FacultyStack';
import AdminStack from './AdminStack';
import ProfileScreen from '../screens/common/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
    const { user } = useAuth();

    const getRoleStack = () => {
        switch (user?.role) {
            case 'admin':
                return AdminStack;
            case 'faculty':
                return FacultyStack;
            case 'student':
            default:
                return StudentStack;
        }
    };

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#2b6cb0',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: ((route) => {
                    const routeName = getFocusedRouteNameFromRoute(route) ?? "";
                    if (routeName === 'QuizPlay' || user?.role === 'admin') {
                        return { display: 'none' };
                    }
                    return { display: 'flex' };
                })(route),
            })}
        >
            <Tab.Screen name="Home" component={getRoleStack()} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}
