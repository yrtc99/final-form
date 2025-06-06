# --- backend/Dockerfile ---
FROM python:3.10-slim
# 把時區調到 Asia/Taipei 方便 log
ENV TZ=Asia/Taipei

# 建置階段
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 把專案搬進去
COPY . .

# Gunicorn 是 Render 上最省事的 WSGI server
EXPOSE 8000
CMD ["gunicorn", "-b", "0.0.0.0:8000", "app:create_app()"]
