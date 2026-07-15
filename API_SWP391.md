### 1\. Quy tắc cấu trúc URL

* Sử dụng danh từ số nhiều: Không dùng động từ trong đường dẫn URL. Thay vì /getUsers hoặc /createHorse, hãy dùng:  
  * GET /api/v1/users (Lấy danh sách người dùng)  
  * POST /api/v1/horses (Tạo mới ngựa)  
* Phân cấp tài nguyên (Sub-resources): Khi một tài nguyên này thuộc về một tài nguyên khác:  
  * GET /api/v1/tournaments/{tournamentId}/races (Lấy danh sách các vòng đua thuộc giải đấu cụ thể)  
* Ký tự: Toàn bộ URL viết chữ thường, ngăn cách bởi dấu gạch ngang \- (kebab-case) nếu tên có nhiều chữ.

### 2\. Quy chuẩn HTTP Methods & Trạng thái phản hồi (Status Codes)

* GET: Lấy dữ liệu $\\rightarrow$ 200 OK  
* POST: Tạo mới dữ liệu $\\rightarrow$ 201 Created  
* PUT: Cập nhật toàn bộ/thay thế $\\rightarrow$ 200 OK  
* DELETE: Xóa dữ liệu (Ẩn/Xóa mềm theo cột deleted\_at) $\\rightarrow$ 200 OK hoặc 204 No Content  
* Lỗi phía Client: 400 Bad Request (Dữ liệu gửi lên sai định dạng), 401 Unauthorized (Chưa đăng nhập), 403 Forbidden (Sai Role), 404 Not Found (Không tìm thấy ID).

### 1\. Phân Hệ 1 & 10: Cài Đặt Hệ Thống & Kiểm Toán (/api/v1/system-settings, /api/v1/audit-logs)

Quản lý cấu hình động toàn hệ thống và lưu vết hành động của người dùng.

| HTTP Method | API Endpoint | Quyền Truy Cập (Role) | Mô Tả Chức Năng |
| :---- | :---- | :---- | :---- |
| GET | /api/v1/system-settings | Public | Lấy danh sách các cài đặt công khai của hệ thống |
| GET | /api/v1/system-settings/{key} | Public | Lấy giá trị của một cấu hình cụ thể thông qua setting\_key |
| PUT | /api/v1/system-settings/{key} | ADMIN | Cập nhật giá trị cấu hình hệ thống (setting\_value) |
| GET | /api/v1/audit-logs | ADMIN | Xem danh sách nhật ký hệ thống (Hỗ trợ lọc theo entity\_type, user\_id) |

### 2\. Phân Hệ 2: Xác Thực & Người Dùng (/api/v1/auth, /api/v1/users)

Quản lý vòng đời tài khoản. Ràng buộc trạng thái: PENDING, VERIFIED, SUSPENDED, TERMINATED.

| HTTP Method | API Endpoint | Quyền Truy Cập (Role) | Mô Tả Chức Năng |
| :---- | :---- | :---- | :---- |
| POST | /api/v1/auth/register | Public | Đăng ký tài khoản mới (Mặc định lưu trạng thái PENDING) |
| POST | /api/v1/auth/login | Public | Đăng nhập hệ thống (Trả về JWT Token và thông tin cơ bản) |
| POST | /api/v1/auth/forgot-password | Public | Gửi yêu cầu quên mật khẩu (Tạo mã thông báo trong password\_reset\_tokens) |
| POST | /api/v1/auth/reset-password | Public | Thực hiện đặt lại mật khẩu mới bằng mã Token hợp lệ |
| GET | /api/v1/users/profile | Đã Đăng Nhập | Lấy thông tin chi tiết cá nhân của tài khoản hiện tại |
| PUT | /api/v1/users/profile | Đã Đăng Nhập | Cập nhật thông tin cá nhân (full\_name, phone, avatar\_url) |
| GET | /api/v1/users | ADMIN | Lấy danh sách toàn bộ người dùng (Phân trang, lọc theo role, status) |
| PUT | /api/v1/users/{id}/status | ADMIN | Duyệt hoặc khóa tài khoản (VERIFIED, SUSPENDED, TERMINATED) |

### 3\. Phân Hệ 3: Quản Lý Nài Ngựa & Thành Tích (/api/v1/jockeys, /api/v1/achievements)

Hồ sơ nài ngựa lưu thông số total\_races, total\_wins. Trạng thái: AVAILABLE, UNAVAILABLE, PAIRED, INJURED.

