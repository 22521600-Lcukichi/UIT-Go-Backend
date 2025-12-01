# 🚀 UIT-GO - Microservices Backend System

**Hệ thống backend microservices cho ứng dụng đặt xe UIT-Go**

---

## 📋 Tổng quan

UIT-Go là hệ thống microservices được xây dựng với:
- **API Gateway** (Node.js/Express) - Điểm vào duy nhất cho tất cả requests
- **User Service** (Django REST Framework) - Authentication & Driver Profile Management
- **Driver Service** (Node.js/Express) - Quản lý vị trí và tìm kiếm tài xế
- **Trip Service** (Node.js/Express) - Quản lý chuyến đi

---

## 🏗️ Kiến trúc hệ thống

```
┌──────────────┐
│   Client     │
│  (Frontend)  │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────┐
│      API Gateway (Port 3000)       │
│  - Authentication & Authorization   │
│  - Request Routing                 │
│  - Service-to-Service Auth          │
└──────┬──────────────────────────────┘
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│   User   │  │  Driver  │  │   Trip   │
│ Service  │  │ Service  │  │ Service  │
│  :8001   │  │  :3003   │  │  :3004   │
│(Django)  │  │(Node.js) │  │(Node.js) │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │              │
     ▼             ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│PostgreSQL│  │ MongoDB  │  │ MongoDB  │
│  :5432   │  │  :27017  │  │  :27017  │
└──────────┘  └──────────┘  └──────────┘
```

---

## 🚀 Cách chạy hệ thống

### **Yêu cầu hệ thống**
- Docker & Docker Compose
- Git
- (Tùy chọn) Node.js 20+ và Python 3.11+ nếu chạy local

### **1. Clone repository**
```bash
git clone <repository-url>
cd "SE360 UIT-GO"
```

### **2. Tạo file .env (Tùy chọn)**
```bash
# Tạo file .env ở root với nội dung:
cat > .env << 'EOF'
# Service URLs (Docker internal network)
USER_SERVICE_URL=http://user-service:8001
DRIVER_SERVICE_URL=http://driver-service:3003
TRIP_SERVICE_URL=http://trip-service:3004

# Authentication & Security
JWT_SECRET=your-jwt-secret-key-change-in-production
INTERNAL_SERVICE_TOKEN=uit-go-internal-service-token-change-in-production

# User Service Database
USER_DB_NAME=user_service
USER_DB_USER=postgres
USER_DB_PASSWORD=postgres123

# Django Settings
SECRET_KEY=django-insecure-dev-key-change-in-production
ALLOWED_HOSTS=*

# MongoDB
URL_MONGODB_SERVER=mongodb://mongodb:27017

# pgAdmin
PGADMIN_EMAIL=admin@uitgo.com
PGADMIN_PASSWORD=admin123
EOF
```

### **3. Chạy với Docker Compose (Khuyến nghị)**
```bash
# Build và khởi động tất cả services
docker compose up -d --build

# Xem logs của tất cả services
docker compose logs -f

# Xem logs của service cụ thể
docker compose logs -f user-service
docker compose logs -f api-gateway
docker compose logs -f driver-service
docker compose logs -f trip-service
```

### **4. Setup Database (Lần đầu tiên)**
```bash
# Chạy migrations cho User Service
docker compose exec user-service python manage.py migrate

# Tạo superuser (tùy chọn)
docker compose exec user-service python manage.py createsuperuser
```

### **5. Kiểm tra services đang chạy**
```bash
# Xem status các containers
docker compose ps

# Health check
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3003/health  # Driver Service
curl http://localhost:3004/health  # Trip Service
curl http://localhost:8001/admin/  # User Service Admin
```

### **6. Dừng hệ thống**
```bash
# Dừng tất cả services
docker compose down

# Dừng và xóa volumes (⚠️ Xóa dữ liệu)
docker compose down -v
```

---

## 🌐 Truy cập Services

| Service | URL | Mô tả |
|---------|-----|-------|
| **API Gateway** | http://localhost:3000 | Điểm vào chính cho tất cả API |
| **User Service** | http://localhost:8001 | Django REST API |
| **Django Admin** | http://localhost:8001/admin/ | Admin panel |
| **pgAdmin** | http://localhost:5050 | PostgreSQL management |
| **Driver Service** | http://localhost:3003 | Driver location service |
| **Trip Service** | http://localhost:3004 | Trip management service |

**Credentials pgAdmin:**
- Email: `admin@uitgo.com`
- Password: `admin123`

