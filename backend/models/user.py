from backend import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=False, nullable=True)  # Changed to not unique and nullable
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'teacher' or 'student'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    # A teacher can create many courses
    courses_created = db.relationship('Course', backref='creator', lazy=True, 
                                      foreign_keys='Course.creator_id')
    
    # A student can be enrolled in many classes
    enrollments = db.relationship('Enrollment', backref='student', lazy=True,
                                 foreign_keys='Enrollment.student_id')
    
    # A student can have progress records
    progress_records = db.relationship('Progress', backref='student', lazy=True)
    
    def __init__(self, username, email=None, password=None, role=None):
        self.username = username
        self.email = email if email else ''
        if password:
            self.set_password(password)
        self.role = role
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def is_teacher(self):
        return self.role == 'teacher'
    
    def is_student(self):
        return self.role == 'student'
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>'
