import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function Register() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div>
      <button 
        className="icon-button theme-toggle auth-theme-toggle" 
        type="button" 
        onClick={toggleTheme}
        aria-label="Switch color theme" 
        title="Switch color theme"
      >
        <i className={`bi ${isDarkMode ? 'bi-brightness-high' : 'bi-moon-stars'}`}></i>
      </button>
      <main className="auth-page">
        <section className="auth-card">
          <Link className="auth-brand" to="/"><span className="brand-icon"><i className="bi bi-grid-1x2-fill" aria-hidden="true"></i></span><span><strong>adminHMD</strong><small>Create your admin workspace account.</small></span></Link>
          <div className="auth-visual"><img src="/assets/images/png/dasher-ui-bootstrap-5.jpg" alt="adminHMD dashboard interface" /></div>
          <form className="needs-validation" noValidate>
            <div className="mb-4">
              <p className="eyebrow mb-1">Get Started</p>
              <h1 className="h3 mb-1">Register</h1>
              <p className="text-muted mb-0">Create a new admin workspace account.</p>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="registerName">Full Name</label>
              <input className="form-control" id="registerName" type="text" required />
              <div className="invalid-feedback">Full name is required.</div>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="registerEmail">Email address</label>
              <input className="form-control" id="registerEmail" type="email" required />
              <div className="invalid-feedback">Enter a valid email.</div>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="registerPassword">Password</label>
              <input className="form-control" id="registerPassword" type="password" minLength="6" required />
              <div className="invalid-feedback">Password must be at least 6 characters.</div>
            </div>
            <div className="mb-4">
              <label className="form-label" htmlFor="registerConfirm">Confirm Password</label>
              <input className="form-control" id="registerConfirm" type="password" minLength="6" required />
              <div className="invalid-feedback">Passwords must match.</div>
            </div>
            <button className="btn btn-primary w-100" type="submit"><i className="bi bi-person-plus" aria-hidden="true"></i> Create Account</button>
          </form>
          
          <div className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></div>
        </section>
      </main>
    </div>
  );
}
