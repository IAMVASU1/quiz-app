# Quiz App Frontend

This is the mobile frontend for the Quiz Application, built with React Native and Expo. It provides a user-friendly interface for students to take quizzes and for faculty to manage them.

## Features

-   **Student Portal**:
    -   **Dashboard**: View recent activity, quick actions.
    -   **Take Quiz**: Join quizzes via code or practice mode.
    -   **Leaderboard**: View top rankings and student profiles.
    -   **History**: Review past quiz attempts and scores.
    -   **Practice**: Aptitude and Technical subject practice modes.

-   **Faculty Portal**:
    -   **Dashboard**: Overview of quizzes and students.
    -   **Create Quiz**: Builder interface to create new quizzes.
    -   **Bulk Upload**: Upload questions via Excel sheet.
    -   **Manage Questions**: View and edit question bank.

-   **Admin Portal**:
    -   Manage users and system settings.

## Tech Stack

-   **Framework**: React Native (Expo)
-   **Navigation**: React Navigation (Stack & Tab)
-   **HTTP Client**: Axios
-   **UI Components**: Custom components + React Native primitives
-   **Icons**: Expo Vector Icons

## Project Structure

```
src/
├── api/            # API service calls
├── components/     # Reusable UI components
├── contexts/       # Global state (AuthContext)
├── navigation/     # Navigation stacks (Auth, Student, Faculty, Admin)
├── screens/        # Application screens
│   ├── auth/       # Login/Register screens
│   ├── student/    # Student-specific screens
│   ├── faculty/    # Faculty-specific screens
│   └── admin/      # Admin screens
├── utils/          # Helper functions
└── App.js          # Entry point
```

## Setup & Installation

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Environment Setup**:
    Ensure the backend server is running.
    Update the API base URL in `src/api/client.js` if testing on a physical device (use your machine's IP address instead of `localhost`).

3.  **Run the app**:
    ```bash
    npx expo start
    ```
    -   Press `a` for Android Emulator
    -   Press `i` for iOS Simulator
    -   Scan QR code with Expo Go app for physical device

## Navigation Flow

-   **AuthStack**: Login -> Register -> Forgot Password
-   **AppTabs**: Main tab navigation based on user role.
    -   **StudentStack**: Home -> Join Quiz -> Play Quiz -> Result -> Leaderboard
    -   **FacultyStack**: Dashboard -> Create Quiz -> Bulk Upload
    -   **AdminStack**: Dashboard -> User Management

## Key Screens

-   **StudentHomeScreen**: Main hub for students.
-   **QuizPlayScreen**: Interactive quiz player with timer.
-   **LeaderboardScreen**: Rankings with accuracy stats.
-   **BulkUploadScreen**: Interface for faculty to upload Excel files.
