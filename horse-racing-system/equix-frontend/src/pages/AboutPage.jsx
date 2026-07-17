import { Link } from 'react-router-dom';
import { GiHorseHead, GiTrophy } from 'react-icons/gi';
import { FiCode, FiDatabase, FiShield, FiUsers } from 'react-icons/fi';
import './AboutPage.css';

const techStack = [
  { icon: <FiCode />, name: 'ReactJS', desc: 'Component-based frontend framework' },
  { icon: <FiShield />, name: 'Spring Boot + JWT', desc: 'Secure backend with token authentication' },
  { icon: <FiDatabase />, name: 'SQL Server', desc: 'Relational database with ACID compliance' },
];

const features = [
  { icon: <GiHorseHead />, title: 'Horse Management', desc: 'Register and manage your stable of horses with detailed profiles and training positions.' },
  { icon: <FiUsers />, title: 'Jockey Pairing', desc: 'Hire available jockeys and create powerful horse-jockey pairs for competition.' },
  { icon: <GiTrophy />, title: 'Tournament System', desc: 'Compete in Sprint, Mile, Medium, and Long-distance races with prize pools.' },
  { icon: <FiUsers />, title: 'Spectator Engagement', desc: 'Watch live races, place guesses on winners, and earn rewards for correct predictions.' },
];

function AboutPage() {
  return (
    <div className="about-page" id="about-page">
      <section className="about-hero">
        <div className="container">
          <h1 className="about-hero-title animate-fadeInUp">
            About <span className="text-primary-color">EquiX</span>
          </h1>
          <p className="about-hero-subtitle animate-fadeInUp delay-1">
            A comprehensive Horse Racing Tournament Management System built with passion 
            for the SWP391 course at FPT College Vietnam.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Our Mission</h2>
          <p className="section-subtitle">
            EquiX (from 'Equine' + 'X' for the unknown thrill of racing) delivers a full-featured 
            platform for managing horse racing tournaments — from registration to live race simulation 
            and result finalization.
          </p>

          <div className="about-features-grid">
            {features.map((feature, i) => (
              <div key={i} className="about-feature-card">
                <div className="about-feature-icon">{feature.icon}</div>
                <h3 className="about-feature-title">{feature.title}</h3>
                <p className="about-feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-tech-section">
        <div className="container">
          <h2 className="section-title">Technology Stack</h2>
          <p className="section-subtitle">
            Built on modern, industry-standard technologies for scalability and performance
          </p>

          <div className="about-tech-grid">
            {techStack.map((tech, i) => (
              <div key={i} className="about-tech-card">
                <div className="about-tech-icon">{tech.icon}</div>
                <h3 className="about-tech-name">{tech.name}</h3>
                <p className="about-tech-desc">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container text-center">
          <h2 className="section-title">FPT College Vietnam</h2>
          <p className="section-subtitle">
            Developed as part of the SWP391 software engineering course, demonstrating full-stack 
            development skills, database design, and business logic implementation.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-6)' }}>
            Join EquiX Today
          </Link>
        </div>
      </section>

      <section className="section about-tech-section" id="contact">
        <div className="container text-center">
          <h2 className="section-title">Contact & Support</h2>
          <p className="section-subtitle">
            For this academic deployment, contact the project administrator through your course team and include your account email, role, and the affected race ID.
          </p>
          <Link to="/faq" className="btn btn-outline" style={{ marginTop: 'var(--space-6)' }}>
            Read Frequently Asked Questions
          </Link>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
