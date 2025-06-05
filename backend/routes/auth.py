from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.models.user import User
from backend import db
import datetime

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        print(f"Received registration data: {data}")
        
        # Validate required fields
        required_fields = ['username', 'password', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if username already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        # Validate role
        if data['role'] not in ['teacher', 'student']:
            return jsonify({'error': 'Role must be either "teacher" or "student"'}), 400
        
        # Create new user
        try:
            user = User(
                username=data['username'],
                email=data.get('email', ''),  # email 變為可選項
                password=data['password'],
                role=data['role']
            )
            
            db.session.add(user)
            db.session.commit()
            
            return jsonify({'message': 'User registered successfully', 'user': user.to_dict()}), 201
        except Exception as model_error:
            print(f"Error creating user: {str(model_error)}")
            db.session.rollback()
            return jsonify({'error': f'Error creating user: {str(model_error)}'}), 500
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate required fields
    if 'username' not in data or 'password' not in data:
        return jsonify({'error': 'Username and password are required'}), 400
    
    # Find user by username
    user = User.query.filter_by(username=data['username']).first()
    
    # Check if user exists and password is correct
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Create access token with user identity and role
    access_token = create_access_token(
        identity={
            'id': user.id,
            'username': user.username,
            'role': user.role
        },
        expires_delta=datetime.timedelta(days=1)
    )
    
    return jsonify({
        'access_token': access_token,
        'user': user.to_dict()
    }), 200


@bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    current_user_id = get_jwt_identity()['id']
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200


@bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()['id']
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    if 'current_password' not in data or 'new_password' not in data:
        return jsonify({'error': 'Current password and new password are required'}), 400
    
    # Check if current password is correct
    if not user.check_password(data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    # Update password
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password updated successfully'}), 200