---

## 📚 API Documentation

### **Base URL:** `http://localhost:3000` (qua API Gateway)

Tất cả requests phải gửi qua API Gateway. API Gateway sẽ route đến service tương ứng.

---

## 🔑 Authentication APIs

### **1. Đăng ký User**

**Endpoint:** `POST /api/auth/register`

**Authentication:** ❌ Không cần

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "password_confirm": "SecurePass123",
  "full_name": "Nguyễn Văn A",
  "phone": "0901234567",
  "user_type": "passenger"  // hoặc "driver"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "phone": "0901234567",
      "user_type": "passenger"
    },
    "tokens": {
      "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
      "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
      "token_type": "Bearer",
      "expires_in": 3600
    }
  },
  "message": "Đăng ký thành công"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "password_confirm": "SecurePass123",
    "full_name": "Nguyễn Văn A",
    "phone": "0901234567",
    "user_type": "passenger"
  }'
```

---

### **2. Đăng nhập**

**Endpoint:** `POST /api/auth/login`

**Authentication:** ❌ Không cần

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "user_type": "passenger"
    },
    "tokens": {
      "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
      "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
      "token_type": "Bearer",
      "expires_in": 3600
    }
  },
  "message": "Đăng nhập thành công"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

---

### **3. Lấy thông tin User hiện tại**

**Endpoint:** `GET /api/auth/me`

**Authentication:** ✅ Required (Bearer Token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "phone": "0901234567",
      "user_type": "passenger",
      "is_verified": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  },
  "message": "Lấy thông tin người dùng thành công"
}
```

**cURL:**
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### **4. Đăng xuất**

**Endpoint:** `POST /api/auth/logout`

**Authentication:** ✅ Required (Bearer Token)

**Request Body:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

---

### **5. Refresh Token**

**Endpoint:** `POST /api/auth/refresh-token`

**Authentication:** ❌ Không cần

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### **6. Lấy thông tin User theo ID**

**Endpoint:** `GET /api/auth/:user_id`

**Authentication:** ❌ Không cần (Public endpoint)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "phone": "0901234567",
      "user_type": "passenger"
    }
  },
  "message": "Lấy thông tin người dùng thành công"
}
```

---

## 🚗 Driver Profile APIs

### **1. Đăng ký Driver Profile**

**Endpoint:** `POST /api/drivers/register`

**Authentication:** ✅ Required (Bearer Token) - Chỉ driver

**Request Body:**
```json
{
  "vehicle_type": "bike",  // "bike", "car_4seats", "car_7seats"
  "vehicle_brand": "Honda",
  "vehicle_model": "Wave",
  "vehicle_color": "Đỏ",
  "license_plate": "59A-12345",
  "driver_license_number": "123456789",
  "drive_license_expiry": "2025-12-31",
  "vehicle_registration_number": "VN123456"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "driver_profile": {
      "id": "uuid",
      "vehicle_type": "bike",
      "license_plate": "59A-12345",
      "approval_status": "pending",
      "is_online": false
    }
  },
  "message": "Đăng kí thông tin tài xế thành công"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/drivers/register \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_type": "bike",
    "license_plate": "59A-12345",
    "driver_license_number": "123456789",
    "drive_license_expiry": "2025-12-31"
  }'
```

---

### **2. Lấy Driver Profile của mình**

**Endpoint:** `GET /api/drivers/me/profile`

**Authentication:** ✅ Required (Bearer Token)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "driver_profile": {
      "id": "uuid",
      "vehicle_type": "bike",
      "vehicle_brand": "Honda",
      "vehicle_model": "Wave",
      "license_plate": "59A-12345",
      "approval_status": "approved",
      "is_online": true,
      "total_trips": 150,
      "total_earnings": 5000000.00
    }
  },
  "message": "Lấy thông tin tài xế thành công"
}
```

---

### **3. Lấy Driver Profile theo ID**

**Endpoint:** `GET /api/drivers/:driver_id/profile`

**Authentication:** ❌ Không cần (Public endpoint)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "driver_profile": {
      "id": "uuid",
      "vehicle_type": "bike",
      "license_plate": "59A-12345",
      "approval_status": "approved"
    }
  },
  "message": "Lấy thông tin tài xế (theo id) thành công"
}
```

---

### **4. Cập nhật trạng thái Online/Offline**

**Endpoint:** `PUT /api/drivers/me/status`

**Authentication:** ✅ Required (Bearer Token) - Chỉ driver

**Request Body:**
```json
{
  "is_online": true,
  "latitude": 10.762622,
  "longitude": 106.660172
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "driver_id": "uuid",
    "is_online": true,
    "vehicle_type": "bike",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Cập nhật trạng thái online của tài xế thành công"
}
```

**cURL:**
```bash
curl -X PUT http://localhost:3000/api/drivers/me/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_online": true,
    "latitude": 10.762622,
    "longitude": 106.660172
  }'
