import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiPlay, FiUsers, FiAward, FiFlag, FiTrendingUp } from "react-icons/fi";
import { GiHorseHead, GiTrophy } from "react-icons/gi";
import RaceCard from "../components/RaceCard/RaceCard";
import LeaderboardTable from "../components/LeaderboardTable/LeaderboardTable";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import "./HomePage.css";

const steps = [
  { icon: <FiUsers />, title: 'Register', desc: 'Create your account as an Owner, Jockey, or Spectator' },
  { icon: <GiHorseHead />, title: 'Build Your Stable', desc: 'Add horses and pair them with skilled jockeys' },
  { icon: <FiFlag />, title: 'Enter Races', desc: 'Register your pairs for exciting tournaments' },
  { icon: <GiTrophy />, title: 'Win Glory', desc: 'Compete for prizes and climb the leaderboard' },
];

function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [races, setRaces] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [racesData, leaderboardData] = await Promise.all([
          api.getRaces().catch(() => []),
          api.getHorseLeaderboard().catch(() => [])
        ]);
        setRaces(Array.isArray(racesData) ? racesData : []);
        setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const liveRace = races.find(r => r.status === 'IN_PROGRESS');
  const featuredRaces = races.filter(r => r.status === 'REGISTRATION_OPEN' || r.status === 'STANDBY').slice(0, 4);

  return (
    <div className="home-page" id="home-page">
      {/* Hero Section */}
      <section className="hero-section" id="hero-section">
        <div className="hero-bg-effects">
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
          <div className="hero-particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="hero-particle" style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }} />
            ))}
          </div>
        </div>

        <div className="container hero-content">
          <div className="hero-badge animate-fadeIn">
            <span className="status-dot status-dot-live" />
            Live Races Available
          </div>

          <h1 className="hero-title animate-fadeInUp delay-1">
            Experience the Thrill of
            <span className="hero-title-accent"> Horse Racing</span>
          </h1>

          <p className="hero-subtitle animate-fadeInUp delay-2">
            Register your horses, hire world-class jockeys, compete in thrilling tournaments, 
            and rise to the top of the leaderboard. Welcome to EquiX.
          </p>

          <div className="hero-actions animate-fadeInUp delay-3">
            <button onClick={handleGetStarted} className="btn btn-primary btn-lg" id="get-started-btn">
              Get Started <FiArrowRight />
            </button>
            <Link to="/races" className="btn btn-outline btn-lg">
              <FiPlay /> View Races
            </Link>
          </div>
        </div>

        <div className="hero-horse-silhouette">
          <span className="hero-horse-emoji">🏇</span>
        </div>
      </section>

      {/* Live Race Banner */}
      {liveRace && (
        <section className="live-banner" id="live-banner">
          <div className="container">
            <div className="live-banner-content">
              <div className="live-banner-left">
                <span className="live-banner-dot status-dot status-dot-live" />
                <span className="live-banner-label">RACE IN PROGRESS</span>
                <span className="live-banner-name">{liveRace.name} — {liveRace.type} {liveRace.distanceM}m</span>
              </div>
              <Link to={`/races/${liveRace.id}`} className="btn btn-primary btn-sm">
                Watch Live <FiArrowRight />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Races */}
      <section className="section" id="featured-races">
        <div className="container">
          <h2 className="section-title">Featured Races</h2>
          <p className="section-subtitle">
            Browse upcoming tournaments and register your horse-jockey pairs for exciting competitions
          </p>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading races...</div>
          ) : featuredRaces.length > 0 ? (
            <div className="races-grid">
              {featuredRaces.map((race) => (
                <RaceCard key={race.id} race={race} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded shadow-sm border border-gray-100">
              No upcoming featured races available at the moment. Check back soon!
            </div>
          )}

          <div className="text-center" style={{ marginTop: 'var(--space-10)' }}>
            <Link to="/races" className="btn btn-outline btn-lg">
              View All Races <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section how-it-works" id="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Getting started with EquiX is simple — follow these four steps to begin your racing journey
          </p>

          <div className="steps-grid">
            {steps.map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-number">{i + 1}</div>
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="section" id="leaderboard-preview">
        <div className="container">
          <h2 className="section-title">Top Performers</h2>
          <p className="section-subtitle">
            The highest-ranked horses and their owners across all race types
          </p>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading leaderboard...</div>
          ) : leaderboard.length > 0 ? (
            <LeaderboardTable data={leaderboard.slice(0, 5)} compact />
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded shadow-sm border border-gray-100">
              Leaderboard is currently empty. Start racing to make your mark!
            </div>
          )}

          <div className="text-center" style={{ marginTop: 'var(--space-8)' }}>
            <Link to="/leaderboard" className="btn btn-outline">
              Full Leaderboard <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-glow" />
            <h2 className="cta-title">Ready to Race?</h2>
            <p className="cta-desc">
              Join thousands of horse racing enthusiasts. Create your account and start building your legacy today.
            </p>
            <div className="cta-actions">
              <button onClick={handleGetStarted} className="btn btn-primary btn-lg" id="cta-get-started-btn">
                {isAuthenticated ? "Go to Dashboard" : "Create Account"} <FiArrowRight />
              </button>
              <Link to="/about" className="btn btn-ghost btn-lg">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;