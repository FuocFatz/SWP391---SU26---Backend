package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.AccountStatusRequest;
import com.equix.horseracingsystem.dto.CreateRefereeRequest;
import com.equix.horseracingsystem.dto.UserResponse;
import com.equix.horseracingsystem.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/referees")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createReferee(@Valid @RequestBody CreateRefereeRequest request) {
        return UserResponse.from(userService.createReferee(request));
    }

    @GetMapping
    public List<UserResponse> getAll() {
        return userService.getAll().stream().map(UserResponse::from).toList();
    }

    @GetMapping("/role/{role}")
    public List<UserResponse> getByRole(@PathVariable String role) {
        return userService.getByRole(role).stream().map(UserResponse::from).toList();
    }

    @GetMapping("/{id}")
    public UserResponse getById(@PathVariable Long id) {
        return UserResponse.from(userService.getById(id));
    }

    @PatchMapping("/{id}/status")
    public UserResponse updateStatus(@PathVariable Long id, @Valid @RequestBody AccountStatusRequest request) {
        return UserResponse.from(userService.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        userService.softDelete(id);
    }
}
