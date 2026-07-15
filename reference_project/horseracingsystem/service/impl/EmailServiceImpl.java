package com.equix.horseracingsystem.service.impl;

import com.equix.horseracingsystem.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {
    private final JavaMailSender mailSender;

    @Override
    public void sendResetPasswordEmail(String toEmail, String rawToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("Hệ Thống Giải Đua Ngựa Equix <no-reply@equix.com>");
            message.setTo(toEmail);
            message.setSubject("[Equix] Yêu Cầu Khôi Phục Mật Khẩu Tài Khoản");

            String content = "Chào bạn,\n\n"
                    + "Bạn đã gửi yêu cầu đặt lại mật khẩu cho tài khoản tại hệ thống Equix.\n"
                    + "Mã token khôi phục của bạn là: " + rawToken + "\n"
                    + "Mã này có hiệu lực trong vòng 15 phút.\n\n"
                    + "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.\n"
                    + "Trân trọng,\nBan Quản Trị Equix.";

            message.setText(content);
            mailSender.send(message);
            log.info("==> Đã gửi email khôi phục mật khẩu thật sự tới thành công: " + toEmail);
        } catch (Exception e) {
            log.error("Xảy ra lỗi khi gửi email tới " + toEmail + ": " + e.getMessage());
        }
    }
}