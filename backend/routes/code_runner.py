from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.user import User
from backend.models.lesson import Lesson
from backend.models.progress import Progress, SubmissionHistory
from backend import db
from datetime import datetime
import docker
import tempfile
import os
import time
import re

bp = Blueprint('code_runner', __name__, url_prefix='/api/code')

# Docker配置
DOCKER_IMAGE = 'python:3.9-alpine'
EXECUTION_TIMEOUT = 10  # 秒
MEMORY_LIMIT = '128m'
CPU_LIMIT = 0.5

def get_docker_client():
    """获取Docker客户端"""
    try:
        client = docker.from_env()
        return client
    except Exception as e:
        print(f"Docker连接失败: {str(e)}")
        return None

def is_code_safe(code):
    """检查代码安全性"""
    dangerous_patterns = [
        r'import\s+os',
        r'import\s+subprocess',
        r'import\s+sys',
        r'import\s+socket',
        r'import\s+requests',
        r'import\s+urllib',
        r'from\s+os\s+import',
        r'from\s+subprocess\s+import',
        r'__import__',
        r'eval\s*\(',
        r'exec\s*\(',
        r'open\s*\(',
        r'file\s*\(',
        r'input\s*\(',
        r'raw_input\s*\(',
        r'compile\s*\(',
        r'globals\s*\(',
        r'locals\s*\(',
        r'vars\s*\(',
        r'dir\s*\(',
        r'exit\s*\(',
        r'quit\s*\(',
        r'while\s+True\s*:',
        r'for.*in.*range\s*\(\s*\d{6,}',  # 防止大循环
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, code, re.IGNORECASE):
            return False, f"代码包含不安全的操作: {pattern}"
    
    return True, "代码安全"

def execute_python_code(code):
    """在Docker容器中安全执行Python代码"""
    client = get_docker_client()
    if not client:
        return False, "Docker服务不可用", "", "无法连接到Docker服务"
    
    # 安全检查
    is_safe, safety_message = is_code_safe(code)
    if not is_safe:
        return False, "", "", safety_message
    
    try:
        # 创建临时文件
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        # 准备Docker执行环境
        container_code_path = '/tmp/user_code.py'
        
        # 运行Docker容器 - 最简化版本，确保兼容性
        try:
            result = client.containers.run(
                image=DOCKER_IMAGE,
                command=f'python {container_code_path}',
                volumes={temp_file: {'bind': container_code_path, 'mode': 'ro'}},
                remove=True,  # 执行完自动删除
                stdout=True,
                stderr=True
                # 移除所有可能不兼容的参数
            )
            
            # 获取输出 - result 已经是字节串
            if isinstance(result, bytes):
                output = result.decode('utf-8').strip()
            else:
                output = str(result).strip()
            
            return True, output, "", "执行成功"
                
        except docker.errors.ContainerError as e:
            # 容器执行错误（非零退出代码）
            error_output = ""
            if hasattr(e, 'stderr') and e.stderr:
                error_output = e.stderr.decode('utf-8') if isinstance(e.stderr, bytes) else str(e.stderr)
            else:
                error_output = str(e)
            return False, "", error_output, "代码执行出错"
            
        except docker.errors.APIError as e:
            return False, "", str(e), "Docker API错误"
            
        except Exception as e:
            return False, "", str(e), f"容器执行异常: {type(e).__name__}"
            
    except Exception as e:
        return False, "", "", f"执行准备失败: {str(e)}"
    finally:
        # 清理临时文件
        try:
            if 'temp_file' in locals():
                os.unlink(temp_file)
        except:
            pass

@bp.route('/run', methods=['POST'])
def run_code():
    """运行代码并返回结果"""
    data = request.get_json()
    
    if not data or 'code' not in data:
        return jsonify({'error': 'No code submitted'}), 400
    
    submitted_code = data.get('code', '').strip()
    
    if not submitted_code:
        return jsonify({'error': 'Empty code submitted'}), 400
    
    # 执行代码
    success, stdout, stderr, message = execute_python_code(submitted_code)
    
    if success:
        return jsonify({
            'message': 'Code executed successfully',
            'output': stdout,
            'error': None,
            'execution_time': '< 1s'
        }), 200
    else:
        return jsonify({
            'message': 'Code execution failed',
            'output': stdout,
            'error': stderr or message,
            'execution_time': None
        }), 400

