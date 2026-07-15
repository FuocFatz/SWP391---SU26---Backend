package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.SystemSetting;
import com.equix.horseracingsystem.service.SystemSettingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/system-settings")
@CrossOrigin("*")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "System Settings", description = "Global system configuration")
public class SystemSettingController {
    private final SystemSettingService service;

    public SystemSettingController(SystemSettingService service) {
        this.service = service;
    }

    @GetMapping
    public List<SystemSetting> getAll() {
        return service.getAllSettings();
    }

    @GetMapping("/{key}")
    public SystemSetting getByKey(@PathVariable String key) {
        return service.getSettingByKey(key);
    }

    @PutMapping("/{key}")
    public SystemSetting update(@PathVariable String key, @RequestBody SystemSetting setting) {
        SystemSetting existing = service.getSettingByKey(key);
        existing.setSettingValue(setting.getSettingValue());
        existing.setDescription(setting.getDescription());
        return service.updateSetting(existing.getId(), existing);
    }
}
