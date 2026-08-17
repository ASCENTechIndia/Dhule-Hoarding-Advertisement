import React, { createContext, useContext, useState } from "react";

const LoaderContext = createContext();

export const useLoader = () => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useLoader must be used within LoaderProvider");
  }
  return context;
};

export const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const setLoader = (flag) => setLoading(flag);

  return (
    <LoaderContext.Provider value={{ loading, setLoader }}>
      {children}
      {loading && <GlobalLoader />}
    </LoaderContext.Provider>
  );
};

// ✅ Minimalistic loader – just a rounded spinner and text
const GlobalLoader = () => (
  <div className="global-loader-overlay">
    <div className="loader-minimal">
      <div className="loader-spinner"></div>
      <div className="loader-text">Loading...</div>
    </div>

    <style>{`
      .global-loader-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .loader-minimal {
        text-align: center;
        background: white;
        padding: 2rem 2.5rem;
        border-radius: 20px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
        animation: fadeInScale 0.3s ease-out;
      }

      .loader-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #f0f0f0;
        border-top: 4px solid #1a73e8;
        border-radius: 50%;
        margin: 0 auto 1rem;
        animation: spin 0.8s linear infinite;
      }

      .loader-text {
        font-size: 1rem;
        font-weight: 500;
        color: #333;
      }

      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `}</style>
  </div>
);