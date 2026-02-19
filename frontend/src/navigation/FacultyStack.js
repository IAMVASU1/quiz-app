import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FacultyHomeScreen from '../screens/faculty/FacultyHomeScreen';
import CreateQuizChoiceScreen from '../screens/faculty/CreateQuizChoiceScreen';
import CreateManualQuizScreen from '../screens/faculty/CreateManualQuizScreen';
import CreateExcelQuizScreen from '../screens/faculty/CreateExcelQuizScreen';
import CreateBuiltInQuizScreen from '../screens/faculty/CreateBuiltInQuizScreen';
import ManageQuizzesScreen from '../screens/faculty/ManageQuizzesScreen';
import QuestionsLibraryScreen from '../screens/faculty/QuestionsLibraryScreen';
import EditQuizScreen from '../screens/faculty/EditQuizScreen';
import EditQuestionScreen from '../screens/faculty/EditQuestionScreen';
import BulkUploadScreen from '../screens/faculty/BulkUploadScreen';
import QuizResultScreen from '../screens/student/QuizResultScreen';
import useAppTheme from '../hooks/useAppTheme';

const Stack = createNativeStackNavigator();

export default function FacultyStack() {
    const { palette } = useAppTheme();

    return (
        <Stack.Navigator
            screenOptions={{
                contentStyle: { backgroundColor: palette.pageBg },
                headerStyle: { backgroundColor: palette.navCard },
                headerTintColor: palette.text,
                headerTitleStyle: { color: palette.text, fontWeight: '700' },
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen name="FacultyHome" component={FacultyHomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreateQuizChoice" component={CreateQuizChoiceScreen} options={{ title: 'Create Quiz' }} />
            <Stack.Screen name="CreateManualQuiz" component={CreateManualQuizScreen} options={{ title: 'Manual Quiz' }} />
            <Stack.Screen name="CreateExcelQuiz" component={CreateExcelQuizScreen} options={{ title: 'Excel Upload' }} />
            <Stack.Screen name="CreateBuiltInQuiz" component={CreateBuiltInQuizScreen} options={{ title: 'Built-in Quiz' }} />
            <Stack.Screen name="ManageQuizzes" component={ManageQuizzesScreen} options={{ title: 'Manage Quizzes' }} />
            <Stack.Screen name="EditQuiz" component={EditQuizScreen} options={{ title: 'Edit Quiz' }} />
            <Stack.Screen name="EditQuestion" component={EditQuestionScreen} options={{ title: 'Edit Question' }} />
            <Stack.Screen name="QuestionsLibrary" component={QuestionsLibraryScreen} options={{ title: 'Question Bank' }} />
            <Stack.Screen name="BulkUpload" component={BulkUploadScreen} options={{ headerShown: false }} />
            <Stack.Screen name="QuizResult" component={QuizResultScreen} options={{ gestureEnabled: false, headerShown: false }} />
        </Stack.Navigator>
    );
}
