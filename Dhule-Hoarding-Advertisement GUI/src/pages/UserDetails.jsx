import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

export default function UserDetails() {
  return (
    <Layout>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-person-badge" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Management</p>
            <h1 className="h3 mb-1">User Details</h1>
            <p className="text-muted mb-0">View and manage individual user account information.</p>
          </div>
        </div>
        <div className="heading-actions">
          <Link className="btn btn-outline-secondary btn-sm" to="/users"><i className="bi bi-arrow-left" aria-hidden="true"></i> Back</Link>
        </div>
      </div>

      <section className="row g-3">
        <div className="col-12 col-xl-4">
          <div className="panel text-center">
            <img className="avatar-img avatar-xl rounded-circle mb-3" src="/assets/images/avatar/avatar-1.jpg" alt="Sarah Ahmed" />
            <h2 className="h5 mb-1">Sarah Ahmed</h2>
            <p className="text-muted mb-3">Admin</p>
            <div className="d-flex justify-content-center gap-2 mb-3">
              <span className="badge text-bg-primary">Admin</span>
              <span className="badge text-bg-success">Verified</span>
            </div>
            <div className="info-list text-start">
              <div><span>Email</span><strong>sarah@example.com</strong></div>
              <div><span>Department</span><strong>Operations</strong></div>
              <div><span>Phone</span><strong>+1 (555) 123-4567</strong></div>
              <div><span>Joined</span><strong>Jan 12, 2026</strong></div>
              <div><span>Status</span><strong><span className="badge text-bg-success">Active</span></strong></div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title"><i className="bi bi-person-gear" aria-hidden="true"></i><span>Account Information</span></h2>
                <p className="text-muted mb-0">Manage user account details and permissions.</p>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Full Name</label>
                <input className="form-control" type="text" value="Sarah Ahmed" readOnly />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value="sarah@example.com" readOnly />
              </div>
              <div className="col-md-6">
                <label className="form-label">Role</label>
                <select className="form-select">
                  <option selected>Admin</option>
                  <option>Manager</option>
                  <option>Editor</option>
                  <option>Viewer</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Team</label>
                <select className="form-select">
                  <option selected>Operations</option>
                  <option>Sales</option>
                  <option>Content</option>
                  <option>Finance</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Bio</label>
                <textarea className="form-control" rows="4">Operations lead focused on workflow optimization and team coordination.</textarea>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button className="btn btn-secondary" type="button">Reset Password</button>
              <button className="btn btn-primary" type="button"><i className="bi bi-check2-circle" aria-hidden="true"></i> Save Changes</button>
            </div>
          </div>
        </div>
      </section>

      {/* Activity Log */}
      <section className="panel mt-3">
        <div className="panel-header">
          <h2 className="h5 mb-1 section-title"><i className="bi bi-clock-history" aria-hidden="true"></i><span>Activity Log</span></h2>
          <p className="text-muted mb-0">Recent account activity and access history.</p>
        </div>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-dot bg-primary"></span>
            <div>
              <p className="mb-1 fw-semibold">Account created</p>
              <p className="text-muted small mb-0">Jan 12, 2026 at 10:30 AM</p>
            </div>
          </div>
          <div className="activity-item">
            <span className="activity-dot bg-success"></span>
            <div>
              <p className="mb-1 fw-semibold">Email verified</p>
              <p className="text-muted small mb-0">Jan 12, 2026 at 10:45 AM</p>
            </div>
          </div>
          <div className="activity-item">
            <span className="activity-dot bg-info"></span>
            <div>
              <p className="mb-1 fw-semibold">Last login</p>
              <p className="text-muted small mb-0">May 24, 2026 at 2:15 PM</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
