import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import SupportSystem from './SupportSystem';

const App = () => {
  return (
    <div style={{ margin: 0, padding: 0, height: '100vh', width: '100vw' }}>
      <SupportSystem />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);