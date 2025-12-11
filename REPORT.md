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

--- 

# 2. Phân tích Module chuyên sâu

# MODULE A: Scalability & Performance

# A. Kiến trúc Microservices & Phân tầng (3-Tier)

* **Mô hình**: Hệ thống tách thành các dịch vụ độc lập: User Service (Django), Driver Service (Node.js), và Trip Service (Node.js). Mỗi dịch vụ có cơ sở dữ liệu riêng (Database per Service).
* **Hạ tầng**: Sử dụng ALB (Application Load Balancer) để phân phối tải đến ECS Tasks (Container), với dữ liệu được lưu trữ phân tán giữa RDS (SQL), MongoDB (NoSQL) và ElastiCache (Redis).

# B. Xử lý Bất đồng bộ (Asynchronous Processing) & Chống nghẽn

Đây là kỹ thuật quan trọng nhất để xử lý các tác vụ nặng (như tìm tài xế):
* **Cơ chế**: Thay vì xử lý đồng bộ (bắt người dùng chờ), hệ thống sử dụng Message Queue (SQS/Kafka). Khi người dùng tìm xe, yêu cầu được đẩy vào hàng đợi (enqueue "find-driver").
* **Backpressure**: Hàng đợi giúp "hấp thụ" lượng request tăng đột biến (burst), ngăn không cho Driver Service bị quá tải (Overload). Service này sẽ tiêu thụ (consume) message từ hàng đợi theo khả năng xử lý của nó.
* **Idempotency**: Để tránh xử lý trùng lặp (ví dụ: mạng lag khiến request gửi 2 lần), hệ thống sử dụng idempotency-key. Consumer sẽ kiểm tra key này trong Redis trước khi xử lý.

# C. Chiến lược Caching (Bộ nhớ đệm)

Nhóm áp dụng mô hình Cache-aside để giảm tải cho Database:
* **Driver Location**: Vị trí tài xế được cache trong Redis với key driver:{id}:loc và TTL (Time-to-Live) ngắn (30 giây) để đảm bảo tính real-time tương đối.
* **Trip Status**: Trạng thái chuyến đi được cache với TTL 60 giây.
* **Logic**: Khi có request đọc, hệ thống kiểm tra Cache trước (Hit). Nếu không có (Miss), mới truy vấn vào Database và cập nhật lại Cache.

# D. Tối ưu hóa Database (Read/Write Split)

* **Phân tách Đọc/Ghi**: Sử dụng kiến trúc Master-Slave (Primary-Replica) cho RDS.
  - Các lệnh ghi (POST/PUT/DELETE) được định tuyến vào RDS Primary.
  - Các lệnh đọc nặng (GET heavy) được chuyển sang RDS Read Replica.
* **Connection Pooling**: Giới hạn số lượng kết nối và thiết lập timeout (5s) để tránh treo Database.

# E. Autoscaling (Tự động mở rộng)
* **ECS Scaling**: Cấu hình Target Tracking dựa trên mức sử dụng CPU. Khi CPU vượt quá 60%, hệ thống tự động tăng số lượng Task (Container).

## Sơ đồ Luồng dữ liệu "Tìm tài xế" (Async Booking Flow)

![Sơ đồ Luồng dữ liệu "Tìm tài xế" (Async Booking Flow)](https://github.com/22521600-Lcukichi/UIT-Go-Backend/blob/main/Async%20Booking%20Flow.png)

## Sơ đồ App Routing & Database Scaling

![Sơ đồ App Routing & Database Scaling](https://github.com/22521600-Lcukichi/UIT-Go-Backend/blob/main/app%20routing.png)

## Đánh giá Kết quả và Kiểm chứng (Load Testing)

Nhóm đã sử dụng công cụ k6 để kiểm thử chịu tải với các kịch bản thực tế (Tìm tài xế, Tạo chuyến, Cập nhật vị trí).
* **Kết quả**
  
| Chỉ số | Baseline (Trước tối ưu) | Optimized (Sau tối ưu) | Cải thiện |
| :--- | :--- | :--- | :--- |
| **Throughput (RPS)** | 300 RPS | **600 RPS** | ⬆️ Tăng gấp đôi |
| **Độ trễ (Latency p95)** | ~350ms | **~180ms** | ⬇️ Giảm ~48% |
| **Tỷ lệ lỗi (Error Rate)**| 3% | **< 1%** | ✅ Ổn định hơn |








