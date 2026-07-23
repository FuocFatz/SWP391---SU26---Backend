package com.equix.horseracingsystem.dto;

import com.equix.horseracingsystem.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class QuickLoginAccountResponse {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String role;
    private String status;
    private Integer rewardPoints;
    private String avatarUrl;

    public static QuickLoginAccountResponse from(User user) {
        return new QuickLoginAccountResponse(user.getId(), user.getUsername(), user.getFullName(),
                user.getEmail(), user.getRole(), user.getStatus(), user.getRewardPoints(), user.getAvatarUrl());
    }
}
