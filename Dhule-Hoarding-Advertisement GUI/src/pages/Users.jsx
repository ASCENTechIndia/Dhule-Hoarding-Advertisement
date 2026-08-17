import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

export default function Users() {
  const users = [
    { id: 1, name: 'Sarah Ahmed', email: 'sarah@example.com', role: 'Admin', team: 'Operations', status: 'Active', avatar: 'avatar-1.jpg', joined: 'Jan 12, 2026' },
    { id: 2, name: 'Rafi Khan', email: 'rafi@example.com', role: 'Manager', team: 'Sales', status: 'Active', avatar: 'avatar-2.jpg', joined: 'Feb 03, 2026' },
    { id: 3, name: 'Nadia Islam', email: 'nadia@example.com', role: 'Editor', team: 'Content', status: 'Pending', avatar: 'avatar-3.jpg', joined: 'Mar 18, 2026' },
    { id: 4, name: 'Mina Torres', email: 'mina@example.com', role: 'Viewer', team: 'Finance', status: 'Suspended', avatar: 'avatar-4.jpg', joined: 'Apr 07, 2026' },
    { id: 5, name: 'Jon Oliver', email: 'jon@example.com', role: 'Analyst', team: 'Data', status: 'Active', avatar: 'avatar-5.jpg', joined: 'Apr 22, 2026' },
  ];

  const getStatusBadge = (status) => {
    const statusMap = {
      'Active': 'text-bg-success',
      'Pending': 'text-bg-warning',
      'Suspended': 'text-bg-secondary'
    };
    return statusMap[status] || 'text-bg-secondary';
  };

  return (
    <Layout>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-people" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Management</p>
            <h1 className="h3 mb-1">Users</h1>
            <p className="text-muted mb-0">Review accounts, roles, account status, and team ownership.</p>
          </div>
        </div>
        <div className="heading-actions">
          <a className="btn btn-outline-secondary btn-sm" href="/tables"><i className="bi bi-download" aria-hidden="true"></i> Export</a>
          <Link className="btn btn-primary btn-sm" to="/add-user"><i className="bi bi-person-plus" aria-hidden="true"></i> Add User</Link>
        </div>
      </div>

      {/* User Summary Metrics */}
      <section className="row g-3 mt-1" aria-label="User summary">
        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-primary">
            <div className="metric-top">
              <span className="metric-label">Total Users</span>
              <span className="metric-icon"><i className="bi bi-people" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">8,742</div>
            <div className="metric-meta">
              <span className="text-success">+5.1%</span>
              <span>this month</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-success">
            <div className="metric-top">
              <span className="metric-label">Active</span>
              <span className="metric-icon"><i className="bi bi-check2-circle" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">7,980</div>
            <div className="metric-meta">
              <span className="text-success">91%</span>
              <span>healthy accounts</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-warning">
            <div className="metric-top">
              <span className="metric-label">Pending</span>
              <span className="metric-icon"><i className="bi bi-hourglass-split" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">184</div>
            <div className="metric-meta">
              <span className="text-warning">12</span>
              <span>need approval</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-danger">
            <div className="metric-top">
              <span className="metric-label">Suspended</span>
              <span className="metric-icon"><i className="bi bi-slash-circle" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">38</div>
            <div className="metric-meta">
              <span className="text-danger">4</span>
              <span>flagged today</span>
            </div>
          </article>
        </div>
      </section>

      {/* Users Table */}
      <section className="panel mt-3">
        <div className="panel-header">
          <div>
            <h2 className="h5 mb-1 section-title"><i className="bi bi-table" aria-hidden="true"></i><span>User List</span></h2>
            <p className="text-muted mb-0">Search, review, and manage team member accounts.</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <input className="form-control form-control-sm table-search" type="search" placeholder="Search users" aria-label="Search users" />
            <Link className="btn btn-primary btn-sm" to="/add-user"><i className="bi bi-person-plus" aria-hidden="true"></i> Add User</Link>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead><tr><th scope="col">User</th><th scope="col">Role</th><th scope="col">Team</th><th scope="col">Status</th><th scope="col">Joined</th><th scope="col" className="text-end">Action</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <img className="avatar-img avatar-sm" src={`/assets/images/avatar/${user.avatar}`} alt={user.name} />
                      <div>
                        <p className="fw-semibold mb-0">{user.name}</p>
                        <p className="text-muted small mb-0">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{user.role}</td>
                  <td>{user.team}</td>
                  <td><span className={`badge ${getStatusBadge(user.status)}`}>{user.status}</span></td>
                  <td>{user.joined}</td>
                  <td className="text-end"><Link className="btn btn-light btn-sm" to="/user-details">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mt-3">
          <p className="text-muted small mb-0">Showing 1 to 5 of 124 users</p>
          <nav aria-label="Users pagination"><ul className="pagination pagination-sm mb-0"><li className="page-item disabled"><a className="page-link" href="#/">Previous</a></li><li className="page-item active"><a className="page-link" href="#/">1</a></li><li className="page-item"><a className="page-link" href="#/">2</a></li><li className="page-item"><a className="page-link" href="#/">Next</a></li></ul></nav>
        </div>
      </section>
    </Layout>
  );
}
