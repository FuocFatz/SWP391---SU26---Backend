package com.equix.horseracingsystem.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("EquiX Horse Racing API")
                        .version("v1")
                        .description("API documentation for EquiX Horse Racing System")
                        .contact(new Contact().name("EquiX Team").email("dev@equix.local"))
                )
                .servers(List.of(
                        new Server().url("http://localhost:9090/api").description("Local API base (with /api prefix)"),
                        new Server().url("http://localhost:9090").description("Local server root")
                ));
    }
}

