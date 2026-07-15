package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.entity.SystemSetting;
import com.equix.horseracingsystem.repository.SystemSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@SuppressWarnings("null")
public class SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;

    public SystemSettingService(SystemSettingRepository systemSettingRepository) {
        this.systemSettingRepository = systemSettingRepository;
    }

    public List<SystemSetting> getAllSettings() {
        return systemSettingRepository.findAll();
    }

    public SystemSetting getSettingById(Integer id) {
        return systemSettingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Setting not found: " + id));
    }

    public SystemSetting getSettingByKey(String key) {
        return systemSettingRepository.findBySettingKey(key)
                .orElseThrow(() -> new RuntimeException("Setting key not found: " + key));
    }

    public SystemSetting createSetting(SystemSetting setting) {
        return systemSettingRepository.save(setting);
    }

    public SystemSetting updateSetting(Integer id, SystemSetting settingDetails) {
        SystemSetting existing = getSettingById(id);
        existing.setSettingValue(settingDetails.getSettingValue());
        existing.setDescription(settingDetails.getDescription());
        return systemSettingRepository.save(existing);
    }
}
