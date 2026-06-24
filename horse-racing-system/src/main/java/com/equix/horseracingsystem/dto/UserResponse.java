package com.equix.horseracingsystem.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private String status;
    private Integer rewardPoints;
    private String avatarUrl;
    private LocalDateTime createdAt;
}