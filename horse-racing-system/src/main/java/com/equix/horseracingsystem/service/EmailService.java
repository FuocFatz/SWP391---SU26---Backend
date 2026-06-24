package com.equix.horseracingsystem.service;

public interface EmailService {
    void sendResetPasswordEmail(String toEmail, String rawToken);
}