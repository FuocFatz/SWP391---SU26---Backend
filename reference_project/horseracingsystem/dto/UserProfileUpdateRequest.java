package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserProfileUpdateRequest {
    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;
    private String phone;
    private String avatarUrl;
}