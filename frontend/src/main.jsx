import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { useOrgSettings } from './hooks/useOrgSettings';

function Root() {
  useOrgSettings();
  return <App />;
}

const container = document.getElementById('root');
let root = window.__react_root;
if (!root) {
  root = ReactDOM.createRoot(container);
  window.__react_root = root;
}

root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
