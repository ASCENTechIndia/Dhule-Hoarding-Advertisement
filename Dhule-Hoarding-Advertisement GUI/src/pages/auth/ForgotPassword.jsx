import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function ForgotPassword() {
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
          <Link className="auth-brand" to="/"><span className="brand-icon"><i className="bi bi-grid-1x2-fill" aria-hidden="true"></i></span><span><strong>adminHMD</strong><small>Reset your password.</small></span></Link>
          <div className="auth-visual"><img src="/assets/images/png/dasher-ui-bootstrap-5.jpg" alt="adminHMD dashboard interface" /></div>
          <form className="needs-validation" noValidate>
            <div className="mb-4">
              <p className="eyebrow mb-1">Account Recovery</p>
              <h1 className="h3 mb-1">Forgot Password</h1>
              <p className="text-muted mb-0">Enter your email to reset your password.</p>
            </div>
            <div className="mb-4">
              <label className="form-label" htmlFor="forgotEmail">Email address</label>
              <input className="form-control" id="forgotEmail" type="email" required />
              <div className="invalid-feedback">Enter a valid email.</div>
            </div>
            <button className="btn btn-primary w-100" type="submit"><i className="bi bi-envelope" aria-hidden="true"></i> Send Reset Link</button>
          </form>
          
          <div className="auth-footer">Remember your password? <Link to="/login">Sign in</Link></div>
        </section>
      </main>
    </div>
  );
}
