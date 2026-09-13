import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  UserCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Server,
  Activity
} from 'lucide-react';
import { User, Tenant } from '../types/index.js';

interface SuperAdminLoginPageProps {
  onLoginSuccess: (user: User, portal: 'super-admin', tenant: Tenant) => void;
}

export const SuperAdminLoginPage: React.FC<SuperAdminLoginPageProps> = ({
  onLoginSuccess
}) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId.trim(),
          password: password.trim(),
          portal: 'super-admin'
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Super Admin authentication failed. Verify master credentials.');
        setLoading(false);
        return;
      }

      if (data.user.role !== 'SUPER_ADMIN' && data.user.role !== 'Master Admin') {
        setErrorMsg('Access Denied: Only Master Super Admin accounts are permitted.');
        setLoading(false);
        return;
      }

      const rootTenant: Tenant = {
        id: 't-root',
        name: 'Master Platform Root',
        code: 'ROOT',
        status: 'active',
        userLicenses: 9999,
        availableMinutes: 9999999,
        viciUserGroup: 'SUPER_ADMIN_GROUP',
        espoTeam: 'Master Operations',
        createdAt: new Date().toISOString()
      };

      onLoginSuccess(data.user, 'super-admin', rootTenant);
    } catch (err) {
      console.error('Master Super Admin Login Error', err);
      setErrorMsg('Unable to reach Dialko master authentication service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Security Banner */}
      <header className="w-full border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-600/30">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">Dialko Master Control</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                  Super Admin Panel
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Master SaaS Infrastructure & Multi-Client Controller</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Master Node Operational
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">Master Super Admin Login</h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Enter your Master Platform credentials to access client provisioning, license allocations, and infrastructure telemetry.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Authentication Refused</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Master Username *
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  id="superadmin-username-input"
                  type="text"
                  required
                  autoFocus
                  placeholder="Master Super Admin Username"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-medium text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Master Password *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  id="superadmin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="superadmin-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Super Admin Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center">
            <span className="text-[11px] text-slate-500">
              Dialko SaaS Platform Core • Security Guarded
            </span>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-[11px] text-slate-600 border-t border-slate-900">
        Dialko Enterprise Telephony • Root Platform Super Admin Portal
      </footer>
    </div>
  );
};
