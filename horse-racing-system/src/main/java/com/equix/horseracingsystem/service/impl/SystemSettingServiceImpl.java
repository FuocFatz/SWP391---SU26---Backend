package com.equix.horseracingsystem.service.impl;

import com.equix.horseracingsystem.dto.ApiResponseWrapper;
import com.equix.horseracingsystem.dto.SystemSettingResponse;
import com.equix.horseracingsystem.entity.SystemSetting;
import com.equix.horseracingsystem.repository.SystemSettingRepository;
import com.equix.horseracingsystem.service.AuditLogService;
import com.equix.horseracingsystem.service.SystemSettingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SystemSettingServiceImpl implements SystemSettingService {

    private final SystemSettingRepository settingRepository;
    private final AuditLogService auditLogService;

    @Autowired
    private HttpServletRequest request;

    @Override
    @Transactional(readOnly = true)
    public ApiResponseWrapper<List<SystemSettingResponse>> getAllSettings() {
        List<SystemSetting> settings = settingRepository.findAll();
        List<SystemSettingResponse> responseList = settings.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ApiResponseWrapper.success("Lấy danh sách cấu hình hệ thống thành công!", responseList);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponseWrapper<SystemSettingResponse> getSettingByKey(String key) {
        SystemSetting setting = settingRepository.findBySettingKey(key)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cấu hình với key: " + key));
        return ApiResponseWrapper.success("Lấy thông tin cấu hình thành công!", mapToResponse(setting));
    }

    @Override
    @Transactional
    public ApiResponseWrapper<SystemSettingResponse> updateSetting(String key, String value) {
        SystemSetting setting = settingRepository.findBySettingKey(key)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cấu hình với key: " + key));

        String adminEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        String beforeValue = setting.getSettingValue();

        setting.setSettingValue(value);
        setting.setUpdatedAt(LocalDateTime.now());
        SystemSetting updated = settingRepository.save(setting);

        // GỌI GHI LOG THEO CẤU TRÚC ĐÚNG MỚI:
        auditLogService.logAction(
                "UPDATE_SETTING",
                "SYSTEM_SETTING",
                Long.valueOf(updated.getId()),
                beforeValue,
                value,
                adminEmail,
                request
        );

        return ApiResponseWrapper.success("Cập nhật giá trị cấu hình thành công!", mapToResponse(updated));
    }

    private SystemSettingResponse mapToResponse(SystemSetting setting) {
        return SystemSettingResponse.builder()
                .id(setting.getId())
                .settingKey(setting.getSettingKey())
                .settingValue(setting.getSettingValue())
                .description(setting.getDescription())
                .updatedAt(setting.getUpdatedAt())
                .build();
    }


}