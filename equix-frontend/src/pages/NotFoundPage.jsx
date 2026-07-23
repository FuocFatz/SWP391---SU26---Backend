import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import './NotFoundPage.css';

function NotFoundPage() {
  return (
    <div className="not-found-page" id="not-found-page">
      <div className="not-found-content">
        <span className="not-found-emoji">🏇</span>
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Ngựa đã rời khỏi đường đua!</h2>
        <p className="not-found-desc">
          Trang bạn đang tìm không tồn tại hoặc đã được chuyển đi.
        </p>
        <Link to="/" className="btn btn-primary btn-lg">
          <FiArrowLeft /> Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