| HTTP Method | API Endpoint | Quyền Truy Cập (Role) | Mô Tả Chức Năng |
| :---- | :---- | :---- | :---- |
| GET | /api/v1/jockeys | Public | Xem danh sách hồ sơ nài ngựa (Lọc theo availability\_status) |
| GET | /api/v1/jockeys/{jockeyId} | Public | Xem chi tiết tỷ lệ thắng (win\_rate), thành tích của 1 nài ngựa |
| PUT | /api/v1/jockeys/my-profile | JOCKEY | Nài ngựa tự cập nhật trạng thái của mình (Ví dụ báo INJURED) |
| GET | /api/v1/achievements | Public | Lấy danh sách tất cả danh hiệu/thành tích tồn tại trong hệ thống |
| POST | /api/v1/achievements | ADMIN | Tạo mới một danh hiệu (name, description) |
| POST | /api/v1/jockeys/{jockeyId}/achievements | ADMIN, REFEREE | Trao danh hiệu thành tích cho nài ngựa (Lưu vào jockey\_achievements) |

### 4\. Phân Hệ 4: Quản Lý Chiến Mã (/api/v1/horses)

Ràng buộc giới tính: STALLION, MARE, GELDING. Trạng thái: AVAILABLE, TRAINING, UNAVAILABLE, PAIRED, REGISTERED, SUSPENDED.

| HTTP Method | API Endpoint | Quyền Truy Cập (Role) | Mô Tả Chức Năng |
| :---- | :---- | :---- | :---- |
| GET | /api/v1/horses | Public | Lấy danh sách toàn bộ ngựa trong hệ thống (Hỗ trợ tìm kiếm, lọc) |
| GET | /api/v1/horses/my-horses | HORSE\_OWNER | Chủ ngựa xem danh sách các con ngựa thuộc sở hữu của mình |
| POST | /api/v1/horses | HORSE\_OWNER, ADMIN | Thêm mới một chú ngựa (Lưu mã số đăng ký registration\_number) |
| GET | /api/v1/horses/{id} | Public | Xem chi tiết thuộc tính, chỉ số (speed, stamina...) và lịch sử chấn thương |
| PUT | /api/v1/horses/{id} | HORSE\_OWNER, ADMIN | Cập nhật thông tin ngựa, tình trạng sức khỏe (health\_status, injury\_notes) |
| DELETE | /api/v1/horses/{id} | HORSE\_OWNER, ADMIN | Xóa mềm một chú ngựa khỏi hệ thống (Cập nhật deleted\_at) |

### 5\. Phân Hệ 5: Giải Đấu & Trận Đua (/api/v1/tournaments, /api/v1/races)

Quản lý các sự kiện đua. Ràng buộc race\_type: SPRINT, MILE, MEDIUM, LONG.

| HTTP Method | API Endpoint | Quyền Truy Cập (Role) | Mô Tả Chức Năng |
| :---- | :---- | :---- | :---- |
| GET | /api/v1/tournaments | Public | Xem danh sách các giải đấu (Lọc theo status: OPEN, ONGOING...) |
| GET | /api/v1/tournaments/{id} | Public | Xem thông tin chi tiết của 1 giải đấu cụ thể |
| POST | /api/v1/tournaments | ADMIN | Tạo giải đấu mới (Mặc định status \= 'DRAFT') |
| PUT | /api/v1/tournaments/{id} | ADMIN | Cập nhật thông tin giải đấu hoặc hủy giải đấu (CANCELLED) |
| GET | /api/v1/tournaments/{tournamentId}/races | Public | Lấy danh sách tất cả các trận đua nằm trong giải đấu đó |
| POST | /api/v1/races | ADMIN | Tạo một trận đua mới (Gán thời gian, total\_lanes, referee\_id) |
| GET | /api/v1/races/{id} | Public | Xem chi tiết trận đua (Khoảng cách, điều kiện thời tiết, trọng tài) |
| PUT | /api/v1/races/{id}/status | ADMIN, REFEREE | Chuyển trạng thái trận đua (REGISTRATION\_CLOSED, IN\_PROGRESS, OFFICIAL) |

### 6\. Phân Hệ 6: Hệ Thống Ghép Cặp Ngựa \- Nài (/api/v1/jockey-invitations, /api/v1/pairing-contracts)

Xử lý luồng kết hợp giữa chủ ngựa (HORSE\_OWNER) và nài ngựa (JOCKEY).

| HTTP Method | API Endpoint | Quyền Truy Cập (Role) | Mô Tả Chức Năng |
| :---- | :---- | :---- | :---- |
| POST | /api/v1/jockey-invitations | HORSE\_OWNER | Gửi lời mời nài ngựa điều khiển ngựa của mình (Lưu jockey\_invitations) |
| GET | /api/v1/jockey-invitations/my-invitations | JOCKEY, HORSE\_OWNER | Xem danh sách lời mời đã gửi hoặc nhận (Lọc theo status \= 'PENDING') |
| PUT | /api/v1/jockey-invitations/{id}/respond | JOCKEY | Chấp nhận/Từ chối lời mời (ACCEPTED, DECLINED). Nếu đồng ý $\\rightarrow$ tạo pairing\_contracts |
| GET | /api/v1/pairing-contracts | ADMIN | Quản lý danh sách toàn bộ các hợp đồng ghép cặp đang hoạt động |
| PUT | /api/v1/pairing-contracts/{id}/dissolve | HORSE\_OWNER, JOCKEY | Hủy/Chấm dứt hợp đồng ghép cặp (Cập nhật trạng thái DISSOLVED và điền dissolved\_at) |

