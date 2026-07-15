package com.equix.horseracingsystem.dto;

import com.equix.horseracingsystem.enums.Role;
import com.equix.horseracingsystem.enums.UserStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private Role role;
    private UserStatus status;
    private Integer rewardPoints;
    private String avatarUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
