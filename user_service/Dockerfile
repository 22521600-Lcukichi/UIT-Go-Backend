# ==========================================
# Dockerfile cho User Service - UIT-Go Backend
# ==========================================

# Sử dụng Python 3.11 official image làm base image
FROM python:3.11-slim

# Metadata
LABEL maintainer="UIT-Go Team"
LABEL service="user-service"
LABEL version="1.0"

# Set environment variables
# Ngăn Python tạo .pyc files (bytecode)
ENV PYTHONDONTWRITEBYTECODE=1
# Ngăn Python buffer output (logs xuất hiện real-time)
ENV PYTHONUNBUFFERED=1

# Tạo thư mục làm việc trong container
WORKDIR /app

# Cài đặt system dependencies cần thiết
# postgresql-client: để kết nối với PostgreSQL
# gcc, python3-dev, musl-dev: để build một số Python packages
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt trước để tận dụng Docker cache
# Nếu requirements.txt không thay đổi, Docker sẽ cache layer này
COPY requirements.txt .

# Upgrade pip và cài đặt dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ source code vào container
COPY . .

# Tạo thư mục cho static files và media files
RUN mkdir -p /app/staticfiles /app/mediafiles

# Copy và set permission cho entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose port 8001 (User Service)
EXPOSE 8001

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

