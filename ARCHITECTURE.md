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

# 2. Module A: Scalability & Performance Design

## Chiến lược mở rộng
Module này tập trung giải quyết vấn đề chịu tải cao (High Concurrency) cho luồng nghiệp vụ "Đặt xe" (Booking) và "Tìm tài xế" (Find Driver).
1.  **Asynchronous Processing:** Sử dụng **Message Queue (SQS/Kafka)** làm bộ đệm (Backpressure) để hấp thụ traffic đột biến, tránh làm sập Driver Service.
2.  **Read/Write Splitting:** Tách luồng đọc/ghi cơ sở dữ liệu để tối ưu hiệu năng.
3.  **Caching:** Sử dụng Redis để cache vị trí tài xế (TTL ngắn).

## Sơ đồ Luồng dữ liệu "Tìm tài xế" (Async Booking Flow)

![Sơ đồ Luồng dữ liệu "Tìm tài xế" (Async Booking Flow)](https://github.com/22521600-Lcukichi/UIT-Go-Backend/blob/main/Async%20Booking%20Flow.png)

## Sơ đồ App Routing & Database Scaling

![Sơ đồ App Routing & Database Scaling](https://github.com/22521600-Lcukichi/UIT-Go-Backend/blob/main/app%20routing.png)

---

# 3. Module C: Thiết kế Bảo mật (Security Design)

## Nguyên tắc thiết kế
Module này áp dụng kiến trúc **Zero Trust** và **Defense-in-Depth** (Phòng thủ chiều sâu). Hệ thống không tin tưởng bất kỳ luồng traffic nào, kể cả bên trong mạng nội bộ. Bảo mật được thiết lập qua nhiều lớp:
1.  **Network Layer:** Sử dụng **NACLs** (Stateless firewall ở cấp Subnet) và **Security Groups** (Stateful firewall ở cấp Instance).
2.  **Identity Layer:** Quản lý định danh tập trung bằng **AWS Cognito**.
3.  **Data Layer:** Mã hóa dữ liệu lưu trữ (At-rest) bằng **AWS KMS** và quản lý bí mật bằng **Secrets Manager**.

## Sơ đồ Bảo mật Mạng (Network Security Flow)

```mermaid
flowchart TD
    Internet((Internet Threat)) -- Port 443 --> WAF[AWS WAF & Shield]
    WAF -- Filtered Traffic --> ALB_SG[ALB Security Group]
    
    subgraph Defense_Layers [Defense-in-Depth Layers]
        direction TB
        
        subgraph Layer_1_Public [Lớp 1: Public Interface]
            ALB_SG -- Allow TCP/443 --> ALB[App Load Balancer]
            NACL_Public[NACL: Allow HTTPS Inbound] -.-> ALB
        end

        subgraph Layer_2_App [Lớp 2: Microservices]
            ALB -- Port 8080 --> ECS_SG[ECS Tasks SG]
            ECS_SG -- Allow TCP/8080 from ALB Only --> ECS[ECS Containers]
            NACL_App[NACL: Allow Traffic from Public Subnet] -.-> ECS
        end

        subgraph Layer_3_Data [Lớp 3: Isolated Data]
            ECS -- Port 5432/6379 --> DB_SG[Database SG]
            DB_SG -- Allow from ECS SG Only --> RDS[(RDS / Redis)]
            NACL_Data[NACL: DENY ALL Internet] -.-> RDS
        end
    end
    
    Secrets[AWS Secrets Manager] -.->|Inject Credentials at Runtime| ECS
    KMS[AWS KMS Key] -.->|Encrypt| RDS
    Cognito[AWS Cognito] -.->|Issue JWT| Internet

    style NACL_Data fill:#ffcccc,stroke:#f00,stroke-width:2px,stroke-dasharray: 5 5





