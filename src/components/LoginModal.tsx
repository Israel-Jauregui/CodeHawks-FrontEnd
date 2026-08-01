import React, { useState } from 'react';
import './LoginModal.css';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after successful login so parent can update user state */
  onLoginSuccess?: () => void;
  onSwitchToSignup?: () => void;
}

function getTokenFromLoginResponse(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;

  const candidateKeys = ['Token', 'token', 'jwt', 'Jwt', 'accessToken', 'access_token'];

  for (const key of candidateKeys) {
    const value = (data as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

export const LoginModal: React.FC<LoginModalProps> = ({ open, onClose, onLoginSuccess, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('https://codehawks.org/api/Members/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email, Password: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || data || 'Login failed');
      } else {
        setSuccess('Login successful!');
        const token = getTokenFromLoginResponse(data);

        if (!token) {
          setError('Login succeeded, but no JWT token was returned.');
          setSuccess(null);
          return;
        }

        localStorage.setItem('token', token);

        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          setTimeout(() => {
            setSuccess(null);
            onClose();
          }, 1200);
        }
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="xp-modal-overlay">
      <div className="window xp-login-modal">
        <div className="title-bar">
          <div className="title-bar-text">User Login</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose}></button>
          </div>
        </div>
        <div className="window-body">
          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                disabled={loading}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </label>
            {error && <div className="login-error">{error}</div>}
            {success && <div className="login-success">{success}</div>}
            <div className="login-actions">
              <button type="submit" disabled={loading} className="xp-btn-primary">
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <button type="button" onClick={onClose} disabled={loading} className="xp-btn-secondary">
                Cancel
              </button>
            </div>
            <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
              <button type="button" onClick={onSwitchToSignup} disabled={loading} style={{ background: 'none', border: 'none', color: '#003399', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'Tahoma, Arial, sans-serif' }}>
                Create an account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
