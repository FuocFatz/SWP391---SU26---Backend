package com.equix.horseracingsystem.constant;

public enum UserRole {
    ADMIN,          // Quản trị viên hệ thống (Quản lý cài đặt, duyệt tài khoản, xem log)
    HORSE_OWNER,    // Chủ ngựa (Đăng ký chiến mã, tham gia giải đua)
    JOCKEY,         // Nài ngựa / Kỵ sĩ (Người điều khiển ngựa trong các trận đấu)
    REFEREE,        // Trọng tài (Điều hành trận đấu, cập nhật kết quả thi đấu)
    SPECTATOR       // Khán giả / Người chơi (Xem thông tin, đặt cược, tích lũy điểm thưởng)
}