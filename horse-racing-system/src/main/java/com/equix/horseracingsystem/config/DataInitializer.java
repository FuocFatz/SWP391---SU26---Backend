package com.equix.horseracingsystem.config;

import com.equix.horseracingsystem.constant.UserRole;
import com.equix.horseracingsystem.constant.UserStatus;
import com.equix.horseracingsystem.constant.HorseStatus;
import com.equix.horseracingsystem.constant.HorseHealthStatus;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.entity.Horse;
import com.equix.horseracingsystem.repository.UserRepository;
import com.equix.horseracingsystem.repository.HorseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final HorseRepository horseRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializeAdminUser();
        initializeOtherUsersAndHorses();
    }

    private void initializeAdminUser() {
        String adminEmail = "admin@equix.com";
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            log.info("==> Khởi tạo tài khoản ADMIN mặc định...");
            User admin = User.builder()
                    .username("admin")
                    .fullName("System Administrator")
                    .email(adminEmail)
                    .phone("0123456789")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(UserRole.ADMIN)
                    .status(UserStatus.VERIFIED)
                    .rewardPoints(0)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(admin);
        }
    }

    private void initializeOtherUsersAndHorses() {
        // 1. Tạo tài khoản CHỦ NGỰA (HORSE_OWNER) và nạp ngựa đua cho họ
        String ownerEmail = "owner@equix.com";
        if (userRepository.findByEmail(ownerEmail).isEmpty()) {
            log.info("==> Khởi tạo tài khoản HORSE_OWNER và các chiến mã đi kèm...");
            User owner = User.builder()
                    .username("horse_owner")
                    .fullName("Nguyen Van Chu")
                    .email(ownerEmail)
                    .phone("0987654321")
                    .passwordHash(passwordEncoder.encode("owner123"))
                    .role(UserRole.HORSE_OWNER)
                    .status(UserStatus.VERIFIED)
                    .rewardPoints(100)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            User savedOwner = userRepository.save(owner);

            // Khởi tạo 2 chiến mã chi tiết thuộc sở hữu của Chủ ngựa này
            createSampleHorse(savedOwner, "Xích Thố", "XT-99", "Thoroughbred", 5, "Crimson Red", 85, 80);
            createSampleHorse(savedOwner, "Đại Phong", "DP-12", "Arabian", 4, "Pure White", 78, 85);
        }

        // 2. Tạo tài khoản NÀI NGỰA (JOCKEY)
        String jockeyEmail = "jockey@equix.com";
        if (userRepository.findByEmail(jockeyEmail).isEmpty()) {
            log.info("==> Khởi tạo tài khoản JOCKEY...");
            User jockey = User.builder()
                    .username("jockey_racer")
                    .fullName("Tran Van Ky Si")
                    .email(jockeyEmail)
                    .phone("0912345678")
                    .passwordHash(passwordEncoder.encode("jockey123"))
                    .role(UserRole.JOCKEY)
                    .status(UserStatus.VERIFIED)
                    .rewardPoints(0)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(jockey);
        }

        // 3. Tạo tài khoản TRỌNG TÀI (REFEREE)
        String refereeEmail = "referee@equix.com";
        if (userRepository.findByEmail(refereeEmail).isEmpty()) {
            log.info("==> Khởi tạo tài khoản REFEREE...");
            User referee = User.builder()
                    .username("referee_01")
                    .fullName("Trong Tai Minh Bach")
                    .email(refereeEmail)
                    .phone("0909090909")
                    .passwordHash(passwordEncoder.encode("referee123"))
                    .role(UserRole.REFEREE)
                    .status(UserStatus.VERIFIED)
                    .rewardPoints(0)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(referee);
        }

        // 4. Tạo tài khoản KHÁN GIẢ / NGƯỜI CHƠI (SPECTATOR)
        String spectatorEmail = "spectator@equix.com";
        if (userRepository.findByEmail(spectatorEmail).isEmpty()) {
            log.info("==> Khởi tạo tài khoản SPECTATOR...");
            User spectator = User.builder()
                    .username("spectator_viewer")
                    .fullName("Người Xem Đua Ngựa")
                    .email(spectatorEmail)
                    .phone("0888888888")
                    .passwordHash(passwordEncoder.encode("spectator123"))
                    .role(UserRole.SPECTATOR)
                    .status(UserStatus.VERIFIED)
                    .rewardPoints(50)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(spectator);
        }
    }

    // Hàm bổ trợ tạo nhanh dữ liệu ngựa đua theo đúng cấu trúc Entity mới của bạn
    private void createSampleHorse(User owner, String name, String regNum, String breed, int age, String color, int speed, int stamina) {
        Horse horse = new Horse();
        horse.setOwner(owner);
        horse.setHorseName(name);
        horse.setNickname("The " + name);
        horse.setRegistrationNumber(regNum);
        horse.setGender("Stallion"); // Ngựa đực giống
        horse.setBreed(breed);
        horse.setAge(age);
        horse.setColor(color);
        horse.setCountryOfOrigin("Vietnam");
        horse.setHeightCm(new BigDecimal("165.50"));
        horse.setWeightKg(new BigDecimal("480.00"));

        // Các chỉ số thuộc tính thi đấu
        horse.setSpeed(speed);
        horse.setStamina(stamina);
        horse.setAcceleration(75);
        horse.setAgility(70);
        horse.setPaceStyle("Front-Runner");

        // Gán trạng thái theo cấu trúc Enum String mới
        horse.setHealthStatus(HorseHealthStatus.HEALTHY);
        horse.setStatus(HorseStatus.AVAILABLE);

        // Các chỉ số thống kê thành tích ban đầu
        horse.setTotalRaces(0);
        horse.setTotalWins(0);
        horse.setTotalTop3(0);
        horse.setTotalPoints(0);

        horse.setImageUrl("https://images.equix.com/horses/sample.jpg");
        horse.setDescription("Chiến mã hạt giống xuất sắc được khởi tạo mặc định.");
        horse.setCreatedAt(LocalDateTime.now());
        horse.setUpdatedAt(LocalDateTime.now());

        horseRepository.save(horse);
    }
}