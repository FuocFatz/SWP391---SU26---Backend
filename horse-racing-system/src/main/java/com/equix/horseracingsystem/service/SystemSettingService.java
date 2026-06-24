package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.dto.ApiResponseWrapper;
import com.equix.horseracingsystem.dto.SystemSettingResponse;

import java.util.List;

public interface SystemSettingService {
    ApiResponseWrapper<List<SystemSettingResponse>> getAllSettings();
    ApiResponseWrapper<SystemSettingResponse> getSettingByKey(String key);
    ApiResponseWrapper<SystemSettingResponse> updateSetting(String key, String value);
}