import Layout from '../components/Layout';

export default function Blank() {
  return (
    <Layout>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-file-earmark" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Template</p>
            <h1 className="h3 mb-1">Blank Page</h1>
            <p className="text-muted mb-0">Use this as a starting point for creating new pages.</p>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12">
          <div className="panel">
            <div className="panel-header">
              <h2 className="h5 mb-1 section-title"><i className="bi bi-pencil" aria-hidden="true"></i><span>Content Area</span></h2>
              <p className="text-muted mb-0">Start building your content here.</p>
            </div>
            <p>This is a blank page template that you can use as a starting point for creating new pages in your dashboard application.</p>
            <p>You can add your own content, forms, tables, charts, or any other elements here.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
