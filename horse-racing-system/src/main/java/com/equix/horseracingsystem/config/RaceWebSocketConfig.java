package com.equix.horseracingsystem.config;

import com.equix.horseracingsystem.realtime.RaceRealtimeWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class RaceWebSocketConfig implements WebSocketConfigurer {

    private final RaceRealtimeWebSocketHandler handler;

    public RaceWebSocketConfig(RaceRealtimeWebSocketHandler handler) {
        this.handler = handler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws/races").setAllowedOriginPatterns("*");
    }
}
