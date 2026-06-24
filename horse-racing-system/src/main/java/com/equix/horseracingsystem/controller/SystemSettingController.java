package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.ApiResponseWrapper;
import com.equix.horseracingsystem.dto.SystemSettingResponse;
import com.equix.horseracingsystem.service.SystemSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/system-settings")
@CrossOrigin("*")
@RequiredArgsConstructor
@Tag(name = "1. System Settings", description = "Quản lý các thông số cấu hình vận hành hệ thống")
public class SystemSettingController {

    private final SystemSettingService settingService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả các cài đặt hệ thống")
    public ResponseEntity<ApiResponseWrapper<List<SystemSettingResponse>>> getAllSettings() {
        return ResponseEntity.ok(settingService.getAllSettings());
    }

    @GetMapping("/{key}")
    @Operation(summary = "Lấy giá trị của một cấu hình cụ thể thông qua setting_key")
    public ResponseEntity<ApiResponseWrapper<SystemSettingResponse>> getSettingByKey(@PathVariable String key) {
        return ResponseEntity.ok(settingService.getSettingByKey(key));
    }

    @PutMapping("/{key}")
    @Operation(summary = "Cập nhật giá trị cấu hình hệ thống", description = "Yêu cầu quyền: ADMIN")
    public ResponseEntity<ApiResponseWrapper<SystemSettingResponse>> updateSetting(
            @PathVariable String key,
            @RequestParam String value) {
        return ResponseEntity.ok(settingService.updateSetting(key, value));
    }
}