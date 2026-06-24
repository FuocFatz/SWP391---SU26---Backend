package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.dto.ApiResponseWrapper;
import com.equix.horseracingsystem.dto.AuthResponse;
import com.equix.horseracingsystem.dto.LoginRequest;
import com.equix.horseracingsystem.dto.RegisterRequest;

public interface AuthService {
    ApiResponseWrapper<AuthResponse> register(RegisterRequest request);
    ApiResponseWrapper<AuthResponse> login(LoginRequest request);
}