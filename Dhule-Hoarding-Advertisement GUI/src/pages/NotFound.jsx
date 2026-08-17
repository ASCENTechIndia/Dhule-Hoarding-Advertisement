import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="error-page">
      <div className="error-content">
        <img className="error-image" src="/assets/images/svg/404.svg" alt="404 Not Found" />
        <div className="error-info">
          <h1 className="h2 mb-1">Page Not Found</h1>
          <p className="text-muted mb-3">The page you're looking for doesn't exist or has been moved.</p>
          <Link className="btn btn-primary" to="/">Go to Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
