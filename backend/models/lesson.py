from backend import db
from datetime import datetime
import json

class Lesson(db.Model):
    __tablename__ = 'lessons'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    order = db.Column(db.Integer, nullable=False)  # To maintain the order of lessons in a unit
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    coding_exercise = db.relationship('CodingExercise', backref='lesson', lazy=True, 
                                     uselist=False, cascade='all, delete-orphan')
    multiple_choice_questions = db.relationship('MultipleChoiceQuestion', backref='lesson', 
                                              lazy=True, cascade='all, delete-orphan')
    fill_blank_exercises = db.relationship('FillBlankExercise', backref='lesson', 
                                         lazy=True, cascade='all, delete-orphan')
    progress_records = db.relationship('Progress', backref='lesson', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'order': self.order,
            'unit_id': self.unit_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'has_coding_exercise': self.coding_exercise is not None,
            'multiple_choice_count': len(self.multiple_choice_questions) if self.multiple_choice_questions else 0,
            'fill_blank_count': len(self.fill_blank_exercises) if self.fill_blank_exercises else 0
        }
    
    def __repr__(self):
        return f'<Lesson {self.title}>'


class CodingExercise(db.Model):
    __tablename__ = 'coding_exercises'
    
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False, unique=True)
    instructions = db.Column(db.Text, nullable=False)
    starter_code = db.Column(db.Text)
    solution_code = db.Column(db.Text, nullable=False)
    test_cases = db.Column(db.Text, nullable=False)  # Stored as JSON string
    max_score = db.Column(db.Integer, default=100)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def get_test_cases(self):
        return json.loads(self.test_cases)
    
    def set_test_cases(self, test_cases_list):
        self.test_cases = json.dumps(test_cases_list)
    
    def to_dict(self):
        return {
            'id': self.id,
            'lesson_id': self.lesson_id,
            'instructions': self.instructions,
            'starter_code': self.starter_code,
            'solution_code': self.solution_code,
            'test_cases': self.get_test_cases(),
            'max_score': self.max_score,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<CodingExercise {self.id}>'


class MultipleChoiceQuestion(db.Model):
    __tablename__ = 'multiple_choice_questions'
    
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    options = db.Column(db.Text, nullable=False)  # Stored as JSON string
    correct_option_index = db.Column(db.Integer, nullable=False)
    explanation = db.Column(db.Text)
    points = db.Column(db.Integer, default=10)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def get_options(self):
        return json.loads(self.options)
    
    def set_options(self, options_list):
        self.options = json.dumps(options_list)
    
    def to_dict(self):
        return {
            'id': self.id,
            'lesson_id': self.lesson_id,
            'question_text': self.question_text,
            'options': self.get_options(),
            'correct_option_index': self.correct_option_index,
            'explanation': self.explanation,
            'points': self.points,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<MultipleChoiceQuestion {self.id}>'


class FillBlankExercise(db.Model):
    __tablename__ = 'fill_blank_exercises'
    
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    text_template = db.Column(db.Text, nullable=False)  # Text with placeholders for blanks
    blanks = db.Column(db.Text, nullable=False)  # Stored as JSON string with blank options and correct answers
    points = db.Column(db.Integer, default=10)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def get_blanks(self):
        return json.loads(self.blanks)
    
    def set_blanks(self, blanks_dict):
        self.blanks = json.dumps(blanks_dict)
    
    def to_dict(self):
        return {
            'id': self.id,
            'lesson_id': self.lesson_id,
            'text_template': self.text_template,
            'blanks': self.get_blanks(),
            'points': self.points,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<FillBlankExercise {self.id}>'
