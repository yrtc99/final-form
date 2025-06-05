from backend import db
from datetime import datetime
import json

class Progress(db.Model):
    __tablename__ = 'progress'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    coding_score = db.Column(db.Integer, default=0)
    multiple_choice_score = db.Column(db.Integer, default=0)
    fill_blank_score = db.Column(db.Integer, default=0)
    completed = db.Column(db.Boolean, default=False)
    attempts = db.Column(db.Integer, default=0)
    last_attempt_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Store detailed results as JSON
    coding_results = db.Column(db.Text)  # JSON string with test case results
    multiple_choice_results = db.Column(db.Text)  # JSON string with question results
    fill_blank_results = db.Column(db.Text)  # JSON string with blank results
    
    # Ensure a student can only have one progress record per lesson
    __table_args__ = (db.UniqueConstraint('student_id', 'lesson_id', name='unique_student_lesson_progress'),)
    
    def get_coding_results(self):
        return json.loads(self.coding_results) if self.coding_results else {}
    
    def set_coding_results(self, results_dict):
        self.coding_results = json.dumps(results_dict)
    
    def get_multiple_choice_results(self):
        return json.loads(self.multiple_choice_results) if self.multiple_choice_results else {}
    
    def set_multiple_choice_results(self, results_dict):
        self.multiple_choice_results = json.dumps(results_dict)
    
    def get_fill_blank_results(self):
        return json.loads(self.fill_blank_results) if self.fill_blank_results else {}
    
    def set_fill_blank_results(self, results_dict):
        self.fill_blank_results = json.dumps(results_dict)
    
    def get_total_score(self):
        return self.coding_score + self.multiple_choice_score + self.fill_blank_score
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'lesson_id': self.lesson_id,
            'coding_score': self.coding_score,
            'multiple_choice_score': self.multiple_choice_score,
            'fill_blank_score': self.fill_blank_score,
            'total_score': self.get_total_score(),
            'completed': self.completed,
            'attempts': self.attempts,
            'last_attempt_at': self.last_attempt_at.isoformat() if self.last_attempt_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'coding_results': self.get_coding_results(),
            'multiple_choice_results': self.get_multiple_choice_results(),
            'fill_blank_results': self.get_fill_blank_results()
        }
    
    def __repr__(self):
        return f'<Progress {self.student_id} on {self.lesson_id}>'


class SubmissionHistory(db.Model):
    """Store history of student submissions for each lesson component"""
    __tablename__ = 'submission_history'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    submission_type = db.Column(db.String(20), nullable=False)  # 'coding', 'multiple_choice', or 'fill_blank'
    content = db.Column(db.Text, nullable=False)  # The submitted content
    score = db.Column(db.Integer)  # Score for this submission
    feedback = db.Column(db.Text)  # Feedback on the submission
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'lesson_id': self.lesson_id,
            'submission_type': self.submission_type,
            'content': self.content,
            'score': self.score,
            'feedback': self.feedback,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None
        }
    
    def __repr__(self):
        return f'<Submission {self.id} by {self.student_id}>'
