package com.equix.horseracingsystem.service;

public interface EmailService {
    void sendPasswordReset(String toEmail, String resetLink);
    void sendPasswordChanged(String toEmail);
    void sendEmailChangeVerification(String toEmail, String verificationLink);
}
