from flask import Blueprint, jsonify, request
import json
from backend.models.lesson import Lesson, CodingExercise, MultipleChoiceQuestion, FillBlankExercise
from backend.models.course import Unit
from backend import db

bp = Blueprint('lessons', __name__, url_prefix='/api/lessons')

# Helper function for formatting lesson data for response
def get_lesson_formatted_data_helper(lesson_obj):
    if not lesson_obj:
        return None
    
    lesson_data = lesson_obj.to_dict() # Basic lesson data from model's to_dict
    # Initialize with default empty content structure for each type.
    # This ensures the 'content' key always has a predictable structure for the frontend.
    content_structure = {
        'coding': {'instructions': '', 'starter_code': '', 'solution_code': '', 'test_code': ''},
        'multiple_choice': {'question': '', 'options': [], 'correct_option': 0},
        'fill_in_blank': {'text': '', 'blanks': []}
    }
    actual_content_type = None # Will be set if content exists
    current_content_data = {} # Will hold the data for the actual_content_type

    if lesson_obj.coding_exercise:
        actual_content_type = 'coding'
        coding_dict = lesson_obj.coding_exercise.to_dict()
        # test_cases from model is a list of dicts, e.g., [{'code': 'test1'}, {'code': 'test2'}]
        # Frontend editor expects a single string for test_code.
        test_cases_list_of_dicts = coding_dict.get('test_cases', []) 
        test_code_str = "\n".join([tc.get('code', '') for tc in test_cases_list_of_dicts if isinstance(tc, dict) and tc.get('code')])
        current_content_data = {
            'instructions': coding_dict.get('instructions', ''),
            'starter_code': coding_dict.get('starter_code', ''),
            'solution_code': coding_dict.get('solution_code', ''),
            'test_code': test_code_str
        }
    elif lesson_obj.multiple_choice_questions: # Check if list is not empty
        actual_content_type = 'multiple_choice'
        mcq = lesson_obj.multiple_choice_questions[0].to_dict() # Assuming one MCQ per lesson for now
        current_content_data = {
            'question': mcq.get('question_text', ''),
            'options': mcq.get('options', []), # options from model is a list
            'correct_option': mcq.get('correct_option_index', 0)
        }
    elif lesson_obj.fill_blank_exercises: # Check if list is not empty
        actual_content_type = 'fill_in_blank'
        fib = lesson_obj.fill_blank_exercises[0].to_dict() # Assuming one FIB per lesson for now
        blanks_model_dict = fib.get('blanks', {}) # blanks from model is a dict e.g. {'0': {'correct_answer': 'ans1'}}
        blanks_list_for_frontend = []
        if isinstance(blanks_model_dict, dict):
            # Sort by key if keys are numeric strings like '0', '1', ... to maintain order
            # This is important if the frontend relies on the order of blanks.
            sorted_keys = sorted(blanks_model_dict.keys(), key=lambda k: int(k) if k.isdigit() else k)
            for key in sorted_keys:
                item = blanks_model_dict[key]
                if isinstance(item, dict) and 'correct_answer' in item:
                    blanks_list_for_frontend.append(item.get('correct_answer', ''))
        current_content_data = {
            'text': fib.get('text_template', ''),
            'blanks': blanks_list_for_frontend
        }
    
    lesson_data['content_type'] = actual_content_type or 'coding' # Default to 'coding' if no content
    # Ensure the 'content' field gets the data for the *actual* content type,
    # or the default empty structure for that type if no content exists.
    lesson_data['content'] = current_content_data if actual_content_type else content_structure[lesson_data['content_type']]
    
    return lesson_data

@bp.route('/<int:lesson_id>', methods=['GET'])
def get_lesson(lesson_id):
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404
    
    formatted_data = get_lesson_formatted_data_helper(lesson)
    if not formatted_data:
        # This case should ideally not be hit if lesson object exists and helper is robust
        return jsonify({'error': 'Failed to format lesson data'}), 500
        
    return jsonify({'lesson': formatted_data}), 200

