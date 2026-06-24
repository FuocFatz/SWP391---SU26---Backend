package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.ApiResponseWrapper;
import com.equix.horseracingsystem.dto.UserProfileUpdateRequest;
import com.equix.horseracingsystem.dto.UserResponse;
import com.equix.horseracingsystem.dto.UserStatusUpdateRequest;
import com.equix.horseracingsystem.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin("*")
@RequiredArgsConstructor
@Tag(name = "2. User Management", description = "Endpoints quản lý thông tin tài khoản và cấu hình phân quyền")
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    @Operation(summary = "Lấy chi tiết thông tin cá nhân", description = "Yêu cầu: Đã đăng nhập (Lấy thông tin dựa theo Token)")
    public ResponseEntity<ApiResponseWrapper<UserResponse>> getCurrentUserProfile(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.getCurrentUserProfile(email));
    }

    @PutMapping("/profile")
    @Operation(summary = "Cập nhật thông tin cá nhân", description = "Yêu cầu: Đã đăng nhập (Chỉ sửa full_name, phone, avatar_url)")
    public ResponseEntity<ApiResponseWrapper<UserResponse>> updateUserProfile(
            Authentication authentication,
            @Valid @RequestBody UserProfileUpdateRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.updateUserProfile(email, request));
    }

    @GetMapping
    @Operation(summary = "Lấy toàn bộ danh sách người dùng (Admin only)", description = "Hỗ trợ phân trang, lọc theo role hoặc status")
    public ResponseEntity<ApiResponseWrapper<Page<UserResponse>>> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(userService.getAllUsers(role, status, pageable));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Duyệt hoặc khóa tài khoản (Admin only)", description = "Cập nhật trạng thái tài khoản: VERIFIED, SUSPENDED, TERMINATED")
    public ResponseEntity<ApiResponseWrapper<UserResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UserStatusUpdateRequest request) {
        return ResponseEntity.ok(userService.updateUserStatus(id, request));
    }
}