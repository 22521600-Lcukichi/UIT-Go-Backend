# 4. Using AWS Cognito for Authentication

## Bối cảnh
Việc tự xây dựng hệ thống xác thực (Authentication) và phân quyền (Authorization) tiềm ẩn nhiều rủi ro bảo mật (lỗ hổng lưu trữ password, quản lý session) và tốn kém thời gian phát triển.

## Quyết định
Sử dụng dịch vụ **AWS Cognito User Pool** để quản lý định danh người dùng thay vì tự phát triển module Auth.
* Cấu hình Password Policy nghiêm ngặt.
* Bật tính năng Advanced Security để phát hiện đăng nhập đáng ngờ.

## Hệ quả

### Tích cực
* **An toàn:** Được AWS quản lý và tuân thủ các chuẩn bảo mật quốc tế, giảm rủi ro lộ lọt thông tin.
* **Tốc độ:** Giảm thời gian phát triển (Development time), nhóm có thể tập trung vào logic nghiệp vụ chính.

### Tiêu cực (Trade-offs)
* **Phụ thuộc (Vendor lock-in):** Hệ thống phụ thuộc hoàn toàn vào hạ tầng AWS, khó chuyển đổi sang Cloud provider khác.
* **Chi phí:** Chi phí sẽ tăng tuyến tính theo số lượng người dùng hoạt động hàng tháng (MAU).
