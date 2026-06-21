package com.equix.horseracingsystem.service;

import org.springframework.stereotype.Service;

@Service
public class LoggingEmailService implements EmailService {

    @Override
    public void sendPasswordReset(String toEmail, String resetLink) {
        // In MVP: log the reset link to application log. In production, integrate with real SMTP/transactional service.
        System.out.println("[EMAIL] Password reset for: " + toEmail + " link=" + resetLink);
    }

    @Override
    public void sendPasswordChanged(String toEmail) {
        System.out.println("[EMAIL] Password changed confirmation for: " + toEmail);
    }
}