### 7\. Phân Hệ 7: Đăng Ký Đua, Kết Quả & Nhật Ký Trận Đua (/api/v1/race-registrations, /api/v1/race-results, /api/v1/race-notes)

Nghiệp vụ cốt lõi điều hành giải đua ngựa.

| HTTP Method | API Endpoint | Quyền Truy Cập (Role) | Mô Tả Chức Năng |
| :---- | :---- | :---- | :---- |
| POST | /api/v1/race-registrations | HORSE\_OWNER | Đăng ký cho cặp Ngựa \+ Nài tham dự trận đua (Kiểm tra registration\_deadline) |
| GET | /api/v1/races/{raceId}/registrations | Tất cả | Xem danh sách các cặp đấu đã đăng ký và số làn đua (lane\_number) |
| PUT | /api/v1/race-registrations/{id}/review | REFEREE, ADMIN | Trọng tài chấm điểm sức khỏe (health\_check\_status) và Duyệt/Từ chối hồ sơ đua |
| PUT | /api/v1/race-registrations/{id}/withdraw | HORSE\_OWNER, JOCKEY | Xin rút lui khỏi trận đấu kèm lý do (withdraw\_reason) |
| POST | /api/v1/race-results | REFEREE, ADMIN | Nhập bảng kết quả trận đấu (finish\_position, finish\_time\_seconds, check dnf, disqualified) |
| GET | /api/v1/races/{raceId}/results | Public | Xem bảng xếp hạng kết quả chung cuộc của trận đua |
| POST | /api/v1/race-notes | REFEREE | Trọng tài ghi nhận sự cố/nhật ký trong lúc đua (Ghi nhận danh mục: START, INCIDENT, DQ...) |
| GET | /api/v1/races/{raceId}/notes | Public | Khán giả và Ban tổ chức xem diễn biến/sự cố của trận đua |

### 8\. Phân Hệ 8: Hệ Thống Dự Đoán (/api/v1/predictions)

Dành cho khán giả (SPECTATOR) tham gia dự đoán trúng thưởng điểm.

| HTTP Method | API Endpoint | Quyền Truy Cập (Role) | Mô Tả Chức Năng |
| :---- | :---- | :---- | :---- |
| POST | /api/v1/predictions | SPECTATOR | Đặt điểm cược vào một chú ngựa trước giờ đóng cổng (wager\_points) |
| GET | /api/v1/predictions/my-history | SPECTATOR | Khán giả xem lịch sử các lượt dự đoán của mình kèm kết quả thắng/thua |
| PUT | /api/v1/predictions/races/{raceId}/settle | ADMIN | Hệ thống tự động tính toán, kết toán điểm thưởng (reward\_points) sau khi có kết quả chính thức |

### 9\. Phân Hệ 9: Đổi Điểm Thưởng & Quà Tặng (/api/v1/rewards)

Đổi điểm tích lũy lấy vật phẩm hoặc coupon.

| HTTP Method | API Endpoint | Quyền Truy Cập (Role) | Mô Tả Chức Năng |
| :---- | :---- | :---- | :---- |
| GET | /api/v1/rewards/types | Public | Lấy danh sách các loại quà tặng (HORSE\_GOODS, VOUCHER, DRINK\_COUPON) |
| POST | /api/v1/rewards/types | ADMIN | Tạo mới/Thêm một phần quà vào kho hệ thống |
| POST | /api/v1/rewards/redeem | Đã Đăng Nhập | Người dùng đổi điểm tích lũy lấy quà (Trừ điểm ở users và lưu vào reward\_history) |
| GET | /api/v1/rewards/my-history | Đã Đăng Nhập | Người dùng xem lại các phần quà mình đã từng đổi |

### 10\. Phân Hệ Thông Báo (/api/v1/notifications)

Quản lý thông báo In-app cho người dùng.

| HTTP Method | API Endpoint | Quyền Truy Cập (Role) | Mô Tả Chức Năng |
| :---- | :---- | :---- | :---- |
| GET | /api/v1/notifications | Đã Đăng Nhập | Lấy danh sách các thông báo nhận được (Hỗ trợ phân trang) |
| PUT | /api/v1/notifications/{id}/read | Đã Đăng Nhập | Đánh dấu thông báo cụ thể là đã đọc (is\_read \= 1\) |
| PUT | /api/v1/notifications/read-all | Đã Đăng Nhập | Đánh dấu toàn bộ tất cả thông báo của mình là đã đọc |

