from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.user import User
from backend.models.course import Course, Unit, Enrollment
from backend.models.lesson import Lesson, MultipleChoiceQuestion, FillBlankExercise
from backend.models.progress import Progress, SubmissionHistory
from backend import db
from datetime import datetime
import json

bp = Blueprint('progress', __name__, url_prefix='/api/progress')

# Helper function to check if user has access to a lesson
def has_lesson_access(user_id, lesson_id):
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return False
    
    unit = Unit.query.get(lesson.unit_id)
    if not unit:
        return False
    
    course = Course.query.get(unit.course_id)
    if not course:
        return False
    
    user = User.query.get(user_id)
    if not user:
        return False
    
    if user.is_teacher():
        return course.creator_id == user_id
    else:
        # For students, check enrollment
        enrollment = Enrollment.query.filter_by(student_id=user_id, course_id=course.id).first()
        return enrollment is not None

# Submit answers to multiple choice questions
@bp.route('/multiple-choice/<int:lesson_id>', methods=['POST'])
@jwt_required()
def submit_multiple_choice_answers(lesson_id):
    current_user = get_jwt_identity()
    user_id = current_user['id']
    
    # Only students can submit answers
    user = User.query.get(user_id)
    if not user or not user.is_student():
        return jsonify({'error': 'Only students can submit answers'}), 403
    
    if not has_lesson_access(user_id, lesson_id):
        return jsonify({'error': 'You do not have access to this lesson'}), 403
    
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404
    
    data = request.get_json()
    
    if 'answers' not in data or not isinstance(data['answers'], dict):
        return jsonify({'error': 'Invalid answers format'}), 400
    
    # Get all multiple choice questions for this lesson
    questions = MultipleChoiceQuestion.query.filter_by(lesson_id=lesson_id).all()
    if not questions:
        return jsonify({'error': 'No multiple choice questions found for this lesson'}), 404
    
    # Check answers
    answers = data['answers']  # Format: {question_id: selected_option_index}
    results = []
    correct_count = 0
    total_points = 0
    
    for question in questions:
        question_id = str(question.id)
        if question_id in answers:
            selected_index = answers[question_id]
            is_correct = selected_index == question.correct_option_index
            
            if is_correct:
                correct_count += 1
                total_points += question.points
            
            results.append({
                'question_id': question.id,
                'correct': is_correct,
                'points': question.points if is_correct else 0,
                'explanation': question.explanation if is_correct else 'Incorrect answer'
            })
    
    # Record submission
    submission = SubmissionHistory(
        student_id=user_id,
        lesson_id=lesson_id,
        submission_type='multiple_choice',
        content=json.dumps(answers),
        score=total_points,
        feedback=f'Answered {correct_count} out of {len(questions)} questions correctly.'
    )
    db.session.add(submission)
    
    # Update or create progress record
    progress = Progress.query.filter_by(student_id=user_id, lesson_id=lesson_id).first()
    if progress:
        # Update if score is better
        if total_points > progress.multiple_choice_score:
            progress.multiple_choice_score = total_points
            progress.set_multiple_choice_results({'results': results, 'score': total_points})
        progress.attempts += 1
        progress.last_attempt_at = datetime.utcnow()
    else:
        # Create new progress record
        progress = Progress(
            student_id=user_id,
            lesson_id=lesson_id,
            multiple_choice_score=total_points,
            attempts=1,
            last_attempt_at=datetime.utcnow()
        )
        progress.set_multiple_choice_results({'results': results, 'score': total_points})
        db.session.add(progress)
    
    # Check if all components are completed
    update_completion_status(progress)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Multiple choice answers submitted',
        'score': total_points,
        'correct_count': correct_count,
        'total_questions': len(questions),
        'results': results
    }), 200

