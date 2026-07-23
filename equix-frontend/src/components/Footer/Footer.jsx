import { Link } from 'react-router-dom';
import { GiHorseshoe } from 'react-icons/gi';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="footer-glow" />
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand"><Link to="/" className="footer-logo"><GiHorseshoe className="footer-logo-icon" /><span>Equi<span className="footer-logo-accent">X</span></span></Link><p className="footer-tagline">Quản lý giải đua ngựa theo từng vai trò, từ đăng ký đến kết quả chính thức.</p></div>
          <div className="footer-section"><h4 className="footer-section-title">Khám phá</h4><Link to="/" className="footer-link">Trang chủ</Link><Link to="/races" className="footer-link">Cuộc đua</Link><Link to="/leaderboard" className="footer-link">Bảng xếp hạng</Link><Link to="/faq" className="footer-link">Hỏi đáp</Link></div>
          <div className="footer-section"><h4 className="footer-section-title">Pháp lý</h4><Link to="/terms" className="footer-link">Điều khoản dịch vụ</Link><Link to="/terms#privacy" className="footer-link">Chính sách bảo mật</Link></div>
          <div className="footer-section"><h4 className="footer-section-title">Hỗ trợ</h4><Link to="/about" className="footer-link">Giới thiệu EquiX</Link><Link to="/about#contact" className="footer-link">Liên hệ</Link><Link to="/login" className="footer-link">Truy cập tài khoản</Link></div>
        </div>
        <div className="footer-bottom"><p className="footer-credit">© 2026 EquiX — SWP391 · FPT College Vietnam</p><p className="footer-tech">Xây dựng bằng React + Spring Boot + SQL Server</p></div>
      </div>
    </footer>
  );
}

export default Footer;
