package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class QuickLoginRequest {
    @NotNull
    private Long userId;
}
