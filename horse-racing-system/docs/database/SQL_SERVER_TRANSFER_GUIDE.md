# Chuyển EquiX sang máy khác

Project chỉ còn một cấu hình runtime tại `src/main/resources/application.properties` và mặc định kết nối:

- SQL Server: `localhost:1433`
- Database: `EquiX`
- Login: `equix_user`
- Password: `123456`

> Mật khẩu này chỉ phù hợp cho demo cục bộ. Hãy thay đổi trước khi triển khai thật.

## 1. Backup database trên máy nguồn

Trong SQL Server Management Studio:

1. Nhấp phải database `EquiX`.
2. Chọn **Tasks → Back Up...**.
3. Chọn loại **Full** và xuất file `EquiX.bak`.
4. Chép `EquiX.bak` cùng project sang máy đích.

Không nên đặt file `.bak` lâu dài trong Git vì file có thể lớn và chứa dữ liệu thật.

## 2. Restore database trên máy đích

Máy đích phải cài SQL Server 2019 hoặc phiên bản tương thích và bật TCP/IP cho cổng 1433.

Trong SQL Server Management Studio:

1. Nhấp phải **Databases → Restore Database...**.
2. Chọn **Device**, trỏ tới `EquiX.bak`.
3. Restore với tên database chính xác là `EquiX`.

## 3. Tạo tài khoản kết nối

Mở và chạy toàn bộ file `create-equix-login.sql` bằng tài khoản quản trị SQL Server. Script sẽ tạo hoặc cập nhật login `equix_user` và cấp quyền đọc/ghi trên database `EquiX`.

Đảm bảo SQL Server bật **SQL Server and Windows Authentication mode**, sau đó restart dịch vụ SQL Server nếu vừa thay đổi chế độ xác thực.

## 4. Chạy project

Trước lần chạy đầu tiên sau khi restore, mở SSMS bằng tài khoản quản trị và chạy các file trong `docs/database/migrations` theo thứ tự tên file. Đặc biệt, `V20260720_08_race_note_constraints.sql` đồng bộ Nhật ký sự cố/Báo cáo trọng tài và `V20260720_09_tournament_status_constraint.sql` đồng bộ trạng thái Mở/Đóng giải đấu. Login `equix_user` chỉ có quyền đọc/ghi nên không tự thay đổi cấu trúc bảng lúc khởi động.

Backend tự đọc cấu hình duy nhất từ `application.properties`:

```powershell
.\mvnw.cmd spring-boot:run
```

Frontend:

```powershell
cd equix-frontend
npm install
npm run dev
```

Nếu SQL Server dùng instance hoặc cổng khác, không cần sửa source code. Chỉ đặt biến môi trường trước khi chạy:

```powershell
$env:EQUIX_DB_URL='jdbc:sqlserver://localhost:1433;databaseName=EquiX;encrypt=true;trustServerCertificate=true'
$env:EQUIX_DB_USERNAME='equix_user'
$env:EQUIX_DB_PASSWORD='123456'
.\mvnw.cmd spring-boot:run
```

## 5. Cấu hình test

File `src/test/resources/application-test.properties` sử dụng H2 tạm thời chỉ khi chạy automated tests. Nó không phải cấu hình runtime và không thay thế database SQL Server `EquiX`.
