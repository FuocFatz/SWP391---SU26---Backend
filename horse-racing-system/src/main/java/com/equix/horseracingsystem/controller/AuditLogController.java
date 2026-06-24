package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.ApiResponseWrapper;
import com.equix.horseracingsystem.dto.AuditLogResponse;
import com.equix.horseracingsystem.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/audit-logs")
@CrossOrigin("*")
@RequiredArgsConstructor
@Tag(name = "1.1. Audit Logs", description = "Endpoints xem nhật ký kiểm toán hệ thống dành riêng cho Admin")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @Operation(summary = "Xem danh sách nhật ký hệ thống (Admin only)", description = "Hỗ trợ phân trang và bộ lọc nâng cao.")
    public ResponseEntity<ApiResponseWrapper<Page<AuditLogResponse>>> getAuditLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long userId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(auditLogService.getAuditLogs(entityType, userId, pageable));
    }
}