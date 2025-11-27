# 🚀 UIT-GO Backend Service

**Django REST Framework API cho Authentication và Driver Profile Management**

---

## 📋 Tổng quan

UIT-Go Backend Service là một Django REST API service cung cấp:
- **Authentication**: Đăng ký, đăng nhập, quản lý users (passenger & driver)
- **Driver Profile**: Quản lý thông tin tài xế (đăng ký, cập nhật status, thống kê)
- **Admin Panel**: Quản lý users và drivers cho admin

---

## 🏗️ Kiến trúc

```
┌─────────────────┐
│  User Service   │  ← Django REST API (Port 8001)
│  - Auth         │
│  - Drivers      │
│  - Admin        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │  ← Database (Port 5432)
│   (user-db)     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│    pgAdmin     │  ← Database Management (Port 5050)
└─────────────────┘
```


## 🚀 Cách chạy hệ thống

### **1. Yêu cầu hệ thống**
- Docker & Docker Compose
- Git

### **2. Clone và setup**
```bash
git clone <repository-url>
cd "SE360 UIT-GO"
```

### **3. Tạo file .env ở thư mục gốc (tùy chọn)**
```bash
cat > .env << 'EOF'
SECRET_KEY=django-insecure-dev-key-change-in-production
JWT_SECRET=your-jwt-secret-key-change-in-production
USER_DB_NAME=user_service
USER_DB_USER=postgres
USER_DB_PASSWORD=postgres123
ALLOWED_HOSTS=*
PGADMIN_EMAIL=admin@uitgo.com
PGADMIN_PASSWORD=admin123
EOF
```

### **4. Chạy hệ thống với Docker Compose**
```bash
# Build và khởi động tất cả services
docker compose up -d --build

# Chạy migrations
docker compose exec user-service python manage.py migrate

# Tạo tài khoản superuser (chỉ lần đầu)
docker compose exec user-service python manage.py createsuperuser
# Email: admin@uitgo.com, Password: admin123 (hoặc tùy chỉnh)

# Xem logs
docker compose logs -f user-service
```

### **5. Truy cập services**
- **API Base URL**: `http://localhost:8001`
- **Django Admin**: `http://localhost:8001/admin/`
- **pgAdmin**: `http://localhost:5050` (Email: `admin@uitgo.com`, Password: `admin123`)

---

## 📚 API Endpoints

### **Base URL:** `http://localhost:8001`

---

## 🔑 Authentication APIs

### **1. Đăng ký User**

**Endpoint:** `POST /api/auth/register/`

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

**Validation:**
- `email`: Required, unique, valid email format
- `password`: Required, min 8 characters
- `password_confirm`: Required, must match password
- `full_name`: Required
- `phone`: Optional, format: 0xxxxxxxxx (10-11 digits)
- `user_type`: Required, chỉ nhận "passenger" hoặc "driver"

**Response Success (201):**
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
      "is_active": true,
      "is_verified": false,
      "created_at": "2025-11-27T10:00:00Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "Bearer",
      "expires_in": 3600
    }
  },
  "message": "Đăng ký thành công"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Đăng ký không thành công",
    "details": {
      "email": ["Email already exists"],
      "password": ["This password is too short. It must contain at least 8 characters."]
    }
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8001/api/auth/register/ \
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

**Endpoint:** `POST /api/auth/login/`

**Authentication:** ❌ Không cần

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response Success (200):**
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
      "access_token": "eyJ...",
      "refresh_token": "eyJ...",
      "token_type": "Bearer",
      "expires_in": 3600
    }
  },
  "message": "Đăng nhập thành công"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8001/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

---

### **3. Đăng xuất**

**Endpoint:** `POST /api/auth/logout/`

**Authentication:** ✅ Required (Bearer Token)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8001/api/auth/logout/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

---

### **4. Lấy thông tin User hiện tại**

**Endpoint:** `GET /api/auth/me/`

**Authentication:** ✅ Required (Bearer Token)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response Success (200):**
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
      "is_active": true,
      "is_verified": false,
      "created_at": "2025-11-27T10:00:00Z",
      "last_login": "2025-11-27T10:30:00Z"
    }
  },
  "message": "Lấy thông tin người dùng thành công"
}
```

**cURL Example:**
```bash
curl http://localhost:8001/api/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### **5. Lấy User theo ID**

**Endpoint:** `GET /api/auth/{user_id}/`

