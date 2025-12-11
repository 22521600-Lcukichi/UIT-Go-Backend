# 1. Tổng quan kiến trúc hệ thống

# 🏗 Kiến trúc Hệ thống UIT-Go

Hệ thống **UIT-Go** được thiết kế theo kiến trúc **Cloud-Native Microservices**, triển khai trên nền tảng **Amazon Web Services (AWS)** để đảm bảo tính linh hoạt và khả năng mở rộng.

---

## 🧩 Mô hình Microservices
Hệ thống được chia thành 3 dịch vụ chính hoạt động độc lập và đóng gói bằng **Docker**:

* **User Service** (`Django/Python`): Quản lý tài khoản và xác thực người dùng.
* **Trip Service** (`Node.js`): Xử lý logic đặt xe, trạng thái chuyến đi và thanh toán.
* **Driver Service** (`Node.js`): Quản lý định vị và trạng thái tài xế theo thời gian thực.

## 🌐 Cổng giao tiếp (Gateway & Routing)
* **API Gateway:** Đóng vai trò trung gian tiếp nhận mọi yêu cầu từ client, thực hiện định tuyến đến các service tương ứng.
* **Application Load Balancer (ALB) & Nginx:** Điều phối lưu lượng truy cập và đóng vai trò Reverse Proxy để tăng cường bảo mật.

## 💾 Tầng dữ liệu (Data Layer)
Tuân thủ nguyên tắc **Database per Service** (mỗi dịch vụ có cơ sở dữ liệu riêng):

* **PostgreSQL:** Lưu trữ dữ liệu có cấu trúc cho *User Service* và *Trip Service*.
* **MongoDB & Redis:** Lưu trữ dữ liệu phi cấu trúc và truy vấn nhanh (caching) cho *Driver Service*.

## ☁️ Hạ tầng mạng (Infrastructure)
Hệ thống sử dụng mô hình **3-Tier** (Web, App, Data) bên trong một **VPC** (Virtual Private Cloud).

* Các thành phần được phân tách vào các subnet riêng biệt (**Public**, **Private**, **Isolated**).
* Triển khai trên nhiều vùng sẵn sàng (**Multi-AZ**) để đảm bảo tính sẵn sàng cao.
## SƠ ĐỒ KIẾN TRÚC HỆ THỐNG

![Sơ đồ kiến trúc tổng quan AWS](https://github.com/22521600-Lcukichi/UIT-Go-Backend/blob/main/system%20overview.png)




