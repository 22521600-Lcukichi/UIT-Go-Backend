# 1. Tổng quan kiến trúc hệ thống

## 🏗 Kiến trúc Hệ thống UIT-Go

Hệ thống **UIT-Go** được thiết kế theo kiến trúc **Cloud-Native Microservices**, triển khai trên nền tảng **Amazon Web Services (AWS)** để đảm bảo tính linh hoạt và khả năng mở rộng.

---

## 🧩 Mô hình Microservices
Hệ thống được chia thành 3 dịch vụ chính hoạt động độc lập và đóng gói bằng **Docker**:

* **User Service** (`Django/Python`): Quản lý tài khoản và xác thực người dùng.
* **Trip Service** (`Node.js`): Xử lý logic đặt xe, trạng thái chuyến đi và thanh toán.
* **Driver Service** (`Node.js`): Quản lý định vị và trạng thái tài xế theo thời gian thực.

## 🌐 Cổng giao tiếp (Gateway & Routing)
* **API Gateway:** Đóng vai trò trung gian tiếp nhận mọi yêu cầu từ client, thực hiện định tuyến đến các service tương ứng.
* **Application Load Balancer (ALB) & Nginx:** Điều phối lưu lượng truy cập và đóng vai trò Reverse Proxy để tăng cường bảo mật.

## 💾 Tầng dữ liệu (Data Layer)
Tuân thủ nguyên tắc **Database per Service** (mỗi dịch vụ có cơ sở dữ liệu riêng):

* **PostgreSQL:** Lưu trữ dữ liệu có cấu trúc cho *User Service* và *Trip Service*.
* **MongoDB & Redis:** Lưu trữ dữ liệu phi cấu trúc và truy vấn nhanh (caching) cho *Driver Service*.

## ☁️ Hạ tầng mạng (Infrastructure)
Hệ thống sử dụng mô hình **3-Tier** (Web, App, Data) bên trong một **VPC** (Virtual Private Cloud).

* Các thành phần được phân tách vào các subnet riêng biệt (**Public**, **Private**, **Isolated**).
* Triển khai trên nhiều vùng sẵn sàng (**Multi-AZ**) để đảm bảo tính sẵn sàng cao.
## SƠ ĐỒ KIẾN TRÚC HỆ THỐNG