**Authentication:** ❌ Không cần

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A"
    }
  },
  "message": "Lấy thông tin người dùng thành công"
}
```

---

### **6. Refresh Token**

**Endpoint:** `POST /api/auth/refresh-token/`

**Authentication:** ❌ Không cần

**Request Body:**
```json
{
  "refresh": "YOUR_REFRESH_TOKEN"
}
```

**Response Success (200):**
```json
{
  "access": "NEW_ACCESS_TOKEN"
}
```

---

## 🚗 Driver APIs

### **1. Đăng ký Driver Profile**

**Endpoint:** `POST /api/drivers/register/`

**Authentication:** ✅ Required (Bearer Token)

**Yêu cầu:** User phải có `user_type='driver'`

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "vehicle_type": "bike",  // "bike", "car_4seats", "car_7seats"
  "vehicle_brand": "Wave",
  "vehicle_model": "Honda Wave",
  "vehicle_color": "Đỏ",
  "license_plate": "59A-12345",  // Format: 2 số + 1-2 chữ + 4-5 số
  "driver_license_number": "123456789",
  "drive_license_expiry": "2024-02-23",  // Format: YYYY-MM-DD
  "vehicle_registration_number": "REG123456"
}
```

**Validation:**
- `vehicle_type`: Required, chỉ nhận: bike, car_4seats, car_7seats
- `license_plate`: Required, format: `59A-12345`, không được trùng
- `driver_license_number`: Required, max 20 ký tự
- `drive_license_expiry`: Required, format YYYY-MM-DD, không được trong quá khứ
- `vehicle_brand`, `vehicle_model`, `vehicle_color`, `vehicle_registration_number`: Optional

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "driver_profile": {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "email": "driver@example.com",
        "full_name": "Tài Xế A"
      },
      "vehicle_type": "bike",
      "vehicle_brand": "Wave",
      "license_plate": "59A-12345",
      "approval_status": "pending",
      "created_at": "2025-11-27T10:00:00Z"
    }
  },
  "message": "Đăng kí thông tin tài xế thành công"
}
```

**Response Error (403) - Không phải driver:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Chỉ tài xế mới được đăng kí thông tin tài xế"
  }
}
```

**Response Error (409) - Đã tồn tại:**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Thông tin tài xế đã tồn tại"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8001/api/drivers/register/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "vehicle_type": "bike",
    "vehicle_brand": "Wave",
    "license_plate": "59A-12345",
    "vehicle_model": "Honda Wave",
    "vehicle_color": "Đỏ",
    "driver_license_number": "123456789",
    "drive_license_expiry": "2024-02-23",
    "vehicle_registration_number": "REG123456"
  }'
```

---

### **2. Lấy Driver Profile của mình**

**Endpoint:** `GET /api/drivers/me/profile/`

**Authentication:** ✅ Required (Bearer Token)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "driver_profile": {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "email": "driver@example.com",
        "full_name": "Tài Xế A"
      },
      "vehicle_type": "bike",
      "vehicle_brand": "Wave",
      "license_plate": "59A-12345",
      "approval_status": "pending",
      "is_online": false,
      "total_trips": 0,
      "total_earnings": "0.00",
      "created_at": "2025-11-27T10:00:00Z"
    }
  },
  "message": "Lấy thông tin tài xế thành công"
}
```

---

### **3. Lấy Driver Profile theo ID**

**Endpoint:** `GET /api/drivers/{driver_id}/profile/`

**Authentication:** ❌ Không cần

**Response:** Tương tự như `/api/drivers/me/profile/`

---

### **4. Cập nhật trạng thái Online/Offline**

**Endpoint:** `PUT /api/drivers/me/status/`

**Authentication:** ✅ Required (Bearer Token)

**Yêu cầu:** 
- User phải có `user_type='driver'`
- Driver profile phải được approved

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "is_online": true,
  "latitude": 10.762622,  // Required khi is_online=true
  "longitude": 106.660172  // Required khi is_online=true
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "driver_id": "uuid",
    "is_online": true,
    "vehicle_type": "bike",
    "updated_at": "2025-11-27T10:00:00Z"
  },
  "message": "Cập nhật trạng thái online của tài xế {driver_id} thành công"
}
```

**Response Error (403) - Chưa được duyệt:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Tài xế chưa được phê duyệt, vui lòng đợi phê duyệt"
  }
}
```

---

### **5. Cập nhật thống kê Driver**

**Endpoint:** `PATCH /api/drivers/{driver_id}/stats/`

**Authentication:** ✅ Required (Bearer Token)

**Request Body:**
```json
{
  "total_trips": 10,
  "total_earnings": "500000.00"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "total_trips": 10,
    "total_earnings": "500000.00"
  },
  "message": "Cập nhật thống kê của tài xế thành công"
}
```

---

## 👨‍💼 Admin APIs

### **Base URL:** `http://localhost:8001`

**Authentication:** ✅ Required (Bearer Token + Admin role)

**Yêu cầu:** User phải có `is_staff=True` hoặc `is_superuser=True`

---

### **1. Dashboard Statistics**

**Endpoint:** `GET /api/admin/dashboard/stats/`

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 100,
      "passengers": 80,
      "drivers": 20,
      "new_last_7days": 15
    },
    "drivers": {
      "total": 20,
      "pending_approval": 5,
      "approved": 15,
      "currently_online": 8
    }
  },
  "message": "Lấy thống kê thành công"
}
```

---

### **2. Liệt kê Users**

**Endpoint:** `GET /api/admin/users/`

**Query Parameters:**
- `user_type`: passenger/driver (optional)
- `is_active`: true/false (optional)
- `search`: tìm theo email/name (optional)
- `page`: số trang (default: 1)
- `page_size`: số items mỗi trang (default: 20, max: 100)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "full_name": "Nguyễn Văn A",
        "phone": "0901234567",
        "user_type": "passenger",
        "is_active": true,
        "is_verified": false,
        "created_at": "2025-11-27T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100
    }
  },
  "message": "Lấy danh sách users thành công"
}
```

