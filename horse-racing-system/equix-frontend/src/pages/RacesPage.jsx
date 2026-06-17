import { useState } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';
import RaceCard from '../components/RaceCard/RaceCard';
import './RacesPage.css';

const allRaces = [
  { id: 1, name: 'Summer Thunder Cup', type: 'Sprint', distance: 1200, date: '2026-07-20', time: '14:00', participants: 10, maxParticipants: 12, prizePool: 75000, status: 'Registration Open' },
  { id: 2, name: 'Golden Mile Classic', type: 'Mile', distance: 1600, date: '2026-07-22', time: '15:30', participants: 8, maxParticipants: 12, prizePool: 120000, status: 'Registration Open' },
  { id: 3, name: 'Emerald Stakes', type: 'Medium', distance: 2200, date: '2026-07-25', time: '14:00', participants: 12, maxParticipants: 14, prizePool: 95000, status: 'Registration Closed' },
  { id: 4, name: 'Royal Long Distance', type: 'Long', distance: 3000, date: '2026-07-28', time: '13:00', participants: 6, maxParticipants: 10, prizePool: 150000, status: 'Registration Open' },
  { id: 5, name: 'Phoenix Sprint Challenge', type: 'Sprint', distance: 1400, date: '2026-08-01', time: '14:00', participants: 14, maxParticipants: 18, prizePool: 60000, status: 'In Progress' },
  { id: 6, name: 'Diamond Mile Stakes', type: 'Mile', distance: 1800, date: '2026-08-05', time: '15:00', participants: 10, maxParticipants: 12, prizePool: 100000, status: 'Registration Open' },
  { id: 7, name: 'Grand Medium Cup', type: 'Medium', distance: 2400, date: '2026-07-15', time: '14:00', participants: 12, maxParticipants: 12, prizePool: 85000, status: 'Official' },
  { id: 8, name: 'Victory Sprint', type: 'Sprint', distance: 1000, date: '2026-07-10', time: '13:00', participants: 8, maxParticipants: 10, prizePool: 45000, status: 'Completed' },
];

const statusFilters = ['All', 'Registration Open', 'Registration Closed', 'In Progress', 'Completed', 'Official'];
const typeFilters = ['All', 'Sprint', 'Mile', 'Medium', 'Long'];

function RacesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const filtered = allRaces.filter((race) => {
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

        <div className="races-results-count">
          Showing {filtered.length} of {allRaces.length} races
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
      </div>
    </div>
  );
}

export default RacesPage;
