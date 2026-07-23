package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BulkRegistrationApprovalRequest {
    @NotEmpty
    private List<Long> registrationIds;
}
