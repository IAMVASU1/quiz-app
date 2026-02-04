# Quiz App Backend

This is the backend for the Quiz Application, built with Node.js, Express, and MongoDB. It provides APIs for user authentication, quiz management, question banking, and leaderboard functionality.

## Features

-   **Authentication**: JWT-based authentication with role-based access control (Student, Faculty, Admin).
-   **Quiz Management**: Create, update, delete, and publish quizzes.
-   **Question Bank**: Manage questions with support for bulk upload via Excel.
-   **Quiz Attempts**: Students can take quizzes, and results are automatically calculated.
-   **Leaderboard**: Global leaderboard tracking student performance (Score & Accuracy).
-   **File Upload**: Support for uploading images and Excel files.

## Tech Stack

-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB (with Mongoose)
-   **Authentication**: JSON Web Tokens (JWT)
-   **Validation**: Joi
-   **File Handling**: Multer, XLSX
-   **Security**: Helmet, CORS

## Project Structure

```
src/
├── config/         # Configuration (DB, env)
├── controllers/    # Request handlers
├── middlewares/    # Custom middlewares (Auth, Error, Upload)
├── models/         # Mongoose models (User, Quiz, Question, Attempt)
├── routes/         # API routes
├── services/       # Business logic services
├── utils/          # Utility functions (AsyncHandler, ApiError)
├── validators/     # Joi validation schemas
├── app.js          # Express app setup
└── index.js        # Entry point
```

## Setup & Installation

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Variables**:
    Create a `.env` file in the root directory with the following:
    ```env
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/quiz-app
    JWT_SECRET=your_jwt_secret_key
    CORS_ORIGIN=*
    ```
4.  **Run the server**:
    ```bash
    npm run dev
    ```

## API Endpoints

### Auth
-   `POST /api/v1/auth/register` - Register new user
-   `POST /api/v1/auth/login` - Login user
-   `GET /api/v1/auth/me` - Get current user profile

### Quizzes
-   `POST /api/v1/quizzes` - Create quiz (Faculty)
-   `GET /api/v1/quizzes` - List quizzes
-   `GET /api/v1/quizzes/:id` - Get quiz details

### Questions
-   `POST /api/v1/questions` - Add question
-   `POST /api/v1/upload/bulk-questions` - Bulk upload questions (Excel)

### Attempts
-   `POST /api/v1/attempts/start` - Start a quiz attempt
-   `POST /api/v1/attempts/:id/submit` - Submit quiz answers
-   `GET /api/v1/attempts/history` - Get student attempt history

### Leaderboard
-   `GET /api/v1/leaderboard/top` - Get top students
-   `GET /api/v1/leaderboard/:id` - Get student profile

## Roles

-   **Admin**: Full access to manage users and system.
-   **Faculty**: Can create quizzes, manage questions, and view results.
-   **Student**: Can take quizzes, view history, and check leaderboard.
