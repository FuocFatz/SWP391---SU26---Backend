package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.dto.ApiResponseWrapper;
import com.equix.horseracingsystem.dto.UserProfileUpdateRequest;
import com.equix.horseracingsystem.dto.UserResponse;
import com.equix.horseracingsystem.dto.UserStatusUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    ApiResponseWrapper<UserResponse> getCurrentUserProfile(String email);
    ApiResponseWrapper<UserResponse> updateUserProfile(String email, UserProfileUpdateRequest request);
    ApiResponseWrapper<Page<UserResponse>> getAllUsers(String role, String status, Pageable pageable);
    ApiResponseWrapper<UserResponse> updateUserStatus(Long id, UserStatusUpdateRequest request);
}