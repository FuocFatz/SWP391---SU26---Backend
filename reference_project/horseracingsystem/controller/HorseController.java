package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.ApiResponseWrapper;
import com.equix.horseracingsystem.dto.HorseRequest;
import com.equix.horseracingsystem.dto.HorseResponse;
import com.equix.horseracingsystem.service.HorseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/horses")
@CrossOrigin("*")
@RequiredArgsConstructor
@Tag(name = "2. Horse Management", description = "Endpoints quản lý thông tin và trạng thái chiến mã")
public class HorseController {

    private final HorseService horseService;

    @PostMapping
    @Operation(summary = "Đăng ký chiến mã mới", description = "Yêu cầu quyền: HORSE_OWNER")
    public ResponseEntity<ApiResponseWrapper<HorseResponse>> createHorse(@RequestBody HorseRequest request, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(horseService.createHorse(request, email));
    }

    @GetMapping("/my-horses")
    @Operation(summary = "Xem danh sách ngựa của tôi", description = "Yêu cầu quyền: HORSE_OWNER")
    public ResponseEntity<ApiResponseWrapper<List<HorseResponse>>> getMyHorses(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(horseService.getMyHorses(email));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem thông tin chi tiết một con ngựa", description = "Yêu cầu quyền: Mọi tài khoản đã xác thực")
    public ResponseEntity<ApiResponseWrapper<HorseResponse>> getHorseById(@PathVariable Long id) {
        return ResponseEntity.ok(horseService.getHorseById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật các thông số/trạng thái chiến mã", description = "Yêu cầu quyền: ADMIN hoặc chính CHỦ NGỰA sở hữu")
    public ResponseEntity<ApiResponseWrapper<HorseResponse>> updateHorse(@PathVariable Long id, @RequestBody HorseRequest request, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(horseService.updateHorse(id, request, email));
    }
}