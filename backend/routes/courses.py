from flask import Blueprint, request, jsonify
from backend.models.user import User
from backend.models.course import Course, Unit, Enrollment
from backend.models.lesson import Lesson
from backend.models.progress import Progress
from backend import db

bp = Blueprint('courses', __name__, url_prefix='/api/courses')

# Helper function to check if user is enrolled in a course
def is_enrolled(student_id, course_id):
    enrollment = Enrollment.query.filter_by(student_id=student_id, course_id=course_id).first()
    return enrollment is not None

# Create a new course
@bp.route('', methods=['POST'])
def create_course():
    data = request.get_json()
    
    # Validate required fields
    if 'title' not in data:
        return jsonify({'error': 'Course title is required'}), 400
    
    # Create new course
    course = Course(
        title=data['title'],
        description=data.get('description', ''),
        creator_id=data.get('creator_id', 1)
    )
    
    db.session.add(course)
    db.session.commit()
    
    return jsonify({'message': 'Course created successfully', 'course': course.to_dict()}), 201

# Get all courses
@bp.route('', methods=['GET'])
def get_courses():
    # 返回所有課程，不需要認證
    courses = Course.query.all()
    return jsonify({'courses': [course.to_dict() for course in courses]}), 200

# Get a specific course
@bp.route('/<int:course_id>', methods=['GET'])
def get_course(course_id):
    # 簡化API，允許直接獲取課程詳情
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    # Get course with units and lessons
    course_data = course.to_dict()
    
    # 構建包含單元和課程的完整數據結構
    units_data = []
    for unit in course.units:
        unit_data = unit.to_dict()
        # 添加課程信息到單元數據中
        unit_data['lessons'] = [lesson.to_dict() for lesson in unit.lessons]
        units_data.append(unit_data)
    
    course_data['units'] = units_data
    
    return jsonify({'course': course_data}), 200

