# --- backend/Dockerfile ---
FROM python:3.10-slim

# 把時區調到 Asia/Taipei 方便 log
ENV TZ=Asia/Taipei

# 安裝 Docker 客戶端
RUN apt-get update && \
    apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli

# 建置階段
WORKDIR /app

# 先創建 requirements.txt 文件
RUN echo "Flask==2.0.1\n\
Flask-SQLAlchemy==2.5.1\n\
Flask-Migrate==3.1.0\n\
Flask-Cors==3.0.10\n\
SQLAlchemy==1.4.23\n\
python-dotenv==0.19.0\n\
gunicorn==20.1.0\n\
Werkzeug==2.0.1\n\
Jinja2==3.0.1\n\
itsdangerous==2.0.1\n\
click==8.0.1\n\
MarkupSafe==2.0.1\n\
alembic==1.7.3\n\
psycopg2-binary==2.9.1\n\
pymysql==1.0.2\n\
docker==6.1.3" > requirements.txt

# 安裝相依套件
RUN pip install --no-cache-dir -r requirements.txt

# 把專案搬進去
COPY . .

# 設置環境變量
ENV PORT=10000

# 暴露端口
EXPOSE ${PORT}

# 啟動命令
CMD gunicorn --bind 0.0.0.0:${PORT} app:app
