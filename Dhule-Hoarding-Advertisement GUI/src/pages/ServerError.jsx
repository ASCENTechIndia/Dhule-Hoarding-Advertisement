import { Link } from 'react-router-dom';

export default function ServerError() {
  return (
    <main className="error-page">
      <div className="error-content">
        <img className="error-image" src="/assets/images/svg/maintenance.svg" alt="500 Server Error" />
        <div className="error-info">
          <h1 className="h2 mb-1">Server Error</h1>
          <p className="text-muted mb-3">Something went wrong on our end. Please try again later.</p>
          <Link className="btn btn-primary" to="/">Go to Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
