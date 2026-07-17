import { Link } from 'react-router-dom';
import { GiHorseshoe } from 'react-icons/gi';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="footer-glow" />
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand"><Link to="/" className="footer-logo"><GiHorseshoe className="footer-logo-icon" /><span>Equi<span className="footer-logo-accent">X</span></span></Link><p className="footer-tagline">Role-aware horse racing tournament management from registration to official results.</p></div>
          <div className="footer-section"><h4 className="footer-section-title">Explore</h4><Link to="/" className="footer-link">Home</Link><Link to="/races" className="footer-link">Races</Link><Link to="/leaderboard" className="footer-link">Leaderboard</Link><Link to="/faq" className="footer-link">FAQ</Link></div>
          <div className="footer-section"><h4 className="footer-section-title">Legal</h4><Link to="/terms" className="footer-link">Terms of Service</Link><Link to="/terms#privacy" className="footer-link">Privacy Policy</Link></div>
          <div className="footer-section"><h4 className="footer-section-title">Support</h4><Link to="/about" className="footer-link">About EquiX</Link><Link to="/about#contact" className="footer-link">Contact</Link><Link to="/login" className="footer-link">Account Access</Link></div>
        </div>
        <div className="footer-bottom"><p className="footer-credit">© 2026 EquiX — SWP391 · FPT College Vietnam</p><p className="footer-tech">Built with React + Spring Boot + SQL Server</p></div>
      </div>
    </footer>
  );
}

export default Footer;
