import React from 'react';
import {
  Shield,
  ShieldAlert,
  Headphones,
  Lock,
  UserCheck,
  Building2,
  ArrowRight,
  AlertCircle,
  PhoneCall,
  Radio,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Info,
  Eye,
  EyeOff,
  ChevronRight,
  Layers,
  MessageSquare,
  Share2
} from 'lucide-react';
import { Tenant, User, Campaign } from '../types/index.js';

interface LoginPageProps {
  portal: 'super-admin' | 'admin' | 'agent';
  tenants: Tenant[];
  activeTenant: Tenant;
  onSelectTenant: (tenant: Tenant) => void;
  onLoginSuccess: (user: User, portal: 'super-admin' | 'admin' | 'agent', tenant: Tenant, campaignInfo?: { campaign: string; queues: string[] }) => void;
  onSwitchPortal: (targetPortal: 'super-admin' | 'admin' | 'agent') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  portal,
  tenants,
  activeTenant,
  onSelectTenant,
  onLoginSuccess,
  onSwitchPortal
}) => {
  const [userId, setUserId] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [selectedTenantId, setSelectedTenantId] = React.useState(activeTenant?.id || 't-1');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // Agent 2-step Campaign & Queue Onboarding Modal State
  const [authenticatedUser, setAuthenticatedUser] = React.useState<User | null>(null);
  const [showCampaignModal, setShowCampaignModal] = React.useState(false);
  const [showQueueModal, setShowQueueModal] = React.useState(false);
  const [availableCampaigns, setAvailableCampaigns] = React.useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = React.useState('Dialer');
  const [selectedQueues, setSelectedQueues] = React.useState<string[]>(['queue_sales_807889336', 'Sales_Outbound_Queue']);

  // Carousel slide for illustration side
  const [activeSlide, setActiveSlide] = React.useState(0);

  const slides = [
    {
      title: 'Inbuild CRM With Cloud Telephony',
      subtitle: 'Manage Your Sales And Support Process',
      icon: 'phone'
    },
    {
      title: 'Social Media Is Here',
      subtitle: 'Manage Customer Queries Across Channels Effortlessly',
      icon: 'social'
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Fetch campaigns for the modal
  React.useEffect(() => {
    fetch(`/api/campaigns?tenantId=${selectedTenantId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableCampaigns(data);
          setSelectedCampaign(data[0].name || 'Dialer');
        }
      })
      .catch(err => console.error('Failed to load campaigns for login modal', err));
  }, [selectedTenantId]);

  // When portal changes, pre-fill sample for convenience if field is blank
  React.useEffect(() => {
    setErrorMsg(null);
    if (portal === 'super-admin') {
      setUserId('superadmin');
      setPassword('SuperAdminMaster@2026');
    } else if (portal === 'admin') {
      setUserId('somnathlead_admin');
      setPassword('AdminPassword@123');
    } else {
      setUserId('somnathlead_agent01');
      setPassword('AgentPass#1002');
    }
  }, [portal]);

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
          portal: portal === 'super-admin' ? 'admin' : portal,
          tenantId: portal === 'super-admin' ? undefined : selectedTenantId
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Authentication failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      // If logging into super-admin, ensure user is SUPER_ADMIN
      if (portal === 'super-admin' && data.user.role !== 'SUPER_ADMIN' && data.user.role !== 'Master Admin') {
        setErrorMsg('Access Denied: Only the Master Platform Super Admin can access the /super-admin portal.');
        setLoading(false);
        return;
      }

      const matchingTenant = tenants.find(t => t.id === data.user.tenantId) || activeTenant;
      
      // If Agent Portal, show the Campaign Selection Modal as in the video
      if (portal === 'agent') {
        setAuthenticatedUser(data.user);
        setShowCampaignModal(true);
      } else {
        onLoginSuccess(data.user, portal, matchingTenant);
      }
    } catch (err: any) {
      console.error('Login request error', err);
      setErrorMsg('Unable to connect to Dialko server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCampaignModal(false);
    setShowQueueModal(true);
  };

  const handleQueueSave = () => {
    setShowQueueModal(false);
    if (authenticatedUser) {
      const matchingTenant = tenants.find(t => t.id === authenticatedUser.tenantId) || activeTenant;
      onLoginSuccess(authenticatedUser, 'agent', matchingTenant, {
        campaign: selectedCampaign,
        queues: selectedQueues
      });
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUserId(u);
    setPassword(p);
    setErrorMsg(null);
  };

  const isSuperAdminPortal = portal === 'super-admin';
  const isAdminPortal = portal === 'admin';
  const isAgentPortal = portal === 'agent';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 font-sans select-none antialiased">
      {/* Top Banner / 3-URL Portal Switch Header */}
      <header className="w-full bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-md tracking-wider ${
              isSuperAdminPortal ? 'bg-indigo-600' : isAdminPortal ? 'bg-blue-600' : 'bg-emerald-600'
            }`}>
              D
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base tracking-tight">Dialko Cloud Telephony</span>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                  isSuperAdminPortal ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                  isAdminPortal ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {isSuperAdminPortal ? 'Super Admin Portal' : isAdminPortal ? 'Tenant Admin Portal' : 'Agent Softphone Portal'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block -mt-0.5">Enterprise Cloud Telephony & Multi-Tenant Softphone</span>
            </div>
          </div>

          {/* 3 Dedicated Portal Switching Tabs with URLs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner overflow-x-auto max-w-full">
            <button
              type="button"
              id="switch-to-super-admin-btn"
              onClick={() => onSwitchPortal('super-admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                isSuperAdminPortal
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Super Admin (/super-admin)</span>
            </button>

            <button
              type="button"
              id="switch-to-admin-btn"
              onClick={() => onSwitchPortal('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                isAdminPortal
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Admin Panel (/admin)</span>
            </button>

            <button
              type="button"
              id="switch-to-agent-btn"
              onClick={() => onSwitchPortal('agent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                isAgentPortal
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-900 hover:bg-slate-200'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Agent Station (/agent)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Split-Screen Login Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 max-w-6xl w-full mx-auto">
        <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* Left Column: Portal Illustration Graphic & Badges */}
          <div className={`lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 relative overflow-hidden ${
            isSuperAdminPortal
              ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white'
              : 'bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-100 text-slate-800'
          }`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>

            <div className="flex items-center gap-2 relative z-10">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono uppercase tracking-wider ${
                isSuperAdminPortal
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/40'
                  : isAdminPortal
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {isSuperAdminPortal
                  ? 'MASTER SAAS LAYER • SUPER ADMIN GATEWAY'
                  : isAdminPortal
                  ? 'CLIENT TENANT • ADMINISTRATOR CONSOLE'
                  : 'AGENT WORKSPACE • WEBRTC SOFTPHONE'}
              </span>
            </div>

            {/* Center Graphic */}
            <div className="my-auto py-8 text-center relative z-10">
              <div className="w-56 h-56 mx-auto relative flex items-center justify-center">
                {/* Visual Telephony Nodes Representation */}
                <div className={`absolute w-44 h-44 rounded-full animate-ping ${
                  isSuperAdminPortal ? 'bg-indigo-500/20' : 'bg-blue-400/15'
                }`}></div>
                <div className={`w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-2xl p-4 text-white ${
                  isSuperAdminPortal
                    ? 'bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600'
                    : isAdminPortal
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-600'
                }`}>
                  {isSuperAdminPortal ? (
                    <>
                      <ShieldAlert className="w-12 h-12 mb-2 animate-bounce" />
                      <span className="text-xs font-black uppercase tracking-wider">Multi-Tenant</span>
                    </>
                  ) : activeSlide === 0 ? (
                    <>
                      <PhoneCall className="w-12 h-12 mb-2 animate-bounce" />
                      <span className="text-xs font-black uppercase tracking-wider">Cloud PBX</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-12 h-12 mb-2 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider">Omni-Channel</span>
                    </>
                  )}
                </div>

                {/* Floating Badges */}
                <div className="absolute -top-2 -right-2 bg-white text-slate-800 px-3 py-1 rounded-full shadow-md border border-slate-200 text-[11px] font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  {isSuperAdminPortal ? 'Cluster Online' : 'SIP Active'}
                </div>
                <div className="absolute -bottom-2 -left-2 bg-white text-slate-800 px-3 py-1 rounded-full shadow-md border border-slate-200 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  {isSuperAdminPortal ? 'MariaDB Asterisk' : 'Auto CRM Sync'}
                </div>
              </div>

              {/* Text Slogans */}
              <div className="mt-8">
                <h3 className={`text-xl font-black tracking-tight ${isSuperAdminPortal ? 'text-white' : 'text-slate-800'}`}>
                  {isSuperAdminPortal
                    ? 'Master Multi-Tenant Control System'
                    : slides[activeSlide].title}
                </h3>
                <p className={`text-xs mt-1 max-w-sm mx-auto ${isSuperAdminPortal ? 'text-slate-300' : 'text-slate-500'}`}>
                  {isSuperAdminPortal
                    ? 'Add new client companies, create tenant admin panels, configure ViciDial 192.168.1.11, EspoCRM API, and manage master user licenses.'
                    : slides[activeSlide].subtitle}
                </p>
              </div>

              {/* Slide dots */}
              {!isSuperAdminPortal && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                        activeSlide === i ? 'w-6 bg-blue-600' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className={`text-left text-[11px] relative z-10 flex items-center justify-between ${
              isSuperAdminPortal ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <span>© 2026 Dialko Cloud Telephony</span>
              <span>All Rights Reserved</span>
            </div>
          </div>

          {/* Right Column: Clean Login Form */}
          <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between bg-white">
            <div>
              {/* Brand Logo in Form Header */}
              <div className="flex items-center gap-2 mb-6">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-xs ${
                  isSuperAdminPortal ? 'bg-indigo-600' : 'bg-red-600'
                }`}>
                  {isSuperAdminPortal ? 'S' : 'D'}
                </div>
                <span className="font-black text-2xl text-slate-900 tracking-tighter">
                  {isSuperAdminPortal ? 'Dialko Super Admin' : 'Dialko'}
                </span>
              </div>

              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">
                  {isSuperAdminPortal
                    ? 'Super Admin Portal Login'
                    : isAdminPortal
                    ? 'Tenant Admin Console Login'
                    : 'Agent Softphone Login'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isSuperAdminPortal
                    ? 'Platform Owner Authentication. Add clients, create tenant admin panels, and manage infrastructure controls.'
                    : isAdminPortal
                    ? 'Enter your company administrator credentials to manage your team, create agent IDs, and configure dialer campaigns.'
                    : 'Enter your assigned Agent User ID & Password to launch your softphone station.'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-800 text-xs animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <strong className="block font-bold">Authentication Failed</strong>
                      <span>{errorMsg}</span>
                    </div>
                  </div>
                )}

                {/* Tenant Selector (Only for Tenant Admin and Agent) */}
                {!isSuperAdminPortal && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Client Organization / Tenant
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <select
                        value={selectedTenantId}
                        onChange={e => {
                          setSelectedTenantId(e.target.value);
                          const t = tenants.find(item => item.id === e.target.value);
                          if (t) onSelectTenant(t);
                        }}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        {tenants.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.slug || t.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Super Admin Organization Badge */}
                {isSuperAdminPortal && (
                  <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-indigo-600" />
                      Platform Scope: Global Multi-Tenant
                    </span>
                    <span className="font-mono text-[10px] bg-indigo-200 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
                      ALL_CLIENTS
                    </span>
                  </div>
                )}

                {/* User ID / Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isSuperAdminPortal
                      ? 'Super Admin Username *'
                      : isAdminPortal
                      ? 'Admin User ID / Email *'
                      : 'Agent User ID / Email *'}
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder={
                        isSuperAdminPortal
                          ? 'e.g. superadmin'
                          : isAdminPortal
                          ? 'e.g. somnathlead_admin'
                          : 'e.g. somnathlead_agent01'
                      }
                      value={userId}
                      onChange={e => setUserId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Password *</span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2.5 px-4 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                    isSuperAdminPortal
                      ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                      : isAdminPortal
                      ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                  } disabled:opacity-50 mt-2`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>
                        {isSuperAdminPortal
                          ? 'Access Master SaaS Console (/super-admin)'
                          : isAdminPortal
                          ? 'Sign In to Admin Panel (/admin)'
                          : 'Launch Softphone Station (/agent)'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick autofill helper */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Demo Quick-Fill Credentials:
                </span>
                {isSuperAdminPortal ? (
                  <button
                    type="button"
                    onClick={() => handleQuickFill('superadmin', 'SuperAdminMaster@2026')}
                    className="w-full p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-left transition cursor-pointer text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-indigo-900 block">superadmin</span>
                      <span className="text-[10px] text-indigo-600">Master SaaS Platform Owner</span>
                    </div>
                    <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">Super Admin</span>
                  </button>
                ) : isAdminPortal ? (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickFill('somnathlead_admin', 'AdminPassword@123')}
                      className="w-full p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-left transition cursor-pointer text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono font-bold text-blue-900 block">somnathlead_admin</span>
                        <span className="text-[10px] text-blue-600">Somnath Enterprise Tenant Admin</span>
                      </div>
                      <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">Tenant Admin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('apex_admin', 'ApexAdminPass@2026')}
                      className="w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition cursor-pointer text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-800 block">apex_admin</span>
                        <span className="text-[10px] text-slate-500">Apex Teleservices Admin</span>
                      </div>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">Tenant Admin</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleQuickFill('somnathlead_agent01', 'AgentPass#1002')}
                      className="p-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded text-left transition cursor-pointer"
                    >
                      <span className="font-mono font-bold text-slate-800 block truncate">agent01 (RIYA001)</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">Ext: 1002 / 114</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('somnathlead_agent02', 'AgentPass#1003')}
                      className="p-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded text-left transition cursor-pointer"
                    >
                      <span className="font-mono font-bold text-slate-800 block truncate">agent02 (MAHI002)</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">Ext: 1003</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Portal Switcher Footer Links */}
            <div className="pt-4 text-center border-t border-slate-100 mt-4 space-y-1">
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => onSwitchPortal('super-admin')}
                  className={`hover:underline cursor-pointer ${isSuperAdminPortal ? 'font-bold text-indigo-600' : 'text-slate-600'}`}
                >
                  Super Admin (/super-admin)
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onSwitchPortal('admin')}
                  className={`hover:underline cursor-pointer ${isAdminPortal ? 'font-bold text-blue-600' : 'text-slate-600'}`}
                >
                  Admin Panel (/admin)
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onSwitchPortal('agent')}
                  className={`hover:underline cursor-pointer ${isAgentPortal ? 'font-bold text-emerald-600' : 'text-slate-600'}`}
                >
                  Agent Softphone (/agent)
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* STEP 1: SELECT CAMPAIGN MODAL (Shown right after agent login like video 00:01 - 00:05) */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 text-center mb-4">
              Select Campaign
            </h3>

            <form onSubmit={handleCampaignSubmit} className="space-y-4">
              {/* Agent Extension / Station Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Agent Station Code</label>
                <input
                  type="text"
                  readOnly
                  value={authenticatedUser?.mobileExtension || '114'}
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-700 text-center"
                />
              </div>

              {/* Campaign Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Campaign *</label>
                <select
                  value={selectedCampaign}
                  onChange={e => setSelectedCampaign(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Dialer">Dialer</option>
                  <option value="RIYA001">RIYA001 (Sales Predictive)</option>
                  <option value="auto1">auto1 (Outbound Auto)</option>
                  <option value="MAHI002">MAHI002</option>
                  <option value="INBOUND_SUPPORT_Q">INBOUND_SUPPORT_Q</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-bold text-xs cursor-pointer"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-md"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT QUEUE MODAL (Shown right after campaign selection like video 00:06 - 00:09) */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 text-center mb-4">
              Select Queue
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Queues *
                </label>
                
                {/* Active chips */}
                <div className="p-2 border border-slate-300 rounded-lg bg-slate-50 min-h-[44px] flex flex-wrap gap-1.5 items-center">
                  {selectedQueues.map(q => (
                    <span
                      key={q}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-xs font-mono font-bold border border-blue-200"
                    >
                      <span>{q}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedQueues(selectedQueues.filter(item => item !== q))}
                        className="text-blue-600 hover:text-blue-900 ml-0.5 cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                {/* Queue Options checklist */}
                <div className="mt-2 text-xs space-y-1 bg-white border border-slate-200 rounded-lg p-2 max-h-36 overflow-y-auto">
                  {['queue_sales_807889336', 'Sales_Outbound_Queue', 'somnathlead_Incoming', 'Maintenance_Queue'].map(queueOpt => (
                    <label key={queueOpt} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedQueues.includes(queueOpt)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedQueues([...selectedQueues, queueOpt]);
                          } else {
                            setSelectedQueues(selectedQueues.filter(q => q !== queueOpt));
                          }
                        }}
                        className="rounded text-blue-600"
                      />
                      <span className="font-mono text-slate-700">{queueOpt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleQueueSave}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Save & Launch Softphone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer info */}
      <footer className="w-full py-3 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        <span>Dialko Cloud Telephony System • Version 2.1.108 Enterprise</span>
      </footer>
    </div>
  );
};
