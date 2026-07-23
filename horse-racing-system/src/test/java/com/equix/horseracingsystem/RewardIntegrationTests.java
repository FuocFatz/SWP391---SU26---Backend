package com.equix.horseracingsystem;

import com.equix.horseracingsystem.controller.ApiException;
import com.equix.horseracingsystem.dto.*;
import com.equix.horseracingsystem.entity.*;
import com.equix.horseracingsystem.repository.*;
import com.equix.horseracingsystem.service.RewardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class RewardIntegrationTests {
    @Autowired RewardService rewards;
    @Autowired RewardHistoryRepository rewardHistories;
    @Autowired RewardTypeRepository rewardTypes;
    @Autowired PredictionRepository predictions;
    @Autowired RaceResultRepository results;
    @Autowired RaceNoteRepository notes;
    @Autowired RaceRegistrationRepository registrations;
    @Autowired JockeyInvitationRepository invitations;
    @Autowired PairingContractRepository pairings;
    @Autowired NotificationRepository notifications;
    @Autowired AuditLogRepository audits;
    @Autowired RaceRepository races;
    @Autowired HorseRepository horses;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwordEncoder;

    private User admin;
    private User spectator;
    private User otherSpectator;
    private User owner;
    private Race race;
    private Horse horse;

    @BeforeEach
    void setUp() {
        rewardHistories.deleteAll(); results.deleteAll(); notes.deleteAll(); predictions.deleteAll();
        registrations.deleteAll(); invitations.deleteAll(); pairings.deleteAll(); notifications.deleteAll(); audits.deleteAll();
        races.deleteAll(); horses.deleteAll(); users.deleteAll();
        resetType(RewardService.HORSE_GOODS, true, 90);
        resetType(RewardService.VOUCHER, false, 30);
        resetType(RewardService.DRINK_COUPON, false, 30);

        admin = user("reward-admin@equix.test", "ADMIN");
        spectator = user("reward-spectator@equix.test", "SPECTATOR");
        otherSpectator = user("reward-other@equix.test", "SPECTATOR");
        owner = user("reward-owner@equix.test", "HORSE_OWNER");
        horse = horses.save(Horse.builder().horseName("Reward Runner").ownerId(owner.getId())
                .registrationNumber("REWARD-HORSE-1").status("AVAILABLE").build());
        race = races.save(Race.builder().tournamentId(1L).name("Reward Cup").type("SPRINT")
                .distanceM(1200).surface("TURF").raceDate(LocalDate.now()).raceTime(LocalTime.NOON)
                .maxParticipants(8).prizePool(BigDecimal.ZERO).status("OFFICIAL").build());
    }

    @Test
    void officialTopThreeUseFixedTiersAndIssuanceIsIdempotent() {
        Prediction first = prediction(spectator, 1L);
        Prediction second = prediction(otherSpectator, 2L);
        User thirdSpectator = user("reward-third@equix.test", "SPECTATOR");
        Prediction third = prediction(thirdSpectator, 3L);

        RewardHistory firstReward = rewards.issueOfficialReward(admin, race, first, result(1, false, false));
        RewardHistory secondReward = rewards.issueOfficialReward(admin, race, second, result(2, false, false));
        RewardHistory thirdReward = rewards.issueOfficialReward(admin, race, third, result(3, false, false));

        assertThat(typeName(firstReward)).isEqualTo(RewardService.HORSE_GOODS);
        assertThat(firstReward.getRedemptionCode()).isNull();
        assertThat(typeName(secondReward)).isEqualTo(RewardService.VOUCHER);
        assertThat(secondReward.getRedemptionCode()).startsWith("EQUIX-VCH-");
        assertThat(typeName(thirdReward)).isEqualTo(RewardService.DRINK_COUPON);
        assertThat(thirdReward.getRedemptionCode()).startsWith("EQUIX-DRK-");
        assertThat(rewards.issueOfficialReward(admin, race, second, result(2, false, false)).getId())
                .isEqualTo(secondReward.getId());
        assertThat(rewardHistories.findAll()).hasSize(3);
    }

    @Test
    void dnfAndDisqualifiedFinishesNeverReceiveRewards() {
        assertThat(rewards.issueOfficialReward(admin, race, prediction(spectator, 11L), result(1, true, false))).isNull();
        assertThat(rewards.issueOfficialReward(admin, race, prediction(otherSpectator, 12L), result(2, false, true))).isNull();
        assertThat(rewardHistories.findAll()).isEmpty();
    }

    @Test
    void digitalRewardIsOwnerScopedClaimedAndRedeemedOnlyOnce() {
        RewardHistory reward = rewards.issueOfficialReward(admin, race, prediction(spectator, 21L), result(2, false, false));
        authenticate("SPECTATOR");
        RewardResponse claimed = rewards.claim(spectator.getEmail(), reward.getId(), new RewardClaimRequest());
        assertThat(claimed.getStatus()).isEqualTo("CLAIMED");
        assertThat(claimed.getRedemptionCode()).isNotBlank();
        assertThatThrownBy(() -> rewards.getMine(otherSpectator.getEmail(), reward.getId()))
                .isInstanceOf(ApiException.class).hasMessageContaining("not found");

        authenticate("ADMIN");
        RewardRedeemRequest request = new RewardRedeemRequest();
        request.setRedemptionCode(claimed.getRedemptionCode()); request.setAdminNote("Demo venue validation");
        assertThat(rewards.redeem(admin.getEmail(), request).getStatus()).isEqualTo("REDEEMED");
        assertThatThrownBy(() -> rewards.redeem(admin.getEmail(), request))
                .isInstanceOf(ApiException.class).hasMessageContaining("already used");
    }

    @Test
    void shippingRewardRequiresDeliveryAndFollowsFulfillmentLifecycle() {
        RewardHistory reward = rewards.issueOfficialReward(admin, race, prediction(spectator, 31L), result(1, false, false));
        authenticate("SPECTATOR");
        assertThatThrownBy(() -> rewards.claim(spectator.getEmail(), reward.getId(), new RewardClaimRequest()))
                .isInstanceOf(ApiException.class).hasMessageContaining("delivery address");

        RewardClaimRequest claim = new RewardClaimRequest();
        claim.setRecipientName("Demo Spectator"); claim.setRecipientPhone("0900000000");
        claim.setDeliveryAddress("123 Demo Street, Ho Chi Minh City");
        assertThat(rewards.claim(spectator.getEmail(), reward.getId(), claim).getStatus()).isEqualTo("CLAIMED");

        authenticate("ADMIN");
        RewardFulfillmentRequest action = action("PROCESS", "Preparing package");
        assertThat(rewards.fulfill(admin.getEmail(), reward.getId(), action).getStatus()).isEqualTo("PROCESSING");
        action = action("SHIP", "Courier accepted package");
        action.setCarrier("Demo Carrier"); action.setTrackingNumber("TRACK-001");
        assertThat(rewards.fulfill(admin.getEmail(), reward.getId(), action).getStatus()).isEqualTo("SHIPPED");

        authenticate("SPECTATOR");
        assertThat(rewards.confirmReceived(spectator.getEmail(), reward.getId()).getStatus()).isEqualTo("FULFILLED");
    }

    @Test
    void cancellationRequiresAnAuditableReason() {
        RewardHistory reward = rewards.issueOfficialReward(admin, race, prediction(spectator, 41L), result(3, false, false));
        authenticate("ADMIN");
        assertThatThrownBy(() -> rewards.fulfill(admin.getEmail(), reward.getId(), action("CANCEL", "")))
                .isInstanceOf(ApiException.class).hasMessageContaining("reason");
        assertThat(rewards.fulfill(admin.getEmail(), reward.getId(), action("CANCEL", "Partner unavailable"))
                .getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    void adminCreatesSpectatorCodeAndOnlyItsOwnerCanRedeemItOnce() {
        RewardType voucher = rewardTypes.findByNameIgnoreCase(RewardService.VOUCHER).orElseThrow();
        authenticate("ADMIN");
        RewardCodeCreateRequest create = new RewardCodeCreateRequest();
        create.setSpectatorId(spectator.getId());
        create.setRewardTypeId(voucher.getId());
        create.setTitle("Demo thank-you voucher");
        create.setValidityDays(14);
        RewardResponse issued = rewards.createCode(admin.getEmail(), create);

        assertThat(issued.getStatus()).isEqualTo("ISSUED");
        assertThat(issued.getRedemptionCode()).startsWith("EQUIX-VCH-");
        assertThat(issued.getRaceId()).isNull();

        RewardCodeRedeemRequest redeem = new RewardCodeRedeemRequest();
        redeem.setRedemptionCode(issued.getRedemptionCode());
        authenticate("SPECTATOR");
        assertThatThrownBy(() -> rewards.redeemCode(otherSpectator.getEmail(), redeem))
                .isInstanceOf(ApiException.class).hasMessageContaining("another spectator");
        assertThat(rewards.redeemCode(spectator.getEmail(), redeem).getStatus()).isEqualTo("REDEEMED");
        assertThatThrownBy(() -> rewards.redeemCode(spectator.getEmail(), redeem))
                .isInstanceOf(ApiException.class).hasMessageContaining("already used");
    }

    @Test
    void spectatorExchangesPointsForGiftCodeReceivesNotificationAndRedeemsOnce() {
        spectator.setRewardPoints(User.INITIAL_REWARD_POINTS);
        spectator = users.save(spectator);
        RewardType voucher = rewardTypes.findByNameIgnoreCase(RewardService.VOUCHER).orElseThrow();
        authenticate("SPECTATOR");

        assertThat(rewards.listPointCatalog(spectator.getEmail()))
                .extracting(RewardCatalogItemResponse::getName)
                .containsExactly(RewardService.DRINK_COUPON, RewardService.VOUCHER);

        PointRewardExchangeRequest exchange = new PointRewardExchangeRequest();
        exchange.setRewardTypeId(voucher.getId());
        RewardResponse issued = rewards.exchangePoints(spectator.getEmail(), exchange);

        assertThat(issued.getStatus()).isEqualTo("CLAIMED");
        assertThat(issued.getPointsSpent()).isEqualTo(300);
        assertThat(issued.getRedemptionCode()).startsWith("EQUIX-VCH-");
        assertThat(users.findById(spectator.getId()).orElseThrow().getRewardPoints()).isEqualTo(200);
        assertThat(notifications.findByUserIdOrderByCreatedAtDesc(spectator.getId()))
                .anyMatch(notification -> notification.getMessage().contains(issued.getRedemptionCode()));

        assertThatThrownBy(() -> rewards.exchangePoints(spectator.getEmail(), exchange))
                .isInstanceOf(ApiException.class).hasMessageContaining("Not enough points");
        assertThat(rewardHistories.findByUserIdOrderByAwardedAtDesc(spectator.getId())).hasSize(1);

        RewardCodeRedeemRequest redeem = new RewardCodeRedeemRequest();
        redeem.setRedemptionCode(issued.getRedemptionCode());
        assertThat(rewards.redeemCode(spectator.getEmail(), redeem).getStatus()).isEqualTo("REDEEMED");
        assertThatThrownBy(() -> rewards.redeemCode(spectator.getEmail(), redeem))
                .isInstanceOf(ApiException.class).hasMessageContaining("already used");
    }

    private RewardFulfillmentRequest action(String action, String note) {
        RewardFulfillmentRequest request = new RewardFulfillmentRequest();
        request.setAction(action); request.setAdminNote(note); return request;
    }

    private Prediction prediction(User user, Long seed) {
        return predictions.save(Prediction.builder().raceId(race.getId()).spectatorId(user.getId())
                .predictedHorseId(horse.getId()).wagerPoints(0).rewardPoints(0).status("ACTIVE").build());
    }

    private RaceResult result(int position, boolean dnf, boolean disqualified) {
        return RaceResult.builder().raceId(race.getId()).horseId(horse.getId()).ownerId(owner.getId())
                .finishPosition(position).finishTimeSeconds(BigDecimal.valueOf(68 + position))
                .pointsAwarded(0).dnf(dnf).disqualified(disqualified).official(true).build();
    }

    private String typeName(RewardHistory reward) {
        return rewardTypes.findById(reward.getRewardTypeId()).orElseThrow().getName();
    }

    private void resetType(String name, boolean shipping, int validityDays) {
        RewardType type = rewardTypes.findByNameIgnoreCase(name).orElseGet(RewardType::new);
        type.setName(name); type.setDescription(name); type.setActive(true); type.setValidityDays(validityDays);
        type.setRequiresShipping(shipping);
        type.setPointCost(switch (name) {
            case RewardService.DRINK_COUPON -> 150;
            case RewardService.VOUCHER -> 300;
            default -> 0;
        });
        type.setTerms("Demo terms"); rewardTypes.save(type);
    }

    private User user(String email, String role) {
        return users.save(User.builder().username(email.substring(0, email.indexOf('@'))).fullName(role)
                .email(email).password(passwordEncoder.encode("Password123")).role(role)
                .status("VERIFIED").rewardPoints(0).build());
    }

    private void authenticate(String role) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "reward-test", "n/a", AuthorityUtils.createAuthorityList("ROLE_" + role)));
    }
}