# Submit answers to fill-in-the-blank exercises
@bp.route('/fill-blank/<int:lesson_id>', methods=['POST'])
@jwt_required()
def submit_fill_blank_answers(lesson_id):
    current_user = get_jwt_identity()
    user_id = current_user['id']
    
    # Only students can submit answers
    user = User.query.get(user_id)
    if not user or not user.is_student():
        return jsonify({'error': 'Only students can submit answers'}), 403
    
    if not has_lesson_access(user_id, lesson_id):
        return jsonify({'error': 'You do not have access to this lesson'}), 403
    
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404
    
    data = request.get_json()
    
    if 'answers' not in data or not isinstance(data['answers'], list):
        return jsonify({'error': 'Invalid answers format'}), 400
    
    # Get all fill-in-the-blank exercises for this lesson
    exercises = FillBlankExercise.query.filter_by(lesson_id=lesson_id).all()
    if not exercises:
        return jsonify({'error': 'No fill-in-the-blank exercises found for this lesson'}), 404
    
    # Check answers
    answers = data['answers']  # Format: [answer1, answer2, ...]
    results = []
    total_points = 0
    
    for exercise in exercises:
        blanks = exercise.get_blanks()
        exercise_results = []
        correct_count = 0
        
        # Check each blank
        for i, blank in enumerate(blanks):
            if i < len(answers):
                is_correct = answers[i] == blank['correct_answer']
                if is_correct:
                    correct_count += 1
                
                exercise_results.append({
                    'blank_index': i,
                    'correct': is_correct,
                    'submitted_answer': answers[i],
                    'correct_answer': blank['correct_answer']
                })
        
        # Calculate points for this exercise
        points_per_blank = exercise.points / len(blanks) if blanks else 0
        exercise_points = int(correct_count * points_per_blank)
        total_points += exercise_points
        
        results.append({
            'exercise_id': exercise.id,
            'blank_results': exercise_results,
            'points': exercise_points,
            'max_points': exercise.points
        })
    
    # Record submission
    submission = SubmissionHistory(
        student_id=user_id,
        lesson_id=lesson_id,
        submission_type='fill_blank',
        content=json.dumps(answers),
        score=total_points,
        feedback=f'Earned {total_points} points on fill-in-the-blank exercises.'
    )
    db.session.add(submission)
    
    # Update or create progress record
    progress = Progress.query.filter_by(student_id=user_id, lesson_id=lesson_id).first()
    if progress:
        # Update if score is better
        if total_points > progress.fill_blank_score:
            progress.fill_blank_score = total_points
            progress.set_fill_blank_results({'results': results, 'score': total_points})
        progress.attempts += 1
        progress.last_attempt_at = datetime.utcnow()
    else:
        # Create new progress record
        progress = Progress(
            student_id=user_id,
            lesson_id=lesson_id,
            fill_blank_score=total_points,
            attempts=1,
            last_attempt_at=datetime.utcnow()
        )
        progress.set_fill_blank_results({'results': results, 'score': total_points})
        db.session.add(progress)
    
    # Check if all components are completed
    update_completion_status(progress)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Fill-in-the-blank answers submitted',
        'score': total_points,
        'results': results
    }), 200

# Helper function to update completion status
def update_completion_status(progress):
    lesson = Lesson.query.get(progress.lesson_id)
    if not lesson:
        return
    
    # 從lessons.py導入辅助函数，檢查課程內容類型
    from routes.lessons import get_lesson_formatted_data_helper
    lesson_data = get_lesson_formatted_data_helper(lesson)
    
    # Check if all components have been attempted
    has_coding = lesson_data and lesson_data.get('content_type') == 'coding'
    has_multiple_choice = len(lesson.multiple_choice_questions) > 0
    has_fill_blank = len(lesson.fill_blank_exercises) > 0
    
    # Mark as completed if all available components have scores
    completed = True
    
    if has_coding and (not hasattr(progress, 'coding_score') or progress.coding_score == 0):
        completed = False
    
    if has_multiple_choice and progress.multiple_choice_score == 0:
        completed = False
    
    if has_fill_blank and progress.fill_blank_score == 0:
        completed = False
    
    progress.completed = completed

