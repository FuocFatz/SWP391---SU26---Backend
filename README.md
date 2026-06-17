# 🏇 Horse Racing System Backend

## 1. Giới thiệu

Horse Racing System là hệ thống quản lý đua ngựa được phát triển bằng Spring Boot.

Mục tiêu của project:

* Quản lý người dùng (User Management)
* Quản lý ngựa đua (Horse Management)
* Xây dựng REST API
* Xác thực người dùng bằng JWT
* Mã hóa mật khẩu bằng BCrypt
* Kết nối SQL Server

---

# 2. Công nghệ sử dụng

## Backend

* Java 17
* Spring Boot 3
* Spring Security
* Spring Data JPA
* Hibernate
* Maven
* JWT (Json Web Token)
* Lombok

## Database

* Microsoft SQL Server

## Công cụ hỗ trợ

* IntelliJ IDEA
* GitHub Desktop
* Postman
* SQL Server Management Studio (SSMS)

---

# 3. Cấu trúc Project

```text
src/main/java/com/equix/horseracingsystem

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
├── security
│   └── JwtUtil
│
├── config
│   └── SecurityConfig
│
└── dto
    ├── LoginRequest
    ├── RegisterRequest
    └── AuthResponse
```

---

# 4. Thiết kế Database

## Users Table

| Column     | Type     |
| ---------- | -------- |
| user_id    | BIGINT   |
| full_name  | VARCHAR  |
| email      | VARCHAR  |
| password   | VARCHAR  |
| phone      | VARCHAR  |
| role       | VARCHAR  |
| status     | VARCHAR  |
| created_at | DATETIME |

### Ý nghĩa

* email dùng để đăng nhập.
* password được mã hóa bằng BCrypt.
* role xác định quyền người dùng.
* status xác định trạng thái tài khoản.

---

## Horse Table

| Column     | Type    |
| ---------- | ------- |
| horse_id   | BIGINT  |
| horse_name | VARCHAR |
| breed      | VARCHAR |
| age        | INT     |
| color      | VARCHAR |
| owner_id   | BIGINT  |
| jockey_id  | BIGINT  |
| pace       | VARCHAR |
| speed      | VARCHAR |
| stamina    | VARCHAR |

### Ý nghĩa

pace:

* FRONT_RUNNER
* MID_PACK
* CLOSER

speed:

* Chỉ số tốc độ

stamina:

* Chỉ số thể lực

---

# 5. Các bước thực hiện

## Bước 1: Tạo Spring Boot Project

Dependencies:

* Spring Web
* Spring Data JPA
* Spring Security
* Validation
* Lombok
* SQL Server Driver

---

## Bước 2: Kết nối Database

application.properties

