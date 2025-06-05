from flask import Blueprint, request, jsonify
from backend.models.user import User
from backend import db
from werkzeug.security import generate_password_hash

bp = Blueprint('users', __name__, url_prefix='/api/users')

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

# Create a new student (accessible by anyone for now, can be restricted to teachers)
@bp.route('', methods=['POST'])
def create_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'student') # Default to student, frontend sends 'student'

    if not username or not password:
        return jsonify({'error': '用戶名和密碼為必填項'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': '用戶名已存在'}), 409 # 409 Conflict

    # The User model's __init__ will handle password hashing via its set_password method
    new_user = User(username=username, password=password, role=role)
    
    try:
        db.session.add(new_user)
        db.session.commit()
        # Prepare user data for response, excluding password_hash
        user_data = {
            'id': new_user.id,
            'username': new_user.username,
            'email': new_user.email or '', # Assuming email is optional as per memory
            'role': new_user.role,
            'created_at': new_user.created_at.isoformat() if new_user.created_at else None
        }
        return jsonify({'message': '學生新增成功', 'user': user_data}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating user: {e}")
        return jsonify({'error': '創建用戶時發生錯誤'}), 500

# Delete a student (now public)
@bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user_to_delete = User.query.get(user_id)
    if not user_to_delete:
        return jsonify({'error': '找不到該學生'}), 404
    
    if user_to_delete.role != 'student':
        return jsonify({'error': '只能刪除學生帳戶'}), 400

    try:
        db.session.delete(user_to_delete)
        db.session.commit()
        return jsonify({'message': '學生刪除成功'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting user: {e}")
        return jsonify({'error': '刪除用戶時發生錯誤'}), 500
