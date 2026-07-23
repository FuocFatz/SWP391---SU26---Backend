package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.controller.ApiException;
import com.equix.horseracingsystem.dto.*;
import com.equix.horseracingsystem.entity.*;
import com.equix.horseracingsystem.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@Service
@SuppressWarnings("null")
public class RewardService {

    public static final String HORSE_GOODS = "HORSE_GOODS";
    public static final String VOUCHER = "VOUCHER";
    public static final String DRINK_COUPON = "DRINK_COUPON";

    private static final Set<RewardStatus> TERMINAL_STATUSES = EnumSet.of(
            RewardStatus.FULFILLED, RewardStatus.REDEEMED,
            RewardStatus.EXPIRED, RewardStatus.CANCELLED);
    private static final Set<RewardStatus> EXPIRABLE_STATUSES = EnumSet.of(
            RewardStatus.ISSUED, RewardStatus.CLAIMED);

    private final RewardHistoryRepository rewardRepository;
    private final RewardTypeRepository rewardTypeRepository;
    private final UserRepository userRepository;
    private final HorseRepository horseRepository;
    private final NotificationService notificationService;
    private final AuditLogRepository auditLogRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public RewardService(RewardHistoryRepository rewardRepository,
                         RewardTypeRepository rewardTypeRepository,
                         UserRepository userRepository,
                         HorseRepository horseRepository,
                         NotificationService notificationService,
                         AuditLogRepository auditLogRepository) {
        this.rewardRepository = rewardRepository;
        this.rewardTypeRepository = rewardTypeRepository;
        this.userRepository = userRepository;
        this.horseRepository = horseRepository;
        this.notificationService = notificationService;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public RewardHistory issueOfficialReward(User admin, Race race, Prediction prediction, RaceResult result) {
        if (prediction == null || prediction.getId() == null || result == null
                || Boolean.TRUE.equals(result.getDnf()) || Boolean.TRUE.equals(result.getDisqualified())
                || result.getFinishPosition() == null || result.getFinishPosition() < 1
                || result.getFinishPosition() > 3) {
            return null;
        }
        Optional<RewardHistory> existing = rewardRepository.findByPredictionId(prediction.getId());
        if (existing.isPresent()) return existing.get();

        String typeName = rewardTypeFor(result.getFinishPosition());
        RewardType type = rewardTypeRepository.findByNameIgnoreCase(typeName)
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT,
                        "Reward type " + typeName + " is not configured"));
        if (!Boolean.TRUE.equals(type.getActive())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Reward type " + typeName + " is inactive");
        }

        LocalDateTime now = LocalDateTime.now();
        Horse horse = result.getHorseId() == null ? null : horseRepository.findById(result.getHorseId()).orElse(null);
        User owner = result.getOwnerId() == null ? null : userRepository.findById(result.getOwnerId()).orElse(null);
        String title = rewardTitle(typeName);
        String imageUrl = firstPresent(type.getImageUrl(), horse == null ? null : horse.getImageUrl());
        String partnerName = firstPresent(type.getPartnerName(), owner == null ? null : owner.getFullName());
        String contactInfo = firstPresent(type.getContactInfo(), ownerContact(owner));

        RewardHistory reward = rewardRepository.save(RewardHistory.builder()
                .userId(prediction.getSpectatorId())
                .rewardTypeId(type.getId())
                .raceId(race.getId())
                .predictionId(prediction.getId())
                .horseId(result.getHorseId())
                .finishPosition(result.getFinishPosition())
                .status(RewardStatus.ISSUED)
                .redemptionCode(isShipping(type) ? null : generateUniqueCode(typeName))
                .title(title)
                .description(firstPresent(type.getDescription(), title))
                .imageUrl(imageUrl)
                .redemptionUrl(type.getRedemptionUrl())
                .partnerName(partnerName)
                .contactInfo(contactInfo)
                .terms(type.getTerms())
                .awardedAt(now)
                .expiresAt(now.plusDays(type.getValidityDays()))
                .updatedAt(now)
                .build());

