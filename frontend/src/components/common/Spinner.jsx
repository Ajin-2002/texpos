import React from 'react';

const Spinner = ({ size = 20 }) => (
  <div className="spinner" style={{ width: size, height: size }} role="status" aria-label="Loading" />
);

export const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', flexDirection: 'column', gap: '12px' }}>
    <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</p>
  </div>
);

export default Spinner;
