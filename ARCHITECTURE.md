# 1. Tổng quan Kiến trúc Hệ thống (System Overview)

## Mô tả
Hệ thống UIT-Go được thiết kế theo kiến trúc **Microservices** và triển khai trên hạ tầng **AWS Cloud** (Region `ap-southeast-1`). Kiến trúc tuân thủ mô hình **3-Tier Web Architecture** và triển khai trên nhiều vùng sẵn sàng (**Multi-AZ**) để đảm bảo tính sẵn sàng cao (High Availability).

### Các thành phần chính
1.  **Public Subnet:** Chứa **Application Load Balancer (ALB)** để phân phối tải và **NAT Gateway** để cung cấp internet chiều đi cho các service nội bộ.
2.  **Private App Subnet:** Nơi triển khai các Microservices (User, Trip, Driver) chạy trên **AWS Fargate (ECS)**. Các service này không có địa chỉ IP công cộng.
3.  **Isolated Data Subnet:** Chứa hệ quản trị cơ sở dữ liệu **RDS (PostgreSQL)** và **ElastiCache (Redis)**. Subnet này bị cô lập hoàn toàn khỏi Internet để bảo mật dữ liệu.

## Sơ đồ Kiến trúc (High-Level Diagram)

![Sơ đồ kiến trúc tổng quan AWS](https://github.com/22521600-Lcukichi/UIT-Go-Backend/blob/main/system%20overview.png)

--- 

# 3. Module A: Scalability & Performance Design

## Chiến lược mở rộng
Module này tập trung giải quyết vấn đề chịu tải cao (High Concurrency) cho luồng nghiệp vụ "Đặt xe" (Booking) và "Tìm tài xế" (Find Driver).
1.  **Asynchronous Processing:** Sử dụng **Message Queue (SQS/Kafka)** làm bộ đệm (Backpressure) để hấp thụ traffic đột biến, tránh làm sập Driver Service.
2.  **Read/Write Splitting:** Tách luồng đọc/ghi cơ sở dữ liệu để tối ưu hiệu năng.
3.  **Caching:** Sử dụng Redis để cache vị trí tài xế (TTL ngắn).

## Sơ đồ Luồng dữ liệu "Tìm tài xế" (Async Booking Flow)

```mermaid
sequenceDiagram
    participant Client
    participant APIGW as API Gateway
    participant TripSvc as Trip Service
    participant Queue as SQS/Kafka
    participant DriverSvc as Driver Service
    participant Redis as Redis Cache
    participant DB as MongoDB

    Note over Client, APIGW: 1. User gửi yêu cầu đặt xe
    Client->>APIGW: POST /api/trips
    APIGW->>TripSvc: Forward Request
    
    Note over TripSvc: Xử lý logic cơ bản & ghi nhận chuyến
    TripSvc->>Queue: Push Message (find-driver)
    TripSvc-->>Client: Trả về 202 Accepted (Processing)
    
    Note over Queue, DriverSvc: Xử lý bất đồng bộ (Async)
    loop Polling / Consuming
        DriverSvc->>Queue: Lấy Message đặt xe
        DriverSvc->>Redis: GET /drivers/nearby (Cache Check)
        alt Cache Hit
            Redis-->>DriverSvc: Trả về list driver IDs
        else Cache Miss
            DriverSvc->>DB: Geospatial Query
            DB-->>DriverSvc: List drivers
            DriverSvc->>Redis: Set Cache (TTL 30s)
        end
        DriverSvc->>DriverSvc: Logic Matching & Tính giá
    end


