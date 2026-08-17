import React from "react";
import "./styles/ResponseModal.css";

const ResponseModal = ({ isOpen, type, title, message, onClose }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <i className="bi bi-check-circle-fill"></i>;
      case "error":
        return <i className="bi bi-exclamation-circle-fill"></i>;
      case "warning":
        return <i className="bi bi-exclamation-triangle-fill"></i>;
      case "info":
        return <i className="bi bi-info-circle-fill"></i>;
      default:
        return <i className="bi bi-info-circle-fill"></i>;
    }
  };

  return (
    <div className={`response-modal-overlay ${isOpen ? "show" : ""}`}>
      <div className={`response-modal response-modal-${type}`}>
        {/* Icon */}
        <div className={`modal-icon modal-icon-${type}`}>{getIcon()}</div>

        {/* Title */}
        {title && <h3 className="modal-title">{title}</h3>}

        {/* Message */}
        <p className="modal-message">{message}</p>

        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ResponseModal;