---

### **3. Xóa User**

**Endpoint:** `DELETE /api/admin/users/{user_id}/`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Xóa user thành công"
}
```

---

### **4. Liệt kê Drivers**

**Endpoint:** `GET /api/admin/drivers/`

**Query Parameters:**
- `status`: pending/approved/rejected/suspended (optional)
- `page`: số trang (default: 1)
- `page_size`: số items mỗi trang (default: 20, max: 100)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "drivers": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "email": "driver@example.com",
          "full_name": "Tài Xế A"
        },
        "license_plate": "59A-12345",
        "vehicle_type": "bike",
        "approval_status": "pending",
        "is_online": false,
        "created_at": "2025-11-27T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 20
    }
  },
  "message": "Lấy danh sách drivers thành công"
}
```

---

### **5. Duyệt/Từ chối Driver**

**Endpoint:** `POST /api/admin/drivers/{driver_id}/approve/`

**Request Body:**
```json
{
  "action": "approve",  // "approve" hoặc "reject"
  "note": "Đã kiểm tra đầy đủ giấy tờ"  // Optional
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "driver_profile": {
      "id": "uuid",
      "approval_status": "approved",
      "approved_at": "2025-11-27T10:00:00Z"
    }
  },
  "message": "Duyệt tài xế thành công"
}
```

---

## 🔐 Authentication

### **JWT Token**

Hầu hết các API yêu cầu JWT token trong header:
```
Authorization: Bearer <access_token>
```

**Token Lifetime:**
- Access Token: 1 giờ (3600 seconds)
- Refresh Token: 30 ngày

**Lấy Token:**
1. Đăng ký: `POST /api/auth/register/`
2. Đăng nhập: `POST /api/auth/login/`

---

## 📊 Database Models

### **User Model**

```python
- id: UUID (Primary Key)
- email: EmailField (Unique)
- full_name: CharField
- phone: CharField (Optional)
- user_type: CharField (passenger/driver/admin)
- is_active: BooleanField
- is_verified: BooleanField
- is_staff: BooleanField
- created_at: DateTimeField
- updated_at: DateTimeField
- last_login: DateTimeField
```

### **DriverProfile Model**

```python
- id: UUID (Primary Key)
- user: OneToOneField (User)
- vehicle_type: CharField (bike/car_4seats/car_7seats)
- vehicle_brand: CharField
- vehicle_model: CharField
- vehicle_color: CharField
- license_plate: CharField
- driver_license_number: CharField
- drive_license_expiry: DateField
- vehicle_registration_number: CharField
- approval_status: CharField (pending/approved/rejected/suspended)
- approval_note: TextField
- approved_at: DateTimeField
- total_trips: IntegerField
- total_earnings: DecimalField
- is_online: BooleanField
- last_online_at: DateTimeField
- created_at: DateTimeField
- updated_at: DateTimeField
```

---

## 🗄️ Database

### **Kết nối Database**

**Thông tin mặc định:**
- Host: `user-db` (trong Docker) hoặc `localhost` (local)
- Port: `5432`
- Database: `user_service`
- Username: `postgres`
- Password: `postgres123`

### **Xem dữ liệu qua pgAdmin**

1. Truy cập: `http://localhost:5050`
2. Đăng nhập: `admin@uitgo.com` / `admin123`
3. Thêm server:
   - Host: `user-db`
   - Port: `5432`
   - Database: `user_service`
   - Username: `postgres`
   - Password: `postgres123`

---

## 🧪 Testing

### **1. Dùng Postman**
- Tạo collection với các endpoints
- Set environment variables
- Test các endpoints

### **2. Dùng Browsable API**
- Truy cập: `http://localhost:8001/api/auth/register/`
- Điền form và submit
- Authorize với token để test protected APIs

### **3. Dùng cURL**
```bash
# Register
curl -X POST http://localhost:8001/api/auth/register/ \
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
curl -X POST http://localhost:8001/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

---

## 🔧 Development

### **Chạy migrations**
```bash
docker compose exec user-service python manage.py makemigrations
docker compose exec user-service python manage.py migrate
```

### **Tạo superuser**
```bash
docker compose exec user-service python manage.py createsuperuser
```

### **Xem logs**
```bash
# Tất cả services
docker compose logs -f

# Chỉ user-service
docker compose logs -f user-service

# Chỉ database
docker compose logs -f user-db
```

### **Restart service**
```bash
docker compose restart user-service
```

### **Rebuild sau khi thay đổi code**
```bash
docker compose up -d --build user-service
```

---



