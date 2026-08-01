import React, { useState } from 'react';
import './SignupModal.css';

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
  /** Called to switch back to the login modal */
  onSwitchToLogin: () => void;
  /** Called after successful signup AND auto-login so parent can update user state */
  onLoginSuccess?: () => void;
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

export const SignupModal: React.FC<SignupModalProps> = ({ open, onClose, onSwitchToLogin, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProfilePicture(e.target.files[0]);
    } else {
      setProfilePicture(null);
    }
  };

  const handleAutoLogin = async () => {
    try {
      const res = await fetch('https://codehawks.org/api/Members/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email, Password: password }),
      });
      const data = await res.json();
      if (res.ok) {
        const token = getTokenFromLoginResponse(data);
        if (token) {
          localStorage.setItem('token', token);
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            setTimeout(() => {
              setSuccess(null);
              onClose();
            }, 1200);
          }
          return true;
        }
      }
    } catch (err) {
      console.error("Auto-login failed after signup", err);
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('Username', username);
      formData.append('Fullname', fullname);
      formData.append('Email', email);
      formData.append('Password', password);
      
      if (bio) formData.append('Bio', bio);
      if (github) formData.append('Github', github);
      if (linkedin) formData.append('Linkedin', linkedin);
      if (profilePicture) formData.append('ProfilePicture', profilePicture);

      const res = await fetch('https://codehawks.org/api/Members/signup', {
        method: 'POST',
        body: formData,
      });

      // Handle JSON response
      const contentType = res.headers.get("content-type");
      let data = null;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        setError(data?.message || (typeof data === 'string' ? data : 'Signup failed. Please try again.'));
      } else {
        setSuccess('Account created successfully! Logging you in...');
        
        // Check if signup actually returned a token immediately
        const token = getTokenFromLoginResponse(data);
        if (token) {
          localStorage.setItem('token', token);
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            setTimeout(() => {
              setSuccess(null);
              onClose();
            }, 1200);
          }
        } else {
          // If no token, auto-login with the credentials
          const loggedIn = await handleAutoLogin();
          if (!loggedIn) {
            setError('Account created, but automatic login failed. Please log in manually.');
            setSuccess(null);
            setTimeout(() => {
              onSwitchToLogin();
            }, 2000);
          }
        }
      }
    } catch (err) {
      setError('Network error. Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="xp-modal-overlay">
      <div className="window xp-signup-modal">
        <div className="title-bar">
          <div className="title-bar-text">Create an Account</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose}></button>
          </div>
        </div>
        <div className="window-body">
          <form className="signup-form" onSubmit={handleSubmit}>
            <label>
              Username <span style={{color: 'red'}}>*</span>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required disabled={loading} autoFocus />
            </label>
            <label>
              Full Name <span style={{color: 'red'}}>*</span>
              <input type="text" value={fullname} onChange={e => setFullname(e.target.value)} required disabled={loading} />
            </label>
            <label>
              Email <span style={{color: 'red'}}>*</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
            </label>
            <label>
              Password <span style={{color: 'red'}}>*</span>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
            </label>
            <label>
              Bio
              <textarea value={bio} onChange={e => setBio(e.target.value)} disabled={loading} />
            </label>
            <label>
              GitHub (Optional)
              <input type="text" value={github} onChange={e => setGithub(e.target.value)} disabled={loading} />
            </label>
            <label>
              LinkedIn (Optional)
              <input type="text" value={linkedin} onChange={e => setLinkedin(e.target.value)} disabled={loading} />
            </label>
            <label>
              Profile Picture
              <input type="file" accept="image/*" onChange={handleFileChange} disabled={loading} />
            </label>

            {error && <div className="signup-error">{error}</div>}
            {success && <div className="signup-success">{success}</div>}

            <div className="signup-actions">
              <button type="submit" disabled={loading} className="xp-btn-primary">
                {loading ? 'Creating...' : 'Register'}
              </button>
              <button type="button" onClick={onSwitchToLogin} disabled={loading} className="xp-btn-secondary">
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