        audit(admin, "ISSUE", reward, null, RewardStatus.ISSUED.name());
        notificationService.createIfAbsent(reward.getUserId(), "REWARD_ISSUED",
                "Reward issued: " + race.getName(),
                "Your official guess earned " + title + ". Open Reward Center to claim it.",
                "/dashboard/rewards");
        return reward;
    }

    @Transactional
    @PreAuthorize("hasRole('SPECTATOR')")
    public List<RewardResponse> listMine(String email, String status, Long raceId, String typeName) {
        User spectator = actor(email, "SPECTATOR");
        RewardStatus statusFilter = parseOptionalStatus(status);
        return rewardRepository.findByUserIdOrderByAwardedAtDesc(spectator.getId()).stream()
                .map(this::expireIfNeeded)
                .filter(reward -> statusFilter == null || reward.getStatus() == statusFilter)
                .filter(reward -> raceId == null || Objects.equals(reward.getRaceId(), raceId))
                .filter(reward -> typeName == null || typeName.isBlank()
                        || type(reward).getName().equalsIgnoreCase(typeName.trim()))
                .map(reward -> response(reward, false))
                .toList();
    }

    @Transactional
    @PreAuthorize("hasRole('SPECTATOR')")
    public RewardResponse getMine(String email, Long id) {
        User spectator = actor(email, "SPECTATOR");
        RewardHistory reward = rewardRepository.findByIdAndUserId(id, spectator.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reward not found"));
        return response(expireIfNeeded(reward), false);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('SPECTATOR')")
    public List<RewardCatalogItemResponse> listPointCatalog(String email) {
        actor(email, "SPECTATOR");
        return rewardTypeRepository.findAllByOrderByIdAsc().stream()
                .filter(type -> Boolean.TRUE.equals(type.getActive()))
                .filter(type -> !isShipping(type))
                .filter(type -> value(type.getPointCost()) > 0)
                .sorted(Comparator.comparing(RewardType::getPointCost).thenComparing(RewardType::getId))
                .map(type -> RewardCatalogItemResponse.builder()
                        .id(type.getId())
                        .name(type.getName())
                        .description(type.getDescription())
                        .pointCost(type.getPointCost())
                        .validityDays(type.getValidityDays())
                        .imageUrl(type.getImageUrl())
                        .partnerName(type.getPartnerName())
                        .terms(type.getTerms())
                        .build())
                .toList();
    }

    @Transactional
    @PreAuthorize("hasRole('SPECTATOR')")
    public RewardResponse exchangePoints(String email, PointRewardExchangeRequest request) {
        User spectator = lockedActor(email, "SPECTATOR");
        RewardType type = rewardTypeRepository.findById(request.getRewardTypeId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reward type not found"));
        if (!Boolean.TRUE.equals(type.getActive()) || isShipping(type) || value(type.getPointCost()) <= 0) {
            throw new ApiException(HttpStatus.CONFLICT, "This reward is not available for point exchange");
        }

        int pointCost = type.getPointCost();
        int currentPoints = value(spectator.getRewardPoints());
        if (currentPoints < pointCost) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Not enough points. This reward requires " + pointCost + " points");
        }

        LocalDateTime now = LocalDateTime.now();
        spectator.setRewardPoints(currentPoints - pointCost);
        userRepository.save(spectator);

        String code = generateUniqueCode(type.getName());
        RewardHistory reward = rewardRepository.save(RewardHistory.builder()
                .userId(spectator.getId())
                .rewardTypeId(type.getId())
                .status(RewardStatus.CLAIMED)
                .redemptionCode(code)
                .title(rewardTitle(type.getName()))
                .description(firstPresent(type.getDescription(), rewardTitle(type.getName())))
                .redemptionUrl(type.getRedemptionUrl())
                .partnerName(type.getPartnerName())
                .contactInfo(type.getContactInfo())
                .terms(type.getTerms())
                .pointsSpent(pointCost)
                .awardedAt(now)
                .claimedAt(now)
                .expiresAt(now.plusDays(Math.max(1, type.getValidityDays())))
                .updatedAt(now)
                .build());

        audit(spectator, "EXCHANGE_POINTS", reward,
                currentPoints + " points", spectator.getRewardPoints() + " points");
        notificationService.createIfAbsent(spectator.getId(), "POINT_REWARD_CODE",
                "Mã quà tặng mới: " + reward.getTitle(),
                "Bạn đã dùng " + pointCost + " point. Mã quà tặng của bạn: " + code
                        + ". Nhấn xem chi tiết để sử dụng mã.",
                "/dashboard/rewards?code=" + code);
        return response(reward, false);
    }

    @Transactional
    @PreAuthorize("hasRole('SPECTATOR')")
    public RewardResponse claim(String email, Long id, RewardClaimRequest request) {
        User spectator = actor(email, "SPECTATOR");
        RewardHistory reward = rewardRepository.findByIdAndUserId(id, spectator.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reward not found"));
        RewardType type = type(reward);
        expireIfNeeded(reward);
        requireStatus(reward, RewardStatus.ISSUED, "Only an issued reward can be claimed");

        if (isShipping(type)) {
            if (blank(request.getRecipientName()) || blank(request.getRecipientPhone())
                    || blank(request.getDeliveryAddress())) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Recipient name, phone and delivery address are required for this reward");
            }
            reward.setRecipientName(clean(request.getRecipientName()));
            reward.setRecipientPhone(clean(request.getRecipientPhone()));
            reward.setDeliveryAddress(clean(request.getDeliveryAddress()));
        }
        reward.setSpectatorNote(clean(request.getSpectatorNote()));
        RewardStatus before = reward.getStatus();
        reward.setStatus(RewardStatus.CLAIMED);
        reward.setClaimedAt(LocalDateTime.now());
        RewardHistory saved = rewardRepository.save(reward);
        audit(spectator, "CLAIM", saved, before.name(), saved.getStatus().name());
        notificationService.createIfAbsent(saved.getUserId(), "REWARD_CLAIMED",
                "Reward claim received #" + saved.getId(),
                isShipping(type) ? "Your delivery request is waiting for Admin processing."
                        : "Your reward code is now ready in Reward Center.",
                "/dashboard/rewards");
        return response(saved, false);
    }

    @Transactional
    @PreAuthorize("hasRole('SPECTATOR')")
    public RewardResponse confirmReceived(String email, Long id) {
        User spectator = actor(email, "SPECTATOR");
        RewardHistory reward = rewardRepository.findByIdAndUserId(id, spectator.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reward not found"));
        RewardType type = type(reward);
        if (!isShipping(type)) {
            throw new ApiException(HttpStatus.CONFLICT, "Digital rewards must be redeemed by Admin");
        }
        requireStatus(reward, RewardStatus.SHIPPED, "Only a shipped reward can be confirmed received");
        reward.setStatus(RewardStatus.FULFILLED);
        reward.setFulfilledAt(LocalDateTime.now());
        RewardHistory saved = rewardRepository.save(reward);
        audit(spectator, "CONFIRM_RECEIVED", saved, RewardStatus.SHIPPED.name(), RewardStatus.FULFILLED.name());
        return response(saved, false);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public List<RewardResponse> listAll(String email, String status, Long raceId, String typeName) {
        actor(email, "ADMIN");
        RewardStatus statusFilter = parseOptionalStatus(status);
        return rewardRepository.findAllByOrderByAwardedAtDesc().stream()
                .map(this::expireIfNeeded)
                .filter(reward -> statusFilter == null || reward.getStatus() == statusFilter)
                .filter(reward -> raceId == null || Objects.equals(reward.getRaceId(), raceId))
                .filter(reward -> typeName == null || typeName.isBlank()
                        || type(reward).getName().equalsIgnoreCase(typeName.trim()))
                .map(reward -> response(reward, true))
                .toList();
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public List<RewardType> listTypes(String email) {
        actor(email, "ADMIN");
        return rewardTypeRepository.findAllByOrderByIdAsc();
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public RewardType updateType(String email, Integer id, RewardTypeUpdateRequest request) {
        User admin = actor(email, "ADMIN");
        RewardType type = rewardTypeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reward type not found"));
        String before = describe(type);
        if (request.getDescription() != null) type.setDescription(clean(request.getDescription()));
        if (request.getActive() != null) type.setActive(request.getActive());
        if (request.getImageUrl() != null) type.setImageUrl(clean(request.getImageUrl()));
        if (request.getRedemptionUrl() != null) type.setRedemptionUrl(clean(request.getRedemptionUrl()));
        if (request.getPartnerName() != null) type.setPartnerName(clean(request.getPartnerName()));
        if (request.getContactInfo() != null) type.setContactInfo(clean(request.getContactInfo()));
        if (request.getTerms() != null) type.setTerms(clean(request.getTerms()));
        if (request.getValidityDays() != null) type.setValidityDays(request.getValidityDays());
        if (request.getPointCost() != null) type.setPointCost(request.getPointCost());
        if (request.getRequiresShipping() != null
                && request.getRequiresShipping() != expectedShipping(type.getName())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Shipping mode is fixed by reward type and cannot be changed");
        }
        type.setRequiresShipping(expectedShipping(type.getName()));
        RewardType saved = rewardTypeRepository.save(type);
        auditType(admin, saved, before, describe(saved));
        return saved;
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public RewardResponse fulfill(String email, Long id, RewardFulfillmentRequest request) {
        User admin = actor(email, "ADMIN");
        RewardHistory reward = rewardRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reward not found"));
        RewardType type = type(reward);
        expireIfNeeded(reward);
        String action = request.getAction().trim().toUpperCase(Locale.ROOT);
        RewardStatus before = reward.getStatus();

        switch (action) {
            case "PROCESS" -> {
                requireShipping(type);
                requireStatus(reward, RewardStatus.CLAIMED, "Only a claimed reward can be processed");
                reward.setStatus(RewardStatus.PROCESSING);
                reward.setProcessingAt(LocalDateTime.now());
            }
            case "SHIP" -> {
                requireShipping(type);
                requireStatus(reward, RewardStatus.PROCESSING, "Only a processing reward can be shipped");
                if (blank(request.getCarrier()) || blank(request.getTrackingNumber())) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Carrier and tracking number are required");
                }
                reward.setCarrier(clean(request.getCarrier()));
                reward.setTrackingNumber(clean(request.getTrackingNumber()));
                reward.setStatus(RewardStatus.SHIPPED);
                reward.setShippedAt(LocalDateTime.now());
            }
            case "FULFILL" -> {
                requireShipping(type);
                requireStatus(reward, RewardStatus.SHIPPED, "Only a shipped reward can be fulfilled");
                reward.setStatus(RewardStatus.FULFILLED);
                reward.setFulfilledAt(LocalDateTime.now());
            }
            case "CANCEL" -> {
                if (TERMINAL_STATUSES.contains(reward.getStatus())) {
                    throw new ApiException(HttpStatus.CONFLICT, "A terminal reward cannot be cancelled");
                }
                if (blank(request.getAdminNote())) {
                    throw new ApiException(HttpStatus.BAD_REQUEST,
                            "A cancellation reason is required");
                }
                reward.setStatus(RewardStatus.CANCELLED);
                reward.setCancelledAt(LocalDateTime.now());
            }
            default -> throw new ApiException(HttpStatus.BAD_REQUEST,
                    "action must be PROCESS, SHIP, FULFILL or CANCEL");
        }

        if (request.getAdminNote() != null) reward.setAdminNote(clean(request.getAdminNote()));
        RewardHistory saved = rewardRepository.save(reward);
        audit(admin, action, saved, before.name(), saved.getStatus().name());
        notificationService.createIfAbsent(saved.getUserId(), "REWARD_" + saved.getStatus().name(),
                "Reward updated #" + saved.getId(),
                fulfillmentMessage(saved), "/dashboard/rewards");
        return response(saved, true);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public RewardResponse createCode(String email, RewardCodeCreateRequest request) {
        User admin = actor(email, "ADMIN");
        User spectator = userRepository.findByIdAndDeletedAtIsNull(request.getSpectatorId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Spectator account not found"));
        if (!"SPECTATOR".equals(spectator.getRole())
                || !Set.of("VERIFIED", "ACTIVE").contains(normalize(spectator.getStatus()))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select an active spectator account");
        }
        RewardType type = rewardTypeRepository.findById(request.getRewardTypeId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reward type not found"));
        if (!Boolean.TRUE.equals(type.getActive())) {
            throw new ApiException(HttpStatus.CONFLICT, "Selected reward type is inactive");
        }
        if (isShipping(type)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Code creation supports digital reward types only");
        }

        LocalDateTime now = LocalDateTime.now();
        int validityDays = request.getValidityDays() == null
                ? Math.max(1, type.getValidityDays()) : request.getValidityDays();
        RewardHistory reward = rewardRepository.save(RewardHistory.builder()
                .userId(spectator.getId())
                .rewardTypeId(type.getId())
                .status(RewardStatus.ISSUED)
                .redemptionCode(generateUniqueCode(type.getName()))
                .title(firstPresent(request.getTitle(), rewardTitle(type.getName())))
                .description(firstPresent(request.getDescription(), type.getDescription()))
                .redemptionUrl(type.getRedemptionUrl())
                .partnerName(type.getPartnerName())
                .contactInfo(type.getContactInfo())
                .terms(type.getTerms())
                .awardedAt(now)
                .expiresAt(now.plusDays(validityDays))
                .adminNote(clean(request.getAdminNote()))
                .updatedAt(now)
                .build());
        audit(admin, "CREATE_CODE", reward, null, RewardStatus.ISSUED.name());
        notificationService.createIfAbsent(spectator.getId(), "REWARD_CODE_ISSUED",
                "New reward code issued", "Admin issued " + reward.getTitle()
                        + ". Enter the code in My Rewards to redeem it.", "/dashboard/rewards");
        return response(reward, true);
    }

    @Transactional
    @PreAuthorize("hasRole('SPECTATOR')")
    public RewardResponse redeemCode(String email, RewardCodeRedeemRequest request) {
        User spectator = actor(email, "SPECTATOR");
        String code = request.getRedemptionCode().trim().toUpperCase(Locale.ROOT);
        RewardHistory reward = rewardRepository.findByRedemptionCodeForUpdate(code)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reward code not found"));
        if (!Objects.equals(reward.getUserId(), spectator.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This reward code belongs to another spectator");
        }
        RewardType type = type(reward);
        if (isShipping(type)) {
            throw new ApiException(HttpStatus.CONFLICT, "A shipped reward cannot be redeemed by code");
        }
        expireIfNeeded(reward);
        if (!EnumSet.of(RewardStatus.ISSUED, RewardStatus.CLAIMED).contains(reward.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Reward code is expired, cancelled, or already used");
        }
        RewardStatus before = reward.getStatus();
        LocalDateTime now = LocalDateTime.now();
        if (reward.getClaimedAt() == null) reward.setClaimedAt(now);
        reward.setStatus(RewardStatus.REDEEMED);
        reward.setRedeemedAt(now);
        RewardHistory saved = rewardRepository.save(reward);
        audit(spectator, "REDEEM_CODE", saved, before.name(), RewardStatus.REDEEMED.name());
        notificationService.createIfAbsent(saved.getUserId(), "REWARD_REDEEMED",
                "Reward code redeemed", "Your " + saved.getTitle() + " was redeemed successfully.",
                "/dashboard/rewards");
        return response(saved, false);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public RewardResponse redeem(String email, RewardRedeemRequest request) {
        User admin = actor(email, "ADMIN");
        String code = request.getRedemptionCode().trim().toUpperCase(Locale.ROOT);
        RewardHistory reward = rewardRepository.findByRedemptionCodeForUpdate(code)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reward code not found"));
        RewardType type = type(reward);
        if (isShipping(type)) {
            throw new ApiException(HttpStatus.CONFLICT, "A shipped reward cannot be redeemed by code");
        }
        expireIfNeeded(reward);
        requireStatus(reward, RewardStatus.CLAIMED, "Reward code is not claimable or was already used");
        reward.setStatus(RewardStatus.REDEEMED);
        reward.setRedeemedAt(LocalDateTime.now());
        if (request.getAdminNote() != null) reward.setAdminNote(clean(request.getAdminNote()));
        RewardHistory saved = rewardRepository.save(reward);
        audit(admin, "REDEEM", saved, RewardStatus.CLAIMED.name(), RewardStatus.REDEEMED.name());
        notificationService.createIfAbsent(saved.getUserId(), "REWARD_REDEEMED",
                "Reward redeemed #" + saved.getId(),
                "Your " + saved.getTitle() + " was redeemed successfully.", "/dashboard/rewards");
        return response(saved, true);
    }

    @Scheduled(fixedDelayString = "${app.rewards.expiry-scan-ms:3600000}")
    @Transactional
    public void expireDueRewards() {
        LocalDateTime now = LocalDateTime.now();
        rewardRepository.findByStatusInAndExpiresAtBefore(EXPIRABLE_STATUSES, now)
                .forEach(this::expireIfNeeded);
    }

    private RewardHistory expireIfNeeded(RewardHistory reward) {
        if (reward.getExpiresAt() == null || !reward.getExpiresAt().isBefore(LocalDateTime.now())
                || !EXPIRABLE_STATUSES.contains(reward.getStatus())) {
            return reward;
        }
        RewardType type = type(reward);
        if (reward.getStatus() == RewardStatus.CLAIMED && isShipping(type)) return reward;
        RewardStatus before = reward.getStatus();
        reward.setStatus(RewardStatus.EXPIRED);
        RewardHistory saved = rewardRepository.save(reward);
        audit(null, "EXPIRE", saved, before.name(), RewardStatus.EXPIRED.name());
        notificationService.createIfAbsent(saved.getUserId(), "REWARD_EXPIRED",
                "Reward expired #" + saved.getId(),
                "This reward expired before it was redeemed.", "/dashboard/rewards");
        return saved;
    }

    private RewardResponse response(RewardHistory reward, boolean admin) {
        RewardType type = type(reward);
        boolean revealCode = admin || EnumSet.of(RewardStatus.CLAIMED, RewardStatus.PROCESSING,
                RewardStatus.SHIPPED, RewardStatus.FULFILLED, RewardStatus.REDEEMED).contains(reward.getStatus());
        return RewardResponse.builder()
                .id(reward.getId()).userId(reward.getUserId()).predictionId(reward.getPredictionId())
                .raceId(reward.getRaceId()).horseId(reward.getHorseId())
                .finishPosition(reward.getFinishPosition()).rewardTypeId(reward.getRewardTypeId())
                .rewardType(type.getName()).rewardTypeDescription(type.getDescription())
                .status(reward.getStatus().name()).title(reward.getTitle()).description(reward.getDescription())
                .redemptionCode(revealCode ? reward.getRedemptionCode() : null)
                .imageUrl(reward.getImageUrl()).redemptionUrl(reward.getRedemptionUrl())
                .partnerName(reward.getPartnerName()).contactInfo(reward.getContactInfo()).terms(reward.getTerms())
                .requiresShipping(isShipping(type)).awardedAt(reward.getAwardedAt()).expiresAt(reward.getExpiresAt())
                .claimedAt(reward.getClaimedAt()).processingAt(reward.getProcessingAt())
                .shippedAt(reward.getShippedAt()).fulfilledAt(reward.getFulfilledAt())
                .redeemedAt(reward.getRedeemedAt()).cancelledAt(reward.getCancelledAt())
                .updatedAt(reward.getUpdatedAt()).recipientName(reward.getRecipientName())
                .recipientPhone(reward.getRecipientPhone()).deliveryAddress(reward.getDeliveryAddress())
                .spectatorNote(reward.getSpectatorNote()).carrier(reward.getCarrier())
                .trackingNumber(reward.getTrackingNumber()).adminNote(reward.getAdminNote())
                .pointsSpent(reward.getPointsSpent())
                .expired(reward.getStatus() == RewardStatus.EXPIRED
                        || (reward.getExpiresAt() != null && reward.getExpiresAt().isBefore(LocalDateTime.now())))
                .build();
    }

    private RewardType type(RewardHistory reward) {
        return rewardTypeRepository.findById(reward.getRewardTypeId())
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT,
                        "Reward type no longer exists"));
    }

    private User actor(String email, String role) {
        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,
                        "Authenticated user no longer exists"));
        if (!Set.of("VERIFIED", "ACTIVE").contains(normalize(user.getStatus()))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account is not active");
        }
        if (!role.equals(user.getRole())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Role cannot perform this action");
        }
        return user;
    }

    private User lockedActor(String email, String role) {
        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,
                        "Authenticated user no longer exists"));
        if (!Set.of("VERIFIED", "ACTIVE").contains(normalize(user.getStatus()))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account is not active");
        }
        if (!role.equals(user.getRole())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Role cannot perform this action");
        }
        return user;
    }

    private RewardStatus parseOptionalStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return RewardStatus.valueOf(normalize(status));
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unknown reward status");
        }
    }

    private void requireStatus(RewardHistory reward, RewardStatus expected, String message) {
        if (reward.getStatus() != expected) throw new ApiException(HttpStatus.CONFLICT, message);
    }

    private void requireShipping(RewardType type) {
        if (!isShipping(type)) throw new ApiException(HttpStatus.CONFLICT, "Digital rewards use code redemption");
    }

    private boolean isShipping(RewardType type) {
        return expectedShipping(type.getName());
    }

    private boolean expectedShipping(String typeName) {
        return HORSE_GOODS.equalsIgnoreCase(typeName);
    }

    private String generateUniqueCode(String typeName) {
        String prefix = VOUCHER.equals(typeName) ? "EQUIX-VCH-" : "EQUIX-DRK-";
        String code;
        do {
            byte[] bytes = new byte[18];
            secureRandom.nextBytes(bytes);
            code = prefix + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes).toUpperCase(Locale.ROOT);
        } while (rewardRepository.existsByRedemptionCodeIgnoreCase(code));
        return code;
    }

    private String rewardTypeFor(int finishPosition) {
        return switch (finishPosition) {
            case 1 -> HORSE_GOODS;
            case 2 -> VOUCHER;
            case 3 -> DRINK_COUPON;
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "Only top-three finishes receive rewards");
        };
    }

    private String rewardTitle(String typeName) {
        return switch (typeName) {
            case HORSE_GOODS -> "Horse goods package";
            case VOUCHER -> "EquiX voucher";
            case DRINK_COUPON -> "Complimentary drink coupon";
            default -> "EquiX reward";
        };
    }

    private String fulfillmentMessage(RewardHistory reward) {
        return switch (reward.getStatus()) {
            case PROCESSING -> "Your reward is being prepared.";
            case SHIPPED -> "Your reward has shipped. Tracking details are available in Reward Center.";
            case FULFILLED -> "Your reward was marked as fulfilled.";
            case CANCELLED -> "Your reward was cancelled. Open Reward Center for details.";
            default -> "Your reward status was updated.";
        };
    }

    private String ownerContact(User owner) {
        if (owner == null) return null;
        List<String> parts = new ArrayList<>();
        if (!blank(owner.getFullName())) parts.add(owner.getFullName().trim());
        if (!blank(owner.getEmail())) parts.add(owner.getEmail().trim());
        if (!blank(owner.getPhone())) parts.add(owner.getPhone().trim());
        return parts.isEmpty() ? null : String.join(" | ", parts);
    }

    private String firstPresent(String preferred, String fallback) {
        return blank(preferred) ? clean(fallback) : clean(preferred);
    }

    private String clean(String value) {
        return blank(value) ? null : value.trim();
    }

    private int value(Integer value) {
        return value == null ? 0 : value;
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String describe(RewardType type) {
        return type.getName() + "|active=" + type.getActive() + "|validityDays=" + type.getValidityDays()
                + "|requiresShipping=" + type.getRequiresShipping() + "|pointCost=" + type.getPointCost();
    }

    private void audit(User actor, String action, RewardHistory reward, String before, String after) {
        auditLogRepository.save(AuditLog.builder()
                .userId(actor == null ? null : actor.getId())
                .userRole(actor == null ? "SYSTEM" : actor.getRole())
                .action(action).entityType("REWARD_HISTORY").entityId(reward.getId())
                .beforeValue(before).afterValue(after).build());
    }

    private void auditType(User admin, RewardType type, String before, String after) {
        auditLogRepository.save(AuditLog.builder()
                .userId(admin.getId()).userRole(admin.getRole()).action("UPDATE")
                .entityType("REWARD_TYPE").entityId(type.getId().longValue())
                .beforeValue(before).afterValue(after).build());
    }
}
