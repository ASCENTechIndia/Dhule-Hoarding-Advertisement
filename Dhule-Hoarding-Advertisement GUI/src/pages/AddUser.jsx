import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

export default function AddUser() {
  return (
    <Layout>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-person-plus" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Management</p>
            <h1 className="h3 mb-1">Add User</h1>
            <p className="text-muted mb-0">Register a new team member to your workspace.</p>
          </div>
        </div>
      </div>

      <form className="row g-3 max-width-form">
        <div className="col-12">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title"><i className="bi bi-person-plus" aria-hidden="true"></i><span>User Information</span></h2>
                <p className="text-muted mb-0">Fill in the basic details for the new user.</p>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="addUserFullName">Full Name</label>
                <input className="form-control" id="addUserFullName" type="text" required />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="addUserEmail">Email Address</label>
                <input className="form-control" id="addUserEmail" type="email" required />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="addUserRole">Role</label>
                <select className="form-select" id="addUserRole" required>
                  <option value="">Select Role</option>
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>Editor</option>
                  <option>Viewer</option>
                  <option>Analyst</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="addUserTeam">Team</label>
                <select className="form-select" id="addUserTeam" required>
                  <option value="">Select Team</option>
                  <option>Operations</option>
                  <option>Sales</option>
                  <option>Content</option>
                  <option>Finance</option>
                  <option>Data</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="addUserPhone">Phone Number</label>
                <input className="form-control" id="addUserPhone" type="tel" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title"><i className="bi bi-shield-check" aria-hidden="true"></i><span>Security Settings</span></h2>
                <p className="text-muted mb-0">Configure access level and permissions.</p>
              </div>
            </div>
            <div className="form-check mb-3">
              <input className="form-check-input" type="checkbox" id="addUserSendInvite" />
              <label className="form-check-label" htmlFor="addUserSendInvite">
                Send email invitation
              </label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="addUserTwoFactor" />
              <label className="form-check-label" htmlFor="addUserTwoFactor">
                Require two-factor authentication
              </label>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="d-flex gap-2">
            <button className="btn btn-primary" type="submit"><i className="bi bi-check2-circle" aria-hidden="true"></i> Create User</button>
            <Link className="btn btn-secondary" to="/users">Cancel</Link>
          </div>
        </div>
      </form>
    </Layout>
  );
}
