package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.dto.ApiResponseWrapper;
import com.equix.horseracingsystem.dto.AuditLogResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditLogService {
    ApiResponseWrapper<Page<AuditLogResponse>> getAuditLogs(String entityType, Long userId, Pageable pageable);

    // Hàm hỗ trợ ghi log tự động bắt IP và User-Agent tiện lợi
    void logAction(String action, String entityType, Long entityId,
                   String beforeValue, String afterValue,
                   String userEmail, HttpServletRequest request);
}