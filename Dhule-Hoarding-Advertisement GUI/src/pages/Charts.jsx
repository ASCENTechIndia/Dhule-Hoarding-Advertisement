import Layout from '../components/Layout';

export default function Charts() {
  return (
    <Layout>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-graph-up-arrow" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Analytics</p>
            <h1 className="h3 mb-1">Charts</h1>
            <p className="text-muted mb-0">Data visualization and analytical charts.</p>
          </div>
        </div>
      </div>

      <section className="row g-3">
        <div className="col-12">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title"><i className="bi bi-graph-up-arrow" aria-hidden="true"></i><span>Sales Performance</span></h2>
                <p className="text-muted mb-0">Monthly revenue compared with operational targets.</p>
              </div>
            </div>
            <div className="chart-bars" aria-label="Sales performance chart">
              <div className="chart-column bar-42"><span></span><small>Jan</small></div>
              <div className="chart-column bar-58"><span></span><small>Feb</small></div>
              <div className="chart-column bar-51"><span></span><small>Mar</small></div>
              <div className="chart-column bar-72"><span></span><small>Apr</small></div>
              <div className="chart-column bar-66"><span></span><small>May</small></div>
              <div className="chart-column bar-83"><span></span><small>Jun</small></div>
              <div className="chart-column bar-77"><span></span><small>Jul</small></div>
              <div className="chart-column bar-91"><span></span><small>Aug</small></div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="panel">
            <div className="panel-header">
              <h2 className="h5 mb-1 section-title"><i className="bi bi-pie-chart" aria-hidden="true"></i><span>Distribution</span></h2>
              <p className="text-muted mb-0">Market share distribution.</p>
            </div>
            <div className="chart-bars">
              <div className="chart-column bar-35"><span></span><small>Category A</small></div>
              <div className="chart-column bar-45"><span></span><small>Category B</small></div>
              <div className="chart-column bar-60"><span></span><small>Category C</small></div>
              <div className="chart-column bar-25"><span></span><small>Category D</small></div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="panel">
            <div className="panel-header">
              <h2 className="h5 mb-1 section-title"><i className="bi bi-bar-chart" aria-hidden="true"></i><span>Growth Trend</span></h2>
              <p className="text-muted mb-0">Quarterly performance metrics.</p>
            </div>
            <div className="chart-bars">
              <div className="chart-column bar-40"><span></span><small>Q1</small></div>
              <div className="chart-column bar-60"><span></span><small>Q2</small></div>
              <div className="chart-column bar-75"><span></span><small>Q3</small></div>
              <div className="chart-column bar-85"><span></span><small>Q4</small></div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
