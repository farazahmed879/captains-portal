import React from 'react';

export const AuthFooter: React.FC = () => {
  return (
    <footer className="auth-bottom-footer">
      <div>
        © 2026 Captains Sports Portal. Empowering team captains and sports managers.
      </div>
      <div className="auth-footer-links">
        <a href="#">Privacy policy</a>
        <a href="#">Terms of service</a>
        <span>● English</span>
      </div>
    </footer>
  );
};
