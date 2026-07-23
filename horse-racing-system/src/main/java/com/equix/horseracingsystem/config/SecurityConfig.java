package com.equix.horseracingsystem.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"message\":\"Authentication is required\"}");
                        })
                        .accessDeniedHandler((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"message\":\"You do not have permission for this action\"}");
                        }))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/uploads/avatars/**").permitAll()
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/auth/login", "/api/v1/auth/register",
                                "/api/auth/login", "/api/auth/register",
                                "/api/v1/auth/quick-login", "/api/auth/quick-login",
                                "/api/v1/auth/email-change/confirm", "/api/auth/email-change/confirm",
                                "/api/auth/password-reset/**").permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/auth/quick-login/accounts", "/api/auth/quick-login/accounts").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/races/*/simulate").hasRole("REFEREE")
                        .requestMatchers(HttpMethod.GET,
                                "/api/races", "/api/races/*", "/api/races/*/registrations",
                                "/api/races/*/results",
                                "/api/races/leaderboard/**", "/api/horses", "/api/horses/*", "/api/tournaments/**").permitAll()
                        .requestMatchers("/api/notifications/**", "/api/v1/auth/me", "/api/auth/me").authenticated()
                        .requestMatchers("/api/rewards/**").hasRole("SPECTATOR")
                        .requestMatchers("/api/admin/rewards/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/analytics/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/predictions", "/api/races/*/predictions").hasRole("SPECTATOR")
                        .requestMatchers(HttpMethod.POST, "/api/races/*/start").hasRole("REFEREE")
                        .requestMatchers(HttpMethod.POST, "/api/races/*/prepare", "/api/races/*/complete",
                                "/api/races/*/report", "/api/races/*/incidents").hasRole("REFEREE")
                        .requestMatchers(HttpMethod.GET, "/api/races/*/notes").hasAnyRole("ADMIN", "REFEREE")
                        .requestMatchers("/api/registrations/*/referee-check").hasRole("REFEREE")
                        .requestMatchers(HttpMethod.PATCH, "/api/registrations/*/dnf").hasRole("REFEREE")
                        .requestMatchers(HttpMethod.PATCH, "/api/registrations/*/approve", "/api/races/*/status").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/registrations/bulk-approve").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/races/*/cancel", "/api/races/*/reschedule").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/races/*/referee").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/races/*/report/revision").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/races/*/registrations", "/api/invitations").hasRole("HORSE_OWNER")
                        .requestMatchers(HttpMethod.PATCH, "/api/invitations/*/respond").hasRole("JOCKEY")
                        .requestMatchers(HttpMethod.POST, "/api/races/*/results").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/races", "/api/tournaments").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/races/**", "/api/tournaments/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/users/role/JOCKEY").hasAnyRole("ADMIN", "HORSE_OWNER", "REFEREE")
                        .requestMatchers("/api/v1/users/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
