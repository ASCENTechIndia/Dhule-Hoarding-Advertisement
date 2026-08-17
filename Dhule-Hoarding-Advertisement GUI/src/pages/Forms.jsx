import Layout from '../components/Layout';

export default function Forms() {
  return (
    <Layout>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-ui-checks-grid" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Inputs</p>
            <h1 className="h3 mb-1">Forms</h1>
            <p className="text-muted mb-0">Reusable form controls, validation states, and field layouts.</p>
          </div>
        </div>
      </div>

      <section className="row g-3">
        <div className="col-12 col-xl-7">
          <form className="panel needs-validation" noValidate>
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title"><i className="bi bi-ui-checks-grid" aria-hidden="true"></i><span>Validation Form</span></h2>
                <p className="text-muted mb-0">Bootstrap-ready fields with custom validation feedback.</p>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="formName">Full name</label>
                <input className="form-control" id="formName" required />
                <div className="invalid-feedback">Full name is required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="formEmail">Email</label>
                <input className="form-control" id="formEmail" type="email" required />
                <div className="invalid-feedback">Valid email is required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="formPlan">Plan</label>
                <select className="form-select" id="formPlan" required>
                  <option value="">Choose plan</option>
                  <option>Starter</option>
                  <option>Business</option>
                  <option>Enterprise</option>
                </select>
                <div className="invalid-feedback">Choose a plan.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="formBudget">Budget</label>
                <input className="form-control" id="formBudget" type="number" min="1" required />
                <div className="invalid-feedback">Enter a valid budget.</div>
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="formMessage">Message</label>
                <textarea className="form-control" id="formMessage" rows="5" required></textarea>
                <div className="invalid-feedback">Message is required.</div>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-4">
              <button className="btn btn-primary" type="submit"><i className="bi bi-send" aria-hidden="true"></i> Submit Form</button>
            </div>
          </form>
        </div>
        <div className="col-12 col-xl-5">
          <div className="panel h-100">
            <h2 className="h5 mb-3 section-title"><i className="bi bi-input-cursor-text" aria-hidden="true"></i><span>Input States</span></h2>
            <input className="form-control mb-3" defaultValue="Default input" />
            <input className="form-control is-valid mb-3" defaultValue="Valid input" />
            <input className="form-control is-invalid mb-3" defaultValue="Invalid input" />
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="sampleCheck" defaultChecked />
              <label className="form-check-label" htmlFor="sampleCheck">Sample checkbox</label>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
