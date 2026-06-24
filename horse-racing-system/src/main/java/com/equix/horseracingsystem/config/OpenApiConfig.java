package com.equix.horseracingsystem.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        Server autoDetectedServer = new Server().url("/").description("Default Server (Auto-detected)");

        return new OpenAPI()
                .info(new Info()
                        .title("Horse Racing System API")
                        .version("v1.0")
                        .description("Tài liệu hướng dẫn và kiểm thử TOÀN BỘ API hệ thống."))
                .servers(List.of(autoDetectedServer))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Nhập Token nhận được sau khi Đăng Nhập thành công.")
                        ));
    }

    // --- CẤU HÌNH QUÉT TẤT CẢ CONTROLLER ---

    @Bean
    public GroupedOpenApi allApi() {
        return GroupedOpenApi.builder()
                .group("0. All Endpoints")
                .packagesToScan("com.equix.horseracingsystem.controller") // Quét toàn bộ controller trong package này
                .pathsToMatch("/**") // Nhận tất cả các đường dẫn API có trong hệ thống
                .build();
    }
}