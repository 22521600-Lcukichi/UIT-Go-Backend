# 1. Tổng quan Kiến trúc Hệ thống (System Overview)

## Mô tả
Hệ thống UIT-Go được thiết kế theo kiến trúc **Microservices** và triển khai trên hạ tầng **AWS Cloud** (Region `ap-southeast-1`). Kiến trúc tuân thủ mô hình **3-Tier Web Architecture** và triển khai trên nhiều vùng sẵn sàng (**Multi-AZ**) để đảm bảo tính sẵn sàng cao (High Availability).

### Các thành phần chính
1.  **Public Subnet:** Chứa **Application Load Balancer (ALB)** để phân phối tải và **NAT Gateway** để cung cấp internet chiều đi cho các service nội bộ.
2.  **Private App Subnet:** Nơi triển khai các Microservices (User, Trip, Driver) chạy trên **AWS Fargate (ECS)**. Các service này không có địa chỉ IP công cộng.
3.  **Isolated Data Subnet:** Chứa hệ quản trị cơ sở dữ liệu **RDS (PostgreSQL)** và **ElastiCache (Redis)**. Subnet này bị cô lập hoàn toàn khỏi Internet để bảo mật dữ liệu.

## Sơ đồ Kiến trúc (High-Level Diagram)

![Sơ đồ kiến trúc tổng quan AWS](https://github.com/user/repo/path/to/your/uploaded-image.png)
