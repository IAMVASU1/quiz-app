import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import JoinQuizScreen from '../screens/student/JoinQuizScreen';
import QuizPlayScreen from '../screens/student/QuizPlayScreen';
import QuizResultScreen from '../screens/student/QuizResultScreen';
import LeaderboardScreen from '../screens/student/LeaderboardScreen';
import AptitudeCategoryScreen from '../screens/student/AptitudeCategoryScreen';
import TechnicalSubjectsScreen from '../screens/student/TechnicalSubjectsScreen';
import QuizSolutionsScreen from '../screens/student/QuizSolutionsScreen';

const Stack = createNativeStackNavigator();

export default function StudentStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="StudentHome" component={StudentHomeScreen} />
            <Stack.Screen name="JoinQuiz" component={JoinQuizScreen} options={{ headerShown: true, title: 'Join Quiz' }} />
            <Stack.Screen name="QuizPlay" component={QuizPlayScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="QuizResult" component={QuizResultScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="QuizSolutions" component={QuizSolutionsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Leaderboard' }} />
            <Stack.Screen name="AptitudeCategory" component={AptitudeCategoryScreen} options={{ headerShown: true, title: 'Aptitude Practice' }} />
            <Stack.Screen name="TechnicalSubjects" component={TechnicalSubjectsScreen} options={{ title: 'Technical Practice' }} />
        </Stack.Navigator>
    );
}
