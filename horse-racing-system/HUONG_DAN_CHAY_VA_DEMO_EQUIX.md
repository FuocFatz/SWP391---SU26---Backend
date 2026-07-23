# Hướng dẫn chạy và kịch bản demo EquiX V4

Tài liệu này dùng cho buổi demo/bảo vệ EquiX trên Windows với:

- Frontend: React + Vite
- Backend: Java 17 + Spring Boot + JWT
- Database runtime: Microsoft SQL Server 2019 trở lên
- Database: `EquiX`
- Tài khoản kết nối SQL Server: `equix_user` / `123456`
- Mật khẩu của toàn bộ tài khoản Quick Login: `12345`

> Quan trọng: `123456` là mật khẩu kết nối database. `12345` là mật khẩu đăng nhập ứng dụng. Đây là hai loại tài khoản khác nhau.

---

## 1. Checklist nhanh trước khi demo

Thực hiện các bước sau trước giờ demo ít nhất 15 phút:

1. Khởi động dịch vụ SQL Server.
2. Kiểm tra database `EquiX` vẫn còn nguyên dữ liệu; không chạy lệnh xóa database.
3. Mở hai cửa sổ PowerShell tại thư mục project.
4. Chạy backend ở cổng `9090`.
5. Chạy frontend ở cổng `5173`.
6. Mở `http://localhost:5173/login`.
7. Kiểm tra có đủ năm nút Quick Login.
8. Đăng nhập thử Administrator và Referee.
9. Kiểm tra race `EquiX Demo Referee Check` có đủ ít nhất 6 đăng ký nếu muốn demo toàn bộ vòng đời cuộc đua.
10. Không cập nhật Windows, Java, Node hoặc SQL Server ngay trước buổi demo.

Các URL cần nhớ:

| Thành phần | URL |
|---|---|
| Website | `http://localhost:5173` |
| Trang đăng nhập | `http://localhost:5173/login` |
| Backend API | `http://localhost:9090/api` |
| Swagger UI | `http://localhost:9090/swagger-ui.html` |
| OpenAPI JSON | `http://localhost:9090/v3/api-docs` |

---

## 2. Cấu trúc project

Thư mục đang dùng:

```text
horse-racing-system/
├── src/                         Backend Spring Boot
├── pom.xml                      Cấu hình Maven/Java
├── mvnw.cmd                     Maven Wrapper cho Windows
├── equix-frontend/              Frontend React/Vite
│   ├── src/
│   ├── package.json
│   └── .env.local               API URL và tài khoản Quick Login
├── docs/database/               Script SQL Server và hướng dẫn chuyển máy
├── docs/demo-screenshots/       Ảnh dự phòng cho buổi demo
├── uploads/                     Avatar/ảnh được tải lên
└── EquiX_Business_Logic_Definitive_v4.md
```

Backend nằm ngay ở thư mục gốc, không có thư mục `equix-backend`. Vì vậy lệnh `mvnw.cmd` phải được chạy tại thư mục gốc.

---

## 3. Yêu cầu cài đặt

### 3.1 Phần mềm bắt buộc

- JDK 17
- Node.js 20 trở lên; máy hiện tại đang dùng Node.js 22
- npm
- Microsoft SQL Server 2019 trở lên
- SQL Server Management Studio hoặc công cụ `sqlcmd`
- Git không bắt buộc nếu chỉ chạy project từ folder đã chép

### 3.2 Kiểm tra phiên bản

Mở PowerShell và chạy:

```powershell
java -version
node --version
npm --version
```

Kết quả Java phải là phiên bản 17. Node.js nên từ phiên bản 20 trở lên.

### 3.3 Kiểm tra ba cổng

```powershell
Get-NetTCPConnection -State Listen -LocalPort 1433,5173,9090 -ErrorAction SilentlyContinue |
    Select-Object LocalAddress,LocalPort,OwningProcess
```

- `1433`: SQL Server
- `9090`: backend Spring Boot
- `5173`: frontend Vite

---

## 4. Chuẩn bị SQL Server

### 4.1 Cấu hình runtime hiện tại

Backend đọc một file cấu hình duy nhất:

```text
src/main/resources/application.properties
```

Cấu hình mặc định:

```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=EquiX;encrypt=true;trustServerCertificate=true
spring.datasource.username=equix_user
spring.datasource.password=123456
spring.jpa.hibernate.ddl-auto=validate
```

Project runtime dùng SQL Server, không dùng MySQL. H2 chỉ được sử dụng trong automated tests.

