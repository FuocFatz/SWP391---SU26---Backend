package com.equix.horseracingsystem.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingResponse {
    private Integer id;
    private String settingKey;
    private String settingValue;
    private String description;
    private LocalDateTime updatedAt;
}