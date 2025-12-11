# 2. Asynchronous Communication with Message Queue

## Bối cảnh
Trong luồng nghiệp vụ "Đặt xe" (Booking), TripService cần gọi sang DriverService để tìm tài xế phù hợp. Khi lượng yêu cầu đặt xe tăng đột biến (burst), việc gọi REST API đồng bộ trực tiếp có thể gây nghẽn và làm sập DriverService do quá tải.

## Quyết định
Chúng tôi quyết định sử dụng cơ chế giao tiếp bất đồng bộ (Asynchronous Communication) thông qua **Message Queue (SQS/Kafka)** cho luồng tìm tài xế.
* TripService sẽ đẩy yêu cầu `find-driver` vào Queue.
* DriverService sẽ tiêu thụ (consume) message từ Queue để xử lý matching.

## Hệ quả

### Tích cực
* **Backpressure:** Queue giúp hấp thụ lượng traffic đột biến, bảo vệ DriverService khỏi bị quá tải.
* **Resilience:** Nếu DriverService tạm thời ngừng hoạt động, yêu cầu vẫn nằm trong Queue và được xử lý lại sau (Retry mechanism).

### Tiêu cực (Trade-offs)
* **Độ trễ (Latency):** Tăng độ trễ xử lý thêm vài trăm mili-giây so với gọi trực tiếp.
* **Phức tạp:** Phải xử lý vấn đề trùng lặp message (duplicate), yêu cầu triển khai cơ chế **Idempotency Key** và Dead Letter Queue (DLQ).
