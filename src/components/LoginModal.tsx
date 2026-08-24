import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import './LoginModal.css';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const { isAvailable, isLoading, error: authError, login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const isLoadingRef = useRef(isLoading);

  onCloseRef.current = onClose;
  isLoadingRef.current = isLoading;

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const frame = window.requestAnimationFrame(() => {
      const initialControl = primaryButtonRef.current?.disabled
        ? cancelButtonRef.current
        : primaryButtonRef.current;
      initialControl?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoadingRef.current) {
        event.preventDefault();
        setError(null);
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  const closeModal = () => {
    setError(null);
    onClose();
  };

  const handleLogin = async () => {
    setError(null);
    try {
      await login();
      closeModal();
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Microsoft sign-in failed.');
    }
  };

  return (
    <div className="xp-modal-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isLoading) closeModal();
    }}>
      <div
        ref={dialogRef}
        className="window xp-login-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        aria-describedby="login-privacy-notice"
      >
        <div className="title-bar">
          <div className="title-bar-text" id="login-title">CodeHawks Member Sign In</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={closeModal} disabled={isLoading}></button>
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
          <div id="login-privacy-notice" className="login-privacy-notice">
            <p>
              Continuing creates a CodeHawks account and stores your verified UNG email, Microsoft identity
              identifiers, name, account timestamps, and a non-identifying starter handle. Public profile
              visibility and optional club-announcement emails are off by default until you choose otherwise.
            </p>
            <p>Review the <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms of Use</a>.</p>
          </div>
          {(error || (!isAvailable && authError)) && <div className="login-error" role="alert">{error || authError}</div>}
          <div className="login-actions">
            <button ref={primaryButtonRef} type="button" onClick={() => void handleLogin()} disabled={isLoading || !isAvailable} className="xp-btn-primary">
              {isLoading ? 'Connecting...' : 'Sign in with Microsoft'}
            </button>
            <button ref={cancelButtonRef} type="button" onClick={closeModal} disabled={isLoading} className="xp-btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
