export function createTrackHorse(registration, horseName, jockeyName, color) {
  return {
    id: registration.horseId,
    registrationId: registration.id,
    name: horseName,
    jockey: jockeyName,
    color,
  };
}

export function mapRealtimePositions(horses, livePositions, fallbackPositions = []) {
  if (!Array.isArray(livePositions) || livePositions.length === 0) {
    return fallbackPositions;
  }

  return horses.map((horse) => {
    const lane = livePositions.find((item) => Number(item.horseId) === Number(horse.id));
    return Number(lane?.position ?? 0);
  });
}