Do `ddl-auto=validate`, backend chỉ kiểm tra schema và không tự tạo đầy đủ bảng từ một database trống. Khi chuyển máy cần restore database `EquiX` từ file `.bak` hoặc import một bản schema/data đầy đủ trước khi chạy.

### 4.2 Kiểm tra kết nối database

```powershell
sqlcmd -S localhost,1433 -U equix_user -P 123456 -C -d EquiX `
  -Q "SELECT DB_NAME() AS database_name, COUNT(*) AS user_count FROM dbo.users;"
```

Kết quả phải hiện database `EquiX` và số lượng tài khoản lớn hơn 0.

### 4.3 Tạo lại SQL login khi chuyển máy

1. Restore database với đúng tên `EquiX`.
2. Bật chế độ `SQL Server and Windows Authentication mode`.
3. Bật TCP/IP và cổng `1433` nếu máy khác chưa cấu hình.
4. Đăng nhập SSMS bằng tài khoản quản trị.
5. Chạy file:

```text
docs/database/create-equix-login.sql
```

Script này tạo/cập nhật login `equix_user`, mật khẩu `123456`, sau đó cấp quyền đọc và ghi trong database `EquiX`.

Hướng dẫn chuyển máy chi tiết nằm tại:

```text
docs/database/SQL_SERVER_TRANSFER_GUIDE.md
```

### 4.4 Tạo/cập nhật năm tài khoản Quick Login

Trong SSMS, mở và chạy:

```text
docs/database/seed-quick-login.sql
```

Script không lưu mật khẩu dạng rõ trong database; database lưu BCrypt hash của mật khẩu `12345`.

### 4.5 Kiểm tra dữ liệu demo hiện tại

```sql
USE EquiX;

SELECT email, role, status, reward_points
FROM dbo.users
WHERE email LIKE 'demo-%@equix.local'
ORDER BY role;

SELECT r.race_name, r.status, COUNT(rr.id) AS registrations
FROM dbo.races r
LEFT JOIN dbo.race_registrations rr ON rr.race_id = r.id
WHERE r.race_name LIKE 'EquiX Demo%'
GROUP BY r.race_name, r.status
ORDER BY r.race_name;
```

Năm tài khoản phải có trạng thái `VERIFIED`. Để chạy luồng trọng tài đầy đủ, race `EquiX Demo Referee Check` cần có ít nhất 6 registrations.

### 4.6 Tạo bộ dữ liệu nghiệp vụ demo đầy đủ nếu còn thiếu

Chỉ dùng phần này khi dữ liệu demo thiếu hoặc race kiểm tra có ít hơn 6 người tham gia. Dừng backend đang chạy bằng `Ctrl+C`, sau đó chạy tại thư mục gốc:

```powershell
$env:EQUIX_DEMO_DATA_ENABLED='true'

$env:EQUIX_DEMO_ADMIN_EMAIL='demo-admin@equix.local'
$env:EQUIX_DEMO_ADMIN_PASSWORD='12345'
$env:EQUIX_DEMO_OWNER_EMAIL='demo-owner@equix.local'
$env:EQUIX_DEMO_OWNER_PASSWORD='12345'
$env:EQUIX_DEMO_JOCKEY_EMAIL='demo-jockey@equix.local'
$env:EQUIX_DEMO_JOCKEY_PASSWORD='12345'
$env:EQUIX_DEMO_REFEREE_EMAIL='demo-referee@equix.local'
$env:EQUIX_DEMO_REFEREE_PASSWORD='12345'
$env:EQUIX_DEMO_SPECTATOR_EMAIL='demo-spectator@equix.local'
$env:EQUIX_DEMO_SPECTATOR_PASSWORD='12345'

.\mvnw.cmd spring-boot:run
```

Bộ khởi tạo sẽ bổ sung dữ liệu demo theo tên cố định và được thiết kế để có thể chạy lại mà không tạo trùng các bản ghi chính. Sau khi log hiện `Started HorseRacingSystemApplication`, giữ terminal này mở để dùng backend.

Khi không muốn tự seed ở những lần chạy sau, đóng terminal và mở terminal PowerShell mới; biến môi trường trên chỉ tồn tại trong terminal hiện tại.

> Không bật bộ seed sau khi bạn đã chạy cuộc đua demo sang `OFFICIAL` nếu mục tiêu là đưa chính race đó về trạng thái ban đầu. Bộ seed không phải lệnh reset trạng thái. Muốn có trạng thái hoàn toàn sạch, hãy restore bản backup database đã chuẩn bị trước buổi demo.

---

## 5. Chạy project

### 5.1 Chạy backend

Mở PowerShell thứ nhất tại thư mục gốc:

```powershell
.\mvnw.cmd spring-boot:run
```

Chờ đến khi có dòng tương tự:

```text
Started HorseRacingSystemApplication
Tomcat started on port 9090
```

Kiểm tra backend:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:9090/v3/api-docs
```

