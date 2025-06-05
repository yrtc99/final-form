import os
import sys
from datetime import datetime
import json
from flask import Flask

# 修復導入路徑問題
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))  # 添加父目錄到路徑
from backend import db, create_app
from backend.models.user import User
from backend.models.course import Course, Unit, Enrollment
from backend.models.lesson import Lesson, CodingExercise, MultipleChoiceQuestion, FillBlankExercise

def init_db():
    """Initialize the database with sample data"""
    app = create_app()
    
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Check if data already exists
        if User.query.first() is not None:
            print("Database already contains data. Skipping initialization.")
            return
        
        # Create sample users
        teacher1 = User(
            username="teacher1",
            email="teacher1@example.com",
            password="password123",
            role="teacher"
        )
        
        teacher2 = User(
            username="teacher2",
            email="teacher2@example.com",
            password="password123",
            role="teacher"
        )
        
        student1 = User(
            username="student1",
            email="student1@example.com",
            password="password123",
            role="student"
        )
        
        student2 = User(
            username="student2",
            email="student2@example.com",
            password="password123",
            role="student"
        )
        
        student3 = User(
            username="student3",
            email="student3@example.com",
            password="password123",
            role="student"
        )
        
        db.session.add_all([teacher1, teacher2, student1, student2, student3])
        db.session.commit()
        
        # Create sample courses
        python_basics = Course(
            title="Python Basics",
            description="Learn the fundamentals of Python programming",
            creator_id=teacher1.id
        )
        
        advanced_python = Course(
            title="Advanced Python",
            description="Take your Python skills to the next level",
            creator_id=teacher1.id
        )
        
        data_science = Course(
            title="Python for Data Science",
            description="Learn to use Python for data analysis and visualization",
            creator_id=teacher2.id
        )
        
        db.session.add_all([python_basics, advanced_python, data_science])
        db.session.commit()
        
        # Create sample units for Python Basics
        units = [
            Unit(title="Introduction to Python", description="Get started with Python", order=1, course_id=python_basics.id),
            Unit(title="Variables and Data Types", description="Learn about Python's data types", order=2, course_id=python_basics.id),
            Unit(title="Control Flow", description="Conditionals and loops", order=3, course_id=python_basics.id)
        ]
        
        db.session.add_all(units)
        db.session.commit()
        
        # Create sample lessons for the first unit
        lessons = [
            Lesson(title="What is Python?", description="Introduction to Python programming language", order=1, unit_id=units[0].id),
            Lesson(title="Setting Up Your Environment", description="Installing Python and tools", order=2, unit_id=units[0].id),
            Lesson(title="Your First Python Program", description="Writing and running a simple program", order=3, unit_id=units[0].id)
        ]
        
        db.session.add_all(lessons)
        db.session.commit()
        
        # Create a sample coding exercise
        coding_exercise = CodingExercise(
            lesson_id=lessons[2].id,
            instructions="Write a program that prints 'Hello, World!' to the console.",
            starter_code="# Write your code here\n\n",
            solution_code="print('Hello, World!')",
            test_cases=json.dumps([
                {
                    "input": "",
                    "expected_output": "Hello, World!"
                }
            ]),
            max_score=100
        )
        
        db.session.add(coding_exercise)
        db.session.commit()
        
        # Create sample multiple choice questions
        mc_questions = [
            MultipleChoiceQuestion(
                lesson_id=lessons[0].id,
                question_text="Which of the following is NOT a characteristic of Python?",
                options=json.dumps([
                    "Interpreted language",
                    "Statically typed",
                    "Object-oriented",
                    "Cross-platform"
                ]),
                correct_option_index=1,
                explanation="Python is dynamically typed, not statically typed.",
                points=10
            ),
            MultipleChoiceQuestion(
                lesson_id=lessons[0].id,
                question_text="Who created Python?",
                options=json.dumps([
                    "Guido van Rossum",
                    "James Gosling",
                    "Bjarne Stroustrup",
                    "Dennis Ritchie"
                ]),
                correct_option_index=0,
                explanation="Python was created by Guido van Rossum.",
                points=10
            )
        ]
        
        db.session.add_all(mc_questions)
        db.session.commit()
        
        # Create a sample fill-in-the-blank exercise
        fill_blank = FillBlankExercise(
            lesson_id=lessons[1].id,
            text_template="To check your Python version, you can use the command {{0}} in your terminal. Python files have the extension {{1}}.",
            blanks=json.dumps([
                {
                    "options": ["python --version", "python -v", "py --version", "python -version"],
                    "correct_answer": "python --version"
                },
                {
                    "options": [".py", ".python", ".pyth", ".pyt"],
                    "correct_answer": ".py"
                }
            ]),
            points=20
        )
        
        db.session.add(fill_blank)
        db.session.commit()
        
        # Enroll students in courses
        enrollments = [
            Enrollment(student_id=student1.id, course_id=python_basics.id),
            Enrollment(student_id=student2.id, course_id=python_basics.id),
            Enrollment(student_id=student3.id, course_id=python_basics.id),
            Enrollment(student_id=student1.id, course_id=advanced_python.id)
        ]
        
        db.session.add_all(enrollments)
        db.session.commit()
        
        print("Database initialized with sample data!")

if __name__ == "__main__":
    init_db()
