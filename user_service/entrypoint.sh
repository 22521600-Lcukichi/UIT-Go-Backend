#!/bin/bash
set -e

echo "⏳ Đợi database sẵn sàng..."
while ! pg_isready -h $DB_HOST -p $DB_PORT; do
  echo "Database chưa sẵn sàng, đợi 2 giây..."
  sleep 2
done

echo "✅ Database đã sẵn sàng!"

echo "🔄 Chạy migrations..."
python manage.py migrate --noinput

echo "📦 Thu thập static files..."
python manage.py collectstatic --noinput --clear || true

echo "🚀 Khởi động User Service trên port 8001..."
python manage.py runserver 0.0.0.0:8001


