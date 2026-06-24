package com.equix.horseracingsystem.config;

import com.equix.horseracingsystem.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // BẮT BUỘC có annotation này nếu sau này bạn muốn dùng @PreAuthorize("hasRole('HORSE_OWNER')") trên hàm
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Vô hiệu hóa CSRF vì dùng Stateless JWT
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 1. Các đường dẫn mở công khai công cộng
                        .requestMatchers("/api/v1/auth/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                        // 2. Phân quyền cho Phân Hệ 1: Cài đặt hệ thống
                        .requestMatchers(HttpMethod.GET, "/api/v1/system-settings/**").permitAll() // Cho phép công khai đọc cấu hình
                        .requestMatchers(HttpMethod.PUT, "/api/v1/system-settings/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/audit-logs").hasRole("ADMIN")

                        // 3. Phân quyền cho Phân Hệ 2: Quản lý người dùng
                        .requestMatchers(HttpMethod.GET, "/api/v1/users/profile").authenticated() // Đã đăng nhập là xem được profile của mình
                        .requestMatchers(HttpMethod.PUT, "/api/v1/users/profile").authenticated() // Đã đăng nhập là tự update được profile
                        .requestMatchers(HttpMethod.GET, "/api/v1/users").hasRole("ADMIN")        // Chỉ ADMIN xem danh sách User
                        .requestMatchers(HttpMethod.PUT, "/api/v1/users/*/status").hasRole("ADMIN") // Chỉ ADMIN mới duyệt/khóa User

                        // 4. Phân quyền chi tiết cho module Horse
                        .requestMatchers(HttpMethod.POST, "/api/v1/horses").hasRole("HORSE_OWNER")
                        .requestMatchers("/api/v1/horses/my-horses").hasRole("HORSE_OWNER")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/horses/**").hasAnyRole("HORSE_OWNER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/horses/**").authenticated() // Đăng nhập bất kỳ role nào cũng được xem chi tiết

                        // 5. Chặn tất cả các trường hợp còn lại
                        .anyRequest().authenticated()
                );

        // QUAN TRỌNG NHẤT: Add JwtAuthenticationFilter chạy TRƯỚC UsernamePasswordAuthenticationFilter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}