Status code phải là `200`.

### 5.2 Chạy frontend

Mở PowerShell thứ hai tại thư mục gốc:

```powershell
cd equix-frontend
npm install
npm run dev
```

Nếu đã có `node_modules`, vẫn có thể chạy thẳng `npm run dev`. Khi terminal hiện `Local: http://localhost:5173/`, mở URL đó trên trình duyệt.

### 5.3 Cấu hình Quick Login

File `equix-frontend/.env.local` phải có:

```dotenv
VITE_API_BASE_URL=http://localhost:9090/api
VITE_ENABLE_QUICK_LOGIN=true

VITE_DEMO_ADMIN_EMAIL=demo-admin@equix.local
VITE_DEMO_ADMIN_PASSWORD=12345
VITE_DEMO_OWNER_EMAIL=demo-owner@equix.local
VITE_DEMO_OWNER_PASSWORD=12345
VITE_DEMO_JOCKEY_EMAIL=demo-jockey@equix.local
VITE_DEMO_JOCKEY_PASSWORD=12345
VITE_DEMO_REFEREE_EMAIL=demo-referee@equix.local
VITE_DEMO_REFEREE_PASSWORD=12345
VITE_DEMO_SPECTATOR_EMAIL=demo-spectator@equix.local
VITE_DEMO_SPECTATOR_PASSWORD=12345
```

Vite chỉ đọc `.env.local` khi khởi động. Nếu sửa file này, phải dừng frontend bằng `Ctrl+C` rồi chạy lại `npm run dev`.

### 5.4 Dừng project

Nhấn `Ctrl+C` trong terminal frontend và backend.

Nếu terminal đã bị đóng nhưng process vẫn giữ cổng:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5173,9090 |
    Select-Object LocalPort,OwningProcess
```

Sau khi kiểm tra đúng PID, dừng từng process:

```powershell
Stop-Process -Id <PID>
```

---

## 6. Tài khoản Quick Login

| Nút | Email | Mật khẩu | Vai trò chính |
|---|---|---:|---|
| Administrator | `demo-admin@equix.local` | `12345` | Quản trị toàn hệ thống |
| Horse Owner | `demo-owner@equix.local` | `12345` | Quản lý ngựa, mời jockey, đăng ký đua |
| Jockey | `demo-jockey@equix.local` | `12345` | Nhận/từ chối lời mời, xem lịch đua |
| Referee | `demo-referee@equix.local` | `12345` | Kiểm tra trước đua, bắt đầu đua, báo cáo |
| Spectator | `demo-spectator@equix.local` | `12345` | Dự đoán, xem đua và nhận thưởng |

Cách dùng:

1. Mở `http://localhost:5173/login`.
2. Kéo xuống phần `Demo Quick Login`.
3. Bấm vào vai trò muốn demo.
4. Hệ thống vẫn gọi API đăng nhập thật và nhận JWT, không bỏ qua bảo mật.
5. Muốn đổi vai trò, mở menu người dùng góc trên bên phải, đăng xuất, quay lại trang Login và bấm vai trò khác.

---

## 7. Kịch bản demo đề xuất trong 12–15 phút

Đây là thứ tự ít rủi ro nhất vì thể hiện được luồng nghiệp vụ liên vai trò.

### Bước 1 — Giới thiệu trang công khai (1 phút)

1. Mở Homepage.
2. Giới thiệu thanh điều hướng `Home`, `Races`, `Leaderboard`, `About`, `FAQ`.
3. Mở `Races` để cho thấy khách vẫn xem được danh sách và chi tiết cuộc đua.
4. Mở `Leaderboard` để cho thấy kết quả chỉ cập nhật chính thức sau khi Admin xác nhận.
5. Mở `Register` và giới thiệu ba role được tự đăng ký: Horse Owner, Jockey, Spectator.
6. Nêu rõ Referee chỉ có thể do Admin tạo.

Câu nói gợi ý:

> EquiX sử dụng kiến trúc phân quyền năm vai trò. Mỗi vai trò chỉ nhìn thấy và thao tác được đúng phần nghiệp vụ của mình; JWT được backend kiểm tra trên các API được bảo vệ.

### Bước 2 — Spectator đặt dự đoán trước khi khóa (1 phút)

Thực hiện bước này trước khi Referee chuyển race sang `STANDBY`.

