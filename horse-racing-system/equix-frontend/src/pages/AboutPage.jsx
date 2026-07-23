import { Link } from 'react-router-dom';
import { GiHorseHead, GiTrophy } from 'react-icons/gi';
import { FiCode, FiDatabase, FiShield, FiUsers } from 'react-icons/fi';
import './AboutPage.css';

const techStack = [
  { icon: <FiCode />, name: 'ReactJS', desc: 'Giao diện được xây dựng theo kiến trúc thành phần' },
  { icon: <FiShield />, name: 'Spring Boot + JWT', desc: 'Backend bảo mật với xác thực bằng token' },
  { icon: <FiDatabase />, name: 'SQL Server', desc: 'Cơ sở dữ liệu quan hệ tuân thủ ACID' },
];

const features = [
  { icon: <GiHorseHead />, title: 'Quản lý ngựa', desc: 'Đăng ký và quản lý chuồng ngựa với hồ sơ chi tiết cùng chiến thuật chạy.' },
  { icon: <FiUsers />, title: 'Ghép nài ngựa', desc: 'Thuê nài ngựa đang sẵn sàng và tạo cặp ngựa–nài ngựa để thi đấu.' },
  { icon: <GiTrophy />, title: 'Hệ thống giải đấu', desc: 'Thi đấu ở cự ly Nước rút, Một dặm, Trung bình và Đường dài với điểm thưởng.' },
  { icon: <FiUsers />, title: 'Tương tác khán giả', desc: 'Xem cuộc đua trực tiếp, dự đoán người thắng và nhận thưởng khi dự đoán đúng.' },
];

function AboutPage() {
  return (
    <div className="about-page" id="about-page">
      <section className="about-hero">
        <div className="container">
          <h1 className="about-hero-title animate-fadeInUp">
            Giới thiệu <span className="text-primary-color">EquiX</span>
          </h1>
          <p className="about-hero-subtitle animate-fadeInUp delay-1">
            Hệ thống quản lý giải đua ngựa toàn diện được xây dựng cho môn SWP391 tại FPT College Vietnam.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Sứ mệnh của chúng tôi</h2>
          <p className="section-subtitle">
            EquiX cung cấp nền tảng đầy đủ để quản lý giải đua ngựa — từ đăng ký, mô phỏng cuộc đua trực tiếp đến công bố kết quả.
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
          <h2 className="section-title">Công nghệ sử dụng</h2>
          <p className="section-subtitle">
            Xây dựng trên các công nghệ hiện đại, tiêu chuẩn ngành để đảm bảo hiệu năng và khả năng mở rộng
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
            Được phát triển trong môn kỹ nghệ phần mềm SWP391, thể hiện kỹ năng full-stack, thiết kế cơ sở dữ liệu và triển khai nghiệp vụ.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-6)' }}>
            Tham gia EquiX ngay
          </Link>
        </div>
      </section>

      <section className="section about-tech-section" id="contact">
        <div className="container text-center">
          <h2 className="section-title">Liên hệ và hỗ trợ</h2>
          <p className="section-subtitle">
            Với bản triển khai học thuật này, hãy liên hệ quản trị viên dự án và cung cấp email tài khoản, vai trò cùng mã cuộc đua liên quan.
          </p>
          <Link to="/faq" className="btn btn-outline" style={{ marginTop: 'var(--space-6)' }}>
            Đọc câu hỏi thường gặp
          </Link>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
