package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin("*")
@Tag(name = "Users", description = "User management operations")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "Create a new user", description = "Creates a new user in the system")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User created successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input", content = @Content)
    })
    @PostMapping
    public User create(@RequestBody @NonNull User user) {
        return userService.create(user);
    }

    @Operation(summary = "Get all users", description = "Retrieves a list of all users")
    @ApiResponse(responseCode = "200", description = "List of users retrieved",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = User.class))))
    @GetMapping
    public List<User> getAll() {
        return userService.getAll();
    }

    @Operation(summary = "Get users by role", description = "Retrieves all users with the specified role")
    @ApiResponse(responseCode = "200", description = "List of users with the specified role",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = User.class))))
    @GetMapping("/role/{role}")
    public List<User> getByRole(
            @Parameter(description = "User role (e.g. OWNER, JOCKEY, REFEREE, SPECTATOR)")
            @PathVariable String role) {
        return userService.getByRole(role);
    }

    @Operation(summary = "Get user by ID", description = "Retrieves a user by their unique ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User found",
                    content = @Content(schema = @Schema(implementation = User.class))),
            @ApiResponse(responseCode = "400", description = "User not found", content = @Content)
    })
    @GetMapping("/{id}")
    public User getById(
            @Parameter(description = "User ID") @PathVariable @NonNull Long id) {
        return userService.getById(id);
    }

    @Operation(summary = "Update a user", description = "Updates an existing user by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User updated successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
            @ApiResponse(responseCode = "400", description = "User not found", content = @Content)
    })
    @PutMapping("/{id}")
    public User update(
            @Parameter(description = "User ID") @PathVariable @NonNull Long id,
            @RequestBody User user) {
        return userService.update(id, user);
    }

    @Operation(summary = "Delete a user", description = "Deletes a user by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User deleted successfully"),
            @ApiResponse(responseCode = "400", description = "User not found", content = @Content)
    })
    @DeleteMapping("/{id}")
    public void delete(
            @Parameter(description = "User ID") @PathVariable @NonNull Long id) {
        userService.delete(id);
    }
}
