# 3. Defense-in-Depth Network Security Architecture

## Bối cảnh
Mô hình Zero Trust yêu cầu không tin tưởng bất kỳ luồng traffic nào, kể cả trong mạng nội bộ. Chỉ sử dụng Security Groups (SGs) là chưa đủ để đảm bảo an toàn nếu một tầng bị xâm nhập.

## Quyết định
Chúng tôi áp dụng kiến trúc **Defense-in-Depth** kết hợp cả **Network ACLs (NACLs)** và **Security Groups (SGs)**.
* **Security Groups (Stateful):** Kiểm soát traffic ở cấp độ Instance/Task (User, Driver, Trip Service, DB).
* **NACLs (Stateless):** Kiểm soát traffic ở cấp độ Subnet, hoạt động như một lớp tường lửa thứ hai. Đặc biệt, "Isolated Data Subnet" chứa Database bị chặn hoàn toàn kết nối từ Internet (Deny All Internet).

## Hệ quả

### Tích cực
* Tăng cường bảo mật vượt trội. Nếu hacker vượt qua được lớp Security Group, họ vẫn bị chặn bởi quy tắc của NACL ở cấp Subnet.
* Ngăn chặn rủi ro thất thoát dữ liệu (Data Exfiltration) từ Database ra Internet.

### Tiêu cực (Trade-offs)
* **Phức tạp quản lý:** NACL là stateless, nên khi mở port chiều đi (outbound), bắt buộc phải mở dải Ephemeral ports (1024-65535) cho chiều về (inbound), đòi hỏi hiểu biết sâu về TCP/IP.
* Khó khăn hơn trong việc debug và kết nối tới Database để bảo trì (cần Bastion Host).
