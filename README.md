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
5. [Yêu cầu tiên quyết](#prerequisites)
6. [Cài đặt & Thiết lập](#installation--setup)
7. [Chạy ứng dụng](#running-the-application)
8. [Kiểm thử giao tiếp giữa các dịch vụ](#testing-inter-service-communication)
9. [Cấu trúc dự án](#project-structure)
10. [Hướng dẫn phát triển](#development-guide)
11. [Xử lý sự cố](#troubleshooting)
12. [Tài liệu](#documentation)
13. [Thành viên nhóm](#team-members)
14. [Giấy phép](#license)

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
 
## 2. Ghép nối chuyến đi (Ride matching)

- Service: Driver Service, Trip Service
- Framework: Node.js
- Database: MongoDB được dùng để truy vấn và tính toán tìm tài xế gần nhất dựa trên tọa độ.
- Công nghệ xử lý hàng đợi (Queue): AWS SQS hoặc Kafka được sử dụng để đẩy yêu cầu "find-driver" vào hàng đợi nhằm xử lý bất đồng bộ, giúp hệ thống chịu tải cao khi có nhiều người đặt xe cùng lúc.


