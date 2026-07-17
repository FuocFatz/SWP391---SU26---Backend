import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiPlay, FiUsers, FiFlag, FiTrendingUp } from 'react-icons/fi';
import { GiHorseHead, GiTrophy } from 'react-icons/gi';
import RaceCard from '../components/RaceCard/RaceCard';
import LeaderboardTable from '../components/LeaderboardTable/LeaderboardTable';
import { api } from '../services/api';
import './HomePage.css';

const steps = [
  { icon: <FiUsers />, title: 'Register', desc: 'Create an account as an Owner, Jockey, or Spectator' },
  { icon: <GiHorseHead />, title: 'Build Your Stable', desc: 'Add horses and pair them with available jockeys' },
  { icon: <FiFlag />, title: 'Enter Races', desc: 'Register eligible horse-jockey pairs for open races' },
  { icon: <GiTrophy />, title: 'Win Glory', desc: 'Complete the official workflow and climb the leaderboard' },
];

function HomePage() {
  const [data, setData] = useState({ races: [], horses: [], horseLeaders: [], jockeyLeaders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getRaces(), api.getHorses(), api.getHorseLeaderboard(), api.getJockeyLeaderboard()])
      .then(([races, horses, horseLeaders, jockeyLeaders]) => setData({
        races: Array.isArray(races) ? races : [],
        horses: Array.isArray(horses) ? horses : [],
        horseLeaders: Array.isArray(horseLeaders) ? horseLeaders : [],
        jockeyLeaders: Array.isArray(jockeyLeaders) ? jockeyLeaders : [],
      }))
      .catch((err) => setError(err.message || 'Unable to load live EquiX data'))
      .finally(() => setLoading(false));
  }, []);

  const liveRace = data.races.find((race) => race.status === 'IN_PROGRESS');
  const featuredRaces = useMemo(() => [...data.races]
    .sort((a, b) => `${a.raceDate || ''}${a.raceTime || ''}`.localeCompare(`${b.raceDate || ''}${b.raceTime || ''}`))
    .slice(0, 4), [data.races]);
  const officialRaces = data.races.filter((race) => race.status === 'OFFICIAL').length;
  const totalPrize = data.races.reduce((sum, race) => sum + Number(race.prizePool || 0), 0);
  const stats = [
    { icon: <GiHorseHead />, value: data.horses.length, label: 'Registered Horses' },
    { icon: <FiUsers />, value: data.jockeyLeaders.length, label: 'Ranked Jockeys' },
    { icon: <FiFlag />, value: officialRaces, label: 'Official Races' },
    { icon: <FiTrendingUp />, value: totalPrize.toLocaleString(), label: 'Prize Pool (VND)' },
  ];

  return (
    <div className="home-page" id="home-page">
      <section className="hero-section" id="hero-section">
        <div className="hero-bg-effects"><div className="hero-glow hero-glow-1" /><div className="hero-glow hero-glow-2" /></div>
        <div className="container hero-content">
          <div className="hero-badge animate-fadeIn"><span className={`status-dot ${liveRace ? 'status-dot-live' : 'status-dot-active'}`} />{liveRace ? 'Live Race Available' : 'Race Management Online'}</div>
          <h1 className="hero-title animate-fadeInUp delay-1">Experience the Thrill of<span className="hero-title-accent"> Horse Racing</span></h1>
          <p className="hero-subtitle animate-fadeInUp delay-2">Manage horses, pair jockeys, complete controlled race workflows, and follow official results in EquiX.</p>
          <div className="hero-actions animate-fadeInUp delay-3">
            <Link to="/register" className="btn btn-primary btn-lg">Get Started <FiArrowRight /></Link>
            <Link to="/races" className="btn btn-outline btn-lg"><FiPlay /> View Races</Link>
          </div>
          <div className="hero-stats animate-fadeInUp delay-4">
            {stats.map((stat) => <div key={stat.label} className="hero-stat"><span className="hero-stat-icon">{stat.icon}</span><span className="hero-stat-value">{stat.value}</span><span className="hero-stat-label">{stat.label}</span></div>)}
          </div>
        </div>
        <div className="hero-horse-silhouette"><span className="hero-horse-emoji">♞</span></div>
      </section>

      {liveRace && <section className="live-banner" id="live-banner"><div className="container"><div className="live-banner-content"><div className="live-banner-left"><span className="live-banner-dot status-dot status-dot-live" /><span className="live-banner-label">Race in progress</span><span className="live-banner-name">{liveRace.name} — {liveRace.type} {liveRace.distanceM}m</span></div><Link to={`/races/${liveRace.id}`} className="btn btn-primary btn-sm">Watch Live <FiArrowRight /></Link></div></div></section>}

      <section className="section" id="featured-races">
        <div className="container">
          <h2 className="section-title">Featured Races</h2>
          <p className="section-subtitle">Current races loaded from the EquiX SQL Server database</p>
          {loading && <div className="page-state">Loading races...</div>}
          {error && <div className="page-state error">{error}</div>}
          {!loading && !error && <div className="races-grid">{featuredRaces.map((race) => <RaceCard key={race.id} race={race} />)}</div>}
          {!loading && !error && !featuredRaces.length && <div className="page-state">No races are scheduled yet.</div>}
          <div className="text-center" style={{ marginTop: 'var(--space-10)' }}><Link to="/races" className="btn btn-outline btn-lg">View All Races <FiArrowRight /></Link></div>
        </div>
      </section>

      <section className="section how-it-works" id="how-it-works"><div className="container"><h2 className="section-title">How It Works</h2><p className="section-subtitle">Four role-aware steps from registration to official results</p><div className="steps-grid">{steps.map((step, index) => <div key={step.title} className="step-card"><div className="step-number">{index + 1}</div><div className="step-icon">{step.icon}</div><h3 className="step-title">{step.title}</h3><p className="step-desc">{step.desc}</p></div>)}</div></div></section>

      <section className="section" id="leaderboard-preview"><div className="container"><h2 className="section-title">Top Performers</h2><p className="section-subtitle">Official points from completed race results</p><LeaderboardTable data={data.horseLeaders.slice(0, 5)} compact /><div className="text-center" style={{ marginTop: 'var(--space-8)' }}><Link to="/leaderboard" className="btn btn-outline">Full Leaderboard <FiArrowRight /></Link></div></div></section>

      <section className="cta-section" id="cta-section"><div className="container"><div className="cta-card"><div className="cta-glow" /><h2 className="cta-title">Ready to Race?</h2><p className="cta-desc">Create a public account and enter the workflow for your selected role.</p><div className="cta-actions"><Link to="/register" className="btn btn-primary btn-lg">Create Account <FiArrowRight /></Link><Link to="/faq" className="btn btn-ghost btn-lg">Read FAQ</Link></div></div></div></section>
    </div>
  );
}

export default HomePage;
