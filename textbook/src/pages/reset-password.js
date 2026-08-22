import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { authClient } from '../utils/authClient';
import { Eye, EyeOff, CheckCircle, AlertTriangle, KeyRound } from 'lucide-react';

export default function ResetPassword() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken) {
        setToken(urlToken);
      } else {
        setError('Invalid or expired password reset link. Please request a new link from the login menu.');
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword,
        token
      });

      if (resetError) {
        throw new Error(resetError.message || 'Failed to reset password');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'An error occurred during password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Reset Password" description="Create a new password for your account">
      <div style={{ maxWidth: '440px', margin: '80px auto', padding: '0 20px' }}>
        <div style={{
          backgroundColor: 'var(--surface-elevated, #fff)',
          border: '1px solid var(--border, #ddd)',
          borderRadius: '16px',
          padding: '36px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Password Reset Successful! 🎉</h2>
              <p style={{ color: 'var(--foreground-light)', marginBottom: '24px' }}>
                Your password has been updated. You can now close this tab and log in using your new credentials.
              </p>
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined') window.location.href = '/';
                }}
                className="button button--primary button--block"
              >
                Go to Homepage
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <KeyRound size={24} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Reset Your Password</h2>
              </div>
              
              <p style={{ fontSize: '0.9rem', color: 'var(--foreground-light)', marginBottom: '24px' }}>
                Enter your new password below. It must be at least 8 characters.
              </p>

              {error && (
                <div className="alert alert--danger" style={{ marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{error}</div>
                </div>
              )}

              {token && (
                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem' }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                        placeholder="Min 8 characters"
                        style={{ width: '100%', paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#888',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem' }}>Confirm New Password</label>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat new password"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="button button--primary button--block"
                    disabled={loading}
                  >
                    {loading ? 'Updating Password...' : 'Reset Password'}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
