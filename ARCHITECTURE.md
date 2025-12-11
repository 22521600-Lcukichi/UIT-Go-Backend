# 1. Tổng quan Kiến trúc Hệ thống (System Overview)

## Mô tả
Hệ thống UIT-Go được thiết kế theo kiến trúc **Microservices** và triển khai trên hạ tầng **AWS Cloud** (Region `ap-southeast-1`). Kiến trúc tuân thủ mô hình **3-Tier Web Architecture** và triển khai trên nhiều vùng sẵn sàng (**Multi-AZ**) để đảm bảo tính sẵn sàng cao (High Availability).

### Các thành phần chính
1.  **Public Subnet:** Chứa **Application Load Balancer (ALB)** để phân phối tải và **NAT Gateway** để cung cấp internet chiều đi cho các service nội bộ.
2.  **Private App Subnet:** Nơi triển khai các Microservices (User, Trip, Driver) chạy trên **AWS Fargate (ECS)**. Các service này không có địa chỉ IP công cộng.
3.  **Isolated Data Subnet:** Chứa hệ quản trị cơ sở dữ liệu **RDS (PostgreSQL)** và **ElastiCache (Redis)**. Subnet này bị cô lập hoàn toàn khỏi Internet để bảo mật dữ liệu.

## Sơ đồ Kiến trúc (High-Level Diagram)

```mermaid
graph TD
    User((User/Client)) -->|HTTPS| IGW[Internet Gateway]
    IGW --> ALB[Application Load Balancer]

    subgraph VPC [AWS VPC 10.0.0.0/16]
        direction TB
        
        subgraph AZ1 [Availability Zone A]
            direction TB
            subgraph Public_Subnet_A [Public Subnet]
                ALB_Node_A[ALB Node]
                NAT_A[NAT Gateway]
            end
            
            subgraph Private_App_Subnet_A [Private App Subnet]
                ECS_User_A[User Service]
                ECS_Trip_A[Trip Service]
                ECS_Driver_A[Driver Service]
            end
            
            subgraph Data_Subnet_A [Isolated Data Subnet]
                RDS_Master[RDS Primary]
                Redis_Master[Redis Primary]
            end
        end

        subgraph AZ2 [Availability Zone B]
            direction TB
            subgraph Public_Subnet_B [Public Subnet]
                ALB_Node_B[ALB Node]
                NAT_B[NAT Gateway]
            end
            
            subgraph Private_App_Subnet_B [Private App Subnet]
                ECS_User_B[User Service Replica]
                ECS_Trip_B[Trip Service Replica]
                ECS_Driver_B[Driver Service Replica]
            end
            
            subgraph Data_Subnet_B [Isolated Data Subnet]
                RDS_Slave[RDS Read Replica]
                Redis_Slave[Redis Replica]
            end
        end
    end

    ALB -->|Port 8080| ECS_User_A
    ALB -->|Port 8080| ECS_Trip_A
    ALB -->|Port 8080| ECS_Driver_A
    
    ECS_User_A -->|Port 5432| RDS_Master
    ECS_Driver_A -->|Port 6379| Redis_Master
    
    classDef public fill:#e1f5fe,stroke:#01579b;
    classDef private fill:#fff3e0,stroke:#ff6f00;
    classDef data fill:#ffebee,stroke:#b71c1c;
    
    class Public_Subnet_A,Public_Subnet_B public;
    class Private_App_Subnet_A,Private_App_Subnet_B private;
    class Data_Subnet_A,Data_Subnet_B data;
