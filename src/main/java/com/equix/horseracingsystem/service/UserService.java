package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.entity.User;
import org.springframework.lang.NonNull;

import java.util.List;

public interface UserService {

    User create(@NonNull User user);

    List<User> getAll();

    List<User> getByRole(String role);

    User getById(@NonNull Long id);

    User update(@NonNull Long id, User user);

    void delete(@NonNull Long id);

}
