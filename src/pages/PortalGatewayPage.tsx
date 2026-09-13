import React from 'react';
import {
  ShieldAlert,
  Building2,
  Headphones,
  ArrowRight,
  ExternalLink,
  PhoneCall,
  Server,
  Users,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';

interface PortalGatewayPageProps {
  onNavigateToPortal: (portal: 'super-admin' | 'admin' | 'agent') => void;
}

export const PortalGatewayPage: React.FC<PortalGatewayPageProps> = ({ onNavigateToPortal }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-slate-100 flex flex-col justify-between antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="w-full border-b border-slate-700/80 bg-slate-900/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
              D
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-white text-lg tracking-tight">Dialko Cloud Telephony</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Multi-Tenant SaaS
                </span>
              </div>
              <p className="text-xs text-slate-400">Enterprise Unified PBX, VICIdial & EspoCRM Ecosystem</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All Telephony Nodes Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero Directory Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10 sm:py-14 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dedicated Multi-Portal Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Select Your Portal Entry Point
          </h2>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            Choose the dedicated URL for your access role. Each URL operates with independent authentication, role validation, and functional toolsets.
          </p>
        </div>

        {/* 3 Dedicated Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Super Admin Panel Card */}
          <div
            id="gateway-super-admin-card"
            className="group bg-slate-800/70 hover:bg-slate-800 border border-indigo-500/30 hover:border-indigo-500 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-indigo-500/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl group-hover:bg-indigo-600/20 transition-all pointer-events-none"></div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-inner">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <span className="font-mono text-[11px] font-bold px-2 py-1 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                  /super-admin
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                Super Admin Panel
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Master SaaS control layer for the platform owner. Add new client companies, create tenant admin panels, configure ViciDial 192.168.1.11, EspoCRM API, and manage global licenses.
              </p>

              <ul className="space-y-1.5 text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Client Company Provisioning & Onboarding</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Create Admin Panels & Credentials</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Global Asterisk Telephony CDR Metrics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Infrastructure Connection Settings</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => onNavigateToPortal('super-admin')}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <span>Launch Super Admin URL</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Client Admin Panel Card */}
          <div
            id="gateway-admin-card"
            className="group bg-slate-800/70 hover:bg-slate-800 border border-blue-500/30 hover:border-blue-500 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-blue-500/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl group-hover:bg-blue-600/20 transition-all pointer-events-none"></div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-inner">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="font-mono text-[11px] font-bold px-2 py-1 rounded bg-blue-950/80 text-blue-300 border border-blue-800">
                  /admin
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                Client Admin Panel
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Client company management console. Create agent IDs, configure campaigns, lists, queues, IVRs, and monitor live calls for your client.
              </p>

              <ul className="space-y-1.5 text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Create Agent IDs, User Groups & Passwords</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Campaigns, Queues & List Uploads</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Live Agent Monitoring, Barge & Whisper</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Call Logs, CDR Reports & Audio Playback</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => onNavigateToPortal('admin')}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
              >
                <span>Launch Admin Panel URL</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3. Agent Softphone Panel Card */}
          <div
            id="gateway-agent-card"
            className="group bg-slate-800/70 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-emerald-500/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-2xl group-hover:bg-emerald-600/20 transition-all pointer-events-none"></div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-inner">
                  <Headphones className="w-6 h-6" />
                </div>
                <span className="font-mono text-[11px] font-bold px-2 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  /agent
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Agent Softphone Panel
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Telephony agent calling workstation. WebRTC softphone dialer, manual & auto-dialing, queue handling, transfer, call notes, and CRM integration.
              </p>

              <ul className="space-y-1.5 text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>WebRTC Softphone Dialer & Audio Pipeline</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Inbound Queue & Outbound Campaign Login</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Call Hangup, Hold, Transfer & Dispositioning</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Customer Lead Details & Instant Script View</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => onNavigateToPortal('agent')}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <span>Launch Agent Softphone URL</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800 bg-slate-900/90 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Dialko Cloud Telephony • Multi-Tenant Architecture</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Direct URLs:</span>
            <span className="font-mono text-indigo-400">/super-admin</span>
            <span className="font-mono text-blue-400">/admin</span>
            <span className="font-mono text-emerald-400">/agent</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
