import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(test_config=None):
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    
    if test_config is None:
        # Load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Configure database
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///python_learning.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key')
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    # 配置 CORS 以接受任何源的請求
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
    jwt.init_app(app)

    # Register blueprints
    from routes import auth, courses, lessons, progress, users, code_execution, lesson_content, lesson_content_fillblank, student
    # 注册新的code_runner蓝图
    from backend.routes import code_runner
    
    app.register_blueprint(auth.bp)
    app.register_blueprint(courses.bp)
    app.register_blueprint(lessons.bp)
    app.register_blueprint(progress.bp)
    app.register_blueprint(users.bp)
    app.register_blueprint(code_execution.bp)
    app.register_blueprint(code_runner.bp)  # 注册新的代码运行模块
    app.register_blueprint(lesson_content.bp)
    app.register_blueprint(lesson_content_fillblank.bp)
    app.register_blueprint(student.bp)

    return app
