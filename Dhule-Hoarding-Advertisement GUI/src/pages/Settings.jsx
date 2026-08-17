import Layout from '../components/Layout';

export default function Settings() {
  return (
    <Layout>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-gear" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Preferences</p>
            <h1 className="h3 mb-1">Settings</h1>
            <p className="text-muted mb-0">Manage your workspace settings and preferences.</p>
          </div>
        </div>
      </div>

      <section className="row g-3">
        <div className="col-12 col-xl-6">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title"><i className="bi bi-sliders" aria-hidden="true"></i><span>General Settings</span></h2>
                <p className="text-muted mb-0">Configure workspace preferences and behavior.</p>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label" htmlFor="settingsWorkspace">Workspace Name</label>
                <input className="form-control" id="settingsWorkspace" type="text" defaultValue="My Workspace" />
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="settingsTimezone">Time Zone</label>
                <select className="form-select" id="settingsTimezone">
                  <option selected>Asia/Dhaka</option>
                  <option>America/New_York</option>
                  <option>Europe/London</option>
                  <option>Asia/Tokyo</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="settingsLanguage">Language</label>
                <select className="form-select" id="settingsLanguage">
                  <option selected>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Bengali</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title"><i className="bi bi-shield-check" aria-hidden="true"></i><span>Security Settings</span></h2>
                <p className="text-muted mb-0">Manage security and access controls.</p>
              </div>
            </div>
            <div className="form-check mb-3">
              <input className="form-check-input" type="checkbox" id="settingsTwoFactor" defaultChecked />
              <label className="form-check-label" htmlFor="settingsTwoFactor">
                Two-factor authentication
              </label>
            </div>
            <div className="form-check mb-3">
              <input className="form-check-input" type="checkbox" id="settingsNotifications" defaultChecked />
              <label className="form-check-label" htmlFor="settingsNotifications">
                Login notifications
              </label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="settingsUpdates" defaultChecked />
              <label className="form-check-label" htmlFor="settingsUpdates">
                Receive system updates
              </label>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-secondary" type="button">Reset</button>
            <button className="btn btn-primary" type="button"><i className="bi bi-check2-circle" aria-hidden="true"></i> Save Settings</button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
