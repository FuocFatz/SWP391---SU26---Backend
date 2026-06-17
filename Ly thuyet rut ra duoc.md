# HORSE RACING SYSTEM - BACKEND MASTER CHEAT SHEET

# 1. Đề tài của nhóm là gì?

Horse Racing System là hệ thống quản lý đua ngựa.

Backend được xây dựng bằng Spring Boot.

Nhiệm vụ Backend:

* Thiết kế database
* Xây dựng REST API
* CRUD User
* CRUD Horse
* Register/Login
* JWT Authentication
* Kết nối SQL Server
* Test API bằng Postman
* Quản lý source code bằng GitHub

---

# 2. Backend đã làm được gì?

Hiện tại đã hoàn thành:

✅ SQL Server Database

✅ User CRUD

✅ Horse CRUD

✅ Register

✅ Login

✅ BCrypt Password Encoding

✅ JWT Generation

✅ Spring Security

✅ CORS Configuration

✅ API Testing bằng Postman

✅ GitHub Source Control

---

# 3. Cấu trúc source code

src/main/java

```text
com.equix.horseracingsystem

├── controller
│   ├── AuthController
│   ├── UserController
│   └── HorseController
│
├── entity
│   ├── User
│   └── Horse
│
├── repository
│   ├── UserRepository
│   └── HorseRepository
│
├── service
│   ├── UserService
│   └── HorseService
│
├── service.impl
│   ├── UserServiceImpl
│   └── HorseServiceImpl
│
├── dto
│   ├── LoginRequest
│   ├── RegisterRequest
│   └── AuthResponse
│
├── security
│   └── JwtUtil
│
└── config
    ├── SecurityConfig
    └── WebConfig
```

---

# 4. Request đi như thế nào?

Frontend/Postman

↓

Controller

↓

Service

↓

Repository

↓

Database

↓

Repository

↓

Service

↓

Controller

↓

JSON Response

Ví dụ:

GET /api/v1/users

↓

UserController

↓

UserService

↓

UserRepository

↓

SQL Server

↓

List<User>

↓

JSON

---

# 5. Entity là gì?

Entity là class đại diện cho bảng database.

Ví dụ:

User.java

↓

Users Table

Horse.java

↓

Horse Table

Ví dụ:

```java
@Entity
@Table(name = "Users")
public class User
```

---

# 6. Repository là gì?

Repository là tầng làm việc trực tiếp với database.

Spring Data JPA tự sinh SQL.

Ví dụ:

```java
userRepository.findAll()
```

Spring tự sinh:

```sql
SELECT * FROM Users
```

---

# 7. Service là gì?

Service chứa nghiệp vụ.

Ví dụ:

Khi đăng ký:

* kiểm tra email
* mã hóa password
* lưu database

Logic này nằm trong Service.

---

# 8. Controller là gì?

Controller nhận HTTP Request.

Ví dụ:

```java
@GetMapping
```

Nhận:

```http
GET /api/v1/users
```

Trả về:

```json
[
 {
   "userId":1,
   "fullName":"Admin"
 }
]
```

---

# 9. CRUD là gì?

CRUD =

Create

Read

Update

Delete

---

POST

↓

Create

GET

↓

Read

PUT

↓

Update

DELETE

↓

Delete

---

# 10. API là gì?

API là cầu nối giữa Frontend và Backend.

Frontend:

```javascript
axios.get("/api/v1/users")
```

Backend:

```java
@GetMapping
```

---

# 11. User API chi tiết

# GET ALL USERS

```http
GET
/api/v1/users
```

Controller:

```java
@GetMapping
public List<User> getAll()
```

Chức năng:

Lấy toàn bộ user.

---

# GET USER BY ID

```http
GET
/api/v1/users/1
```

Chức năng:

Lấy user theo ID.

---

# CREATE USER

```http
POST
/api/v1/users
```

Body:

```json
{
  "fullName":"Admin",
  "email":"admin@gmail.com",
  "password":"123456"
}
```

Chức năng:

Thêm user mới.

---

# UPDATE USER

```http
PUT
/api/v1/users/1
```

Body:

```json
{
  "fullName":"New Name"
}
```

Chức năng:

Cập nhật thông tin.

---

# DELETE USER

```http
DELETE
/api/v1/users/1
```

