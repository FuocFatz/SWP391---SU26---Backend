package com.equix.horseracingsystem.service;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class LoggingEmailService implements EmailService {
    private static final Logger log = LoggerFactory.getLogger(LoggingEmailService.class);

    @Override
    public void sendPasswordReset(String toEmail, String resetLink) {
        // This local adapter deliberately never writes the secret-bearing reset link to logs.
        log.info("Password reset delivery requested for masked recipient {}", mask(toEmail));
    }

    @Override
    public void sendPasswordChanged(String toEmail) {
        log.info("Password change confirmation requested for masked recipient {}", mask(toEmail));
    }

    @Override
    public void sendEmailChangeVerification(String toEmail, String verificationLink) {
        // Never log the secret-bearing verification link.
        log.info("Email-change verification delivery requested for masked recipient {}", mask(toEmail));
    }

    private String mask(String email) {
        int at = email == null ? -1 : email.indexOf('@');
        return at <= 1 ? "***" : email.charAt(0) + "***" + email.substring(at);
    }
}
