from flask import Blueprint, request, jsonify
from backend import db
from backend.models.user import User
from backend.models.course import Course, Enrollment, Unit
from backend.models.progress import Progress
from backend.models.lesson import Lesson
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from datetime import datetime

bp = Blueprint('student', __name__, url_prefix='/api/student')

# 獲取學生儀表板數據
@bp.route('/dashboard', methods=['GET'])
def get_student_dashboard():
    student_id = None
    try:
        # Try to get student_id from JWT token first
        current_user = get_jwt_identity()
        if current_user:
            student_id = current_user.get('id')
    except Exception:
        # JWT might not be present or other issues, proceed to check query param
        pass

    # If not found via JWT, try to get from query parameter
    if not student_id:
        student_id = request.args.get('student_id', type=int)
    
    # If student_id is still not determined, return an error for dashboard
    if not student_id:
        return jsonify({'error': 'Could not determine student ID for dashboard'}), 400
    
    # 檢查學生是否存在
    student = User.query.get(student_id)
    if not student or student.role != 'student':
        return jsonify({'error': 'Student not found or invalid role'}), 404

    # 獲取學生註冊的課程
    enrollments = Enrollment.query.filter_by(student_id=student_id).all()
    enrolled_course_ids = [e.course_id for e in enrollments]
    
    # 總課程數
    total_courses_enrolled = len(enrolled_course_ids)
    
    # 計算總完成課程數和總課程進度
    total_lessons_completed = 0
    total_lessons_count = 0
    
    for course_id in enrolled_course_ids:
        course_units = Unit.query.filter_by(course_id=course_id).all()
        unit_ids = [u.id for u in course_units]
        if not unit_ids:
            continue
            
        lessons_in_course = Lesson.query.filter(Lesson.unit_id.in_(unit_ids)).count()
        total_lessons_count += lessons_in_course
        
        completed_in_course = Progress.query.filter(
            Progress.student_id == student_id,
            Progress.lesson_id.in_(db.session.query(Lesson.id).filter(Lesson.unit_id.in_(unit_ids))),
            Progress.completed == True
        ).count()
        total_lessons_completed += completed_in_course

    overall_progress_percentage = (total_lessons_completed / total_lessons_count * 100) if total_lessons_count > 0 else 0
    
    # 最新活動 (latest activity)
    latest_activity_record = Progress.query.filter_by(student_id=student_id)\
                                    .order_by(Progress.updated_at.desc())\
                                    .first()
    
    last_activity_description = "No recent activity"
    last_activity_time = None
    if latest_activity_record:
        latest_lesson_for_activity = Lesson.query.get(latest_activity_record.lesson_id)
        if latest_lesson_for_activity: # Check if lesson exists
            last_activity_description = f"{'Completed' if latest_activity_record.completed else 'Progress on'} lesson: {latest_lesson_for_activity.title}"
        else:
            last_activity_description = "Progress on a lesson (details unavailable)"
        last_activity_time = latest_activity_record.updated_at.isoformat()

    # 獲取最近互動的課程 (for "Continue Learning" section)
    # Fetch up to 5 unique recent lessons based on progress records
    recent_progress_entries = Progress.query.filter_by(student_id=student_id)\
                                        .order_by(Progress.updated_at.desc())\
                                        .limit(10).all() # Fetch more initially to find unique lessons

    recent_lessons_data = []
    seen_lesson_ids = set()
    for p_entry in recent_progress_entries:
        if p_entry.lesson_id not in seen_lesson_ids:
            lesson = Lesson.query.get(p_entry.lesson_id)
            # Ensure lesson and its parent course/unit exist
            if lesson and lesson.unit and lesson.unit.course:
                recent_lessons_data.append({
                    'id': lesson.id,
                    'title': lesson.title,
                    'course_title': lesson.unit.course.title,
                    'unit_title': lesson.unit.title,
                    'status': 'completed' if p_entry.completed else 'in_progress'
                })
                seen_lesson_ids.add(p_entry.lesson_id)
            if len(recent_lessons_data) >= 3: # Show up to 3 in UI
                break
            
    dashboard_data = {
        'student_name': student.username,
        'total_courses_enrolled': total_courses_enrolled,
        'completed_lessons_count': total_lessons_completed,
        'overall_progress_percentage': round(overall_progress_percentage),
        'last_activity_description': last_activity_description,
        'last_activity_time': last_activity_time,
        'recent_lessons': recent_lessons_data, # <-- Added this
        # 'weekly_progress': [], # Placeholder for future implementation
        # 'exercise_scores': [], # Placeholder for future implementation
    }
    
    return jsonify(dashboard_data), 200

# 獲取學生活動數據
@bp.route('/activity', methods=['GET'])
def get_student_activity():
    student_id = None
    try:
        # Try to get student_id from JWT token first
        current_user = get_jwt_identity()
        if current_user:
            student_id = current_user.get('id')
    except Exception:
        # JWT might not be present or other issues, proceed to check query param
        pass

    # If not found via JWT, try to get from query parameter
    if not student_id:
        student_id = request.args.get('student_id', type=int)
    
    # If student_id is still not determined, return empty list for activities
    if not student_id:
        return jsonify({'activities': []}), 200
    
    # 示例活動數據
    # 實際應用中，您會從數據庫查詢學生的活動記錄，例如課程進度、提交的作業等
    
    progress_records = Progress.query.filter_by(student_id=student_id)\
                                     .order_by(Progress.updated_at.desc())\
                                     .limit(10).all() # Get last 10 activities

    activities = []
    for p_record in progress_records:
        lesson = Lesson.query.get(p_record.lesson_id)
        if lesson:
            activity = {
                'id': p_record.id,
                'type': 'lesson_progress', # 'quiz_attempt', 'assignment_submission'
                'description': f"{'Completed' if p_record.completed else 'Updated progress on'} lesson: {lesson.title}",
                'timestamp': p_record.updated_at.isoformat(),
                'details_link': f"/student/courses/{lesson.unit.course_id}/lessons/{lesson.id}" # Example link
            }
            activities.append(activity)
            
    return jsonify({'activities': activities}), 200
