import Layout from '../components/Layout';

export default function Alerts() {
  return (
    <Layout>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-exclamation-triangle" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Feedback</p>
            <h1 className="h3 mb-1">Alerts</h1>
            <p className="text-muted mb-0">Alert components for user feedback and notifications.</p>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="h5 mb-1 section-title"><i className="bi bi-exclamation-circle" aria-hidden="true"></i><span>Alert Variations</span></h2>
        </div>
        <div className="alert alert-primary" role="alert">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Primary Alert:</strong> This is a primary alert with a helpful message.
        </div>
        <div className="alert alert-secondary" role="alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          <strong>Secondary Alert:</strong> This is a secondary alert message.
        </div>
        <div className="alert alert-success" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          <strong>Success Alert:</strong> Operation completed successfully!
        </div>
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-x-circle me-2"></i>
          <strong>Danger Alert:</strong> An error has occurred. Please try again.
        </div>
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          <strong>Warning Alert:</strong> Please be cautious with this action.
        </div>
        <div className="alert alert-info" role="alert">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Info Alert:</strong> Here is some additional information.
        </div>
        <div className="alert alert-light" role="alert">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Light Alert:</strong> This is a light-colored alert.
        </div>
      </div>

      <div className="panel mt-3">
        <div className="panel-header">
          <h2 className="h5 mb-1 section-title"><i className="bi bi-x-circle" aria-hidden="true"></i><span>Dismissible Alerts</span></h2>
        </div>
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <strong>Success!</strong> You have successfully completed the task.
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <strong>Warning!</strong> Please review your input before proceeding.
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      </div>
    </Layout>
  );
}