# Get student progress for a course
@bp.route('/course/<int:course_id>', methods=['GET'])
def get_course_progress(course_id):
    user_id = None
    try:
        # Try to get user_id from JWT token first
        current_user = get_jwt_identity()
        if current_user:
            user_id = current_user.get('id')
    except Exception:
        # JWT might not be present or other issues, proceed to check query param
        pass

    # If not found via JWT, try to get from query parameter
    if not user_id:
        user_id = request.args.get('student_id', type=int)
    
    # If user_id is still not determined, return an error
    if not user_id:
        return jsonify({'error': 'Could not determine user ID. Please provide student_id as a query parameter'}), 400
    
    # Check if user exists
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    if user.is_student():
        # Check if student is enrolled
        enrollment = Enrollment.query.filter_by(student_id=user_id, course_id=course_id).first()
        if not enrollment:
            return jsonify({'error': 'You are not enrolled in this course'}), 403
        
        # Get progress for all lessons in this course
        progress_data = get_student_course_progress(user_id, course_id)
        return jsonify({'progress': progress_data}), 200
    
    elif user.is_teacher():
        # Check if teacher created this course
        if course.creator_id != user_id:
            return jsonify({'error': 'You do not have permission to view this course'}), 403
        
        # Get progress for all students in this course
        students_progress = get_all_students_progress(course_id)
        return jsonify({'students_progress': students_progress}), 200
    
    return jsonify({'error': 'Invalid user role'}), 400

# Helper function to get a student's progress in a course
def get_student_course_progress(student_id, course_id):
    # Get all units in the course
    units = Unit.query.filter_by(course_id=course_id).order_by(Unit.order).all()
    
    progress_data = {
        'course_id': course_id,
        'units': []
    }
    
    total_lessons = 0
    completed_lessons = 0
    total_points = 0
    earned_points = 0
    
    for unit in units:
        unit_data = {
            'unit_id': unit.id,
            'title': unit.title,
            'lessons': []
        }
        
        # Get all lessons in the unit
        lessons = Lesson.query.filter_by(unit_id=unit.id).order_by(Lesson.order).all()
        
        for lesson in lessons:
            total_lessons += 1
            
            # Get progress for this lesson
            progress = Progress.query.filter_by(student_id=student_id, lesson_id=lesson.id).first()
            
            lesson_data = {
                'lesson_id': lesson.id,
                'title': lesson.title,
                'completed': False,
                'coding_score': 0,
                'multiple_choice_score': 0,
                'fill_blank_score': 0,
                'total_score': 0,
                'attempts': 0,
                'last_attempt': None
            }
            
            # Calculate max possible points for this lesson
            max_points = 0
            
            # Check if lesson has coding content
            from routes.lessons import get_lesson_formatted_data_helper
            lesson_data_formatted = get_lesson_formatted_data_helper(lesson)
            if lesson_data_formatted and lesson_data_formatted.get('content_type') == 'coding':
                max_points += 100  # Default max score for coding exercises
            
            for q in lesson.multiple_choice_questions:
                max_points += q.points
            
            for ex in lesson.fill_blank_exercises:
                max_points += ex.points
            
            lesson_data['max_points'] = max_points
            total_points += max_points
            
            if progress:
                lesson_data['completed'] = progress.completed
                lesson_data['coding_score'] = getattr(progress, 'coding_score', 0)
                lesson_data['multiple_choice_score'] = progress.multiple_choice_score
                lesson_data['fill_blank_score'] = progress.fill_blank_score
                lesson_data['total_score'] = progress.get_total_score()
                lesson_data['attempts'] = progress.attempts
                lesson_data['last_attempt'] = progress.last_attempt_at.isoformat() if progress.last_attempt_at else None
                
                if progress.completed:
                    completed_lessons += 1
                
                earned_points += progress.get_total_score()
            
            unit_data['lessons'].append(lesson_data)
        
        progress_data['units'].append(unit_data)
    
    # Add summary statistics
    progress_data['summary'] = {
        'total_lessons': total_lessons,
        'completed_lessons': completed_lessons,
        'completion_percentage': (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0,
        'total_points': total_points,
        'earned_points': earned_points,
        'score_percentage': (earned_points / total_points * 100) if total_points > 0 else 0
    }
    
    return progress_data

# Helper function to get progress for all students in a course
def get_all_students_progress(course_id):
    # Get all enrollments for this course
    enrollments = Enrollment.query.filter_by(course_id=course_id).all()
    
    students_progress = []
    
    for enrollment in enrollments:
        student = User.query.get(enrollment.student_id)
        if student:
            # Get this student's progress
            progress_data = get_student_course_progress(student.id, course_id)
            
            # Add student info
            student_progress = {
                'student_id': student.id,
                'username': student.username,
                'email': student.email,
                'progress': progress_data
            }
            
            students_progress.append(student_progress)
    
    return students_progress