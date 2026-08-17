import Layout from '../components/Layout';
import { useState } from 'react';

export default function Modals() {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  return (
    <Layout>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-window-stack" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Overlays</p>
            <h1 className="h3 mb-1">Modals</h1>
            <p className="text-muted mb-0">Modal dialogs for user interactions and confirmations.</p>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-6">
          <div className="panel">
            <div className="panel-header">
              <h2 className="h5 mb-1 section-title"><i className="bi bi-box-arrow-up" aria-hidden="true"></i><span>Modal Trigger</span></h2>
            </div>
            <button 
              className="btn btn-primary"
              type="button"
              onClick={() => setShowModal(true)}
            >
              Open Modal
            </button>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="panel">
            <div className="panel-header">
              <h2 className="h5 mb-1 section-title"><i className="bi bi-question-circle" aria-hidden="true"></i><span>Confirmation Modal</span></h2>
            </div>
            <button 
              className="btn btn-warning"
              type="button"
              onClick={() => setShowConfirmModal(true)}
            >
              Confirm Action
            </button>
          </div>
        </div>
      </div>

      {/* Modal Backdrop */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Modal Title</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                This is a sample modal dialog. You can place any content here including forms, images, or text.
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => setShowModal(false)}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-danger">
                <h5 className="modal-title"><i className="bi bi-exclamation-triangle text-warning me-2"></i>Confirm Action</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowConfirmModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                Are you sure you want to proceed with this action? This action cannot be undone.
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