1. Quick Login bằng `Spectator`.
2. Vào `Browse Races` hoặc `Dashboard`.
3. Tại `Race Guess`, chọn `EquiX Demo Referee Check`.
4. Chọn một ngựa, nên chọn `Thunder Bolt` để dễ nhớ.
5. Bấm lưu dự đoán.
6. Mở `My Guesses` để cho thấy mỗi spectator chỉ có một dự đoán trên một race và có thể cập nhật khi race chưa `STANDBY`.

Điểm nghiệp vụ cần nói:

- Một spectator chỉ được có một guess trên mỗi race.
- Guess không dùng tiền thật.
- Guess bị khóa vĩnh viễn khi race chuyển sang `STANDBY`.
- Reward chỉ được phát khi kết quả đã thành `OFFICIAL`.

### Bước 3 — Horse Owner quản lý ngựa và ghép jockey (2 phút)

1. Đăng xuất và Quick Login bằng `Horse Owner`.
2. Vào `My Horses`.
3. Giới thiệu form `Create Horse`: tên, giới tính, giống, tuổi, cân nặng, chiến thuật chạy, speed và stamina.
4. Có thể tạo một ngựa thử, ví dụ `Demo Tomorrow`, để chứng minh CRUD.
5. Bấm `Edit` để chuyển trạng thái `AVAILABLE`, `TRAINING` hoặc `UNAVAILABLE`.
6. Dùng `Portrait` để tải ảnh JPEG/PNG/WebP tối đa 5 MB.
7. Vào `Hire Jockey` hoặc `Races`, chọn race, horse và jockey rồi gửi invitation.
8. Giải thích rằng phải có pairing được jockey chấp nhận trước khi đăng ký race.
9. Vào `Pairings` để xem cặp đã đăng ký và chức năng rút đăng ký trong grace period.

Không nên xóa horse đang `PAIRED` hoặc `REGISTERED`; hệ thống cố ý khóa hành động này để bảo vệ toàn vẹn dữ liệu.

### Bước 4 — Jockey nhận lời mời (1 phút)

1. Đăng xuất và Quick Login bằng `Jockey`.
2. Vào `Invitations`.
3. Mở lời mời đang `PENDING` và bấm `Accept` hoặc `Decline`.
4. Nếu Accept, pairing contract được kích hoạt và jockey không thể nhận một horse khác cùng lúc.
5. Mở `My Horse`, `Races` và `Achievements` để giới thiệu phân công, lịch sử và thành tích cá nhân.

Điểm nghiệp vụ cần nói:

- Quan hệ Horse–Jockey là một-một trong pairing đang hoạt động.
- Pairing được lưu bằng contract, không chỉ là một cột tạm trên UI.
- Lịch sử lời mời và quyết định được giữ lại để truy vết.

### Bước 5 — Admin duyệt và quản trị (2 phút)

1. Đăng xuất và Quick Login bằng `Administrator`.
2. Dashboard hiển thị tổng số account, race, pending approval và horse.
3. Tại `Registration Approvals`, duyệt từng đăng ký hoặc bấm `Approve all`.
4. Vào `Accounts` để giới thiệu Verify, Reject, Suspend, Change role và soft delete.
5. Vào `Tournaments` để giới thiệu thời gian giải và grace period 72/120/168 giờ.
6. Giới thiệu form `Create Race`: tournament, referee, loại race, distance, ngày giờ, tối đa 6–18 người và prize pool.
7. Trong `Race List`, giới thiệu status có thể điều khiển: Draft → Registration Open → Registration Closed.
8. Giới thiệu `Race Schedule Control` cho reschedule/cancel và lý do bắt buộc.
9. Mở `Analytics` để xem phân bố users, races, rewards, cảnh báo vận hành và top horses.

Không bấm Cancel trên race dùng để demo tiếp. Cancel có nghiệp vụ rollback registrations và guesses.

### Bước 6 — Referee kiểm tra và chạy race (3 phút)

Race dùng cho bước này: `EquiX Demo Referee Check`.

Điều kiện ban đầu:

- Race đang `REGISTRATION_CLOSED`.
- Race được gán cho Demo Referee.
- Có ít nhất 6 registrations.
- Các registrations đang `READY_FOR_CHECK` hoặc `APPROVED`.

Thao tác:

