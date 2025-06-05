# Python Programming Education Platform

This platform provides a comprehensive learning environment for Python programming with separate interfaces for teachers and students.

## Features

### For Teachers
- Create and manage course content (programming exercises, multiple-choice questions, fill-in-the-blank exercises)
- Organize courses into units and lessons
- Create classes and assign students to specific courses
- View student progress and performance

### For Students
- Access assigned courses and lessons
- Complete programming exercises with an integrated code editor
- Take multiple-choice quizzes
- Complete fill-in-the-blank exercises using drag and drop
- View personal progress through a dashboard

## Technical Stack
- Backend: Flask (Python)
- Frontend: React
- Database: SQLite (development) / PostgreSQL (production)
- Authentication: JWT

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Installation

1. Clone the repository
2. Set up the backend:
   ```
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   flask db upgrade
   ```

3. Set up the frontend:
   ```
   cd frontend
   npm install
   ```

4. Run the application:
   - Backend: `flask run` (from the backend directory)
   - Frontend: `npm start` (from the frontend directory)

## Project Structure
- `/backend`: Flask API server
- `/frontend`: React application
- `/docs`: Documentation
