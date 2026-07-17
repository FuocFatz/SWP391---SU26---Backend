import { useState, useEffect } from 'react';
import { GiHorseHead } from 'react-icons/gi';
import './RaceTrack.css';

const defaultHorses = [
  { id: 1, name: 'Thunder Storm', jockey: 'Rider A', color: '#E74C3C' },
  { id: 2, name: 'Lightning Bolt', jockey: 'Rider B', color: '#3498DB' },
  { id: 3, name: 'Golden Arrow', jockey: 'Rider C', color: '#F39C12' },
  { id: 4, name: 'Silver Wind', jockey: 'Rider D', color: '#2ECC71' },
  { id: 5, name: 'Dark Phoenix', jockey: 'Rider E', color: '#9B59B6' },
  { id: 6, name: 'Midnight Run', jockey: 'Rider F', color: '#1ABC9C' },
];

function RaceTrack({ horses = defaultHorses, duration = 67, isLive = true }) {
  const [positions, setPositions] = useState(() => horses.map((_, index) => (index * 7) % 11));
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(isLive);

  useEffect(() => {
    if (!isRunning) return undefined;

    const posInterval = setInterval(() => {
      setPositions((prev) =>
        prev.map((pos) => Math.min(pos + Math.random() * 3 + 0.5, 100)),
      );
    }, 800);

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          setIsRunning(false);
          clearInterval(posInterval);
          clearInterval(timerInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(posInterval);
      clearInterval(timerInterval);
    };
  }, [isRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sortedHorses = horses
    .map((horse, index) => ({ ...horse, position: positions[index] || 0 }))
    .sort((a, b) => b.position - a.position);

  return (
    <div className="race-track" id="live-race-track">
      <div className="race-track-timer">
        <div className={`race-track-timer-display ${isRunning ? 'live' : ''}`}>
          <span className="race-track-timer-label">
            {isRunning ? 'LIVE' : 'FINISHED'}
          </span>
          <span className="race-track-timer-value">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="race-track-lanes">
        {horses.map((horse, index) => (
          <div key={horse.id} className="race-track-lane">
            <div className="race-track-lane-info">
              <span className="race-track-lane-number">{index + 1}</span>
              <span className="race-track-lane-name">{horse.name}</span>
            </div>
            <div className="race-track-lane-bar">
              <div
                className="race-track-horse-marker"
                style={{
                  left: `${Math.min(positions[index] || 0, 95)}%`,
                  backgroundColor: horse.color,
                  boxShadow: `0 0 10px ${horse.color}40`,
                }}
              >
                <GiHorseHead />
              </div>
              <div className="race-track-lane-fill" style={{
                width: `${positions[index] || 0}%`,
                background: `linear-gradient(90deg, ${horse.color}20, ${horse.color}05)`,
              }} />
            </div>
          </div>
        ))}
      </div>

      <div className="race-track-positions">
        <h4 className="race-track-positions-title">Current Positions</h4>
        {sortedHorses.map((horse, index) => (
          <div key={horse.id} className={`race-track-position-row ${index < 3 ? 'top' : ''}`}>
            <span className="race-track-position-rank">{index + 1}</span>
            <span
              className="race-track-position-dot"
              style={{ backgroundColor: horse.color }}
            />
            <span className="race-track-position-name">{horse.name}</span>
            <span className="race-track-position-jockey">{horse.jockey}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RaceTrack;
