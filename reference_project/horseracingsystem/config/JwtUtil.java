package com.equix.horseracingsystem.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    // Khóa bí mật đảm bảo độ dài tối thiểu an toàn cho thuật toán mã hóa HS256
    private static final String SECRET =
            "mysecretkeymysecretkeymysecretkeymysecretkey_super_secret_key_2026";

    private final SecretKey key =
            Keys.hmacShaKeyFor(SECRET.getBytes());

    // Sinh Token dựa theo trường Email đăng nhập của người dùng
    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(
                        new Date(System.currentTimeMillis() + 86400000) // Thời hạn 1 ngày (86,400,000 ms)
                )
                .signWith(key)
                .compact();
    }

    // Đổi tên từ extractUsername sang getEmailFromToken để khớp với JwtAuthenticationFilter
    public String getEmailFromToken(String token) {
        return extractAllClaims(token).getSubject();
    }

    // Đổi tên từ isTokenValid sang validateToken để khớp với bộ lọc Security Filter
    public boolean validateToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            // Kiểm tra xem hạn dùng của token còn nằm sau thời điểm hiện tại hay không
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            // Token sai cấu trúc, hết hạn hoặc bị chỉnh sửa trái phép sẽ rơi vào đây
            return false;
        }
    }

    // Bóc tách toàn bộ Payload Claims từ chuỗi mã hóa JWT
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}