1. Đăng xuất và Quick Login bằng `Referee`.
2. Vào `Assigned Races` để chỉ ra race được phân công.
3. Vào `Race Monitor` và chọn `EquiX Demo Referee Check`.
4. Trong `Pre-race Checks`, bấm `Fit` cho đủ ít nhất 6 entries.
5. Giới thiệu nút `Disqualify`: lý do tối thiểu 20 ký tự, category, severity và phải nhập đúng `CONFIRM`.
6. Khi đủ 6 entries `CLEARED TO RACE`, bấm `Prepare Standby`.
7. Nhắc lại rằng lúc này toàn bộ guess bị khóa.
8. Bấm `Start Race`. Chỉ Referee được phép bấm nút này.
9. Bấm `Simulate` để hiện vị trí và đường đua trực tiếp.
10. Có thể thêm một incident demo như `OBSERVATION` với mô tả ít nhất 10 ký tự.
11. Bấm `Complete` để chuyển race sang kết quả tạm thời.
12. Điền `Signed Referee Report`:
    - Summary: `Race completed normally with all incidents reviewed.`
    - Severity: `Information`
    - Action taken: `No action required`
    - Signature: `Demo Referee`
    - Tick xác nhận đã xem toàn bộ incident
13. Bấm `Submit signed report`.

Kết quả mong đợi: race chuyển sang `REPORT_READY` để Admin review. Referee không thể tự xuất bản kết quả chính thức.

### Bước 7 — Admin công bố kết quả chính thức (2 phút)

1. Đăng xuất và Quick Login bằng `Administrator`.
2. Ở Dashboard, tìm race đang `REPORT_READY`.
3. Bấm `Review & finalize`.
4. Kiểm tra/sắp xếp position và finish time của từng entry.
5. Nếu muốn đảm bảo spectator nhận thưởng, đặt horse đã guess ở vị trí 1, 2 hoặc 3.
6. Giới thiệu hỗ trợ `DNF`, `Disqualified` và dead heat.
7. Với Disqualified, violation reason phải có ít nhất 20 ký tự.
8. Bấm `Publish official results`.

Kết quả mong đợi:

- Race chuyển sang `OFFICIAL`.
- Leaderboard được cập nhật.
- Prize pool được hiển thị theo tỷ lệ 60/30/10.
- Guess được settle.
- Reward tương ứng được phát cho spectator.
- Notification được tạo.

Admin cũng có thể bấm `Request revision` thay vì publish. Báo cáo sẽ quay lại Referee với lý do tối thiểu 20 ký tự; đây là vòng kiểm soát hai người.

### Bước 8 — Spectator nhận và đổi thưởng (2 phút)

1. Quick Login lại bằng `Spectator`.
2. Mở biểu tượng chuông để xem notification kết quả/reward.
3. Vào `My Rewards`.
4. Nếu là digital voucher/drink:
    - Bấm `Claim digital reward`.
    - Xem mã một lần, nút Copy và QR.
5. Nếu là horse goods:
    - Bấm `Claim delivery`.
    - Nhập recipient name, phone và delivery address.
    - Gửi claim.
6. Đăng nhập Admin → `Reward Fulfillment`:
    - Goods: `Start processing` → nhập carrier/tracking → `Mark shipped` → `Mark fulfilled`.
    - Digital: nhập/scanner redemption code → `Validate & redeem`.
7. Quay lại Spectator để xem trạng thái cuối hoặc `Confirm received` khi hàng đang shipped.

Vòng đời chính:

```text
Goods:   ISSUED → CLAIMED → PROCESSING → SHIPPED → FULFILLED
Digital: ISSUED → CLAIMED → REDEEMED
```

---

## 8. Hướng dẫn demo từng nhóm chức năng

### 8.1 Guest và xác thực

| Chức năng | Cách demo | Kết quả mong đợi |
|---|---|---|
| Home | Mở `/` | Landing page, race nổi bật và CTA |
| All Races | Mở `/races` | Lọc/xem danh sách race công khai |
| Race Detail | Bấm một race | Thông tin, participants và results phù hợp status |
| Leaderboard | Mở `/leaderboard` | Chỉ số ngựa từ kết quả official |
| About/FAQ/Terms | Dùng menu/footer | Giải thích hệ thống và quy định |
| Register | Chọn Owner/Jockey/Spectator | Owner/Jockey chờ Admin; Spectator active ngay |
| Login | Email + password hoặc Quick Login | Backend xác thực và trả JWT |
| Forgot Password | Nhập email | Trả thông báo chung, không làm lộ email tồn tại hay không |

Lưu ý local: adapter email hiện tại chỉ ghi nhận yêu cầu gửi mail và không cấu hình SMTP thật. Vì vậy có thể demo bước request reset/change email, nhưng không nên hứa rằng hộp thư sẽ nhận link trong môi trường local này.

### 8.2 Administrator

