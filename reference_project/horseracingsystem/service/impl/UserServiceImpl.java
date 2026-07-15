package com.equix.horseracingsystem.service.impl;

import com.equix.horseracingsystem.constant.UserRole;
import com.equix.horseracingsystem.constant.UserStatus;
import com.equix.horseracingsystem.dto.ApiResponseWrapper;
import com.equix.horseracingsystem.dto.UserProfileUpdateRequest;
import com.equix.horseracingsystem.dto.UserResponse;
import com.equix.horseracingsystem.dto.UserStatusUpdateRequest;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.UserRepository;
import com.equix.horseracingsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public ApiResponseWrapper<UserResponse> getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin tài khoản hiện tại."));
        return ApiResponseWrapper.success("Lấy thông tin cá nhân thành công!", mapToResponse(user));
    }

    @Override
    @Transactional
    public ApiResponseWrapper<UserResponse> updateUserProfile(String email, UserProfileUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin tài khoản cần cập nhật."));

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        user.setUpdatedAt(LocalDateTime.now());

        User updated = userRepository.save(user);
        return ApiResponseWrapper.success("Cập nhật thông tin hồ sơ thành công!", mapToResponse(updated));
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponseWrapper<Page<UserResponse>> getAllUsers(String role, String status, Pageable pageable) {
        UserRole enumRole = null;
        UserStatus enumStatus = null;

        try {
            if (role != null && !role.isBlank()) enumRole = UserRole.valueOf(role.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return ApiResponseWrapper.error("Tham số lọc quyền tài khoản 'role' gửi lên không hợp lệ.");
        }

        try {
            if (status != null && !status.isBlank()) enumStatus = UserStatus.valueOf(status.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return ApiResponseWrapper.error("Tham số lọc trạng thái tài khoản 'status' gửi lên không hợp lệ.");
        }

        Page<User> userPage = userRepository.findByRoleAndStatus(enumRole, enumStatus, pageable);
        Page<UserResponse> responsePage = userPage.map(this::mapToResponse);

        return ApiResponseWrapper.success("Lấy danh sách người dùng thành công!", responsePage);
    }

    @Override
    @Transactional
    public ApiResponseWrapper<UserResponse> updateUserStatus(Long id, UserStatusUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng có ID yêu cầu: " + id));

        try {
            UserStatus targetStatus = UserStatus.valueOf(request.getStatus().toUpperCase().trim());
            user.setStatus(targetStatus);
            user.setUpdatedAt(LocalDateTime.now());

            User updated = userRepository.save(user);
            return ApiResponseWrapper.success("Cập nhật trạng thái tài khoản thành công!", mapToResponse(updated));
        } catch (IllegalArgumentException e) {
            return ApiResponseWrapper.error("Trạng thái chuyển đổi không hợp lệ. Chỉ chấp nhận: VERIFIED, SUSPENDED, TERMINATED.");
        }
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .rewardPoints(user.getRewardPoints())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }
}