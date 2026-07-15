package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserStatusUpdateRequest {
    @NotBlank(message = "Trạng thái không được để trống")
    private String status; // VERIFIED, SUSPENDED, TERMINATED
}