| Menu | Nội dung demo |
|---|---|
| Dashboard | Thống kê, create race, status race, schedule control, registration approvals |
| Accounts | Search/filter, verify, reject có lý do, suspend, change role, delete |
| Tournaments | Tạo giải, địa điểm, start/end date, grace period, open/close |
| Horses | Danh sách horse, owner, health, status và record |
| Jockeys | Danh sách jockey, status, verify/suspend |
| Referees | Admin tạo referee đã verified; public không tạo được referee |
| Results | Official/provisional, position, time, points, DNF/disqualification |
| Guesses | Theo dõi spectator, race, horse được chọn và trạng thái guess |
| Reward Fulfillment | Xử lý giao hàng, redeem code, cấu hình reward catalog |
| Analytics | Users/races/rewards distribution, alerts và top horses |
| Settings | Profile, avatar, đổi mật khẩu và yêu cầu đổi email |

### 8.3 Horse Owner

| Menu | Nội dung demo |
|---|---|
| Dashboard | Tổng horse, registrations, ready pairings và reward points |
| My Horses | Create, edit, portrait, status, delete khi không bị ràng buộc |
| Hire Jockey | Chọn horse + jockey + race và gửi invitation |
| Pairings | Active/registered entries và withdrawal trong grace period |
| Races | Race còn mở đăng ký và trạng thái tham gia |
| Leaderboard | Wins, Top 3, points của horse |
| Profile | Sửa tên/phone, avatar, password, yêu cầu đổi email |

### 8.4 Jockey

| Menu | Nội dung demo |
|---|---|
| Dashboard | Số invitation, assignment và thành tích |
| Invitations | Accept hoặc Decline lời mời đang pending |
| My Horse | Horse đang được phân công và pairing liên quan |
| Races | Lịch race được gán thông qua pairing |
| Achievements | Races, wins, Top 3 và ranking cá nhân |
| Profile | Cập nhật thông tin tài khoản |

### 8.5 Referee

| Menu | Nội dung demo |
|---|---|
| Dashboard | Tổng quan race được phân công |
| Assigned Races | Chỉ hiện race có `refereeId` đúng tài khoản hiện tại |
| Race Monitor | Check Fit/Disqualify, Standby, Start, Simulate, Complete, incident, DNF |
| Reports | Báo cáo ký tên, severity, action và vòng revision |
| Profile | Thông tin và bảo mật cá nhân |

### 8.6 Spectator

| Menu | Nội dung demo |
|---|---|
| Dashboard | Race có thể đoán và dữ liệu tổng quan |
| Browse Races | Chọn race/entry để dự đoán trước Standby |
| My Guesses | Một guess/race, xem trạng thái pending/locked/settled |
| My Rewards | Claim, mã/QR, tracking, xác nhận nhận hàng |
| Leaderboard | Theo dõi horse rankings |
| Profile | Thông tin và bảo mật cá nhân |

### 8.7 Chức năng dùng chung sau đăng nhập

- Notification bell hiển thị unread count.
- Notification Center hỗ trợ `Mark as read` từng mục và `Mark all as read`.
- Profile hỗ trợ avatar JPEG/PNG/WebP tối đa 5 MB.
- Đổi password yêu cầu current password; password mới tối thiểu 8 ký tự, có chữ và số.
- Đổi email yêu cầu current password và phải xác minh email mới.
- JWT hết hạn sẽ đưa người dùng về Login với thông báo session expired.

---

## 9. Các trạng thái nghiệp vụ cần nhớ

### 9.1 Race lifecycle

```text
DRAFT
  → REGISTRATION_OPEN
  → REGISTRATION_CLOSED
  → STANDBY
  → IN_PROGRESS
  → COMPLETED
  → REPORT_READY
  → OFFICIAL
```

Nhánh đặc biệt:

```text
REPORT_READY → REVISION_REQUIRED → REPORT_READY
Race chưa chạy → CANCELLED
```

Ai thực hiện:

| Transition | Người thực hiện |
|---|---|
| Draft/Open/Close/Reopen | Admin |
| Registration Closed → Standby | Referee sau khi đủ ít nhất 6 entries Fit |
| Standby → In Progress | Chỉ Referee được gán |
| In Progress → Completed | Referee |
| Completed → Report Ready | Referee gửi signed report |
| Report Ready → Official | Admin |
| Report Ready → Revision Required | Admin |

### 9.2 Registration lifecycle rút gọn

```text
Owner chọn horse/race
→ gửi invitation cho Jockey
→ Jockey ACCEPTED
→ PENDING_ADMIN
→ Admin APPROVED/READY_FOR_CHECK
→ Referee FIT
→ CLEARED_TO_RACE
```

