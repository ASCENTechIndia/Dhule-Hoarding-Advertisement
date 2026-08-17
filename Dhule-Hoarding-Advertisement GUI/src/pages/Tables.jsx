import Layout from '../components/Layout';

export default function Tables() {
  const tableData = [
    { id: 1, name: 'Sarah Ahmed', email: 'sarah@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Rafi Khan', email: 'rafi@example.com', role: 'Manager', status: 'Active' },
    { id: 3, name: 'Nadia Islam', email: 'nadia@example.com', role: 'Editor', status: 'Pending' },
    { id: 4, name: 'Mina Torres', email: 'mina@example.com', role: 'Viewer', status: 'Suspended' },
    { id: 5, name: 'Jon Oliver', email: 'jon@example.com', role: 'Analyst', status: 'Active' },
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
          <span className="page-icon"><i className="bi bi-table" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Data Display</p>
            <h1 className="h3 mb-1">Tables</h1>
            <p className="text-muted mb-0">Responsive data tables with various styling options.</p>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="h5 mb-1 section-title"><i className="bi bi-table" aria-hidden="true"></i><span>Data Table</span></h2>
            <p className="text-muted mb-0">Sample responsive data table.</p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.id}>
                  <td className="fw-semibold">{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.role}</td>
                  <td><span className={`badge ${getStatusBadge(row.status)}`}>{row.status}</span></td>
                  <td className="text-end">
                    <button className="btn btn-light btn-sm" type="button">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
