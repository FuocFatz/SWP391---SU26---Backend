package com.equix.horseracingsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String role;
    private Integer rewardPoints;

}
