package com.equix.horseracingsystem.security;

import com.equix.horseracingsystem.constant.UserStatus;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Hệ thống của bạn đang đăng nhập bằng Email thông qua AuthController
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Kiểm tra ràng buộc TRẠNG THÁI tài khoản theo quy chuẩn
        if (user.getStatus() != UserStatus.VERIFIED) {
            throw new DisabledException("Access Denied: Your account status is " + user.getStatus()
                    + ". Please wait for Admin verification.");
        }

        // Trả về đối tượng UserDetails chuẩn của Spring Security
        // Lưu ý: Thêm tiền tố "ROLE_" vào trước quyền hạn để hoạt động chính xác với .hasRole()
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(), // Sử dụng password_hash từ DB mới
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }
}