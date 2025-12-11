# 1. Chiến lược Cơ sở dữ liệu đa hình (Polyglot Persistence)

## Bối cảnh
Hệ thống UIT-Go có các yêu cầu dữ liệu đa dạng. Dữ liệu người dùng và giao dịch thanh toán cần tính toàn vẹn cao, trong khi dữ liệu vị trí tài xế (Location) cần khả năng truy xuất không gian địa lý (geospatial query) và tốc độ ghi cao theo thời gian thực. Việc sử dụng một loại cơ sở dữ liệu duy nhất không thể đáp ứng tối ưu cho tất cả các microservices.

## Quyết định
Chúng tôi áp dụng mô hình **Database per Service** với chiến lược Polyglot Persistence như sau:

1.  **PostgreSQL (Relational DB):** Sử dụng cho **UserService** và **TripService** để lưu trữ thông tin tài khoản, hồ sơ và lịch sử chuyến đi có cấu trúc chặt chẽ.
2.  **MongoDB (NoSQL):** Sử dụng cho **DriverService** để tận dụng `2dsphere` index cho việc lưu trữ và truy vấn vị trí tài xế.
3.  **Redis (In-memory DB):** Sử dụng để lưu trữ cache vị trí tạm thời và session token.

## Hệ quả

### Tích cực
* Tối ưu hóa hiệu năng cho từng loại dữ liệu đặc thù (SQL cho giao dịch, NoSQL cho vị trí).
* Đảm bảo tính độc lập giữa các service, service này không bị ảnh hưởng trực tiếp nếu database của service kia gặp sự cố.

### Tiêu cực (Trade-offs)
* **Độ phức tạp vận hành:** Phải quản lý và bảo trì nhiều loại database engine khác nhau.
* **Tính nhất quán dữ liệu:** Việc truy xuất dữ liệu tổng hợp (join) giữa các service trở nên khó khăn hơn và phải thực hiện ở tầng ứng dụng hoặc thông qua API aggregation.
