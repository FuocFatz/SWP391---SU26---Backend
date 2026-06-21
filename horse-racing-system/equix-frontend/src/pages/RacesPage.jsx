import { useState, useEffect } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';
import { api } from '../services/api';
import RaceCard from '../components/RaceCard/RaceCard';
import './RacesPage.css';

const statusFilters = ['All', 'DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'STANDBY', 'IN_PROGRESS', 'COMPLETED', 'REPORT_READY', 'OFFICIAL', 'CANCELLED'];
const typeFilters = ['All', 'Sprint', 'Mile', 'Medium', 'Long'];

function RacesPage() {
  const [races, setRaces] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        setLoading(true);
        const data = await api.getRaces();
        setRaces(Array.isArray(data) ? data : []);
        setError('');
      } catch (err) {
        console.error('Failed to fetch races:', err);
        setError('Failed to load races');
        setRaces([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRaces();
  }, []);

  const filtered = races.filter((race) => {
    const matchSearch = race.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || race.status === statusFilter;
    const matchType = typeFilter === 'All' || race.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="races-page" id="races-page">
      <div className="container">
        <div className="races-page-header">
          <h1 className="races-page-title">All Races</h1>
          <p className="races-page-subtitle">Browse upcoming, live, and completed races</p>
        </div>

        {error && (
          <div className="races-error" style={{ padding: '1rem', backgroundColor: '#fee', borderRadius: '0.5rem', color: '#c00', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="races-filters">
          <div className="races-search">
            <FiSearch className="races-search-icon" />
            <input
              type="text"
              className="form-input races-search-input"
              placeholder="Search races..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="race-search"
            />
          </div>

          <div className="races-filter-group">
            <FiFilter className="races-filter-icon" />
            <select
              className="form-select races-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              id="race-status-filter"
            >
              {statusFilters.map((s) => (
                <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>
              ))}
            </select>

            <select
              className="form-select races-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              id="race-type-filter"
            >
              {typeFilters.map((t) => (
                <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading races...</div>
        ) : (
          <>
            <div className="races-results-count">
              Showing {filtered.length} of {races.length} races
            </div>

            <div className="races-grid">
              {filtered.map((race) => (
                <RaceCard key={race.id} race={race} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="races-empty">
                <p>No races match your filters. Try adjusting your search.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default RacesPage;
