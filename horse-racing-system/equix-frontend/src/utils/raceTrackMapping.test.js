import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrackHorse, mapRealtimePositions } from './raceTrackMapping.js';

test('track horse keeps horse id separate from registration id', () => {
  const trackHorse = createTrackHorse(
    { id: 401, horseId: 101 },
    'Storm Chaser',
    'Alex Morgan',
    '#E74C3C',
  );

  assert.equal(trackHorse.id, 101);
  assert.equal(trackHorse.registrationId, 401);
});

test('all realtime lanes move when registration ids do not match horse ids', () => {
  const registrations = Array.from({ length: 12 }, (_, index) => ({
    id: 401 + index,
    horseId: 101 + index,
  }));
  const horses = registrations.map((registration, index) =>
    createTrackHorse(registration, `Horse ${index + 1}`, `Jockey ${index + 1}`, '#fff'));
  const livePositions = registrations.map((registration, index) => ({
    registrationId: registration.id,
    horseId: registration.horseId,
    position: 20 + index,
  }));

  assert.deepEqual(
    mapRealtimePositions(horses, livePositions),
    Array.from({ length: 12 }, (_, index) => 20 + index),
  );
});
