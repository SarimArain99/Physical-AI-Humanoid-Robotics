import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signIn, signUp, signOut, authClient } from '../../utils/authClient';
import { UserCircle, X, LogIn, UserPlus, LogOut, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import { useLocation } from '@docusaurus/router';
import './AuthModal.css';

export default function AuthModal() {
  const { data: session, isPending } = useSession();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [softwareBg, setSoftwareBg] = useState('Beginner');
  const [hardwareBg, setHardwareBg] = useState('Beginner');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle updating button labels based on session
  useEffect(() => {
    const updateButtons = () => {
      const btns = document.querySelectorAll('.nav-login-btn');
      if (btns.length === 0 || isPending) return;

      const targetHTML = session
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user" style="margin-right: 6px; vertical-align: -3px;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${session.user.name || session.user.email}`
        : 'Login';

      btns.forEach(btn => {
        if (btn.innerHTML !== targetHTML) {
          btn.innerHTML = targetHTML;
        }
      });
    };

    updateButtons();

    // Debounced MutationObserver to prevent cascading DOM mutation lag
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateButtons, 150);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    // Also use global event delegation to handle clicks on any .nav-login-btn
    const handleGlobalClick = (e) => {
      const btn = e.target.closest('.nav-login-btn');
      if (btn) {
        e.preventDefault();
        // Close Docusaurus mobile sidebar if open
        const closeBtn = document.querySelector('.navbar-sidebar__close');
        if (closeBtn) closeBtn.click();
        setIsOpen(true);
      }
    };

    document.addEventListener('click', handleGlobalClick);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      observer.disconnect();
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [session, isPending, location.pathname]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (session) {
      await signOut();
      localStorage.removeItem('userBg');
      setIsOpen(false);
      return;
    }

    try {
      if (view === 'login') {
        const { error } = await signIn.email({ email, password });
        if (error) throw new Error(error.message);
        setIsOpen(false);
      } else if (view === 'signup') {
        const { error } = await signUp.email({ email, password, name });
        if (error) throw new Error(error.message);
        setIsOpen(false);
      } else if (view === 'forgot') {
        const { error } = await authClient.forgetPassword({
          email,
          redirectTo: window.location.origin + '/reset-password'
        });
        if (error) throw new Error(error.message);
        setSuccessMessage('If an account exists, a password reset link has been sent to your email.');
      }
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
            ) : view === 'login' ? (
              <><LogIn size={20} /> Login</>
            ) : view === 'signup' ? (
              <><UserPlus size={20} /> Create Account</>
            ) : (
              <><KeyRound size={20} /> Reset Password</>
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
            {successMessage && <div className="alert alert--success auth-success">{successMessage}</div>}
            
            <form onSubmit={handleSubmit} className="auth-form">
              {view === 'signup' && (
                <>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label>Software Background</label>
                    <select value={softwareBg} onChange={e => setSoftwareBg(e.target.value)} className="auth-select">
                      <option value="Beginner">Beginner (No coding)</option>
                      <option value="Intermediate">Intermediate (Some Python/JS)</option>
                      <option value="Advanced">Advanced (Software Engineer)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Hardware Background</label>
                    <select value={hardwareBg} onChange={e => setHardwareBg(e.target.value)} className="auth-select">
                      <option value="Beginner">Beginner (Never built a PC/Robot)</option>
                      <option value="Intermediate">Intermediate (Arduino/Raspberry Pi)</option>
                      <option value="Advanced">Advanced (Robotics Engineer)</option>
                    </select>
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@example.com" />
              </div>

              {view !== 'forgot' && (
                <div className="form-group">
                  <label>Password</label>
                  <div className="password-input-wrapper" style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                      placeholder="••••••••" 
                      style={{ paddingRight: '40px', width: '100%' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle-btn"
                      style={{ 
                        position: 'absolute', 
                        right: '12px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--foreground-light, #888)', 
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  {view === 'login' && (
                    <div style={{ textAlign: 'right', marginTop: '6px' }}>
                      <button 
                        type="button" 
                        className="auth-link-btn"
                        onClick={() => { setView('forgot'); setError(''); setSuccessMessage(''); }}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className="button button--primary button--block" style={{ marginTop: '16px' }}>
                {view === 'login' ? 'Sign In' : view === 'signup' ? 'Sign Up' : 'Send Reset Link'}
              </button>
            </form>

            <div className="auth-toggle">
              {view === 'forgot' ? (
                <button type="button" className="auth-toggle-btn" onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}>
                  <ArrowLeft size={14} /> Back to Login
                </button>
              ) : (
                <>
                  <span className="auth-toggle-text">
                    {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                  </span>
                  <button type="button" className="auth-toggle-btn" onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setError(''); setSuccessMessage(''); }}>
                    {view === 'login' ? 'Sign Up' : 'Log In'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
