package com.equix.horseracingsystem.realtime;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RaceRealtimePublisher {

    private final ObjectMapper objectMapper;
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    public RaceRealtimePublisher(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void register(WebSocketSession session) {
        sessions.add(session);
        send(session, Map.of("type", "CONNECTED", "sentAt", LocalDateTime.now().toString()));
    }

    public void unregister(WebSocketSession session) {
        sessions.remove(session);
    }

    public boolean hasSubscribers() {
        return sessions.stream().anyMatch(WebSocketSession::isOpen);
    }

    public void publishRaceState(Object race) {
        broadcast(Map.of("type", "RACE_STATE", "payload", race, "sentAt", LocalDateTime.now().toString()));
    }

    public void publishSimulation(Object simulation) {
        broadcast(Map.of("type", "RACE_SIMULATION", "payload", simulation, "sentAt", LocalDateTime.now().toString()));
    }

    private void broadcast(Object payload) {
        sessions.removeIf(session -> !session.isOpen());
        sessions.forEach(session -> send(session, payload));
    }

    private void send(WebSocketSession session, Object payload) {
        if (!session.isOpen()) return;
        try {
            synchronized (session) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
            }
        } catch (IOException exception) {
            sessions.remove(session);
        }
    }
}