```

---

## 🗺️ Trip & Location APIs

### **1. Tạo Trip và Tìm Driver**

**Endpoint:** `POST /api/get-data-location-customer`

**Authentication:** ❌ Không cần

**Request Body:**
```json
{
  "customer_id": "uuid",
  "pickup_lat": 10.762622,
  "pickup_lng": 106.660172,
  "pickup_district": "Quận 1",
  "pickup_city": "Hồ Chí Minh",
  "destination_lat": 10.7769,
  "destination_lng": 106.7009,
  "destination_city": "Hồ Chí Minh",
  "destination_district": "Quận 3",
  "status_trip": "searching"
}
```

**Response (200):**
```json
{
  "message": "Trip created successfully",
  "trip_id": "mongodb_id",
  "driver_id": "uuid",
  "fare_estimate": 50000,
  "distance_km": 5.2
}
```

---

### **2. Driver Gửi Vị trí**

**Endpoint:** `POST /api/get-data-location`

**Authentication:** ❌ Không cần

**Request Body:**
```json
{
  "driver_id": "uuid",
  "latitude": 10.762622,
  "longitude": 106.660172,
  "district": "Quận 1",
  "city": "Hồ Chí Minh"
}
```

**Response (200):**
```json
{
  "success": true,
  "driver_status": {
    "driver_id": "uuid",
    "location": {
      "type": "Point",
      "coordinates": [106.660172, 10.762622]
    }
  },
  "status_trip": "ACCEPTED",
  "matched_trip": {
    "trip_id": "mongodb_id",
    "customer_id": "uuid",
    "pickup_district": "Quận 1",
    "pickup_city": "Hồ Chí Minh",
    "destination_city": "Hồ Chí Minh",
    "destination_district": "Quận 3"
  }
}
```

---

### **3. Driver Accept Trip**

**Endpoint:** `POST /api/DriverAcceptTrip`

**Authentication:** ❌ Không cần

**Request Body:**
```json
{
  "driver_id": "uuid",
  "trip_id": "mongodb_id"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Trip accepted successfully",
  "trip": {
    "_id": "mongodb_id",
    "driver_id": "uuid",
    "status_trip": "ACCEPTED"
  }
}
```

---

### **4. Hủy Trip**

**Endpoint:** `POST /api/cancel-trip`

**Authentication:** ❌ Không cần

**Request Body:**
```json
{
  "trip_id": "mongodb_id"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Trip canceled successfully",
  "trip": {
    "_id": "mongodb_id",
    "status_trip": "cancelled"
  }
}
```

---

### **5. Hoàn thành Trip**

**Endpoint:** `POST /api/complete-trip`

**Authentication:** ❌ Không cần

**Request Body:**
```json
{
  "trip_id": "mongodb_id",
  "pickup_latitude": 10.762622,
  "pickup_longitude": 106.660172,
  "destination_latitude": 10.7769,
  "destination_longitude": 106.7009
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Trip completed & billed successfully",
  "bill": 50000,
  "distance_km": 5.2,
  "trip": {
    "_id": "mongodb_id",
    "status_trip": "completed",
    "bill": 50000
  }
}
```

---

### **6. Lấy Vị trí Driver**

**Endpoint:** `POST /get_driver_location`

**Authentication:** ❌ Không cần

**Request Body:**
```json
{
  "driver_id": "uuid",
  "trip_id": "mongodb_id"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Driver location retrieved successfully",
  "location": {
    "type": "Point",
    "coordinates": [106.660172, 10.762622]
  }
}
```

---

## 🔧 Development

### **Chạy local (không dùng Docker)**

#### **1. User Service (Django)**
```bash
cd user_service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Tạo .env trong user_service/
# DB_HOST=localhost (thay vì user-db)

# Chạy migrations
python manage.py migrate

# Chạy server
python manage.py runserver
```

#### **2. API Gateway**
```bash
cd api-gateway
npm install

# Tạo .env
# USER_SERVICE_URL=http://localhost:8001
# DRIVER_SERVICE_URL=http://localhost:3003
# TRIP_SERVICE_URL=http://localhost:3004