Chức năng:

Xóa user.

---

# 12. Horse API chi tiết

# GET HORSES

```http
GET
/api/v1/horses
```

---

# GET HORSE BY ID

```http
GET
/api/v1/horses/1
```

---

# CREATE HORSE

```http
POST
/api/v1/horses
```

Body:

```json
{
  "horseName":"Special Week",
  "breed":"Thoroughbred",
  "age":4,
  "pace":"MID_PACK",
  "speed":"85",
  "stamina":"90"
}
```

---

# UPDATE HORSE

```http
PUT
/api/v1/horses/1
```

---

# DELETE HORSE

```http
DELETE
/api/v1/horses/1
```

---

# 13. Register hoạt động như thế nào?

API:

```http
POST
/api/auth/register
```

Body:

```json
{
  "fullName":"Trainer",
  "email":"trainer@gmail.com",
  "password":"123456",
  "role":"HORSE_OWNER"
}
```

Flow:

B1:

Kiểm tra email tồn tại.

```java
findByEmail()
```

B2:

Mã hóa password.

```java
passwordEncoder.encode()
```

B3:

Lưu database.

```java
save()
```

B4:

Trả về:

```text
Register Success
```

---

# 14. Login hoạt động như thế nào?

API:

```http
POST
/api/auth/login
```

Body:

```json
{
  "email":"trainer@gmail.com",
  "password":"123456"
}
```

Flow:

B1

Tìm user.

```java
findByEmail()
```

B2

So sánh password.

```java
passwordEncoder.matches()
```

B3

Tạo JWT.

```java
jwtUtil.generateToken()
```

B4

Trả về:

```json
{
 "token":"eyJhb..."
}
```

---

# 15. BCrypt là gì?

Mentor rất hay hỏi câu này.

Password nhập:

```text
123456
```

Database lưu:

```text
$2a$10$Hdk29....
```

Tại sao?

Vì BCrypt mã hóa password.

Nếu hacker lấy được database vẫn khó biết password thật.

---

# 16. JWT là gì?

JWT = Json Web Token

Sau khi login:

```java
jwtUtil.generateToken()
```

Sinh token.

Ví dụ:

```text
eyJhbGciOiJIUzI1NiJ9...
```

Frontend lưu token.

Các request sau gửi token để xác thực.

---

# 17. Tại sao dùng JWT?

Không cần Session.

Nhẹ.

Phù hợp REST API.

Dùng phổ biến trong Spring Boot.

---

# 18. SecurityConfig dùng để làm gì?

File:

```java
SecurityConfig.java
```

Chức năng:

* cấu hình bảo mật
* cấu hình CORS
* cho phép API public

Ví dụ:

```java
.requestMatchers("/api/auth/**")
.permitAll()
```

---

# 19. CORS là gì?

Frontend:

```text
localhost:5173
```

Backend:

```text
localhost:8080
```

Khác domain.

Browser chặn.

CORS cho phép frontend gọi backend.

---

# 20. Cách test API bằng Postman

B1

Run Spring Boot

B2

Mở Postman

B3

Test Register

```http
POST
/api/auth/register
```

B4

Test Login

```http
POST
/api/auth/login
```

B5

Copy token

B6

Test CRUD APIs

---

# 21. GitHub

Quy trình push code:

GitHub Desktop

↓

Commit

↓

Publish Branch

↓

Push Origin

↓

GitHub Repository

---

# 22. Nếu mentor hỏi em làm phần nào?

Em phụ trách:

* Thiết kế database
* Entity
* Repository
* Service
* Controller
* User CRUD
* Horse CRUD
* Register/Login
* BCrypt
* JWT
* Testing API bằng Postman
* Push GitHub

---

# 23. Câu trả lời demo 1 phút

"Backend của nhóm em sử dụng Spring Boot, SQL Server và Spring Security.

Em thiết kế database gồm bảng Users và Horse, sau đó xây dựng kiến trúc Controller-Service-Repository.

Em triển khai đầy đủ CRUD cho User và Horse.

Ngoài ra em xây dựng chức năng Register/Login, mã hóa mật khẩu bằng BCrypt và tạo JWT Token sau khi đăng nhập thành công.

Tất cả API đã được kiểm thử bằng Postman và source code được quản lý trên GitHub."
