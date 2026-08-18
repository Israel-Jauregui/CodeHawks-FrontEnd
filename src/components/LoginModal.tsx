import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import './LoginModal.css';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const { isAvailable, isLoading, error: authError, login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  if (!open) return null;

  const handleLogin = async () => {
    setError(null);
    try {
      await login();
      onClose();
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Microsoft sign-in failed.');
    }
  };

  return (
    <div className="xp-modal-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isLoading) onClose();
    }}>
      <div className="window xp-login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title">
        <div className="title-bar">
          <div className="title-bar-text" id="login-title">CodeHawks Member Sign In</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose} disabled={isLoading}></button>
          </div>
        </div>
        <div className="window-body login-form">
          <div className="login-microsoft-icon" aria-hidden="true">
            <span></span><span></span><span></span><span></span>
          </div>
          <div>
            <h3>Sign in with Microsoft</h3>
            <p><strong>@ung.edu account required.</strong></p>
          </div>
          {(error || (!isAvailable && authError)) && <div className="login-error" role="alert">{error || authError}</div>}
          <div className="login-actions">
            <button type="button" onClick={() => void handleLogin()} disabled={isLoading || !isAvailable} className="xp-btn-primary">
              {isLoading ? 'Connecting...' : 'Sign in with Microsoft'}
            </button>
            <button type="button" onClick={onClose} disabled={isLoading} className="xp-btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
