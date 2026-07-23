package com.equix.horseracingsystem.realtime;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class RaceRealtimeWebSocketHandler extends TextWebSocketHandler {

    private final RaceRealtimePublisher publisher;

    public RaceRealtimeWebSocketHandler(RaceRealtimePublisher publisher) {
        this.publisher = publisher;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        publisher.register(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        publisher.unregister(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        publisher.unregister(session);
    }
}