@bp.route('/<int:lesson_id>', methods=['PUT'])
def update_lesson(lesson_id):
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # Update basic lesson info
    lesson.title = data.get('title', lesson.title)
    lesson.description = data.get('description', lesson.description)
    lesson.unit_id = data.get('unit_id', lesson.unit_id)
    lesson.order = data.get('order', lesson.order)

    requested_content_type = data.get('content_type')
    content_payload = data.get('content')

    # Clear existing content before adding new/updated content
    # This handles cases where content type changes or content is simply updated.
    if lesson.coding_exercise:
        db.session.delete(lesson.coding_exercise)
        lesson.coding_exercise = None # Ensure association is cleared from the lesson object side
    # For list-based relationships, clear the list and delete objects
    for mcq in lesson.multiple_choice_questions[:]: # Iterate over a copy for safe removal
        db.session.delete(mcq)
    lesson.multiple_choice_questions = []
    for fib in lesson.fill_blank_exercises[:]: # Iterate over a copy
        db.session.delete(fib)
    lesson.fill_blank_exercises = []
    
    # It's good practice to flush deletions if you are immediately adding related items,
    # though a full commit later usually handles this. For clarity and safety:
    try:
        db.session.flush() # Flushes pending changes, good before adding new related items
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to clear old lesson content during flush: {str(e)}'}), 500

    if requested_content_type and content_payload:
        if requested_content_type == 'coding':
            new_coding_exercise = CodingExercise(
                # lesson_id will be set by relationship when associated with 'lesson'
                instructions=content_payload.get('instructions', ''),
                starter_code=content_payload.get('starter_code', ''),
                solution_code=content_payload.get('solution_code', ''),
                max_score=content_payload.get('max_score', 100) 
            )
            test_code_str = content_payload.get('test_code', '') 
            # Model's set_test_cases expects a list of dicts or similar structured data
            # Frontend sends test_code as a single string; split into lines for basic structure.
            test_cases_for_model = [{'code': line} for line in test_code_str.splitlines() if line.strip()] if test_code_str else []
            new_coding_exercise.set_test_cases(test_cases_for_model)
            lesson.coding_exercise = new_coding_exercise # Associate with lesson
            # db.session.add(new_coding_exercise) # Adding through lesson relationship is often enough

        elif requested_content_type == 'multiple_choice':
            new_mcq = MultipleChoiceQuestion(
                question_text=content_payload.get('question', ''),
                correct_option_index=content_payload.get('correct_option', 0),
                points=content_payload.get('points', 10) 
            )
            new_mcq.set_options(content_payload.get('options', [])) # Expects a list of strings
            lesson.multiple_choice_questions.append(new_mcq) # Associate with lesson
            # db.session.add(new_mcq)

        elif requested_content_type == 'fill_in_blank':
            new_fib = FillBlankExercise(
                text_template=content_payload.get('text', ''),
                points=content_payload.get('points', 10) 
            )
            blanks_list_from_frontend = content_payload.get('blanks', []) # List of strings (answers)
            # Model expects a dict like: {'0': {'correct_answer': 'ans1'}, '1': {'correct_answer': 'ans2'}}
            blanks_dict_for_model = {
                str(i): {'correct_answer': answer, 'display_text': answer}
                for i, answer in enumerate(blanks_list_from_frontend)
            }
            new_fib.set_blanks(blanks_dict_for_model) # Expects a dictionary
            lesson.fill_blank_exercises.append(new_fib) # Associate with lesson
            # db.session.add(new_fib)
            
    try:
        db.session.commit()
        updated_lesson_for_response = Lesson.query.get(lesson_id) # Re-fetch for fresh data
        response_data = get_lesson_formatted_data_helper(updated_lesson_for_response)
        return jsonify({'message': 'Lesson updated successfully', 'lesson': response_data}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update lesson: {str(e)}'}), 500

@bp.route('', methods=['POST'])
def create_lesson():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required_fields = ['title', 'unit_id']
    for field in required_fields:
        if field not in data or not data[field]: # Check for presence and non-empty value
            return jsonify({'error': f'{field} is required'}), 400

    unit = Unit.query.get(data['unit_id'])
    if not unit:
        return jsonify({'error': 'Unit not found'}), 404

    new_lesson = Lesson(
        title=data['title'],
        description=data.get('description', ''),
        unit_id=data['unit_id'],
        order=data.get('order', 1) # Default order to 1 or make it dynamic
    )
    # Content will be added after initial lesson creation and commit to get lesson.id
    # However, with SQLAlchemy's relationship management, we can build the objects and commit once.

    requested_content_type = data.get('content_type')
    content_payload = data.get('content')

    if requested_content_type and content_payload:
        if requested_content_type == 'coding':
            coding_exercise = CodingExercise(
                instructions=content_payload.get('instructions', ''),
                starter_code=content_payload.get('starter_code', ''),
                solution_code=content_payload.get('solution_code', ''),
                max_score=content_payload.get('max_score', 100)
            )
            test_code_str = content_payload.get('test_code', '')
            test_cases_for_model = [{'code': line} for line in test_code_str.splitlines() if line.strip()] if test_code_str else []
            coding_exercise.set_test_cases(test_cases_for_model)
            new_lesson.coding_exercise = coding_exercise # Associate

        elif requested_content_type == 'multiple_choice':
            mcq = MultipleChoiceQuestion(
                question_text=content_payload.get('question', ''),
                correct_option_index=content_payload.get('correct_option', 0),
                points=content_payload.get('points', 10)
            )
            mcq.set_options(content_payload.get('options', []))
            new_lesson.multiple_choice_questions.append(mcq) # Associate

        elif requested_content_type == 'fill_in_blank':
            fib = FillBlankExercise(
                text_template=content_payload.get('text', ''),
                points=content_payload.get('points', 10)
            )
            blanks_list = content_payload.get('blanks', []) 
            blanks_dict_for_model = {
                str(i): {'correct_answer': answer, 'display_text': answer} 
                for i, answer in enumerate(blanks_list)
            }
            fib.set_blanks(blanks_dict_for_model)
            new_lesson.fill_blank_exercises.append(fib) # Associate

    db.session.add(new_lesson) # Add lesson, associated content will be cascaded if configured in models
    try:
        db.session.commit()
        # Re-fetch or use the committed new_lesson object for the response helper
        # If using new_lesson directly, ensure its relationships are loaded if helper needs them.
        # For safety, re-fetching ensures all DB-side defaults/triggers are reflected.
        created_lesson_from_db = Lesson.query.get(new_lesson.id)
        created_lesson_full_data = get_lesson_formatted_data_helper(created_lesson_from_db)
        return jsonify({
            'message': 'Lesson created successfully',
            'lesson': created_lesson_full_data
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create lesson: {str(e)}'}), 500

@bp.route('/<int:lesson_id>', methods=['DELETE'])
def delete_lesson(lesson_id):
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404
    
    try:
        db.session.delete(lesson)  # SQLAlchemy will handle cascading deletes if configured in models
        db.session.commit()
        return jsonify({'message': 'Lesson deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete lesson: {str(e)}'}), 500