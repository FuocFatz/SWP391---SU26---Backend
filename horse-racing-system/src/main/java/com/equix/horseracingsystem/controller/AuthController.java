package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.ApiResponseWrapper;
import com.equix.horseracingsystem.dto.AuthResponse;
import com.equix.horseracingsystem.dto.LoginRequest;
import com.equix.horseracingsystem.dto.RegisterRequest;
import com.equix.horseracingsystem.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin("*")
@Tag(name = "1. Authentication", description = "Endpoints xử lý Đăng ký tài khoản và Đăng nhập hệ thống")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(
            summary = "Đăng ký tài khoản mới",
            description = "Tạo một tài khoản thành viên mới trong hệ thống. Trạng thái mặc định ban đầu của tài khoản sẽ là PENDING (Chờ Admin phê duyệt)."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Đăng ký tài khoản thành công",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponseWrapper.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Yêu cầu không hợp lệ (Trùng Email, dữ liệu đầu vào không đúng định dạng...)",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponseWrapper.class)
                    )
            )
    })
    @SecurityRequirements // Loại bỏ yêu cầu gán Bearer Token cho API công khai này
    @PostMapping("/register")
    public ResponseEntity<ApiResponseWrapper<AuthResponse>> register(@RequestBody RegisterRequest request) {
        ApiResponseWrapper<AuthResponse> response = authService.register(request);
        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Đăng nhập hệ thống",
            description = "Xác thực tài khoản người dùng bằng Email và Mật khẩu. Trả về chuỗi JWT Bearer Token nếu tài khoản hợp lệ và đã ở trạng thái VERIFIED."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Xác thực thành công",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponseWrapper.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Xác thực thất bại (Sai mật khẩu hoặc Tài khoản đang ở trạng thái PENDING/SUSPENDED)",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponseWrapper.class)
                    )
            )
    })
    @SecurityRequirements // Loại bỏ yêu cầu gán Bearer Token cho API đăng nhập công khai này
    @PostMapping("/login")
    public ResponseEntity<ApiResponseWrapper<AuthResponse>> login(@RequestBody LoginRequest request) {
        ApiResponseWrapper<AuthResponse> response = authService.login(request);
        if (!response.isSuccess()) {
            // Trả về HTTP Status 401 Unauthorized khi đăng nhập thất bại
            return ResponseEntity.status(401).body(response);
        }
        return ResponseEntity.ok(response);
    }
}