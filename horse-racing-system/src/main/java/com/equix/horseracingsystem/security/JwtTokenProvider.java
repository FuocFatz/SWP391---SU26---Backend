package com.equix.horseracingsystem.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {

    // 1. Thay đổi Key thành SecretKey và sử dụng chuỗi ký tự cố định giống JwtUtil để đồng bộ ký & giải mã
    private static final String SECRET = "mysecretkeymysecretkeymysecretkeymysecretkey_super_secret_key_2026";
    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());

    @Value("${app.jwtExpirationInMs:86400000}") // Mặc định 1 ngày
    private long jwtExpirationInMs;

    // Tạo JWT từ thông tin đăng nhập thành công
    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        // 2. Sửa cú pháp sinh Token mới theo chuẩn jjwt 0.12.x (dùng subject(), signWith(key) không cần truyền thuật toán thủ công)
        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    // Lấy username/email từ chuỗi Token JWT
    public String getUsernameFromJWT(String token) {
        // 3. Sử dụng cú pháp parser() mới đã sửa lỗi biên dịch triệt để
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    // Kiểm tra tính hợp lệ của Token
    public boolean validateToken(String authToken) {
        try {
            // 4. Đồng bộ hóa cú pháp kiểm tra tính hợp lệ của Token
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            // Token hết hạn, sai cấu trúc hoặc chữ ký không hợp lệ sẽ rơi vào đây
        }
        return false;
    }
}