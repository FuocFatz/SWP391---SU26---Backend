package com.equix.horseracingsystem.service.impl;

import com.equix.horseracingsystem.dto.ApiResponseWrapper;
import com.equix.horseracingsystem.dto.AuditLogResponse;
import com.equix.horseracingsystem.entity.AuditLog;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.AuditLogRepository;
import com.equix.horseracingsystem.repository.UserRepository;
import com.equix.horseracingsystem.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public ApiResponseWrapper<Page<AuditLogResponse>> getAuditLogs(String entityType, Long userId, Pageable pageable) {
        Page<AuditLog> logPage;

        if (entityType != null && !entityType.trim().isEmpty()) {
            logPage = auditLogRepository.findByEntityType(entityType.trim().toUpperCase(), pageable);
        } else if (userId != null) {
            logPage = auditLogRepository.findByUserId(userId, pageable);
        } else {
            logPage = auditLogRepository.findAll(pageable);
        }

        Page<AuditLogResponse> responsePage = logPage.map(this::mapToResponse);
        return ApiResponseWrapper.success("Lấy danh sách nhật ký hệ thống thành công!", responsePage);
    }

    @Override
    @Transactional
    public void logAction(String action, String entityType, Long entityId,
                          String beforeValue, String afterValue,
                          String userEmail, HttpServletRequest request) {

        User user = userRepository.findByEmail(userEmail).orElse(null);

        AuditLog auditLog = new AuditLog();
        auditLog.setUser(user);
        auditLog.setUserRole(user != null ? user.getRole().name() : "ANONYMOUS");
        auditLog.setAction(action.toUpperCase());
        auditLog.setEntityType(entityType.toUpperCase());
        auditLog.setEntityId(entityId);
        auditLog.setBeforeValue(beforeValue);
        auditLog.setAfterValue(afterValue);

        // Trích xuất tự động IP và Trình duyệt người dùng gửi lên
        if (request != null) {
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getRemoteAddr();
            }
            auditLog.setIpAddress(ip);
            auditLog.setUserAgent(request.getHeader("User-Agent"));
        }

        auditLog.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .userEmail(log.getUser() != null ? log.getUser().getEmail() : "System/Anonymous")
                .userRole(log.getUserRole())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .beforeValue(log.getBeforeValue())
                .afterValue(log.getAfterValue())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .createdAt(log.getCreatedAt())
                .build();
    }
}