# Update a course
@bp.route('/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    data = request.get_json()
    
    # Update course fields
    if 'title' in data:
        course.title = data['title']
    if 'description' in data:
        course.description = data['description']
    
    db.session.commit()
    
    return jsonify({'message': 'Course updated successfully', 'course': course.to_dict()}), 200

# Delete a course
@bp.route('/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    db.session.delete(course)
    db.session.commit()
    
    return jsonify({'message': 'Course deleted successfully'}), 200

# Create a new unit in a course
@bp.route('/<int:course_id>/units', methods=['POST'])
def create_unit(course_id):
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    if 'title' not in data:
        return jsonify({'error': 'Unit title is required'}), 400
    
    # Determine order (place at the end by default)
    order = data.get('order')
    if order is None:
        max_order = db.session.query(db.func.max(Unit.order)).filter_by(course_id=course_id).scalar()
        order = 1 if max_order is None else max_order + 1
    
    # Create new unit
    unit = Unit(
        title=data['title'],
        description=data.get('description', ''),
        order=order,
        course_id=course_id
    )
    
    db.session.add(unit)
    db.session.commit()
    
    return jsonify({'message': 'Unit created successfully', 'unit': unit.to_dict()}), 201

# Get all units in a course
@bp.route('/<int:course_id>/units', methods=['GET'])
def get_units(course_id):
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    # Get all units in the course, ordered by their order field
    units = Unit.query.filter_by(course_id=course_id).order_by(Unit.order).all()
    return jsonify({'units': [unit.to_dict() for unit in units]}), 200

# Enroll students in a course
@bp.route('/<int:course_id>/enrollments', methods=['POST'])
def enroll_students(course_id):
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    if 'student_ids' not in data or not isinstance(data['student_ids'], list):
        return jsonify({'error': 'List of student IDs is required'}), 400
    
    # Enroll each student
    results = []
    for student_id in data['student_ids']:
        # Check if student exists and is actually a student
        student = User.query.get(student_id)
        if not student or not student.is_student():
            results.append({'student_id': student_id, 'status': 'error', 'message': 'Invalid student ID'})
            continue
        
        # Check if student is already enrolled
        existing_enrollment = Enrollment.query.filter_by(student_id=student_id, course_id=course_id).first()
        if existing_enrollment:
            results.append({'student_id': student_id, 'status': 'skipped', 'message': 'Student already enrolled'})
            continue
        
        # Create new enrollment
        enrollment = Enrollment(student_id=student_id, course_id=course_id)
        db.session.add(enrollment)
        results.append({'student_id': student_id, 'status': 'success', 'message': 'Student enrolled successfully'})
    
    db.session.commit()
    
    return jsonify({'message': 'Enrollment process completed', 'results': results}), 200

# Update all enrollments for a course (replaces existing enrollments)
@bp.route('/<int:course_id>/enrollments', methods=['PUT'])
def update_course_enrollments(course_id):
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': '找不到該課程'}), 404

    data = request.get_json()
    student_ids = data.get('student_ids')

    if student_ids is None or not isinstance(student_ids, list):
        return jsonify({'error': '必須提供學生ID列表'}), 400

    try:
        # 1. Remove all existing enrollments for this course
        Enrollment.query.filter_by(course_id=course_id).delete()
        
        # 2. Add new enrollments for the provided student_ids
        new_enrollments = []
        for student_id in student_ids:
            student = User.query.get(student_id)
            if student and student.role == 'student':
                enrollment = Enrollment(student_id=student_id, course_id=course_id)
                new_enrollments.append(enrollment)
            else:
                # Optionally, log or raise an error for invalid student_ids
                print(f"警告：學生ID {student_id} 不存在或非學生角色，已跳過註冊。")
        
        if new_enrollments:
            db.session.add_all(new_enrollments)
        
        db.session.commit()
        return jsonify({'message': '課程註冊狀態已成功更新'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating enrollments: {e}")
        return jsonify({'error': '更新課程註冊狀態時發生錯誤'}), 500

# Get students enrolled in a course
@bp.route('/<int:course_id>/enrollments', methods=['GET'])
def get_enrollments(course_id):
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    # Get all enrollments for the course with student information
    enrollments = Enrollment.query.filter_by(course_id=course_id).all()
    
    enrollment_data = []
    for enrollment in enrollments:
        student = User.query.get(enrollment.student_id)
        if student:
            enrollment_data.append({
                'enrollment_id': enrollment.id,
                'student_id': student.id,
                'username': student.username,
                'email': student.email,
                'enrolled_at': enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None
            })
    
    return jsonify({'enrollments': enrollment_data}), 200

# Remove a student from a course
@bp.route('/<int:course_id>/enrollments/<int:student_id>', methods=['DELETE'])
def remove_enrollment(course_id, student_id):
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    # Find the enrollment
    enrollment = Enrollment.query.filter_by(student_id=student_id, course_id=course_id).first()
    if not enrollment:
        return jsonify({'error': 'Student is not enrolled in this course'}), 404
    
    db.session.delete(enrollment)
    db.session.commit()
    
    return jsonify({'message': 'Student removed from course successfully'}), 200

# 前端兼容API - 註冊學生到課程
@bp.route('/<int:course_id>/enroll', methods=['POST'])
def enroll_students_compat(course_id):
    # 調用原有的註冊邏輯
    return enroll_students(course_id)

# 前端兼容API - 從課程中移除學生
@bp.route('/<int:course_id>/enroll/<int:student_id>', methods=['DELETE'])
def remove_enrollment_compat(course_id, student_id):
    # 調用原有的取消註冊邏輯
    return remove_enrollment(course_id, student_id)

# Update a unit in a course
@bp.route('/<int:course_id>/units/<int:unit_id>', methods=['PUT'])
def update_unit(course_id, unit_id):
    # First, check if the unit exists and belongs to the specified course
    unit = Unit.query.filter_by(id=unit_id, course_id=course_id).first()
    if not unit:
        return jsonify({'error': 'Unit not found or does not belong to the specified course'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update unit fields
    if 'title' in data:
        unit.title = data['title']
    if 'description' in data:
        unit.description = data['description']
    if 'order' in data:
        unit.order = data['order']
    
    try:
        db.session.commit()
        return jsonify({'message': 'Unit updated successfully', 'unit': unit.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update unit: {str(e)}'}), 500

# Add a direct endpoint for updating units (for compatibility with frontend)
@bp.route('/units/<int:unit_id>', methods=['PUT'])
def update_unit_direct(unit_id):
    # Find the unit
    unit = Unit.query.get(unit_id)
    if not unit:
        return jsonify({'error': 'Unit not found'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update unit fields
    if 'title' in data:
        unit.title = data['title']
    if 'description' in data:
        unit.description = data['description']
    if 'order' in data:
        unit.order = data['order']
    
    try:
        db.session.commit()
        return jsonify({'message': 'Unit updated successfully', 'unit': unit.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update unit: {str(e)}'}), 500

# 獲取學生已註冊的所有課程
@bp.route('/enrolled', methods=['GET'])
# @jwt_required() # JWT Removed
def get_enrolled_courses():
    # student_id = get_jwt_identity() # JWT Removed. This endpoint now needs student_id from query params.
    student_id = request.args.get('student_id', type=int)
    if not student_id:
        return jsonify({'error': 'student_id query parameter is required'}), 400

    # 獲取該學生所有的註冊記錄
    enrollments = Enrollment.query.filter_by(student_id=student_id).all()
    
    # 獲取這些註冊記錄對應的課程
    course_ids = [enrollment.course_id for enrollment in enrollments]
    courses = Course.query.filter(Course.id.in_(course_ids)).all() if course_ids else []
    
    # 返回課程信息和學生的進度
    result = []
    for course in courses:
        # 計算該課程的總課程數和已完成課程數
        units = Unit.query.filter_by(course_id=course.id).all()
        unit_ids = [unit.id for unit in units]
        
        # 獲取所有課程
        lessons_count = 0
        if unit_ids:
            lessons_count = Lesson.query.filter(Lesson.unit_id.in_(unit_ids)).count()
        
        # 獲取已完成的課程數
        completed_lessons = 0
        if unit_ids and lessons_count > 0:
            lessons = Lesson.query.filter(Lesson.unit_id.in_(unit_ids)).all()
            lesson_ids = [lesson.id for lesson in lessons]
            if lesson_ids:
                completed = Progress.query.filter(
                    Progress.student_id == student_id,
                    Progress.lesson_id.in_(lesson_ids),
                    Progress.completed == True
                ).count()
                completed_lessons = completed
        
        # 計算完成百分比
        completion_percentage = (completed_lessons / lessons_count * 100) if lessons_count > 0 else 0
        
        # 獲取最近的活動時間
        last_activity = None
        if unit_ids and lessons_count > 0:
            latest_progress = Progress.query.filter(
                Progress.student_id == student_id,
                Progress.lesson_id.in_(lesson_ids)
            ).order_by(Progress.updated_at.desc()).first()
            
            if latest_progress:
                last_activity = latest_progress.updated_at.isoformat()
        
        # 構建課程信息
        course_info = {
            'id': course.id,
            'title': course.title,
            'description': course.description,
            # 'image_url': course.image_url, # Removed as Course model does not have image_url
            'lessons_count': lessons_count,
            'completed_lessons': completed_lessons,
            'completion_percentage': round(completion_percentage),
            'last_activity': last_activity,
            'enrolled_at': next((e.enrolled_at.isoformat() for e in enrollments if e.course_id == course.id and e.enrolled_at is not None), None)
        }
        
        result.append(course_info)
    
    return jsonify({'courses': result}), 200
