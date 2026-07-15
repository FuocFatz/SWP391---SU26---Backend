package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.dto.UserResponse;
import com.equix.horseracingsystem.service.UserService;
import java.util.stream.Collectors;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.equix.horseracingsystem.util.SecurityUtil;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin("*")
@Tag(name = "Users", description = "User management operations")
@SuppressWarnings("null")
public class UserController {

    private final UserService userService;
    private final SecurityUtil securityUtil;

    public UserController(UserService userService, SecurityUtil securityUtil) {
        this.userService = userService;
        this.securityUtil = securityUtil;
    }

    private UserResponse mapToDTO(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .rewardPoints(user.getRewardPoints())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    @Operation(summary = "Create a new user", description = "Creates a new user in the system")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User created successfully",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input", content = @Content)
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse create(@RequestBody @NonNull User user) {
        return mapToDTO(userService.create(user));
    }

    @Operation(summary = "Get all users", description = "Retrieves a list of all users")
    @ApiResponse(responseCode = "200", description = "List of users retrieved",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserResponse.class))))
    @GetMapping
    public List<UserResponse> getAll() {
        return userService.getAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Operation(summary = "Get users by role", description = "Retrieves all users with the specified role")
    @ApiResponse(responseCode = "200", description = "List of users with the specified role",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserResponse.class))))
    @GetMapping("/role/{role}")
    public List<UserResponse> getByRole(
            @Parameter(description = "User role (e.g. OWNER, JOCKEY, REFEREE, SPECTATOR)")
            @PathVariable String role) {
        return userService.getByRole(role).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Operation(summary = "Get user by ID", description = "Retrieves a user by their unique ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User found",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "400", description = "User not found", content = @Content)
    })
    @GetMapping("/{id}")
    public UserResponse getById(
            @Parameter(description = "User ID") @PathVariable @NonNull Long id) {
        return mapToDTO(userService.getById(id));
    }

    @GetMapping("/profile")
    public UserResponse getMyProfile() {
        return mapToDTO(userService.getById(securityUtil.getCurrentUserId()));
    }

    @PutMapping("/profile")
    public UserResponse updateMyProfile(@RequestBody User user) {
        User existing = userService.getById(securityUtil.getCurrentUserId());
        existing.setFullName(user.getFullName());
        existing.setPhone(user.getPhone());
        existing.setAvatarUrl(user.getAvatarUrl());
        return mapToDTO(userService.update(existing.getId(), existing));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateStatus(@PathVariable Long id, @RequestParam String status) {
        User user = userService.getById(id);
        user.setStatus(com.equix.horseracingsystem.enums.UserStatus.valueOf(status.toUpperCase()));
        return mapToDTO(userService.update(id, user));
    }

    @Operation(summary = "Update a user", description = "Updates an existing user by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User updated successfully",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "400", description = "User not found", content = @Content)
    })
    @PutMapping("/{id}")
    public UserResponse update(
            @Parameter(description = "User ID") @PathVariable @NonNull Long id,
            @RequestBody User user) {
        return mapToDTO(userService.update(id, user));
    }

    @Operation(summary = "Delete a user", description = "Deletes a user by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User deleted successfully"),
            @ApiResponse(responseCode = "400", description = "User not found", content = @Content)
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(
            @Parameter(description = "User ID") @PathVariable @NonNull Long id) {
        userService.delete(id);
    }
}
