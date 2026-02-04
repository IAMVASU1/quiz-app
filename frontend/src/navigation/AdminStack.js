import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserDetailsScreen from '../screens/admin/UserDetailsScreen';
import UsersManagementScreen from '../screens/admin/UsersManagementScreen';
import UserListScreen from '../screens/admin/UserListScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import HistoryScreen from '../screens/common/HistoryScreen';

// Faculty Screens
import CreateQuizChoiceScreen from '../screens/faculty/CreateQuizChoiceScreen';
import CreateManualQuizScreen from '../screens/faculty/CreateManualQuizScreen';
import CreateExcelQuizScreen from '../screens/faculty/CreateExcelQuizScreen';
import CreateBuiltInQuizScreen from '../screens/faculty/CreateBuiltInQuizScreen';
import ManageQuizzesScreen from '../screens/faculty/ManageQuizzesScreen';
import QuestionsLibraryScreen from '../screens/faculty/QuestionsLibraryScreen';
import EditQuizScreen from '../screens/faculty/EditQuizScreen';
import EditQuestionScreen from '../screens/faculty/EditQuestionScreen';
import BulkUploadScreen from '../screens/faculty/BulkUploadScreen';

// Student Screens
import JoinQuizScreen from '../screens/student/JoinQuizScreen';
import QuizPlayScreen from '../screens/student/QuizPlayScreen';
import QuizResultScreen from '../screens/student/QuizResultScreen';
import AptitudeCategoryScreen from '../screens/student/AptitudeCategoryScreen';
import TechnicalSubjectsScreen from '../screens/student/TechnicalSubjectsScreen';
import QuizSolutionsScreen from '../screens/student/QuizSolutionsScreen';

const Stack = createNativeStackNavigator();

export default function AdminStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard', headerShown: false }} />
            <Stack.Screen name="UserDetails" component={UserDetailsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="UsersManagement" component={UsersManagementScreen} options={{ headerShown: false }} />


            <Stack.Screen name="UserList" component={UserListScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: false }} />

            {/* Faculty Screens */}
            <Stack.Screen name="CreateQuizChoice" component={CreateQuizChoiceScreen} options={{ title: 'Create Quiz' }} />
            <Stack.Screen name="CreateManualQuiz" component={CreateManualQuizScreen} options={{ title: 'Manual Quiz' }} />
            <Stack.Screen name="CreateExcelQuiz" component={CreateExcelQuizScreen} options={{ title: 'Excel Upload' }} />
            <Stack.Screen name="CreateBuiltInQuiz" component={CreateBuiltInQuizScreen} options={{ title: 'Built-in Quiz' }} />
            <Stack.Screen name="ManageQuizzes" component={ManageQuizzesScreen} options={{ title: 'Manage Quizzes' }} />
            <Stack.Screen name="EditQuiz" component={EditQuizScreen} options={{ title: 'Edit Quiz' }} />
            <Stack.Screen name="EditQuestion" component={EditQuestionScreen} options={{ title: 'Edit Question' }} />
            <Stack.Screen name="QuestionsLibrary" component={QuestionsLibraryScreen} options={{ title: 'Question Bank' }} />
            <Stack.Screen name="BulkUpload" component={BulkUploadScreen} options={{ headerShown: false }} />

            {/* Student Screens */}
            <Stack.Screen name="JoinQuiz" component={JoinQuizScreen} options={{ title: 'Join Quiz' }} />
            <Stack.Screen name="QuizPlay" component={QuizPlayScreen} options={{ gestureEnabled: false, headerShown: false }} />
            <Stack.Screen name="QuizResult" component={QuizResultScreen} options={{ gestureEnabled: false, headerShown: false }} />
            <Stack.Screen name="AptitudeCategory" component={AptitudeCategoryScreen} options={{ title: 'Aptitude Practice' }} />
            <Stack.Screen name="TechnicalSubjects" component={TechnicalSubjectsScreen} options={{ title: 'Technical Practice' }} />
            <Stack.Screen name="QuizSolutions" component={QuizSolutionsScreen} options={{ title: 'Solutions' }} />
        </Stack.Navigator>
    );
}