npm start
```

#### **3. Driver Service**
```bash
cd driver-service
npm install

# Tạo .env
# URL_MONGODB_SERVER=mongodb://localhost:27017
# USER_SERVICE_URL=http://localhost:8001

# Đảm bảo MongoDB đang chạy
npm start
```

#### **4. Trip Service**
```bash
cd trip-service
npm install

# Tạo .env
# URL_MONGODB_SERVER=mongodb://localhost:27017
# USER_SERVICE_URL=http://localhost:8001

# Đảm bảo MongoDB đang chạy
npm start
```

---

## 🔐 Environment Variables

### **Quan trọng:**
- `JWT_SECRET`: Phải giống nhau giữa API Gateway và User Service
- `INTERNAL_SERVICE_TOKEN`: Phải giống nhau giữa tất cả services
- `USER_SERVICE_URL`, `DRIVER_SERVICE_URL`, `TRIP_SERVICE_URL`: URLs để các service gọi nhau

### **Xem file `.env.example` (nếu có) để biết danh sách đầy đủ**

---

## 🐛 Troubleshooting

### **Lỗi: Port đã được sử dụng**
```bash
# Kiểm tra port đang được sử dụng
lsof -i :3000  # API Gateway
lsof -i :8001  # User Service
lsof -i :3003  # Driver Service
lsof -i :3004  # Trip Service

# Hoặc dừng service đang dùng port đó
docker compose down
```

### **Lỗi: Database connection failed**
```bash
# Kiểm tra database containers
docker compose ps

# Xem logs database
docker compose logs user-db
docker compose logs mongodb

# Restart database
docker compose restart user-db mongodb

# Kiểm tra user-service có kết nối được không
docker compose exec user-service python manage.py dbshell
```

### **Lỗi: Service không start**
```bash
# Xem logs chi tiết
docker compose logs -f <service-name>

# Rebuild containers
docker compose up -d --build --force-recreate

# Xóa và tạo lại
docker compose down -v
docker compose up -d --build
```

### **Lỗi: Resource deadlock avoided**
- Đảm bảo `settings.py` chỉ dùng `os.getenv()`, không dùng `config()`
- Xóa file `.env` trong `user_service/` nếu có

### **Lỗi: Role "postgres" does not exist**
- Đảm bảo `DB_HOST=user-db` trong Docker (không phải `localhost`)
- Kiểm tra `user-db` container đang chạy: `docker compose ps`

### **Xóa tất cả và bắt đầu lại**
```bash
# ⚠️ CẢNH BÁO: Xóa tất cả containers, volumes, và images
docker compose down -v --rmi all
docker compose up -d --build
```

---

## 📁 Cấu trúc Project

```
SE360 UIT-GO/
├── api-gateway/          # API Gateway service
│   ├── routes/          # Route handlers (auth, driver)
│   ├── middleware/      # Auth middleware
│   ├── config/         # Configuration
│   ├── utils/          # Utilities
│   └── server.js       # Main server
├── user_service/        # Django User Service
│   ├── authentication/  # Auth app
│   ├── drivers/        # Driver profile app
│   └── user_service/   # Django settings
├── driver-service/      # Driver location service
│   ├── model/          # MongoDB models
│   └── config/        # Database config
├── trip-service/        # Trip management service
│   ├── model/          # MongoDB models
│   ├── utils/         # Validation utilities
│   └── config/        # Database config
├── Docker-compose.yaml  # Docker Compose config
└── README.md           # This file
```

---

## 🧪 Testing

### **Test API với cURL**

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "password_confirm": "Test123456",
    "full_name": "Test User",
    "phone": "0901234567",
    "user_type": "passenger"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

---

## 📝 Notes

- Tất cả services giao tiếp qua Docker internal network
- Service-to-service authentication dùng `INTERNAL_SERVICE_TOKEN` (header: `X-Internal-Service-Token`)
- User authentication dùng JWT tokens (header: `Authorization: Bearer <token>`)
- Database: PostgreSQL cho User Service, MongoDB cho Driver & Trip Services
- API Gateway là single entry point - tất cả requests phải qua Gateway

---

## 🔄 Service Communication Flow

```
Client → API Gateway → User Service (JWT Auth)
                    → Driver Service (Internal Token)
                    → Trip Service (Internal Token)
```

**Authentication:**
- Client → API Gateway: JWT Token
- API Gateway → Services: Internal Service Token
- Services → Services: Internal Service Token

---