### 9.3 Mười quy tắc V4 quan trọng để trả lời thầy

1. Một jockey chỉ ghép với một horse trong active pairing.
2. Một horse chỉ ghép với một jockey trong active pairing.
3. Phải có pairing trước khi đăng ký race.
4. Registration đóng một tuần trước race theo nghiệp vụ chuẩn.
5. Mỗi race có từ 6 đến 18 cặp tham gia.
6. Mỗi spectator có đúng một guess trên mỗi race.
7. Guess khóa khi race sang Standby.
8. Referee chỉ do Admin tạo và chỉ Referee được gán mới có thể Start Race.
9. Kết quả chỉ Official sau báo cáo Referee và xác nhận Admin.
10. Prize pool chia 60/30/10; guess reward chỉ phát sau Official.

Các rule khác đáng chú ý: toàn bộ race dùng Turf; horse stats/training position chủ yếu mang tính hiển thị; hệ thống hỗ trợ incident, DNF, disqualification, referee reassignment, reschedule và cancellation audit.

---

## 10. Khi nút bị disable hoặc xuất hiện thông báo lỗi

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `Authentication is required` | Token thiếu/hết hạn hoặc backend vừa restart | Logout, login lại bằng Quick Login và refresh |
| Không thấy Quick Login | `.env.local` thiếu hoặc Vite chưa restart | Đặt `VITE_ENABLE_QUICK_LOGIN=true`, restart frontend |
| `Registration is not ready for referee check` | Entry chưa qua pairing/Admin approval hoặc race sai trạng thái | Jockey Accept → Admin Approve → Referee Check |
| `Prepare Standby` bị khóa | Race chưa `REGISTRATION_CLOSED` hoặc chưa đủ 6 entries Fit | Admin đóng đăng ký, Referee bấm Fit đủ 6 |
| `Start Race` bị khóa | Race chưa `STANDBY` hoặc referee không được gán | Prepare Standby và kiểm tra referee assignment |
| `Complete` bị khóa | Race chưa `IN_PROGRESS` | Bấm Start Race trước |
| Không thể gửi report | Summary dưới 20 ký tự, thiếu signature hoặc chưa tick review | Điền đủ ba điều kiện |
| Admin không thấy Finalize | Race chưa `REPORT_READY` | Referee phải Complete và Submit signed report |
| Không sửa được guess | Race đã `STANDBY` trở lên | Đây là rule khóa guess, không phải lỗi |
| Không có reward | Race chưa Official hoặc horse guess ngoài Top 3 | Admin Finalize và kiểm tra finish position |
| Không xóa được horse | Horse đang Paired/Registered | Hoàn tất/rút workflow trước khi xóa |
| Không mở lại horse Unavailable | Chưa tick xác nhận đủ thể lực | Tick fit confirmation trong Edit Horse |
| Không claim goods | Thiếu tên, phone hoặc địa chỉ tối thiểu | Điền đủ delivery form |
| Không Mark shipped | Chưa có carrier/tracking number | Điền đủ hai trường rồi thao tác |
| Không Cancel reward | Chưa nhập admin note | Nhập lý do rồi Cancel |

---

## 11. Xử lý lỗi chạy project

### 11.1 Backend báo login failed for user `equix_user`

- Kiểm tra SQL Server đã bật SQL Authentication.
- Kiểm tra TCP/IP và cổng 1433.
- Chạy lại `docs/database/create-equix-login.sql` bằng tài khoản quản trị.
- Kiểm tra password database là `123456`.

### 11.2 Backend báo schema validation failed

Database đang thiếu bảng/cột so với entity hiện tại.

- Không đổi `ddl-auto` sang `create` hoặc `create-drop` trước buổi demo.
- Restore đúng bản `EquiX` mới nhất.
- Đảm bảo các migration trong `docs/database/migrations` đã được áp dụng theo thứ tự.
- Backup database trước khi chạy migration thủ công.

### 11.3 Frontend mở được nhưng không tải dữ liệu

1. Kiểm tra backend `http://localhost:9090/v3/api-docs` trả `200`.
2. Kiểm tra `.env.local` có `VITE_API_BASE_URL=http://localhost:9090/api`.
3. Restart Vite.
4. Logout/login lại để nhận JWT mới.

### 11.4 Port 5173 hoặc 9090 đã được sử dụng

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5173,9090 |
    Select-Object LocalPort,OwningProcess
