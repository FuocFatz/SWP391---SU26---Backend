import { Link } from 'react-router-dom';
import { FiClock, FiUsers, FiAward } from 'react-icons/fi';
import './RaceCard.css';

const statusConfig = {
  DRAFT: { className: 'status-closed', label: 'Bản nháp' },
  REGISTRATION_OPEN: { className: 'status-open', label: 'Đang mở đăng ký' },
  REGISTRATION_CLOSED: { className: 'status-closed', label: 'Đã đóng đăng ký' },
  STANDBY: { className: 'status-standby', label: 'Chờ xuất phát' },
  IN_PROGRESS: { className: 'status-live', label: 'Đang diễn ra' },
  COMPLETED: { className: 'status-completed', label: 'Đã hoàn thành' },
  REPORT_READY: { className: 'status-report', label: 'Đã có báo cáo' },
  REVISION_REQUIRED: { className: 'status-report', label: 'Cần chỉnh sửa' },
  OFFICIAL: { className: 'status-official', label: 'Chính thức' },
  CANCELLED: { className: 'status-closed', label: 'Đã hủy' },
};

const typeLabels = { SPRINT: 'NƯỚC RÚT', MILE: 'MỘT DẶM', MEDIUM: 'TRUNG BÌNH', LONG: 'ĐƯỜNG DÀI' };

function RaceCard({ race }) {
  if (!race?.id) return null;
  const type = String(race.type || 'Race').toUpperCase();
  const typeClass = ['SPRINT', 'MILE', 'MEDIUM', 'LONG'].includes(type) ? type.toLowerCase() : 'sprint';
  const status = String(race.status || 'DRAFT').toUpperCase().replaceAll(' ', '_');
  const statusCfg = statusConfig[status] || { className: 'status-closed', label: status.replaceAll('_', ' ') };

  return (
    <Link to={`/races/${race.id}`} className="race-card" id={`race-card-${race.id}`}>
      <div className={`race-card-type-strip type-${typeClass}`} />
      <div className="race-card-header">
        <span className={`race-card-type-badge type-${typeClass}`}>{typeLabels[type] || type}</span>
        <span className={`race-card-status ${statusCfg.className}`}>{statusCfg.label}</span>
      </div>
      <h3 className="race-card-name">{race.name || `Cuộc đua #${race.id}`}</h3>
      <div className="race-card-details">
        <div className="race-card-detail"><FiClock /><span>{race.raceDate || 'Chưa xác định ngày'} - {race.raceTime ? String(race.raceTime).slice(0, 5) : 'Chưa xác định giờ'}</span></div>
        <div className="race-card-detail"><FiUsers /><span>Tối đa {race.maxParticipants || 18} cặp</span></div>
        <div className="race-card-detail"><FiAward /><span>{race.distanceM ? `${race.distanceM}m` : 'Chưa xác định cự ly'}</span></div>
      </div>
      <div className="race-card-footer">
        <div className="race-card-prize">
          <span className="race-card-prize-label">{Number(race.prizePool || 0) > 0 ? 'Tổng điểm thưởng' : 'Cuộc đua giao hữu'}</span>
          <span className="race-card-prize-value">{Number(race.prizePool || 0) > 0 ? `${Number(race.prizePool).toLocaleString()} point` : 'Không có điểm thưởng'}</span>
        </div>
        <span className="race-card-arrow">Xem</span>
      </div>
    </Link>
  );
}

export default RaceCard;
