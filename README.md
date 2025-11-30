# UIT-Go PROJECT

 UIT-Go là một ứng dụng mô phỏng nền tảng gọi xe thông minh, cho phép hành khách
đặt xe và kết nối với các tài xế ở gần theo thời gian thực. Hệ thống được thiết kế nhằm
tái hiện quy trình vận hành của một dịch vụ gọi xe hiện đại, đồng thời là môi trường để
triển khai và kiểm thử các thành phần microservices trong kiến trúc cloud-native.


---

## 📋 Nội dung

1. [Tổng quan dự án](#project-overview)
2. [Các tính năng chính](#key-features)
3. [Kiến trúc hệ thống](#architecture)
4. [Công nghệ sử dụng](#technology-stack)
5. [Cài đặt & Thiết lập](#installation--setup)
6. [Kiểm thử giao tiếp giữa các dịch vụ](#testing-inter-service-communication)
8. [Cấu trúc dự án](#project-structure)
9. [Hướng dẫn phát triển](#development-guide)
10. [Xử lý sự cố](#troubleshooting)
11. [Tài liệu](#documentation)
12. [Thành viên nhóm](#team-members)
13. [Giấy phép](#license)

---

## 📖 Tổng quan dự án

Ứng dụng UIT-Go được xây dựng với hai nhóm người dùng chính: Hành khách và Tài
xế

---

## 🔑 Các tính năng chính

## 1. Quản lý người dùng (User Management) 

- Service: User Service.
- Framework: Django (Python).
- Database: PostgreSQL (lưu trữ thông tin tài khoản, mật khẩu đã hash, hồ sơ người dùng).
- Xác thực & Bảo mật:

   - AWS Cognito: Quản lý định danh (User Pool), chính sách mật khẩu và MFA (Multi-Factor Authentication) thay vì tự xây dựng hệ thống auth.
   - JWT (JSON Web Token): Dùng để xác thực phiên đăng nhập.
   - AWS Secrets Manager: Quản lý thông tin đăng nhập database (credentials) để bảo mật.
 
## 2. Đặt chuyến và ghép nối (Ride matching)

- Service: Driver Service, Trip Service
- Framework: Node.js
- Database: MongoDB được dùng để truy vấn và tính toán tìm tài xế gần nhất dựa trên tọa độ.
- Công nghệ xử lý hàng đợi (Queue): AWS SQS hoặc Kafka được sử dụng để đẩy yêu cầu "find-driver" vào hàng đợi nhằm xử lý bất đồng bộ, giúp hệ thống chịu tải cao khi có nhiều người đặt xe cùng lúc.

## 3. Quản lý vị trí và bản đồ (Location Service)

- Service: Driver Service
- Framework: Node.js
- Database: MongoDB (lưu trữ dữ liệu địa lý GeoJSON như tọa độ [lng, lat]).
- Cơ sở dữ liệu đệm (Caching): Redis (Amazon ElastiCache) được sử dụng để lưu và truy vấn nhanh vị trí tài xế theo thời gian thực (Real-time), giúp giảm tải cho database chính.
- Giao thức cập nhật: Hệ thống đề xuất sử dụng WebSocket hoặc SSE (Server-Sent Events) để đẩy dữ liệu vị trí real-time thay vì polling liên tục.

## 4. Quản lý chuyến đi (Trip Management)

- Service: Trip Service
- Framework: Node.js
- Database:

  - MongoDB: Lưu trữ thông tin chi tiết chuyến đi (Trip Document) trong quá trình xử lý.
  - PostgreSQL: Được sử dụng để cập nhật trạng thái chuyến đi (update/trip, cancel/trip) và lưu trữ dữ liệu có cấu trúc lịch sử chuyến nhằm đảm bảo tính toàn vẹn
- Cơ chế khóa (Locking): Sử dụng Distributed Lock (Redis lock) hoặc ràng buộc Database để ngăn chặn lỗi "Race condition" (ví dụ: 2 tài xế cùng nhận 1 chuyến).

---

## 🏗 Kiến trúc hệ thống

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

---

## 🛠 Công nghệ sử dụng

## 1. Backend

Hệ thống được chia thành các dịch vụ nhỏ với công nghệ phù hợp cho từng chức năng:

  - Node.js: Được sử dụng cho Driver Service và Trip Service để xử lý các tác vụ IO-bound và thời gian thực.
  - Python (Django Framework): Được sử dụng cho User Service để tận dụng khả năng quản lý xác thực và quản trị mạnh mẽ của Django.
  - RESTful API: Giao thức giao tiếp chính giữa các microservices và client.

## 2. Database & Caching

Sử dụng chiến lược "Database per Service" (Mỗi dịch vụ một cơ sở dữ liệu riêng):

  - PostgreSQL: Cơ sở dữ liệu quan hệ (SQL) dùng cho User Service (lưu user/session) và Trip Service (lưu thông tin chuyến đi, hóa đơn).
  - MongoDB: Cơ sở dữ liệu phi quan hệ (NoSQL) dùng cho Driver Service và một phần Trip Service để lưu trữ dữ liệu vị trí địa lý (GeoJSON) và lịch sử di chuyển.
  - Redis (ElastiCache): Dùng để caching (lưu đệm) dữ liệu truy cập thường xuyên và lưu vị trí tài xế theo thời gian thực để giảm tải cho DB chính.

## 3. Containerization & Orchestration

- Docker: Đóng gói ứng dụng thành các container image.
- Docker Compose: Dùng để triển khai và chạy thử nghiệm hệ thống trên môi trường local.
- AWS ECS (Elastic Container Service) với Fargate: Nền tảng quản lý container serverless được sử dụng để chạy các dịch vụ trên môi trường AWS.

## 4. Hạ tầng đám mây

Hệ thống được triển khai hoàn toàn trên Amazon Web Services (AWS):

   - Compute: AWS Fargate (chạy container không cần quản lý server) và EC2 (cho môi trường thử nghiệm).
   - Networking: VPC (Virtual Private Cloud), NAT Gateway, Internet Gateway, và Application Load Balancer (ALB) để định tuyến traffic.
   - Storage: S3 (dùng để lưu trữ backup hoặc static files - được nhắc đến trong giải pháp backup).
   - Message Queue: AWS SQS (Simple Queue Service) dùng để xử lý bất đồng bộ (async) cho các tác vụ như tìm tài xế.
   - Security & Identity:
        - AWS Cognito: Quản lý định danh người dùng (User Pool).
        - AWS KMS (Key Management Service): Quản lý khóa mã hóa dữ liệu.
        - AWS Secrets Manager: Quản lý các thông tin nhạy cảm (DB credentials).

## 5. Infrastructure as Code (IaC)

Terraform: Công cụ chính được sử dụng để định nghĩa và khởi tạo toàn bộ hạ tầng AWS (VPC, Subnets, ECS, RDS...) thông qua mã nguồn, đảm bảo tính nhất quán.

## 6. Các công cụ khác

- Nginx: Đóng vai trò Reverse Proxy đứng trước API Gateway để nhận request từ người dùng.
- k6: Công cụ dùng để Load Testing (kiểm thử chịu tải) và đo lường hiệu năng hệ thống.

---

## 🚀 Cài đặt & Thiết lập

## 1. Yêu cầu hệ thống

- Docker & Docker Compose
- Git

## 2. Clone và set up

```bash
git clone <repository-url>
cd "SE360 UIT-GO"
```

## 3. Tạo file .env ở thư mục gốc (tùy chọn)

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

## 4. Chạy hệ thống với Docker Compose

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

## 5. Truy cập services
- **API Base URL**: `http://localhost:8001`
- **Django Admin**: `http://localhost:8001/admin/`
- **pgAdmin**: `http://localhost:5050` (Email: `admin@uitgo.com`, Password: `admin123`)
  
---

## 🧪 Kiểm thử giao tiếp giữa các dịch vụ

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

## 💻 Hướng dẫn phát triển

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

## 👥 Thành viên nhóm

**Môn học**: SE360 – Cloud Computing and Modern Application Development  
**Trường**: University of Information Technology (**UIT**)  
**Lớp**: SE360.Q11  

| Họ và tên         | MSSV | Công việc                                                                                           |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------- |
| Võ Thành Đạt        | 23520279   |                    |
| Võ Hoàng Doanh         | 23520295   |           |
| Nguyễn Đình Giang | 22520358   |  |
| Đoàn Minh Tuấn | 22521600   |  |
| Phạm Ngọc Thiên | 23521485   |  |
