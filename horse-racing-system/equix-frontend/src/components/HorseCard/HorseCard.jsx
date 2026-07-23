import './HorseCard.css';

const statusStyles = {
  Available: 'badge-green',
  Training: 'badge-yellow',
  Paired: 'badge-neutral',
  Registered: 'badge-red',
  Unavailable: 'badge-neutral',
};

const statusLabels = {
  Available: 'Sẵn sàng',
  Training: 'Đang huấn luyện',
  Paired: 'Đã ghép cặp',
  Registered: 'Đã đăng ký',
  Unavailable: 'Không sẵn sàng',
};

const positionLabels = {
  Front: 'Dẫn đầu',
  Pace: 'Bám tốc độ',
  Late: 'Tăng tốc cuối',
  End: 'Nước rút cuối',
};

const positionEmojis = {
  Front: '🏃',
  Pace: '⚡',
  Late: '🔥',
  End: '💨',
};

function HorseCard({ horse, onClick }) {
  const {
    id = 1,
    name = 'Thunder Bolt',
    breed = 'Thoroughbred',
    age = 4,
    weight = 480,
    position = 'Front',
    status = 'Available',
    portrait = null,
  } = horse || {};

  return (
    <div className="horse-card" id={`horse-card-${id}`} onClick={onClick}>
      <div className="horse-card-portrait">
        {portrait ? (
          <img src={portrait} alt={name} className="horse-card-img" />
        ) : (
          <div className="horse-card-placeholder">
            <span>🐎</span>
          </div>
        )}
        <span className={`horse-card-status badge ${statusStyles[status] || 'badge-neutral'}`}>
          {statusLabels[status] || status}
        </span>
      </div>

      <div className="horse-card-body">
        <h4 className="horse-card-name">{name}</h4>
        <p className="horse-card-breed">{breed}</p>

        <div className="horse-card-stats">
          <div className="horse-card-stat">
            <span className="horse-card-stat-label">Tuổi</span>
            <span className="horse-card-stat-value">{age} tuổi</span>
          </div>
          <div className="horse-card-stat">
            <span className="horse-card-stat-label">Cân nặng</span>
            <span className="horse-card-stat-value">{weight}kg</span>
          </div>
          <div className="horse-card-stat">
            <span className="horse-card-stat-label">Vị trí</span>
            <span className="horse-card-stat-value">{positionEmojis[position]} {positionLabels[position] || position}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HorseCard;
