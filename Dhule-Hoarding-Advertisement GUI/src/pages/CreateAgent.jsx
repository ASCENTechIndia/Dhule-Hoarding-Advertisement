import Layout from '../components/Layout';

export default function CreateAgent() {
  return (
    <Layout>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-robot" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Automation</p>
            <h1 className="h3 mb-1">Create Agent</h1>
            <p className="text-muted mb-0">Set up and configure automated workflow agents.</p>
          </div>
        </div>
      </div>

      <form className="row g-3 max-width-form">
        <div className="col-12">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title"><i className="bi bi-robot" aria-hidden="true"></i><span>Agent Configuration</span></h2>
                <p className="text-muted mb-0">Configure your automated workflow agent.</p>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label" htmlFor="agentName">Agent Name</label>
                <input className="form-control" id="agentName" type="text" placeholder="Enter agent name" required />
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="agentDesc">Description</label>
                <textarea className="form-control" id="agentDesc" rows="4" placeholder="Describe what this agent will do"></textarea>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="agentTrigger">Trigger Event</label>
                <select className="form-select" id="agentTrigger" required>
                  <option value="">Select trigger</option>
                  <option>User Registration</option>
                  <option>Form Submission</option>
                  <option>Email Received</option>
                  <option>Schedule</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="agentAction">Action</label>
                <select className="form-select" id="agentAction" required>
                  <option value="">Select action</option>
                  <option>Send Email</option>
                  <option>Create Record</option>
                  <option>Update Database</option>
                  <option>Webhook Call</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="d-flex gap-2">
            <button className="btn btn-primary" type="submit"><i className="bi bi-check2-circle" aria-hidden="true"></i> Create Agent</button>
            <button className="btn btn-secondary" type="button">Cancel</button>
          </div>
        </div>
      </form>
    </Layout>
  );
}
