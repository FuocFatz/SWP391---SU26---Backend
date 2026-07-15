package com.equix.horseracingsystem;

import com.equix.horseracingsystem.entity.Notification;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.AuditLogRepository;
import com.equix.horseracingsystem.repository.NotificationRepository;
import com.equix.horseracingsystem.repository.UserRepository;
import com.equix.horseracingsystem.service.NotificationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthNotificationIntegrationTests {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired NotificationRepository notificationRepository;
    @Autowired AuditLogRepository auditLogRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired NotificationService notificationService;

    private User spectator;
    private User otherSpectator;
    private String spectatorToken;

    @BeforeEach
    void setUp() throws Exception {
        notificationRepository.deleteAll();
        auditLogRepository.deleteAll();
        userRepository.deleteAll();

        spectator = saveUser("spectator", "spectator@equix.test", "SPECTATOR", "VERIFIED");
        otherSpectator = saveUser("other", "other@equix.test", "SPECTATOR", "VERIFIED");
        saveUser("owner", "owner@equix.test", "HORSE_OWNER", "PENDING");
        spectatorToken = login("spectator@equix.test", "Password123");
    }

    @Test
    void loginAndMeUseRealJwtEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", bearer(spectatorToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("spectator@equix.test"))
                .andExpect(jsonPath("$.role").value("SPECTATOR"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void profileUpdateChangesOnlySafeFields() throws Exception {
        mockMvc.perform(patch("/api/v1/auth/me")
                        .header("Authorization", bearer(spectatorToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Updated Spectator","phone":"+84901234567","role":"ADMIN","status":"PENDING"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Updated Spectator"))
                .andExpect(jsonPath("$.phone").value("+84901234567"))
                .andExpect(jsonPath("$.email").value("spectator@equix.test"))
                .andExpect(jsonPath("$.role").value("SPECTATOR"))
                .andExpect(jsonPath("$.status").value("VERIFIED"));

        User persisted = userRepository.findById(spectator.getId()).orElseThrow();
        assertThat(persisted.getRole()).isEqualTo("SPECTATOR");
        assertThat(persisted.getStatus()).isEqualTo("VERIFIED");
    }

    @Test
    void pendingAccountCannotLogin() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"owner@equix.test","password":"Password123"}
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Your account is pending Admin confirmation."));
    }

    @Test
    void publicRegistrationActivatesSpectatorButNotOwnerAndRejectsAdmin() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson("new-spec", "new-spec@equix.test", "SPECTATOR")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("VERIFIED"))
                .andExpect(jsonPath("$.token").isNotEmpty());

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson("new-owner", "new-owner@equix.test", "HORSE_OWNER")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.token").isEmpty());

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson("new-admin", "new-admin@equix.test", "ADMIN")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void markOwnNotificationReadPersistsAndSerializesDto() throws Exception {
        Notification own = notificationRepository.save(notification(spectator.getId(), "Own update"));

        mockMvc.perform(patch("/api/notifications/{id}/read", own.getId())
                        .header("Authorization", bearer(spectatorToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(own.getId()))
                .andExpect(jsonPath("$.read").value(true))
                .andExpect(jsonPath("$.readAt").isNotEmpty())
                .andExpect(jsonPath("$.userId").doesNotExist());

        Notification persisted = notificationRepository.findById(own.getId()).orElseThrow();
        assertThat(persisted.getRead()).isTrue();
        assertThat(persisted.getReadAt()).isNotNull();

        mockMvc.perform(patch("/api/notifications/{id}/read", own.getId())
                        .header("Authorization", bearer(spectatorToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true));
    }

    @Test
    void alreadyReadLegacyNotificationGetsMissingTimestampBackfilled() throws Exception {
        Notification legacy = notificationRepository.save(Notification.builder()
                .userId(spectator.getId()).type("TEST").channel("IN_APP")
                .title("Legacy read").message("Missing read timestamp").read(true).build());
        assertThat(legacy.getReadAt()).isNull();

        mockMvc.perform(patch("/api/notifications/{id}/read", legacy.getId())
                        .header("Authorization", bearer(spectatorToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true))
                .andExpect(jsonPath("$.readAt").isNotEmpty());

        assertThat(notificationRepository.findById(legacy.getId()).orElseThrow().getReadAt()).isNotNull();
    }

    @Test
    void cannotReadAnotherUsersNotification() throws Exception {
        Notification other = notificationRepository.save(notification(otherSpectator.getId(), "Private update"));

        mockMvc.perform(patch("/api/notifications/{id}/read", other.getId())
                        .header("Authorization", bearer(spectatorToken)))
                .andExpect(status().isNotFound());

        assertThat(notificationRepository.findById(other.getId()).orElseThrow().getRead()).isFalse();
    }

    @Test
    void markAllOnlyTouchesCurrentUserAndIsIdempotent() throws Exception {
        notificationRepository.save(notification(spectator.getId(), "One"));
        notificationRepository.save(notification(spectator.getId(), "Two"));
        Notification other = notificationRepository.save(notification(otherSpectator.getId(), "Other"));

        mockMvc.perform(patch("/api/notifications/read-all")
                        .header("Authorization", bearer(spectatorToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatedCount").value(2));

        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", bearer(spectatorToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(0));

        mockMvc.perform(patch("/api/notifications/read-all")
                        .header("Authorization", bearer(spectatorToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatedCount").value(0));

        assertThat(notificationRepository.findById(other.getId()).orElseThrow().getRead()).isFalse();
    }

    @Test
    void notificationListIsScopedToCurrentUser() throws Exception {
        notificationRepository.save(notification(spectator.getId(), "Visible"));
        notificationRepository.save(notification(otherSpectator.getId(), "Hidden"));

        String body = mockMvc.perform(get("/api/notifications")
                        .header("Authorization", bearer(spectatorToken)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode response = objectMapper.readTree(body);
        assertThat(response).hasSize(1);
        assertThat(response.get(0).get("title").asText()).isEqualTo("Visible");
    }

    @Test
    void duplicateBusinessNotificationIsPrevented() {
        notificationService.createIfAbsent(spectator.getId(), "RACE_STATUS", "Standby", "Guess locked", "/races/1");
        notificationService.createIfAbsent(spectator.getId(), "RACE_STATUS", "Standby", "Guess locked", "/races/1");

        assertThat(notificationRepository.findByUserIdOrderByCreatedAtDesc(spectator.getId())).hasSize(1);
    }

    private User saveUser(String username, String email, String role, String status) {
        return userRepository.save(User.builder()
                .username(username)
                .fullName(username)
                .email(email)
                .password(passwordEncoder.encode("Password123"))
                .role(role)
                .status(status)
                .rewardPoints(0)
                .build());
    }

    private String login(String email, String password) throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }

    private Notification notification(Long userId, String title) {
        return Notification.builder()
                .userId(userId)
                .type("TEST")
                .channel("IN_APP")
                .title(title)
                .message("Test notification")
                .deepLink("/notifications/" + title.replace(' ', '-'))
                .read(false)
                .build();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private String registrationJson(String username, String email, String role) {
        return """
                {"username":"%s","fullName":"New User","email":"%s","password":"Password123","role":"%s"}
                """.formatted(username, email, role);
    }
}