```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=HorseRacingDB;encrypt=true;trustServerCertificate=true

spring.datasource.username=sa
spring.datasource.password=your_password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

---

## Bước 3: Tạo Entity

### User Entity

Chức năng:

Ánh xạ bảng Users trong SQL Server sang Java Object.

Ví dụ:

```java
@Entity
@Table(name = "Users")
public class User {
}
```

---

### Horse Entity

Chức năng:

Ánh xạ bảng Horse trong SQL Server sang Java Object.

---

## Bước 4: Tạo Repository

Ví dụ:

```java
public interface UserRepository
        extends JpaRepository<User, Long> {
}
```

Mục đích:

* CRUD tự động
* Không cần viết SQL thủ công

---

## Bước 5: Tạo Service

Mục đích:

Chứa business logic.

Ví dụ:

```java
public User create(User user){
    return userRepository.save(user);
}
```

---

## Bước 6: Tạo Controller

Mục đích:

Nhận request từ client.

Ví dụ:

```java
@GetMapping
public List<User> getAll(){
    return userService.getAll();
}
```

---

# 6. CRUD APIs

## User APIs

### GET ALL USERS

```http
GET /api/v1/users
```

Mục đích:

Lấy toàn bộ user.

---

### GET USER BY ID

```http
GET /api/v1/users/{id}
```

Ví dụ:

```http
GET /api/v1/users/1
```

---

### CREATE USER

```http
POST /api/v1/users
```

Body:

```json
{
  "fullName":"Trainer",
  "email":"trainer@gmail.com",
  "password":"123456",
  "phone":"090123456",
  "role":"ADMIN",
  "status":"ACTIVE"
}
```

---

### UPDATE USER

```http
PUT /api/v1/users/1
```

---

### DELETE USER

```http
DELETE /api/v1/users/1
```

---

# 7. Horse APIs

## GET ALL HORSES

```http
GET /api/v1/horses
```

---

## GET HORSE BY ID

```http
GET /api/v1/horses/1
```

---

## CREATE HORSE

```http
POST /api/v1/horses
```

Body:

```json
{
  "horseName":"Special Week",
  "breed":"Thoroughbred",
  "age":4,
  "color":"Brown",
  "ownerId":1,
  "jockeyId":2,
  "pace":"MID_PACK",
  "speed":"85",
  "stamina":"90"
}
```

---

## UPDATE HORSE

```http
PUT /api/v1/horses/1
```

---

## DELETE HORSE

```http
DELETE /api/v1/horses/1
```

---

# 8. Authentication

## Register

Endpoint:

```http
POST /api/auth/register
```

Ví dụ:

```json
{
  "fullName":"Trainer",
  "email":"trainer@umamusume.com",
  "password":"123456",
  "phone":"0901111111",
  "role":"HORSE_OWNER"
}
```

### Giải thích

Khi đăng ký:

```java
passwordEncoder.encode(password)
```

Password sẽ được mã hóa BCrypt trước khi lưu database.

Ví dụ:

```text
123456
```

sẽ thành:

```text
$2a$10$....
```

Mục đích:

Tăng bảo mật.

---

## Login

Endpoint:

```http
POST /api/auth/login
```

Body:

```json
{
  "email":"trainer@umamusume.com",
  "password":"123456"
}
```

### Luồng xử lý

Bước 1:

Tìm user theo email.

```java
findByEmail()
```

Bước 2:

So sánh mật khẩu.

```java
passwordEncoder.matches()
```

Bước 3:

Sinh JWT Token.

```java
jwtUtil.generateToken()
```

Bước 4:

Trả token về client.

Ví dụ:

```json
{
  "token":"eyJhbGciOiJIUzI1NiJ9..."
}
```

---

# 9. JWT

## JwtUtil

Chức năng:

* Tạo JWT Token
* Thiết lập thời gian hết hạn 24 giờ

Ví dụ:

```java
String token =
        jwtUtil.generateToken(
                user.getEmail()
        );
```

---

# 10. Cách Test API

## Bước 1

Chạy project:

```bash
mvn spring-boot:run
```

---

## Bước 2

Mở Postman.

---

## Bước 3

Test Register.

```http
POST
http://localhost:8080/api/auth/register
```

---

## Bước 4

Test Login.

```http
POST
http://localhost:8080/api/auth/login
```

Nếu thành công:

```json
{
  "token":"eyJhbGciOiJIUzI1NiJ9..."
}
```

---

## Bước 5

Test CRUD APIs.

Ví dụ:

```http
GET
http://localhost:8080/api/v1/users
```

---

# 11. Kết quả đạt được

✔ Kết nối SQL Server thành công

✔ CRUD User hoàn chỉnh

✔ CRUD Horse hoàn chỉnh

✔ Register thành công

✔ Login thành công

✔ BCrypt Password Encoding

✔ JWT Token Generation

✔ Testing bằng Postman

✔ Push source code lên GitHub

---

# 12. GitHub Repository

Repository:

https://github.com/FuocFatz/SWP391---SU26---Backend

---

# Tác giả

SWP391 - SU26

Horse Racing System Backend Project
