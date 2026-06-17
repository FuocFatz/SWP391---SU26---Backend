package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.UserRepository;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User create(@NonNull User user) {
        if (user.getPassword() != null && !user.getPassword().startsWith("$2")) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        if (user.getRewardPoints() == null) {
            user.setRewardPoints(0);
        }
        if (user.getEnabled() == null) {
            user.setEnabled(true);
        }
        return userRepository.save(user);
    }

    @Override
    public List<User> getAll() {
        return userRepository.findAll();
    }

    @Override
    public List<User> getByRole(String role) {
        return userRepository.findByRole(role.toUpperCase());
    }

    @Override
    public User getById(@NonNull Long id) {
        return userRepository.findById(id).orElse(null);
    }

    @Override
    public User update(@NonNull Long id, User user) {

        User existing = userRepository.findById(id).orElse(null);

        if (existing == null) {
            return null;
        }

        existing.setUsername(user.getUsername());
        existing.setFullName(user.getFullName());
        existing.setEmail(user.getEmail());
        existing.setPassword(user.getPassword());
        existing.setPhone(user.getPhone());
        existing.setRole(user.getRole());
        existing.setEnabled(user.getEnabled());
        existing.setRewardPoints(user.getRewardPoints());
        existing.setAvatarUrl(user.getAvatarUrl());
        existing.setUpdatedAt(java.time.LocalDateTime.now());

        return userRepository.save(existing);
    }

    @Override
    public void delete(@NonNull Long id) {
        userRepository.deleteById(id);
    }
}
