import React, { useState, useEffect } from 'react';
import {
  Building2,
  Lock,
  UserCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Briefcase
} from 'lucide-react';
import { User, Tenant } from '../types/index.js';

interface ClientAdminLoginPageProps {
  tenants: Tenant[];
  activeTenant: Tenant;
  onSelectTenant: (tenant: Tenant) => void;
  onLoginSuccess: (user: User, portal: 'admin', tenant: Tenant) => void;
}

export const ClientAdminLoginPage: React.FC<ClientAdminLoginPageProps> = ({
  tenants,
  activeTenant,
  onSelectTenant,
  onLoginSuccess
}) => {
  const [selectedTenantId, setSelectedTenantId] = useState(activeTenant?.id || (tenants[0]?.id || ''));
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTenant?.id) {
      setSelectedTenantId(activeTenant.id);
    } else if (tenants.length > 0) {
      setSelectedTenantId(tenants[0].id);
      onSelectTenant(tenants[0]);
    }
  }, [activeTenant?.id, tenants]);

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
          portal: 'admin',
          tenantId: selectedTenantId
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Admin authentication failed. Verify your credentials.');
        setLoading(false);
        return;
      }

      if (data.user.role === 'Agent') {
        setErrorMsg('Access Denied: Agent accounts cannot log in to the Client Admin Panel. Please use the dedicated Agent Softphone URL.');
        setLoading(false);
        return;
      }

      const matchingTenant = tenants.find(t => t.id === data.user.tenantId) || activeTenant || tenants[0];
      onLoginSuccess(data.user, 'admin', matchingTenant);
    } catch (err) {
      console.error('Client Admin Login Error', err);
      setErrorMsg('Unable to connect to authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col justify-between antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="w-full border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-sm">
              D
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base tracking-tight">Dialko Admin Portal</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                  Admin Panel
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Client Administration & Telephony Operations</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              PBX Telephony Online
            </span>
          </div>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Client Administrator Login</h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Sign in with your client administrator credentials to manage user seats, campaigns, call flows, and reporting.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Sign-In Failed</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client Selection (if clients exist) */}
            {tenants.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Client Account *
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    id="client-admin-tenant-select"
                    value={selectedTenantId}
                    onChange={e => {
                      setSelectedTenantId(e.target.value);
                      const t = tenants.find(item => item.id === e.target.value);
                      if (t) onSelectTenant(t);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                  >
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code || t.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Admin User ID / Username *
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="client-admin-username-input"
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. admin username"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="client-admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="client-admin-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Admin Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Dialko Tenant Administration • Real Credentials Required
            </span>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-[11px] text-slate-500 border-t border-slate-200 bg-white">
        Dialko Cloud Telephony • Client Administrator Portal
      </footer>
    </div>
  );
};
