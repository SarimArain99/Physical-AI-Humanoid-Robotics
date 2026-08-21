import React, { useState, useEffect } from 'react';
import { useSession, signIn, signUp, signOut } from '../../utils/authClient';
import { UserCircle, X, LogIn, UserPlus, LogOut } from 'lucide-react';
import './AuthModal.css';

export default function AuthModal() {
  const { data: session, isPending } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [softwareBg, setSoftwareBg] = useState('Beginner');
  const [hardwareBg, setHardwareBg] = useState('Beginner');
  const [error, setError] = useState('');

  // Attach to the navbar HTML button
  useEffect(() => {
    const btn = document.getElementById('nav-login-btn');
    if (!btn) return;

    if (isPending) {
      // Don't update innerText while waiting so it doesn't flicker
      return;
    }

    if (session) {
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user" style="margin-right: 6px; vertical-align: -3px;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${session.user.name || session.user.email}`;
      btn.onclick = () => setIsOpen(true);
    } else {
      btn.innerText = 'Login';
      btn.onclick = () => setIsOpen(true);
    }
  }, [session, isPending]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (session) {
      await signOut();
      localStorage.removeItem('userBg');
      setIsOpen(false);
      return;
    }

    try {
      if (isLoginView) {
        const { error } = await signIn.email({ email, password });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await signUp.email({ email, password, name, softwareBg, hardwareBg });
        if (error) throw new Error(error.message);
      }
      setIsOpen(false);
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={() => setIsOpen(false)}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-modal-header">
          <div className="auth-modal-title">
            {session ? (
              <><UserCircle size={20} /> Account Profile</>
            ) : isLoginView ? (
              <><LogIn size={20} /> Login</>
            ) : (
              <><UserPlus size={20} /> Create Account</>
            )}
          </div>
          <button className="auth-modal-close" onClick={() => setIsOpen(false)}>
            <X size={18} />
          </button>
        </div>
        
        {session ? (
          <div className="auth-modal-content">
            <div className="profile-info">
              <div className="profile-name">{session.user.name}</div>
              <div className="profile-email">{session.user.email}</div>
            </div>
            <button className="button button--danger button--block" onClick={handleSubmit}>
              <LogOut size={16} style={{marginRight: '8px', verticalAlign: '-3px'}}/> Logout
            </button>
          </div>
        ) : (
          <div className="auth-modal-content">
            {error && <div className="alert alert--danger auth-error">{error}</div>}
            
            <form onSubmit={handleSubmit} className="auth-form">
              {!isLoginView && (
                <>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label>Software Background</label>
                    <select value={softwareBg} onChange={e => setSoftwareBg(e.target.value)} className="auth-select">
                      <option>Beginner (No coding)</option>
                      <option>Intermediate (Some Python/JS)</option>
                      <option>Advanced (Software Engineer)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Hardware Background</label>
                    <select value={hardwareBg} onChange={e => setHardwareBg(e.target.value)} className="auth-select">
                      <option>Beginner (Never built a PC/Robot)</option>
                      <option>Intermediate (Arduino/Raspberry Pi)</option>
                      <option>Advanced (Robotics Engineer)</option>
                    </select>
                  </div>
                </>
              )}
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@example.com" />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <button type="submit" className="button button--primary button--block">
                {isLoginView ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="auth-toggle">
              <span className="auth-toggle-text">
                {isLoginView ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button type="button" className="auth-toggle-btn" onClick={() => setIsLoginView(!isLoginView)}>
                {isLoginView ? 'Sign Up' : 'Log In'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
