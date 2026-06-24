package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, Integer> {
    // Tìm kiếm cấu hình thông qua chuỗi Key độc nhất
    Optional<SystemSetting> findBySettingKey(String settingKey);
}