package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.dto.*;

public interface AuthService {
    ApiResponseWrapper<AuthResponse> register(RegisterRequest request);
    ApiResponseWrapper<AuthResponse> login(LoginRequest request);
    ApiResponseWrapper<String> forgotPassword(ForgotPasswordRequest request);
    ApiResponseWrapper<String> resetPassword(ResetPasswordRequest request);


}