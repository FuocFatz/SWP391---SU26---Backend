package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.service.UserService;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin("*")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public User create(@RequestBody @NonNull User user) {
        return userService.create(user);
    }

    @GetMapping
    public List<User> getAll() {
        return userService.getAll();
    }

    @GetMapping("/role/{role}")
    public List<User> getByRole(@PathVariable String role) {
        return userService.getByRole(role);
    }

    @GetMapping("/{id}")
    public User getById(@PathVariable @NonNull Long id) {
        return userService.getById(id);
    }

    @PutMapping("/{id}")
    public User update(@PathVariable @NonNull Long id,
                       @RequestBody User user) {
        return userService.update(id, user);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable @NonNull Long id) {
        userService.delete(id);
    }
}