```

Kiểm tra PID rồi mới dùng `Stop-Process`.

### 11.5 Backend chạy được nhưng Quick Login sai mật khẩu

Chạy lại `docs/database/seed-quick-login.sql`, sau đó kiểm tra `.env.local` dùng password `12345` và restart frontend.

### 11.6 Email reset/change không đến hộp thư

Môi trường local đang dùng `LoggingEmailService`, chưa kết nối SMTP/provider thật. Request vẫn được backend xử lý theo hướng không làm lộ tài khoản, nhưng thư/link xác minh không được gửi ra ngoài. Đây là integration cần cấu hình khi deploy thật.

---

## 12. Kiểm tra tự động trước buổi demo

### 12.1 Backend tests

Tại thư mục gốc:

```powershell
.\mvnw.cmd test
```

Automated tests dùng cấu hình `src/test/resources/application-test.properties` và H2 tạm thời. Lệnh test không chuyển runtime production sang H2.

### 12.2 Frontend tests, lint và build

```powershell
cd equix-frontend
npm test
npm run lint
npm run build
```

Cả bốn nhóm kiểm tra nên hoàn thành trước khi đóng gói project.

---

## 13. Câu hỏi thầy có thể hỏi

### Tại sao dùng JWT?

JWT phù hợp REST API stateless. Backend xác thực chữ ký/token expiration và áp dụng role authorization cho từng endpoint; frontend không thể tự đổi role để có quyền backend.

### Vì sao Admin không được Start Race?

Đây là separation of duties. Admin tổ chức và kiểm soát dữ liệu; Referee chịu trách nhiệm vận hành race. Chỉ referee được phân công mới chuyển `STANDBY` sang `IN_PROGRESS`.

### Vì sao kết quả cần hai bước?

Kết quả đầu tiên chỉ là provisional. Referee phải nộp signed report, sau đó Admin mới review/finalize. Cơ chế này hạn chế một người tự ý quyết định toàn bộ kết quả.

### Làm sao ngăn spectator sửa dự đoán khi race bắt đầu?

Khi race chuyển sang `STANDBY`, backend khóa guess. Quy tắc được kiểm tra ở API/database workflow, không chỉ ẩn nút frontend.

### Reward hoạt động thế nào?

Sau `OFFICIAL`, dự đoán Top 1 nhận horse goods, Top 2 nhận voucher, Top 3 nhận drink coupon. Goods có fulfillment/tracking; digital reward có one-time code và QR để Admin xác nhận redeem.

### Prize pool có phải tiền thật không?

Không. Prize pool là mô hình hiển thị phục vụ đồ án và chia theo 60/30/10. Guess cũng là dự đoán học thuật, không phải gambling bằng tiền thật.

### Database được bảo vệ thế nào?

Ứng dụng dùng account SQL riêng `equix_user`, JPA parameter binding, password người dùng lưu bằng BCrypt, JWT secret ở cấu hình môi trường và không lưu password người dùng dạng rõ.

### Khi chuyển project sang máy khác cần làm gì?

Restore `EquiX.bak`, tạo login `equix_user`, bật SQL Authentication/TCP 1433, rồi chạy backend và frontend. Không thể chỉ copy source code mà bỏ qua database.

---

## 14. Phương án dự phòng nếu live demo gặp sự cố

Không chỉnh code trong lúc đang thuyết trình. Thứ tự xử lý:

1. Refresh trang.
2. Logout và Quick Login lại.
3. Kiểm tra terminal backend còn chạy.
4. Kiểm tra SQL Server còn hoạt động.
5. Nếu một bước workflow đã làm thay đổi status, chuyển sang race demo khác thay vì cố sửa database trực tiếp.
6. Dùng ảnh dự phòng tại `docs/demo-screenshots/final-demo/` để tiếp tục trình bày:
   - Quick Login năm role
   - Admin Dashboard/Reward Fulfillment
   - Horse Owner Dashboard
   - Jockey Invitation
   - Referee Check
   - Spectator Guess/Rewards
   - Notifications
   - Mobile responsive

Nên backup database ngay trước buổi demo. Nếu cần chạy lại từ đầu sau một lần diễn tập, restore bản backup sẽ an toàn hơn các lệnh sửa status thủ công.

---

## 15. Lời dẫn kết thúc gợi ý

> EquiX triển khai đầy đủ một chuỗi nghiệp vụ đua ngựa đa vai trò: chủ ngựa tạo và quản lý horse, jockey xác nhận pairing, Admin duyệt đăng ký, Referee kiểm tra và vận hành race, Admin xác nhận kết quả chính thức, sau đó spectator nhận reward từ dự đoán. Các status transition, phân quyền JWT, audit reason, notification và reward lifecycle đều được kiểm tra ở backend và lưu trên Microsoft SQL Server.

