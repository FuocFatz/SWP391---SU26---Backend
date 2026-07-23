package com.equix.horseracingsystem.config;

import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.UserRepository;
import com.equix.horseracingsystem.service.NotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;

import java.util.List;

@Component
@ConditionalOnProperty(name = "app.demo-data.enabled", havingValue = "true")
@Order(100)
public class DemoDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final List<DemoAccount> accounts;

    public DemoDataInitializer(
            UserRepository userRepository,
            NotificationService notificationService,
            PasswordEncoder passwordEncoder,
            @Value("${EQUIX_DEMO_ADMIN_EMAIL}") String adminEmail,
            @Value("${EQUIX_DEMO_ADMIN_PASSWORD}") String adminPassword,
            @Value("${EQUIX_DEMO_OWNER_EMAIL}") String ownerEmail,
            @Value("${EQUIX_DEMO_OWNER_PASSWORD}") String ownerPassword,
            @Value("${EQUIX_DEMO_JOCKEY_EMAIL}") String jockeyEmail,
            @Value("${EQUIX_DEMO_JOCKEY_PASSWORD}") String jockeyPassword,
            @Value("${EQUIX_DEMO_REFEREE_EMAIL}") String refereeEmail,
            @Value("${EQUIX_DEMO_REFEREE_PASSWORD}") String refereePassword,
            @Value("${EQUIX_DEMO_SPECTATOR_EMAIL}") String spectatorEmail,
            @Value("${EQUIX_DEMO_SPECTATOR_PASSWORD}") String spectatorPassword) {
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
        this.accounts = List.of(
                new DemoAccount("demo_admin", "Demo Administrator", adminEmail, adminPassword, "ADMIN"),
                new DemoAccount("demo_owner", "Demo Horse Owner", ownerEmail, ownerPassword, "HORSE_OWNER"),
                new DemoAccount("demo_jockey", "Demo Jockey", jockeyEmail, jockeyPassword, "JOCKEY"),
                new DemoAccount("demo_referee", "Demo Referee", refereeEmail, refereePassword, "REFEREE"),
                new DemoAccount("demo_spectator", "Demo Spectator", spectatorEmail, spectatorPassword, "SPECTATOR"));
    }

    @Override
    public void run(String... args) {
        for (DemoAccount account : accounts) {
            if (account.password() == null || account.password().isBlank()) {
                throw new IllegalStateException("Every demo password must be provided through environment variables");
            }
            if (userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(account.email()).isPresent()) {
                continue;
            }
            User saved = userRepository.save(User.builder()
                    .username(account.username())
                    .fullName(account.fullName())
                    .email(account.email().trim().toLowerCase())
                    .password(passwordEncoder.encode(account.password()))
                    .role(account.role())
                    .status("VERIFIED")
                    .rewardPoints(User.INITIAL_REWARD_POINTS)
                    .build());

            notificationService.createIfAbsent(saved.getId(), "ACCOUNT_APPROVED", "Welcome to EquiX",
                    "Your demo account is active and ready to use.", "/dashboard");
            if ("SPECTATOR".equals(saved.getRole())) {
                notificationService.createIfAbsent(saved.getId(), "RACE_APPROACHING", "Demo race approaching",
                        "A demonstration race is available for your next prediction.", "/races");
            }
        }
    }

    private record DemoAccount(String username, String fullName, String email, String password, String role) {
    }
}
