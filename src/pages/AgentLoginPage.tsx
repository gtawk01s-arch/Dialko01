import React, { useState, useEffect } from 'react';
import {
  Headphones,
  Lock,
  UserCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  PhoneCall,
  Briefcase,
  Layers,
  Radio
} from 'lucide-react';
import { User, Tenant } from '../types/index.js';

interface AgentLoginPageProps {
  tenants: Tenant[];
  activeTenant: Tenant;
  onSelectTenant: (tenant: Tenant) => void;
  onLoginSuccess: (
    user: User,
    portal: 'agent',
    tenant: Tenant,
    agentCampaignInfo?: { campaign: string; queues: string[] }
  ) => void;
}

export const AgentLoginPage: React.FC<AgentLoginPageProps> = ({
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

  // Step 2: Campaign and Queue Assignment Modal after credentials validated
  const [verifiedUser, setVerifiedUser] = useState<User | null>(null);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignsList, setCampaignsList] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedQueues, setSelectedQueues] = useState<string[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  useEffect(() => {
    if (activeTenant?.id) {
      setSelectedTenantId(activeTenant.id);
    } else if (tenants.length > 0) {
      setSelectedTenantId(tenants[0].id);
      onSelectTenant(tenants[0]);
    }
  }, [activeTenant?.id, tenants]);

  const handleStep1Submit = async (e: React.FormEvent) => {
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
          portal: 'agent',
          tenantId: selectedTenantId
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Agent authentication failed. Check your Agent ID and Password.');
        setLoading(false);
        return;
      }

      setVerifiedUser(data.user);

      // Load available campaigns for this agent's client
      setIsLoadingCampaigns(true);
      try {
        const campRes = await fetch(`/api/campaigns?tenantId=${data.user.tenantId || selectedTenantId}`);
        const campData = await campRes.json();
        if (Array.isArray(campData) && campData.length > 0) {
          setCampaignsList(campData);
          setSelectedCampaign(campData[0].name || campData[0].id);
        } else {
          setCampaignsList([{ id: 'camp-default', name: 'General Outbound Dialer', type: 'PREDICTIVE' }]);
          setSelectedCampaign('General Outbound Dialer');
        }
        setSelectedQueues(['Tier-1 Inbound Support', 'Sales Queue']);
      } catch (err) {
        console.error('Failed to fetch campaigns', err);
        setCampaignsList([{ id: 'camp-default', name: 'Standard Campaign', type: 'PREDICTIVE' }]);
        setSelectedCampaign('Standard Campaign');
      } finally {
        setIsLoadingCampaigns(false);
        setIsCampaignModalOpen(true);
      }
    } catch (err) {
      console.error('Agent Login Error', err);
      setErrorMsg('Unable to connect to softphone server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishLaunchStation = () => {
    if (!verifiedUser) return;
    const matchingTenant = tenants.find(t => t.id === verifiedUser.tenantId) || activeTenant || tenants[0];
    onLoginSuccess(verifiedUser, 'agent', matchingTenant, {
      campaign: selectedCampaign || 'Standard Campaign',
      queues: selectedQueues
    });
  };

  const toggleQueue = (queueName: string) => {
    if (selectedQueues.includes(queueName)) {
      setSelectedQueues(selectedQueues.filter(q => q !== queueName));
    } else {
      setSelectedQueues([...selectedQueues, queueName]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-emerald-600/30">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">Dialko Agent Station</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Agent Softphone
                </span>
              </div>
              <p className="text-[11px] text-slate-400">WebRTC Telephony, Auto-Hopper & Lead Workspace</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SIP WebRTC Engine Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Form */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <Headphones className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">Agent Station Login</h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Sign in with your Agent credentials to open your WebRTC phone and start taking calls.
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

          <form onSubmit={handleStep1Submit} className="space-y-4">
            {/* Client Selection */}
            {tenants.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Client Account *
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <select
                    id="agent-tenant-select"
                    value={selectedTenantId}
                    onChange={e => {
                      setSelectedTenantId(e.target.value);
                      const t = tenants.find(item => item.id === e.target.value);
                      if (t) onSelectTenant(t);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
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
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Agent User ID / Extension *
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  id="agent-username-input"
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. agent101 or 1001"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-medium text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  id="agent-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
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
              id="agent-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Next: Choose Campaign & Launch Softphone</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-700/80 text-center">
            <span className="text-[11px] text-slate-400">
              Dialko Softphone Station • WebRTC SIP Audio Ready
            </span>
          </div>
        </div>
      </main>

      {/* Step 2: Campaign & Queue Selection Modal */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-base font-bold text-white">Select Active Campaign</h2>
              <p className="text-xs text-slate-400">
                Agent: <span className="text-emerald-400 font-mono font-bold">{verifiedUser?.name || verifiedUser?.userId}</span>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Dialer Campaign *
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {campaignsList.map(camp => (
                    <label
                      key={camp.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                        selectedCampaign === camp.name
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                          : 'bg-slate-900 border-slate-700 hover:border-slate-600 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="campaignSelection"
                          checked={selectedCampaign === camp.name}
                          onChange={() => setSelectedCampaign(camp.name)}
                          className="accent-emerald-500"
                        />
                        <span className="font-semibold">{camp.name}</span>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                        {camp.type || 'PREDICTIVE'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Assigned Inbound Queues
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Tier-1 Inbound Support', 'Sales Queue', 'VIP Priority Line', 'Escalations'].map(queue => {
                    const isSelected = selectedQueues.includes(queue);
                    return (
                      <button
                        key={queue}
                        type="button"
                        onClick={() => toggleQueue(queue)}
                        className={`p-2 rounded-xl border text-left flex items-center justify-between transition cursor-pointer text-xs ${
                          isSelected
                            ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="truncate">{queue}</span>
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCampaignModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition cursor-pointer"
              >
                Back
              </button>
              <button
                id="agent-confirm-launch-btn"
                type="button"
                onClick={handleFinishLaunchStation}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Launch Station</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-4 text-center text-[11px] text-slate-500 border-t border-slate-800">
        Dialko Agent Workspace • SIP WebRTC Telephony Console
      </footer>
    </div>
  );
};
