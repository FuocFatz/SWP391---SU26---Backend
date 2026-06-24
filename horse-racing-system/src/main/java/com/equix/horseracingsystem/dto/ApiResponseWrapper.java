package com.equix.horseracingsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ApiResponseWrapper<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public static <T> ApiResponseWrapper<T> success(String message, T data) {
        return new ApiResponseWrapper<>(true, message, data, LocalDateTime.now());
    }

    public static <T> ApiResponseWrapper<T> error(String message) {
        return new ApiResponseWrapper<>(false, message, null, LocalDateTime.now());
    }
}