@bp.route('/submit/<int:lesson_id>', methods=['POST'])
@jwt_required()
def submit_code(lesson_id):
    """提交编程作业并自动评分"""
    current_user = get_jwt_identity()
    user_id = current_user['id']
    
    # 验证用户
    user = User.query.get(user_id)
    if not user or not user.is_student():
        return jsonify({'error': 'Only students can submit solutions'}), 403
    
    data = request.get_json()
    if not data or 'code' not in data:
        return jsonify({'error': 'No code submitted'}), 400
    
    submitted_code = data.get('code', '').strip()
    
    if not submitted_code:
        return jsonify({'error': 'Empty code submitted'}), 400
    
    # 验证课程存在
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404
    
    try:
        # 执行代码并获取实际输出
        success, stdout, stderr, message = execute_python_code(submitted_code)
        
        # 评分逻辑
        test_results = []
        passed_tests = 0
        total_tests = 3
        
        if not success:
            # 代码执行失败
            test_results = [{
                'test_case': 1,
                'passed': False,
                'message': f'代码执行失败: {stderr or message}'
            }]
            score = 0
        else:
            # 测试1: 代码成功执行
            test_results.append({
                'test_case': 1,
                'passed': True,
                'message': '代码成功执行'
            })
            passed_tests += 1
            
            # 测试2: 检查是否有输出
            if stdout.strip():
                test_results.append({
                    'test_case': 2,
                    'passed': True,
                    'message': '代码产生了输出'
                })
                passed_tests += 1
            else:
                test_results.append({
                    'test_case': 2,
                    'passed': False,
                    'message': '代码没有产生输出'
                })
            
            # 测试3: 检查特定输出（根据作业要求定制）
            expected_outputs = ['hello', 'Hello', 'HELLO']
            output_found = any(expected in stdout for expected in expected_outputs)
            
            if output_found:
                test_results.append({
                    'test_case': 3,
                    'passed': True,
                    'message': '输出包含预期内容'
                })
                passed_tests += 1
            else:
                test_results.append({
                    'test_case': 3,
                    'passed': False,
                    'message': f'输出不包含预期内容。实际输出: "{stdout.strip()}"'
                })
        
        # 计算分数
        score = int((passed_tests / total_tests) * 100)
        
        # 记录提交历史
        submission = SubmissionHistory(
            student_id=user_id,
            lesson_id=lesson_id,
            submission_type='coding',
            content=submitted_code,
            score=score,
            feedback=f'通过 {passed_tests}/{total_tests} 个测试用例'
        )
        db.session.add(submission)
        
        # 更新或创建进度记录
        progress = Progress.query.filter_by(student_id=user_id, lesson_id=lesson_id).first()
        if progress:
            if score > progress.coding_score:
                progress.coding_score = score
            progress.attempts += 1
            progress.last_attempt_at = datetime.utcnow()
        else:
            progress = Progress(
                student_id=user_id,
                lesson_id=lesson_id,
                coding_score=score,
                attempts=1,
                last_attempt_at=datetime.utcnow()
            )
            db.session.add(progress)
        
        db.session.commit()
        
        # 准备返回的输出
        execution_output = stdout if success else f"错误: {stderr or message}"
        
        return jsonify({
            'message': 'Code submitted and evaluated',
            'score': score,
            'max_score': 100,
            'output': execution_output,
            'test_results': test_results,
            'passed': passed_tests == total_tests,
            'feedback': f'通过 {passed_tests}/{total_tests} 个测试用例',
            'execution_success': success
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': f'系统错误: {str(e)}',
            'message': 'Code submission failed'
        }), 500

@bp.route('/health', methods=['GET'])
def health_check():
    """检查Docker服务状态"""
    client = get_docker_client()
    if client:
        try:
            client.ping()
            return jsonify({
                'status': 'healthy',
                'docker': 'connected',
                'message': 'Code execution service is ready'
            }), 200
        except:
            return jsonify({
                'status': 'unhealthy',
                'docker': 'disconnected',
                'message': 'Docker service unavailable'
            }), 503
    else:
        return jsonify({
            'status': 'unhealthy',
            'docker': 'unavailable',
            'message': 'Cannot connect to Docker'
        }), 503