package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.dto.AccountStatusRequest;
import com.equix.horseracingsystem.dto.CreateRefereeRequest;
import com.equix.horseracingsystem.entity.User;

import java.util.List;

public interface UserService {
    User createReferee(CreateRefereeRequest request);
    List<User> getAll();
    List<User> getByRole(String role);
    User getById(Long id);
    User updateStatus(Long id, AccountStatusRequest request);
    void softDelete(Long id);
}
