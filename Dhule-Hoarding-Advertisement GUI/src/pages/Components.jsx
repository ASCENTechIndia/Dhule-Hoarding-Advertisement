import Layout from '../components/Layout';

export default function Components() {
  return (
    <Layout>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-grid-3x3-gap" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">UI Elements</p>
            <h1 className="h3 mb-1">Components</h1>
            <p className="text-muted mb-0">Reusable UI components and design elements.</p>
          </div>
        </div>
      </div>

      <section className="row g-3">
        <div className="col-12 col-xl-6">
          <div className="panel">
            <div className="panel-header">
              <h2 className="h5 mb-1 section-title"><i className="bi bi-tag" aria-hidden="true"></i><span>Badges</span></h2>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <span className="badge text-bg-primary">Primary</span>
              <span className="badge text-bg-secondary">Secondary</span>
              <span className="badge text-bg-success">Success</span>
              <span className="badge text-bg-danger">Danger</span>
              <span className="badge text-bg-warning">Warning</span>
              <span className="badge text-bg-info">Info</span>
              <span className="badge text-bg-light">Light</span>
              <span className="badge text-bg-dark">Dark</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="panel">
            <div className="panel-header">
              <h2 className="h5 mb-1 section-title"><i className="bi bi-info-circle" aria-hidden="true"></i><span>Buttons</span></h2>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-primary" type="button">Primary</button>
              <button className="btn btn-secondary" type="button">Secondary</button>
              <button className="btn btn-success" type="button">Success</button>
              <button className="btn btn-danger" type="button">Danger</button>
              <button className="btn btn-warning" type="button">Warning</button>
              <button className="btn btn-info" type="button">Info</button>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="panel">
            <div className="panel-header">
              <h2 className="h5 mb-1 section-title"><i className="bi bi-palette" aria-hidden="true"></i><span>Colors</span></h2>
            </div>
            <div className="row g-2">
              <div className="col-6 col-sm-4"><div style={{backgroundColor: '#2563eb', padding: '20px', borderRadius: '6px'}}></div><small className="text-muted">Primary</small></div>
              <div className="col-6 col-sm-4"><div style={{backgroundColor: '#0f766e', padding: '20px', borderRadius: '6px'}}></div><small className="text-muted">Success</small></div>
              <div className="col-6 col-sm-4"><div style={{backgroundColor: '#d97706', padding: '20px', borderRadius: '6px'}}></div><small className="text-muted">Warning</small></div>
              <div className="col-6 col-sm-4"><div style={{backgroundColor: '#dc2626', padding: '20px', borderRadius: '6px'}}></div><small className="text-muted">Danger</small></div>
              <div className="col-6 col-sm-4"><div style={{backgroundColor: '#f5f7fb', border: '1px solid #dbe4ef', padding: '20px', borderRadius: '6px'}}></div><small className="text-muted">Light</small></div>
              <div className="col-6 col-sm-4"><div style={{backgroundColor: '#111827', padding: '20px', borderRadius: '6px'}}></div><small className="text-muted">Dark</small></div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="panel">
            <div className="panel-header">
              <h2 className="h5 mb-1 section-title"><i className="bi bi-circle" aria-hidden="true"></i><span>Indicators</span></h2>
            </div>
            <div className="d-flex flex-wrap gap-3">
              <div><span style={{display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2563eb', marginRight: '8px'}}></span>Active</div>
              <div><span style={{display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0f766e', marginRight: '8px'}}></span>Success</div>
              <div><span style={{display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#d97706', marginRight: '8px'}}></span>Warning</div>
              <div><span style={{display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#dc2626', marginRight: '8px'}}></span>Danger</div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
