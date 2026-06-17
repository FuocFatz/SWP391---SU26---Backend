import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import './NotFoundPage.css';

function NotFoundPage() {
  return (
    <div className="not-found-page" id="not-found-page">
      <div className="not-found-content">
        <span className="not-found-emoji">🏇</span>
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Horse has left the track!</h2>
        <p className="not-found-desc">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary btn-lg">
          <FiArrowLeft /> Back to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
