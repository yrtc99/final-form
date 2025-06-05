from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.user import User
from backend.models.lesson import Lesson, FillBlankExercise
from backend import db
import json

bp = Blueprint('lesson_content_fillblank', __name__, url_prefix='/api/content/fill-blank')

# Helper function to check if user is a teacher
def is_teacher(user_id):
    user = User.query.get(user_id)
    return user and user.is_teacher()

# Helper function to check if user has access to a lesson
def has_lesson_access(user_id, lesson_id):
    # Check if user is a teacher with access or a student enrolled in the course
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return False
    
    # Get unit and course
    unit = db.session.query(lesson.unit).first()
    if not unit:
        return False
    
    course = db.session.query(unit.course).first()
    if not course:
        return False
    
    user = User.query.get(user_id)
    if not user:
        return False
    
    if user.is_teacher():
        return course.creator_id == user_id
    else:
        # For students, check enrollment
        enrollment = db.session.query(db.exists().where(
            db.and_(
                db.text('enrollments.student_id = :student_id'),
                db.text('enrollments.course_id = :course_id')
            )
        )).params(student_id=user_id, course_id=course.id).scalar()
        return enrollment

# Create a fill-in-the-blank exercise for a lesson (teacher only)
@bp.route('/<int:lesson_id>', methods=['POST'])
@jwt_required()
def create_fill_blank_exercise(lesson_id):
    current_user = get_jwt_identity()
    user_id = current_user['id']
    
    if not is_teacher(user_id):
        return jsonify({'error': 'Only teachers can create fill-in-the-blank exercises'}), 403
    
    if not has_lesson_access(user_id, lesson_id):
        return jsonify({'error': 'You do not have permission to modify this lesson'}), 403
    
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['text_template', 'blanks']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Validate blanks
    try:
        if isinstance(data['blanks'], str):
            blanks = json.loads(data['blanks'])
        else:
            blanks = data['blanks']
        
        if not isinstance(blanks, list) or len(blanks) == 0:
            return jsonify({'error': 'Blanks must be a non-empty list'}), 400
        
        # Each blank should have options and a correct answer
        for blank in blanks:
            if not isinstance(blank, dict):
                return jsonify({'error': 'Each blank must be an object'}), 400
            if 'options' not in blank or not isinstance(blank['options'], list) or len(blank['options']) == 0:
                return jsonify({'error': 'Each blank must have non-empty options list'}), 400
            if 'correct_answer' not in blank:
                return jsonify({'error': 'Each blank must have a correct answer'}), 400
            if blank['correct_answer'] not in blank['options']:
                return jsonify({'error': 'Correct answer must be one of the options'}), 400
    except json.JSONDecodeError:
        return jsonify({'error': 'Blanks must be valid JSON'}), 400
    
    # Create new fill-in-the-blank exercise
    exercise = FillBlankExercise(
        lesson_id=lesson_id,
        text_template=data['text_template'],
        blanks=json.dumps(blanks),
        points=data.get('points', 10)
    )
    
    db.session.add(exercise)
    db.session.commit()
    
    return jsonify({'message': 'Fill-in-the-blank exercise created successfully', 
                   'exercise': exercise.to_dict()}), 201

# Update a fill-in-the-blank exercise (teacher only)
@bp.route('/<int:exercise_id>', methods=['PUT'])
@jwt_required()
def update_fill_blank_exercise(exercise_id):
    current_user = get_jwt_identity()
    user_id = current_user['id']
    
    if not is_teacher(user_id):
        return jsonify({'error': 'Only teachers can update exercises'}), 403
    
    exercise = FillBlankExercise.query.get(exercise_id)
    if not exercise:
        return jsonify({'error': 'Exercise not found'}), 404
    
    if not has_lesson_access(user_id, exercise.lesson_id):
        return jsonify({'error': 'You do not have permission to modify this exercise'}), 403
    
    data = request.get_json()
    
    # Update exercise fields
    if 'text_template' in data:
        exercise.text_template = data['text_template']
    
    if 'blanks' in data:
        try:
            if isinstance(data['blanks'], str):
                blanks = json.loads(data['blanks'])
            else:
                blanks = data['blanks']
            
            if not isinstance(blanks, list) or len(blanks) == 0:
                return jsonify({'error': 'Blanks must be a non-empty list'}), 400
            
            # Each blank should have options and a correct answer
            for blank in blanks:
                if not isinstance(blank, dict):
                    return jsonify({'error': 'Each blank must be an object'}), 400
                if 'options' not in blank or not isinstance(blank['options'], list) or len(blank['options']) == 0:
                    return jsonify({'error': 'Each blank must have non-empty options list'}), 400
                if 'correct_answer' not in blank:
                    return jsonify({'error': 'Each blank must have a correct answer'}), 400
                if blank['correct_answer'] not in blank['options']:
                    return jsonify({'error': 'Correct answer must be one of the options'}), 400
            
            exercise.blanks = json.dumps(blanks)
        except json.JSONDecodeError:
            return jsonify({'error': 'Blanks must be valid JSON'}), 400
    
    if 'points' in data:
        exercise.points = data['points']
    
    db.session.commit()
    
    return jsonify({'message': 'Fill-in-the-blank exercise updated successfully', 
                   'exercise': exercise.to_dict()}), 200

# Delete a fill-in-the-blank exercise (teacher only)
@bp.route('/<int:exercise_id>', methods=['DELETE'])
@jwt_required()
def delete_fill_blank_exercise(exercise_id):
    current_user = get_jwt_identity()
    user_id = current_user['id']
    
    if not is_teacher(user_id):
        return jsonify({'error': 'Only teachers can delete exercises'}), 403
    
    exercise = FillBlankExercise.query.get(exercise_id)
    if not exercise:
        return jsonify({'error': 'Exercise not found'}), 404
    
    if not has_lesson_access(user_id, exercise.lesson_id):
        return jsonify({'error': 'You do not have permission to delete this exercise'}), 403
    
    db.session.delete(exercise)
    db.session.commit()
    
    return jsonify({'message': 'Fill-in-the-blank exercise deleted successfully'}), 200
