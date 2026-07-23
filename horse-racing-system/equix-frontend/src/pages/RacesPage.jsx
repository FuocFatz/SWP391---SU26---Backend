import { useState, useEffect } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';
import { api } from '../services/api';
import { subscribeRaceRealtime } from '../services/raceRealtime';
import RaceCard from '../components/RaceCard/RaceCard';
import './RacesPage.css';

const statusFilters = ['All', 'DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'STANDBY', 'IN_PROGRESS', 'COMPLETED', 'REPORT_READY', 'REVISION_REQUIRED', 'OFFICIAL', 'CANCELLED'];
const typeFilters = ['All', 'SPRINT', 'MILE', 'MEDIUM', 'LONG'];

function RacesPage() {
  const [races, setRaces] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        setLoading(true);
        const data = await api.getRaces();
        setRaces(Array.isArray(data) ? data : []);
        setError('');
      } catch (err) {
        console.error('Failed to fetch races:', err);
        setError('Không thể tải danh sách cuộc đua');
        setRaces([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRaces();
  }, []);

  useEffect(() => subscribeRaceRealtime((event) => {
    if (event?.type !== 'RACE_STATE' || !event.payload?.id) return;
    setRaces((current) => {
      const exists = current.some((race) => Number(race.id) === Number(event.payload.id));
      return exists
        ? current.map((race) => Number(race.id) === Number(event.payload.id) ? event.payload : race)
        : [...current, event.payload];
    });
  }, setRealtimeStatus), []);

  const filtered = races.filter((race) => {
    const matchSearch = String(race.name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || String(race.status || '').toUpperCase() === statusFilter;
    const matchType = typeFilter === 'All' || String(race.type || '').toUpperCase() === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="races-page" id="races-page">
      <div className="container">
        <div className="races-page-header">
          <h1 className="races-page-title">Tất cả cuộc đua</h1>
          <p className="races-page-subtitle">Xem các cuộc đua sắp diễn ra, đang diễn ra, đã hoàn thành hoặc đã hủy</p>
          <span className={`races-realtime-status ${realtimeStatus}`}><i />{realtimeStatus === 'connected' ? 'Đã kết nối cập nhật trực tiếp' : 'Đang kết nối cập nhật trực tiếp…'}</span>
        </div>

        {error && (
          <div className="races-error page-state error">
            {error}
          </div>
        )}

        <div className="races-filters">
          <label className="form-field races-search-field">
            <span className="form-field-label">Tìm cuộc đua</span>
            <span className="races-search">
              <FiSearch className="races-search-icon" aria-hidden="true" />
              <input
                type="text"
                className="form-input races-search-input"
                placeholder="Tìm theo tên cuộc đua"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="race-search"
              />
            </span>
          </label>

          <div className="races-filter-group">
            <FiFilter className="races-filter-icon" aria-hidden="true" />
            <label className="form-field races-filter-field">
              <span className="form-field-label">Trạng thái cuộc đua</span>
              <select
                className="form-select races-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                id="race-status-filter"
              >
                {statusFilters.map((s) => (
                  <option key={s} value={s}>{s === 'All' ? 'Tất cả trạng thái' : s}</option>
                ))}
              </select>
            </label>

            <label className="form-field races-filter-field">
              <span className="form-field-label">Loại cuộc đua</span>
              <select
                className="form-select races-filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                id="race-type-filter"
              >
                {typeFilters.map((t) => (
                  <option key={t} value={t}>{t === 'All' ? 'Tất cả loại' : t}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="page-state">Đang tải cuộc đua...</div>
        ) : (
          <>
            <div className="races-results-count">
              Đang hiển thị {filtered.length}/{races.length} cuộc đua
            </div>

            <div className="races-grid">
              {filtered.map((race) => (
                <RaceCard key={race.id} race={race} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="races-empty">
                <p>Không có cuộc đua phù hợp. Hãy điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default RacesPage;
