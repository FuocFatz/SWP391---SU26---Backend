package com.equix.horseracingsystem.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RewardCodeRedeemRequest {
    @NotBlank
    @Size(max = 80)
    @JsonAlias("code")
    private String redemptionCode;
}
