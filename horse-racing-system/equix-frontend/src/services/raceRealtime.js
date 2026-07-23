import { getRaceRealtimeUrl } from './api';

export function subscribeRaceRealtime(onEvent, onConnectionChange = () => {}) {
  let socket;
  let retryTimer;
  let stopped = false;

  const connect = () => {
    if (stopped) return;
    onConnectionChange('connecting');
    socket = new WebSocket(getRaceRealtimeUrl());

    socket.addEventListener('open', () => onConnectionChange('connected'));
    socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        onEvent(message);
      } catch {
        // Ignore malformed frames; the next valid race event remains usable.
      }
    });
    socket.addEventListener('close', () => {
      if (stopped) return;
      onConnectionChange('reconnecting');
      retryTimer = window.setTimeout(connect, 1500);
    });
    socket.addEventListener('error', () => socket?.close());
  };

  connect();
  return () => {
    stopped = true;
    window.clearTimeout(retryTimer);
    socket?.close();
  };
}
