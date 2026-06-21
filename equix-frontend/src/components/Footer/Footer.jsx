import { Link } from 'react-router-dom';
import { GiHorseshoe } from 'react-icons/gi';
import { FiGithub, FiMail } from 'react-icons/fi';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="footer-glow" />
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <GiHorseshoe className="footer-logo-icon" />
              <span>Equi<span className="footer-logo-accent">X</span></span>
            </Link>
            <p className="footer-tagline">
              Experience the thrill of professional horse racing management. 
              Register, race, and win.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4 className="footer-section-title">Quick Links</h4>
            <Link to="/" className="footer-link">Home</Link>
            <Link to="/races" className="footer-link">Races</Link>
            <Link to="/leaderboard" className="footer-link">Leaderboard</Link>
            <Link to="/about" className="footer-link">About</Link>
          </div>

          {/* Legal */}
          <div className="footer-section">
            <h4 className="footer-section-title">Legal</h4>
            <Link to="/terms" className="footer-link">Terms of Service</Link>
            <Link to="/about" className="footer-link">Privacy Policy</Link>
            <Link to="/about" className="footer-link">Contact Us</Link>
          </div>

          {/* Connect */}
          <div className="footer-section">
            <h4 className="footer-section-title">Connect</h4>
            <div className="footer-socials">
              <a href="#" className="footer-social-btn" aria-label="GitHub">
                <FiGithub />
              </a>
              <a href="#" className="footer-social-btn" aria-label="Email">
                <FiMail />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-credit">
            © 2026 EquiX — SWP391 · FPT College Vietnam
          </p>
          <p className="footer-tech">
            Built with React + Spring Boot + MySQL
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
