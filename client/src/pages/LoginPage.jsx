import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, UserCheck, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [badgeNumber, setBadgeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!badgeNumber.trim()) {
      setError('Please enter your official Officer Service Badge Number.');
      return;
    }
    if (!password) {
      setError('Please enter your security passcode.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(badgeNumber.trim().toUpperCase(), password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message || 'Authentication failed: Invalid badge number or security password.');
    }
  };

  return (
    <div className="min-h-screen bg-hq-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-hq-card border border-hq-border rounded-2xl shadow-2xl p-8 space-y-6">
        {/* Police Insignia & Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mx-auto text-3xl shadow-inner">
            🛡️
          </div>
          <h1 className="text-base font-bold text-white uppercase tracking-wider font-sans">
            Maharashtra Police Headquarters
          </h1>
          <p className="text-xs text-blue-400 font-semibold">
            Police Headquarters Data Management System (PHDMS v2.0)
          </p>
          <p className="text-[11px] text-hq-muted">
            Individual Officer Command & Access Portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-xs text-red-400 flex items-center space-x-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Individual Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Officer Service Badge Number (Login ID)
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
              <input
                type="text"
                required
                value={badgeNumber}
                onChange={(e) => {
                  setBadgeNumber(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. MH-HQ-001 or ADM-001"
                className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono uppercase"
                autoComplete="username"
              />
            </div>
            <p className="text-[10px] text-hq-muted mt-1">
              Enter your assigned individual Maharashtra Police badge identifier
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Security Passcode
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter personal passcode"
                className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-10 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>{isSubmitting ? 'Verifying Credentials...' : 'Sign In with Officer Credentials'}</span>
          </button>
        </form>

        {/* Security Notice */}
        <div className="pt-4 border-t border-hq-border text-[11px] text-slate-400 space-y-1 bg-slate-900/40 p-3 rounded-lg">
          <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Restricted Official Police Network</span>
          </div>
          <p className="text-[10px] text-hq-muted leading-relaxed">
            Every commissioned officer must log in with their own unique Service Badge Number and security password.
            Account sharing or unauthorized switching is strictly prohibited and audited under Section 66 of the IT Act.
          </p>
        </div>
      </div>
    </div>
  );
}
