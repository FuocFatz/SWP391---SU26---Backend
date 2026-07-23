package com.equix.horseracingsystem.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class WebConfig {

    private final Path avatarDirectory;

    public WebConfig(@Value("${app.upload.avatar-dir:uploads/avatars}") String avatarDirectory) {
        this.avatarDirectory = Path.of(avatarDirectory).toAbsolutePath().normalize();
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(@NonNull CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("*")
                        .allowedMethods("*");
            }

            @Override
            public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
                String avatarLocation = avatarDirectory.toUri().toString();
                registry.addResourceHandler("/uploads/avatars/**")
                        .addResourceLocations(avatarLocation.endsWith("/") ? avatarLocation : avatarLocation + "/");
            }
        };
    }
}
