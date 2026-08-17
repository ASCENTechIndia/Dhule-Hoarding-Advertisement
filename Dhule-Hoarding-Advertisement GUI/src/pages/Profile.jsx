import Layout from '../components/Layout';

export default function Profile() {
  return (
    <Layout>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-person-badge" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Account</p>
            <h1 className="h3 mb-1">Profile</h1>
            <p className="text-muted mb-0">Manage your personal details, bio, and contact preferences.</p>
          </div>
        </div>
      </div>

      <section className="row g-3">
        <div className="col-12 col-xl-4">
          <div className="panel h-100 text-center profile-card">
            <div className="profile-cover"><img src="/assets/images/png/dasher-ui-bootstrap-5.jpg" alt="adminHMD dashboard preview" /></div>
            <img className="avatar-img avatar-xl profile-photo" src="/assets/images/avatar/avatar.jpg" alt="Admin Hasan" />
            <h2 className="h5 mt-3 mb-1">Admin Hasan</h2>
            <p className="text-muted mb-3">Product Administrator</p>
            <div className="d-flex justify-content-center gap-2"><span className="badge text-bg-primary">Admin</span><span className="badge text-bg-success">Verified</span></div>
            <div className="info-list mt-4 text-start">
              <div><span>Email</span><strong>admin@example.com</strong></div>
              <div><span>Department</span><strong>Product Ops</strong></div>
              <div><span>Time Zone</span><strong>Asia/Dhaka</strong></div>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-8">
          <form className="panel needs-validation" noValidate>
            <div className="panel-header"><div><h2 className="h5 mb-1 section-title"><i className="bi bi-person-gear" aria-hidden="true"></i><span>Profile Settings</span></h2><p className="text-muted mb-0">Update your account profile and contact details.</p></div></div>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label" htmlFor="profileName">Name</label><input className="form-control" id="profileName" type="text" defaultValue="Admin Hasan" required /></div>
              <div className="col-md-6"><label className="form-label" htmlFor="profileEmail">Email</label><input className="form-control" id="profileEmail" type="email" defaultValue="admin@example.com" required /></div>
              <div className="col-12"><label className="form-label" htmlFor="profileBio">Bio</label><textarea className="form-control" id="profileBio" rows="5" defaultValue="Focused on clean admin workflows, reusable UI systems, and reliable operations."></textarea></div>
            </div>
            <div className="d-flex justify-content-end mt-4"><button className="btn btn-primary" type="submit"><i className="bi bi-check2-circle" aria-hidden="true"></i> Save Profile</button></div>
          </form>
        </div>
      </section>
    </Layout>
  );
}