![Sơ đồ kiến trúc tổng quan AWS](https://github.com/22521600-Lcukichi/UIT-Go-Backend/blob/main/system%20overview.png)

--- 

# 2. Phân tích Module chuyên sâu

## MODULE A: Scalability & Performance

### A. Kiến trúc Microservices & Phân tầng (3-Tier)

* **Mô hình**: Hệ thống tách thành các dịch vụ độc lập: User Service (Django), Driver Service (Node.js), và Trip Service (Node.js). Mỗi dịch vụ có cơ sở dữ liệu riêng (Database per Service).
* **Hạ tầng**: Sử dụng ALB (Application Load Balancer) để phân phối tải đến ECS Tasks (Container), với dữ liệu được lưu trữ phân tán giữa RDS (SQL), MongoDB (NoSQL) và ElastiCache (Redis).

### B. Xử lý Bất đồng bộ (Asynchronous Processing) & Chống nghẽn

Đây là kỹ thuật quan trọng nhất để xử lý các tác vụ nặng (như tìm tài xế):
* **Cơ chế**: Thay vì xử lý đồng bộ (bắt người dùng chờ), hệ thống sử dụng Message Queue (SQS/Kafka). Khi người dùng tìm xe, yêu cầu được đẩy vào hàng đợi (enqueue "find-driver").
* **Backpressure**: Hàng đợi giúp "hấp thụ" lượng request tăng đột biến (burst), ngăn không cho Driver Service bị quá tải (Overload). Service này sẽ tiêu thụ (consume) message từ hàng đợi theo khả năng xử lý của nó.
* **Idempotency**: Để tránh xử lý trùng lặp (ví dụ: mạng lag khiến request gửi 2 lần), hệ thống sử dụng idempotency-key. Consumer sẽ kiểm tra key này trong Redis trước khi xử lý.

### C. Chiến lược Caching (Bộ nhớ đệm)

Nhóm áp dụng mô hình Cache-aside để giảm tải cho Database:
* **Driver Location**: Vị trí tài xế được cache trong Redis với key driver:{id}:loc và TTL (Time-to-Live) ngắn (30 giây) để đảm bảo tính real-time tương đối.
* **Trip Status**: Trạng thái chuyến đi được cache với TTL 60 giây.
* **Logic**: Khi có request đọc, hệ thống kiểm tra Cache trước (Hit). Nếu không có (Miss), mới truy vấn vào Database và cập nhật lại Cache.

### D. Tối ưu hóa Database (Read/Write Split)

* **Phân tách Đọc/Ghi**: Sử dụng kiến trúc Master-Slave (Primary-Replica) cho RDS.
  - Các lệnh ghi (POST/PUT/DELETE) được định tuyến vào RDS Primary.
  - Các lệnh đọc nặng (GET heavy) được chuyển sang RDS Read Replica.
* **Connection Pooling**: Giới hạn số lượng kết nối và thiết lập timeout (5s) để tránh treo Database.

### E. Autoscaling (Tự động mở rộng)
* **ECS Scaling**: Cấu hình Target Tracking dựa trên mức sử dụng CPU. Khi CPU vượt quá 60%, hệ thống tự động tăng số lượng Task (Container).

### Sơ đồ Luồng dữ liệu "Tìm tài xế" (Async Booking Flow)

![Sơ đồ Luồng dữ liệu "Tìm tài xế" (Async Booking Flow)](https://github.com/22521600-Lcukichi/UIT-Go-Backend/blob/main/Async%20Booking%20Flow.png)

### Sơ đồ App Routing & Database Scaling

![Sơ đồ App Routing & Database Scaling](https://github.com/22521600-Lcukichi/UIT-Go-Backend/blob/main/app%20routing.png)

### Đánh giá Kết quả và Kiểm chứng (Load Testing)

Nhóm đã sử dụng công cụ k6 để kiểm thử chịu tải với các kịch bản thực tế (Tìm tài xế, Tạo chuyến, Cập nhật vị trí).
* **Kết quả**
  
| Chỉ số | Baseline (Trước tối ưu) | Optimized (Sau tối ưu) | Cải thiện |
| :--- | :--- | :--- | :--- |
| **Throughput (RPS)** | 300 RPS | **600 RPS** | ⬆️ Tăng gấp đôi |
| **Độ trễ (Latency p95)** | ~350ms | **~180ms** | ⬇️ Giảm ~48% |
| **Tỷ lệ lỗi (Error Rate)**| 3% | **< 1%** | ✅ Ổn định hơn |

### Bảng Đánh giá Quyết định Thiết kế (Trade-offs)

| Quyết định thiết kế | Lợi ích chính (Pros) | Đánh đổi / Rủi ro (Cons) |
| :--- | :--- | :--- |
| **Queue (SQS/Kafka) cho tìm xe** | Hấp thụ tải đột biến (burst), tránh gây nghẽn cho Driver Service. | Độ trễ (Latency) tăng; hệ thống phức tạp hơn; bắt buộc phải xử lý `idempotency` và có `DLQ` (Dead Letter Queue).  |
| **Cache Redis (loc/trip) TTL 20-60s** | Giảm tải cho Database, chỉ số độ trễ `p95` giảm đáng kể. | Dữ liệu có thể bị cũ (stale); cần cân bằng kỹ giữa thời gian sống (TTL) và việc làm mới cache. |
| **Read/Write split (Primary + Replica)** | Tăng throughput (lưu lượng xử lý) cho các tác vụ đọc. | Gặp vấn đề `Replication lag` dẫn đến tính nhất quán cuối cùng (eventual consistency); không dùng được cho các giao dịch cần tính nhất quán mạnh.  |
| **Autoscaling ECS (target tracking)** | Hệ thống tự động mở rộng tài nguyên khi tải tăng. | Nếu cấu hình ngưỡng sai dễ gây hiện tượng scale lên xuống liên tục ("ping-pong"); chi phí biến động; cần thiết lập `min/max tasks` hợp lý.  |
| **Compression + HTTP/2** | Giảm băng thông (bandwidth) và TTFB (Time To First Byte), cải thiện độ trễ. |Tăng nhẹ mức sử dụng CPU để nén/giải nén; cần kiểm thử tính tương thích với phía Client. |
| **Async hóa luồng phụ (enqueue)** | Bảo vệ các service lõi, giúp hệ thống chịu tải tốt hơn. | Người dùng có thể cảm thấy phản hồi chậm hơn; cần thiết kế UX và thông báo trạng thái rõ ràng để người dùng biết. |
| **TTL ngắn vs dài cho cache** | **TTL dài:** Tỷ lệ cache hit cao, giảm tải DB tối đa. | **TTL dài:** Dữ liệu dễ bị cũ (stale).  **TTL ngắn:** Cache miss nhiều, hiệu quả giảm tải thấp hơn.  |

--- 
## MODULE C: Thiết kế cho Security (DevSecOps)

### A. Nguyên tắc thiết kế cốt lõi
* **Zero Trust Architecture (ZTA)**: Loại bỏ niềm tin ngầm định (implicit trust). Giả định rằng mạng nội bộ đã bị xâm nhập, do đó mọi luồng traffic (kể cả giữa các microservices) đều phải được xác thực và cấp quyền tối thiểu.
* **Defense-in-Depth (Phòng thủ chiều sâu)**: Thiết lập nhiều lớp bảo vệ chồng lên nhau (Network, Application, Data). Nếu một lớp bị phá vỡ, các lớp khác vẫn bảo vệ được hệ thống.
* **Least Privilege (Đặc quyền tối thiểu)**: Mỗi thành phần (User, Service, Role) chỉ được cấp quyền vừa đủ để thực hiện chức năng, không hơn.

### B. Phân tích mối đe dọa (Threat Modeling)

Nhóm thực hiện đã sử dụng phương pháp STRIDE kết hợp với Data Flow Diagram (DFD) để phân tích rủi ro dựa trên các vùng tin cậy (Trust Boundaries).

* **Trust Boundaries**: Hệ thống được chia thành 4 vùng: Internet (Untrusted), DMZ (Semi-Trusted - chứa API Gateway), Private Network (Trusted - chứa Microservices), và Restricted Zone (Highly Sensitive - chứa Databases) .
* **Các mối đe dọa và giải pháp tiêu biểu:**
  - Spoofing/Identity: Chống Brute-force bằng Rate Limiting và CAPTCHA; Chống GPS Spoofing của tài xế bằng xác thực chữ ký GPS metadata.
  - Tampering: Chống sửa đổi dữ liệu chuyến đi bằng Idempotency Key và Distributed Lock (Redis) để tránh Race condition.
  - Information Disclosure: Ngăn chặn lộ dữ liệu vị trí tài xế (Real-time location) bằng cách phân trang (pagination) và làm mờ vị trí (fuzzy location) khi cần thiết.

### C. Hiện thực hóa kỹ thuật (Implementation)

### 1. Bảo mật tầng mạng (Network Security)

* Đây là lớp bảo vệ mạnh mẽ nhất, áp dụng mô hình Zero Trust
* **Kiến trúc mạng phân tầng**:
  - Sử dụng **VPC** chia thành 3 loại subnet trên 2 Availability Zones (Multi-AZ): Public (ALB, NAT), Private (ECS Tasks), và Isolated Data (Databases) .
  - **Isolated Data Subnet** được thiết kế như một "két sắt": Không có đường Route ra Internet, ngăn chặn hoàn toàn khả năng kẻ tấn công tải dữ liệu ra ngoài (Data Exfiltration).
* **Firewall 2 lớp (Stateful & Stateless):**
  - Security Groups (Stateful): Thiết kế theo chuỗi xích (Chaining). ECS Tasks SG chỉ chấp nhận traffic từ ALB SG. RDS SG chỉ chấp nhận traffic từ ECS Tasks SG. Không cho phép truy cập trực tiếp từ IP lạ.
  - Network ACLs (Stateless): Đây là lớp bảo vệ thứ 2 cực kỳ nghiêm ngặt. Tại Isolated Data Subnet, NACL chặn mặc định tất cả traffic từ Internet (0.0.0.0/0), chỉ cho phép traffic nội bộ VPC.
* **Sơ đồ Zero Trust Network:**

![Sơ đồ App Routing & Database Scaling](https://github.com/22521600-Lcukichi/UIT-Go-Backend/blob/main/zero%20trust.png)

### 2. Quản lý định danh và quyền truy cập (Identity & Access)
* Authentication (User): Sử dụng AWS Cognito User Pool thay vì tự xây dựng DB user. Cấu hình chính sách mật khẩu mạnh (12 ký tự, chữ hoa/thường/số/ký tự đặc biệt) và bật chế độ bảo mật nâng cao (Advanced Security Mode: ENFORCED) để chặn đăng nhập đáng ngờ.
* Authorization (Service): Sử dụng IAM Roles theo nguyên tắc Least Privilege.
  - Tách biệt Execution Role (chạy hạ tầng) và Task Role (logic ứng dụng).
  - Phân quyền chi tiết: Ví dụ DriverService có quyền sns:Publish để gửi thông báo, trong khi UserService thì không
 
### 3. Bảo mật dữ liệu (Data Protection)
* **Encryption at Rest (Lưu trữ)**: Dữ liệu được mã hóa bằng AWS KMS với Customer Managed Key. Chế độ enable_key_rotation được bật để tự động xoay vòng khóa mỗi năm, giảm rủi ro khi lộ khóa.
* **Secrets Management**: Không lưu cứng (hard-code) mật khẩu DB trong code. Sử dụng AWS Secrets Manager. Các ECS Task sẽ gọi API để lấy credentials đã được mã hóa KMS khi khởi động.
* **Encryption in Transit (Truyền tải)**: Triển khai HTTPS/TLS cho Application Load Balancer (ALB) sử dụng chứng chỉ (Certificate) được quản lý bởi AWS ACM, ngăn chặn tấn công Man-in-the-Middle.

### Đánh Giá Các Quyết Định Thiết Kế (Trade-offs)

| Quyết định | Lựa chọn | Trade-off (Đánh đổi) | Lý giải |
| :--- | :--- | :--- | :--- |
| **Network Security** | NACLs + Security Groups | Tăng độ phức tạp quản lý mạng. | Cần Defense-in-Depth. Lợi ích bảo mật vượt trội so với công sức bỏ ra. |
| **Authentication** | AWS Cognito | Phụ thuộc vào AWS, chi phí phụ thuộc vào số User. | An toàn hơn tự code. Giảm thời gian development. Có sẵn Compliance. |
| **Database Access** | Isolated Subnets (No Internet) | Khó khăn khi debug/patching DB (cần Bastion Host). | Loại bỏ hoàn toàn vector tấn công từ Internet vào Database. |
| **Encryption** | KMS Customer Managed Key | Tăng chi phí mỗi tháng + phí API call. | Kiểm soát hoàn toàn vòng đời khóa (Key Lifecycle). |
| **Secrets** | Secrets Manager | Đắt hơn Parameter Store (tính phí theo mỗi Secret). | Hỗ trợ tự động xoay vòng password (Auto-rotation) với RDS. |

---
# 3. Tổng hợp Các quyết định thiết kế và Trade-off

| ADR | Quyết định (Decision) | Chi tiết & Lý do (Context & Rationale) | Đánh đổi & Rủi ro (Trade-offs & Consequences) |
| :--- | :--- | :--- | :--- |
| **001** | **Chiến lược Polyglot Persistence (Database per Service)** | **Quyết định:** Sử dụng PostgreSQL cho User/Trip Service và MongoDB/Redis cho Driver Service.<br><br>**Lý do:**<br> - **PostgreSQL:** Phù hợp dữ liệu quan hệ chặt chẽ (tài khoản, lịch sử chuyến).<br> - **MongoDB/Redis:** Tối ưu cho dữ liệu vị trí tài xế (Geo-spatial) và truy vấn thời gian thực. | - **Độ phức tạp hạ tầng:** Phải quản lý nhiều loại DB engine khác nhau.<br>- **Khó khăn vận hành:** Việc cô lập dữ liệu (Isolated Subnets) gây khó khăn khi debug hoặc patch lỗi, cần dùng Bastion Host. |
| **002** | **Giao tiếp Bất đồng bộ (Async with Message Queue)** | **Quyết định:** Sử dụng SQS/Kafka cho luồng "Tìm tài xế" (Find Driver).<br><br>**Lý do:**<br> - **Chống nghẽn:** Hấp thụ lượng request đột biến (Burst traffic) để không làm sập DriverService.<br> - **Backpressure:** Giảm áp lực xử lý tức thời lên hệ thống. | - **Độ trễ (Latency):** Tăng latency vài trăm ms do phải qua hàng đợi.<br>- **Phức tạp:** Cần xử lý logic Idempotency (tránh trùng lặp) và Dead Letter Queue (xử lý lỗi). |
| **003** | **Bảo mật chiều sâu (Defense-in-Depth Network)** | **Quyết định:** Kết hợp Security Groups (Instance level) + NACLs (Subnet level) + Zero Trust.<br><br>**Lý do:**<br> - **Đa lớp bảo vệ:** Nếu Security Group cấu hình sai, NACL vẫn chặn được traffic.<br> - **Zero Trust:** Giả định mạng nội bộ không an toàn, kiểm soát chặt mọi luồng traffic. | - **Quản lý mạng:** Tăng độ phức tạp khi cấu hình.<br>- **NACLs Stateless:** Phải mở dải Ephemeral ports (1024-65535) cho traffic trả về, đòi hỏi hiểu biết sâu về TCP/IP để tránh rủi ro. |
| **004** | **Quản lý định danh với AWS Cognito** | **Quyết định:** Sử dụng AWS Cognito User Pool thay vì tự xây dựng module Auth.<br><br>**Lý do:**<br> - **An toàn & Tốc độ:** Tránh lỗ hổng bảo mật tự code, giảm thời gian development.<br> - **Tính năng:** Có sẵn phát hiện đăng nhập đáng ngờ và tuân thủ Compliance. | - **Vendor Lock-in:** Phụ thuộc hoàn toàn vào hệ sinh thái AWS.<br>- **Chi phí:** Chi phí tăng tuyến tính theo số lượng người dùng hoạt động (MAU). |
| **005** | **Caching & Read Replicas (Scalability)** | **Quyết định:** Dùng Redis Cache (TTL ngắn) và RDS Read Replicas.<br><br>**Lý do:**<br> - **Hiệu năng:** Giảm tải cho Primary DB, giảm p95 latency cho API tìm tài xế.<br> - **Tách biệt:** Tách luồng Đọc (Read) và Ghi (Write) để tối ưu throughput. | - **Tính nhất quán (Consistency):** Chấp nhận Eventual Consistency, dữ liệu đọc từ Replica có thể bị trễ (lag).<br>- **Dữ liệu cũ:** Cache có thể trả về vị trí cũ nếu TTL chưa hết hạn. |

# 4. Thách thức & Bài học kinh nghiệm (Challenges & Lessons Learned)

### Module C: Security (Bảo mật)
* **Thách thức về Infrastructure as Code (IaC):**
    * *Vấn đề:* Khó khăn khi tách code Terraform của Module C riêng biệt nhưng cần tham chiếu đến tài nguyên (VPC, Subnets) của Module nền tảng (Base).
    * *Bài học:* Sử dụng `data source` của Terraform để truy vấn tài nguyên qua Tags. Bài học rút ra là cần có **Chiến lược gắn thẻ (Tagging Strategy)** nhất quán ngay từ đầu để dễ dàng quản lý và tham chiếu.
* **Thách thức về Network ACLs (NACLs):**
    * *Vấn đề:* NACLs là stateless (phi trạng thái). Nếu cho phép traffic đi ra (outbound) port 443, bắt buộc phải mở dải port 1024-65535 cho traffic trả về (inbound), gây lo ngại rủi ro bảo mật.
    * *Bài học:* Hiểu sâu về **TCP/IP Handshake** là bắt buộc. Giải pháp là chấp nhận mở ephemeral ports nhưng phải kết hợp chặn chặt chẽ bằng Security Groups (Stateful firewall - tường lửa có trạng thái).

### Module A: Scalability & Performance (Hiệu năng)
* **Backpressure & Idempotency:**
    * *Vấn đề:* Sử dụng Queue giúp chịu tải burst nhưng gây ra vấn đề trùng lặp tin nhắn (duplicate message).
    * *Bài học:* Luôn thiết kế theo nguyên tắc "At least once delivery" (Gửi ít nhất một lần). Bắt buộc phải có **idempotency-key** và **Dead Letter Queue (DLQ)** để xử lý lỗi và tránh trùng lặp đơn hàng.
* **Consistency vs Latency:**
    * *Vấn đề:* Đọc từ Replica hoặc Cache giúp giảm độ trễ (latency) nhưng gặp vấn đề dữ liệu không đồng nhất tức thì (Eventual Consistency).
    * *Bài học:* Cần phân loại rõ endpoint nào cần **Strong Consistency** (đọc trực tiếp từ Primary DB) và endpoint nào chấp nhận độ trễ dữ liệu để tối ưu trải nghiệm người dùng.
* **Cache Invalidation:**
    * *Vấn đề:* TTL quá dài thì dữ liệu vị trí bị cũ (stale), TTL quá ngắn thì cache miss nhiều, giảm hiệu quả.
    * *Bài học:* Chọn TTL ngắn (20-60s) cho dữ liệu vị trí và hỗ trợ cơ chế **refresh thủ công** khi trạng thái thay đổi lớn (ví dụ: kết thúc chuyến đi).
* **Autoscaling Tuning:**
    * *Vấn đề:* Ngưỡng CPU/RPS thiết lập không chuẩn gây hiện tượng scale "ping-pong" (tăng giảm số lượng task liên tục).
    * *Bài học:* Cần thiết lập `min/max tasks` hợp lý và có thời gian warm-up cho service.
* **Quan trắc (Observability):**
    * *Vấn đề:* Thiếu số liệu thực tế dẫn đến việc tối ưu sai chỗ.
    * *Bài học:* Cần chạy load test (sử dụng k6/JMeter) sớm với kịch bản sát thực tế và đo lường các chỉ số p95/error rate thay vì chỉ nhìn vào số liệu trung bình.

---

# 5. Kết quả & Hướng phát triển (Results & Future Improvements)

### Tóm tắt Kết quả (Results)
* **Về Bảo mật (Module C):**
    * Hoàn thành **Threat Modeling** (phương pháp STRIDE) để nhận diện sớm các rủi ro.
    * Xây dựng mạng lưới tin cậy (**Zero Trust Architecture**) với sự kết hợp chặt chẽ giữa NACLs và Security Groups.
    * Thiết lập vành đai bảo vệ định danh (AWS Cognito) và mã hóa dữ liệu (KMS, Secrets Manager).
* **Về Hiệu năng (Module A):**
    * Kiến trúc chịu tải tốt hơn nhờ **Async Queue** chống nghẽn cho DriverService.
    * Giảm đáng kể độ trễ (p95 latency) ở luồng tìm tài xế nhờ chiến lược **Caching** và tách biệt **Read-Replica**.
    * Hệ thống duy trì ổn định, không bị sập khi có lượng truy cập đột biến (Burst traffic).

### Đề xuất Cải tiến (Future Improvements)
* **Nâng cao Bảo mật:**
    * Triển khai **AWS WAF** (Web Application Firewall) trước ALB để chặn các tấn công phổ biến như SQL Injection và XSS.
    * Bật **VPC Flow Logs** để ghi lại toàn bộ traffic mạng phục vụ việc phân tích và điều tra sự cố (Forensics).
    * Tích hợp **DevSecOps Pipeline** (sử dụng công cụ như Trivy, Checkov) vào quy trình CI/CD để phát hiện lỗi cấu hình Terraform trước khi deploy.
* **Nâng cao Hiệu năng:**
    * Bổ sung **Circuit Breaker** và chính sách Timeout chuẩn cho giao tiếp Service-to-Service để tránh lỗi dây chuyền.
    * Cân nhắc triển khai **Service Mesh** (như Istio hoặc Linkerd) để hỗ trợ mTLS và quản lý traffic thông minh hơn.
    * Thay thế cơ chế Polling hiện tại bằng **WebSocket** hoặc **Server-Sent Events (SSE)** để cập nhật vị trí và trạng thái chuyến đi theo thời gian thực (Real-time) mượt mà hơn.




























