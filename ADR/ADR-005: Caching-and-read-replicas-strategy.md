# 5. Caching and Read Replicas Strategy for Scalability

## Bối cảnh
Hệ thống có tỉ lệ tác vụ Đọc (Read) cao hơn nhiều so với Ghi (Write), đặc biệt là các API truy vấn vị trí tài xế và trạng thái chuyến đi. Việc dồn tất cả traffic vào Database chính (Primary) sẽ gây nút thắt cổ chai về hiệu năng.

## Quyết định
1.  **Read/Write Splitting:** Sử dụng **RDS Read Replicas** để phục vụ các yêu cầu đọc (GET), chỉ các yêu cầu ghi (POST/PUT/DELETE) mới đi vào Primary DB.
2.  **Caching:** Sử dụng **Redis** với chiến lược Cache-aside.
    * Vị trí tài xế: TTL ngắn (20-60s).
    * Trạng thái chuyến đi: TTL 60s, cache invalidation khi kết thúc chuyến.

## Hệ quả

### Tích cực
* **Hiệu năng:** Giảm tải đáng kể cho Database gốc, giảm độ trễ (p95 latency) cho người dùng cuối.
* **Scalability:** Dễ dàng mở rộng khả năng đọc bằng cách thêm nhiều Read Replicas.

### Tiêu cực (Trade-offs)
* **Eventual Consistency:** Chấp nhận việc dữ liệu đọc từ Replica hoặc Cache có thể bị trễ (stale) vài giây so với dữ liệu thực tế.
* **Cache Invalidation:** Cần xử lý logic xóa cache cẩn thận để tránh hiển thị dữ liệu quá cũ, đặc biệt khi trạng thái chuyến đi thay đổi.
