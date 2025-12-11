# 1. Chiến lược Cơ sở dữ liệu đa hình (Polyglot Persistence)

* **Trạng thái:** Đã chấp nhận
* **Ngày:** 2025-10-15
* **Người thực hiện:** Nhóm phát triển UIT-Go

## Bối cảnh
[cite_start]Hệ thống UIT-Go có các yêu cầu dữ liệu đa dạng[cite: 59]. [cite_start]Dữ liệu người dùng và giao dịch thanh toán cần tính toàn vẹn cao (ACID), trong khi dữ liệu vị trí tài xế (Location) cần khả năng truy xuất không gian địa lý (geospatial query) và tốc độ ghi cao theo thời gian thực[cite: 71, 442]. Việc sử dụng một loại cơ sở dữ liệu duy nhất không thể đáp ứng tối ưu cho tất cả các microservices.

## Quyết định
[cite_start]Chúng tôi áp dụng mô hình **Database per Service** với chiến lược Polyglot Persistence như sau[cite: 107, 434]:

1.  [cite_start]**PostgreSQL (Relational DB):** Sử dụng cho **UserService** và **TripService** để lưu trữ thông tin tài khoản, hồ sơ và lịch sử chuyến đi có cấu trúc chặt chẽ[cite: 443].
2.  [cite_start]**MongoDB (NoSQL):** Sử dụng cho **DriverService** để tận dụng `2dsphere` index cho việc lưu trữ và truy vấn vị trí tài xế[cite: 193, 215, 444].
3.  [cite_start]**Redis (In-memory DB):** Sử dụng để lưu trữ cache vị trí tạm thời và session token[cite: 444, 1313].

## Hệ quả

### Tích cực
* [cite_start]Tối ưu hóa hiệu năng cho từng loại dữ liệu đặc thù (SQL cho giao dịch, NoSQL cho vị trí)[cite: 442, 443].
* [cite_start]Đảm bảo tính độc lập giữa các service, service này không bị ảnh hưởng trực tiếp nếu database của service kia gặp sự cố[cite: 107, 434].

### Tiêu cực (Trade-offs)
* [cite_start]**Độ phức tạp vận hành:** Phải quản lý và bảo trì nhiều loại database engine khác nhau[cite: 1215].
* [cite_start]**Tính nhất quán dữ liệu:** Việc truy xuất dữ liệu tổng hợp (join) giữa các service trở nên khó khăn hơn và phải thực hiện ở tầng ứng dụng hoặc thông qua API aggregation[cite: 102].
