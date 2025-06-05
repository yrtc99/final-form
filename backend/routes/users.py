from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.user import User

bp = Blueprint('users', __name__, url_prefix='/api/users')

# Helper function to check if user is a teacher
def is_teacher(user_id):
    user = User.query.get(user_id)
    return user and user.role == 'teacher'

# Get all students
@bp.route('/students', methods=['GET'])
def get_all_students():
    
    # Get all students
    students = User.query.filter_by(role='student').all()
    
    student_data = []
    for student in students:
        student_data.append({
            'id': student.id,
            'username': student.username,
            'email': student.email or '',
            'created_at': student.created_at.isoformat() if student.created_at else None
        })
    
    return jsonify({'students': student_data}), 200
