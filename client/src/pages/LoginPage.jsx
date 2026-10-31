import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, UserCheck, AlertCircle, Lock, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'System Administrator',
    rank: 'Director General / Addl. CP',
    badge: 'ADM-001',
    altBadge: 'MH-HQ-001',
    password: 'Admin@123',
    desc: 'Full analytics, station oversight, officer registry, database logs',
    color: 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: '👑',
  },
  {
    role: 'Senior Police Inspector (Sr. PI)',
    rank: 'Head Officer (HQ Precinct)',
    badge: 'HED-101',
    altBadge: 'MH-MUM-101',
    password: 'Head@123',
    desc: 'Case approvals, judicial warrants, BOLO broadcasts, lockup custody',
    color: 'border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20',
    tagColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: '⭐',
  },
  {
    role: 'Police Sub-Inspector (PSI)',
    rank: 'Field Investigator (Crime Branch)',
    badge: 'OFF-201',
    altBadge: 'MH-MUM-201',
    password: 'Officer@123',
    desc: 'FIR registration, crime mapping, evidence intake, witness statements',
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: '👮',
  },
  {
    role: 'Evidence Malkhana Incharge',
    rank: 'Evidence Manager',
    badge: 'EVD-301',
    altBadge: 'MH-MUM-301',
    password: 'Evidence@123',
    desc: 'Vault custody transfers, SHA-256 chain of custody, QR verification',
    color: 'border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20',
    tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    icon: '📦',
  },
];

export default function LoginPage() {
  const [badgeNumber, setBadgeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleFillDemo = (account, useAlt = false) => {
    const badgeToUse = useAlt ? account.altBadge : account.badge;
    setBadgeNumber(badgeToUse);
    setPassword(account.password);
    setSelectedBadge(badgeToUse);
    setError('');
  };

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
      <div className="w-full max-w-4xl bg-hq-card border border-hq-border rounded-2xl shadow-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Login Form & Insignia (7 cols on desktop) */}
        <div className="md:col-span-7 space-y-6">
          {/* Police Insignia & Header */}
          <div className="text-center md:text-left space-y-1.5">
            <div className="flex items-center space-x-3 justify-center md:justify-start">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-2xl shadow-inner">
                🛡️
              </div>
              <div>
                <h1 className="text-base font-bold text-white uppercase tracking-wider font-sans">
                  Maharashtra Police Headquarters
                </h1>
                <p className="text-xs text-blue-400 font-semibold">
                  Police Headquarters Data Management System (PHDMS v2.0)
                </p>
              </div>
            </div>
            <p className="text-[11px] text-hq-muted pt-1">
              Individual Officer Command, Investigation & Access Portal
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-xs text-red-400 flex items-center space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{typeof error === 'string' ? error : error?.message || 'Authentication error.'}</span>
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
                    if (selectedBadge) setSelectedBadge('');
                    if (error) setError('');
                  }}
                  placeholder="e.g. ADM-001 or MH-HQ-001"
                  className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono uppercase"
                  autoComplete="username"
                />
              </div>
              <p className="text-[10px] text-hq-muted mt-1">
                Enter your assigned Maharashtra Police badge identifier
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
          <div className="border-t border-hq-border text-[11px] text-slate-400 space-y-1 bg-slate-900/40 p-3 rounded-lg">
            <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>Restricted Official Police Network</span>
            </div>
            <p className="text-[10px] text-hq-muted leading-relaxed">
              Every commissioned officer must log in with their own Service Badge Number and security password.
              Role-Based Access Control (RBAC) is enforced and audited under Section 66 of the IT Act.
            </p>
          </div>
        </div>

        {/* Right Column: Demo Accounts & 1-Click Autofill (5 cols on desktop) */}
        <div className="md:col-span-5 bg-slate-900/70 border border-hq-border rounded-xl p-4 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-hq-border">
            <div className="flex items-center space-x-1.5 text-blue-400 font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Demo Accounts (Evaluation)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              1-Click Autofill
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Click any officer profile below to automatically populate the login credentials for testing:
          </p>

          <div className="space-y-2.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const isActive = selectedBadge === acc.badge || selectedBadge === acc.altBadge;
              return (
                <div
                  key={acc.badge}
                  className={`p-2.5 rounded-lg border transition-all text-left relative ${
                    isActive
                      ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500'
                      : 'border-hq-border bg-slate-950/40 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm">{acc.icon}</span>
                      <div>
                        <span className="text-xs font-bold text-white block leading-tight">
                          {acc.role}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {acc.rank}
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <span className="flex items-center space-x-1 text-[10px] text-blue-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Selected</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-hq-muted mt-1 leading-snug">
                    {acc.desc}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <div className="font-mono text-slate-300">
                      <span className="text-hq-muted text-[10px]">Badge: </span>
                      <span className="font-bold text-white">{acc.badge}</span>
                      <span className="text-hq-muted mx-1.5">•</span>
                      <span className="text-hq-muted text-[10px]">Pass: </span>
                      <span className="text-amber-300 font-semibold">{acc.password}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleFillDemo(acc, false)}
                        className="px-2 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white text-[10px] font-semibold border border-blue-500/40 transition"
                      >
                        Autofill
                      </button>
                      <button
                        type="button"
                        title={`Alternate badge: ${acc.altBadge}`}
                        onClick={() => handleFillDemo(acc, true)}
                        className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[9px] font-mono border border-slate-700 transition"
                      >
                        {acc.altBadge}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-500 text-center italic pt-1">
            Tip: You can switch between roles anytime to test different authorization levels.
          </p>
        </div>

      </div>
    </div>
  );
}
