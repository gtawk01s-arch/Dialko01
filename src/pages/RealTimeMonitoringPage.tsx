import React from 'react';
import {
  Activity,
  Headphones,
  PhoneCall,
  Users,
  Mic,
  Shield,
  Volume2,
  PhoneOff,
  Radio,
  Clock,
  RotateCcw,
  Sparkles,
  Zap,
  LogOut,
  PhoneForwarded,
  Sliders,
  Play,
  Pause,
  X,
  AlertTriangle,
  Send
} from 'lucide-react';
import { ActiveAgent, LiveCall, Tenant, Campaign } from '../types/index.js';
import { AudioPlayerModal } from '../components/AudioPlayerModal.js';

interface RealTimeMonitoringProps {
  activeTenant: Tenant;
  onRandomLiveListen: () => void;
}

export const RealTimeMonitoringPage: React.FC<RealTimeMonitoringProps> = ({ activeTenant, onRandomLiveListen }) => {
  const [agents, setAgents] = React.useState<ActiveAgent[]>([]);
  const [liveCalls, setLiveCalls] = React.useState<LiveCall[]>([]);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [viewTab, setViewTab] = React.useState<'agents' | 'calls' | 'wallboard'>('agents');

  // Supervisor live listen audio stream modal
  const [liveAudioModal, setLiveAudioModal] = React.useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    audioUrl: string;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    audioUrl: ''
  });

  // Dialing Modals
  const [isManualDialOpen, setIsManualDialOpen] = React.useState(false);
  const [isAutoDialControlOpen, setIsAutoDialControlOpen] = React.useState(false);
  const [isForceLogoutModalOpen, setIsForceLogoutModalOpen] = React.useState(false);
  const [selectedAgentForLogout, setSelectedAgentForLogout] = React.useState<ActiveAgent | null>(null);

  // Manual Dial Form
  const [manualDialForm, setManualDialForm] = React.useState({
    phoneNumber: '',
    campaign: 'RIYA001',
    agentId: 'somnathlead_agent01',
    didNumber: '8005490671'
  });

  // Auto Dial Form
  const [autoDialConfig, setAutoDialConfig] = React.useState({
    campaign: 'RIYA001',
    enabled: true,
    dialRatio: '1.5'
  });

  const fetchData = async () => {
    try {
      const [agentsRes, callsRes, campsRes] = await Promise.all([
        fetch(`/api/realtime/agents?tenantId=${activeTenant.id}`),
        fetch(`/api/realtime/calls?tenantId=${activeTenant.id}`),
        fetch(`/api/campaigns?tenantId=${activeTenant.id}`)
      ]);
      const agentsData = await agentsRes.json();
      const callsData = await callsRes.json();
      const campsData = await campsRes.json();

      setAgents(agentsData);
      setLiveCalls(callsData);
      setCampaigns(campsData);
      if (campsData.length > 0 && !manualDialForm.campaign) {
        setManualDialForm(prev => ({ ...prev, campaign: campsData[0].name }));
        setAutoDialConfig(prev => ({ ...prev, campaign: campsData[0].name }));
      }
    } catch (err) {
      console.error('Failed to load realtime monitor data', err);
    }
  };

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000); // 4-second live poll
    return () => clearInterval(interval);
  }, [activeTenant.id]);

  const handleSupervisorAction = async (action: 'listen' | 'barge' | 'whisper', agentId: string, callId: string, agentName: string) => {
    try {
      await fetch('/api/realtime/supervisor-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify({ action, agentId, callId })
      });

      const modeText = action === 'listen' ? 'Stealth Audio Stream' : action === 'whisper' ? 'Whisper (Coach Agent Only)' : '3-Way Conference Barge';

      setLiveAudioModal({
        isOpen: true,
        title: `Supervisor ${action.toUpperCase()}: ${agentName}`,
        subtitle: `Channel: SIP/supervisor-8600051 • Call ID: ${callId} • Mode: ${modeText}`,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
      });
    } catch (err) {
      console.error('Supervisor action failed', err);
    }
  };

  const handleConfirmForceLogout = async () => {
    if (!selectedAgentForLogout) return;
    try {
      await fetch('/api/realtime/force-logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify({ agentId: selectedAgentForLogout.agentId || selectedAgentForLogout.id })
      });
      setIsForceLogoutModalOpen(false);
      setSelectedAgentForLogout(null);
      fetchData();
    } catch (err) {
      console.error('Failed to force logout agent', err);
    }
  };

  const handleExecuteManualDial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/realtime/manual-dial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(manualDialForm)
      });
      setIsManualDialOpen(false);
      setManualDialForm(prev => ({ ...prev, phoneNumber: '' }));
      fetchData();
    } catch (err) {
      console.error('Failed to initiate manual dial', err);
    }
  };

  const handleUpdateAutoDial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/realtime/auto-dial-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(autoDialConfig)
      });
      setIsAutoDialControlOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to update auto dial config', err);
    }
  };

  return (
    <div id="realtime-monitoring-container" className="p-4 space-y-3 select-none">
      {/* Header & Supervisor Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            RM
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              Real Time Monitoring
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Live 4s Polling
              </span>
            </h2>
            <span className="text-[11px] text-slate-500">Live channels, supervisor whisper/barge/listen, force logout & dialing controls</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="bg-slate-100 p-1 rounded-md flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setViewTab('agents')}
              className={`px-3 py-1 rounded font-semibold cursor-pointer transition ${
                viewTab === 'agents' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Active Agents ({agents.length})
            </button>
            <button
              onClick={() => setViewTab('calls')}
              className={`px-3 py-1 rounded font-semibold cursor-pointer transition ${
                viewTab === 'calls' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Live Calls ({liveCalls.length})
            </button>
            <button
              onClick={() => setViewTab('wallboard')}
              className={`px-3 py-1 rounded font-semibold cursor-pointer transition ${
                viewTab === 'wallboard' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Wallboard
            </button>
          </div>

          {/* Supervisor Quick Dial Tools */}
          <button
            onClick={() => setIsManualDialOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold shadow-xs cursor-pointer"
            title="Place a manual call directly"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Manual Dial
          </button>

          <button
            onClick={() => setIsAutoDialControlOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-xs cursor-pointer"
            title="Configure Auto-Dialer hopper pace & dial ratio"
          >
            <Sliders className="w-3.5 h-3.5" />
            Auto Dial
          </button>

          <button
            onClick={onRandomLiveListen}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-xs cursor-pointer"
            title="Stealth listen into any random active live call"
          >
            <Headphones className="w-3.5 h-3.5" />
            Random Listen
          </button>
        </div>
      </div>

      {/* 1. ACTIVE AGENTS TABLE VIEW */}
      {viewTab === 'agents' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Agent Name</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Extension</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Status</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Campaign</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Customer Phone</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Session Duration</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200 text-right">Calls Taken</th>
                  <th className="py-2.5 px-3.5 text-center">Supervisor Live Controls & Force Logout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map(agent => (
                  <tr key={agent.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-medium text-slate-800 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        agent.status === 'INCALL' ? 'bg-emerald-500 animate-pulse' :
                        agent.status === 'READY' ? 'bg-blue-500' : 'bg-amber-500'
                      }`} />
                      {agent.name}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-slate-600">{agent.extension}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        agent.status === 'INCALL' ? 'bg-emerald-100 text-emerald-800' :
                        agent.status === 'READY' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-700 font-medium">{agent.campaign}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-blue-700 font-semibold">
                      {agent.customerPhone || '-'}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-slate-700 font-medium">{agent.sessionDuration}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-right font-mono font-bold text-slate-800">{agent.callsToday}</td>
                    <td className="py-2.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {agent.status === 'INCALL' ? (
                          <>
                            <button
                              onClick={() => handleSupervisorAction('listen', agent.agentId || agent.id, 'CALL-LIVE-01', agent.name)}
                              className="flex items-center gap-0.5 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] shadow-xs cursor-pointer"
                              title="Listen stealthily to live audio"
                            >
                              <Headphones className="w-3 h-3" />
                              Listen
                            </button>
                            <button
                              onClick={() => handleSupervisorAction('whisper', agent.agentId || agent.id, 'CALL-LIVE-01', agent.name)}
                              className="flex items-center gap-0.5 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] shadow-xs cursor-pointer"
                              title="Whisper coach only to the agent"
                            >
                              <Mic className="w-3 h-3" />
                              Whisper
                            </button>
                            <button
                              onClick={() => handleSupervisorAction('barge', agent.agentId || agent.id, 'CALL-LIVE-01', agent.name)}
                              className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[10px] shadow-xs cursor-pointer"
                              title="Barge into call (3-way audio bridge)"
                            >
                              <Zap className="w-3 h-3" />
                              Barge
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 text-[10px] mr-1">No Active Call</span>
                        )}

                        {/* Force Logout Action */}
                        <button
                          onClick={() => {
                            setSelectedAgentForLogout(agent);
                            setIsForceLogoutModalOpen(true);
                          }}
                          className="flex items-center gap-0.5 px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-semibold text-[10px] transition cursor-pointer"
                          title="Force Logout agent from SIP dialer session"
                        >
                          <LogOut className="w-3 h-3" />
                          Force Logout
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. LIVE CALLS TABLE VIEW */}
      {viewTab === 'calls' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Call ID</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Customer Phone</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Agent</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Campaign</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Queue</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Duration</th>
                  <th className="py-2.5 px-3.5 text-center">Supervisor Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {liveCalls.map(call => (
                  <tr key={call.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-bold text-blue-700">{call.callId}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-800 font-bold">{call.customerPhone}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-sans font-medium text-slate-800">{call.agentName}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-sans font-medium text-slate-700">{call.campaign}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-sans text-slate-600">{call.queue}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-emerald-600 font-bold">{call.duration}</td>
                    <td className="py-2.5 px-3.5 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSupervisorAction('listen', call.agentId, call.callId, call.agentName)}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Headphones className="w-3 h-3" />
                          Listen
                        </button>
                        <button
                          onClick={() => handleSupervisorAction('whisper', call.agentId, call.callId, call.agentName)}
                          className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Mic className="w-3 h-3" />
                          Whisper
                        </button>
                        <button
                          onClick={() => handleSupervisorAction('barge', call.agentId, call.callId, call.agentName)}
                          className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[10px] shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          Barge
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. WALLBOARD / QUEUE METRICS VIEW */}
      {viewTab === 'wallboard' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs text-center">
            <span className="text-[11px] font-bold uppercase text-slate-400">Total Logged In Agents</span>
            <p className="text-3xl font-black text-slate-800 font-mono mt-1">{agents.length || 7}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs text-center">
            <span className="text-[11px] font-bold uppercase text-slate-400">Agents In-Call</span>
            <p className="text-3xl font-black text-emerald-600 font-mono mt-1">
              {agents.filter(a => a.status === 'INCALL').length || 4}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs text-center">
            <span className="text-[11px] font-bold uppercase text-slate-400">Calls Waiting in Queue</span>
            <p className="text-3xl font-black text-rose-600 font-mono mt-1">0</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs text-center">
            <span className="text-[11px] font-bold uppercase text-slate-400">Avg Answer Speed</span>
            <p className="text-3xl font-black text-blue-600 font-mono mt-1">4.2s</p>
          </div>
        </div>
      )}

      {/* Manual Dial Modal */}
      {isManualDialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Supervisor Manual Call Dispatch</h3>
              </div>
              <button
                onClick={() => setIsManualDialOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteManualDial} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Destination Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={manualDialForm.phoneNumber}
                  onChange={e => setManualDialForm({ ...manualDialForm, phoneNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Campaign</label>
                  <select
                    value={manualDialForm.campaign}
                    onChange={e => setManualDialForm({ ...manualDialForm, campaign: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    {campaigns.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {campaigns.length === 0 && <option value="RIYA001">RIYA001</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Outbound DID</label>
                  <input
                    type="text"
                    value={manualDialForm.didNumber}
                    onChange={e => setManualDialForm({ ...manualDialForm, didNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assign to Agent</label>
                <select
                  value={manualDialForm.agentId}
                  onChange={e => setManualDialForm({ ...manualDialForm, agentId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                >
                  {agents.map(a => (
                    <option key={a.id} value={a.name}>{a.name} ({a.extension})</option>
                  ))}
                  {agents.length === 0 && <option value="somnathlead_agent01">Somnath Agent 01</option>}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsManualDialOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Initiate Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto-Dial Control Modal */}
      {isAutoDialControlOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <h3 className="font-bold text-sm">Automated Dialing Engine Control</h3>
              </div>
              <button
                onClick={() => setIsAutoDialControlOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateAutoDial} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Campaign</label>
                <select
                  value={autoDialConfig.campaign}
                  onChange={e => setAutoDialConfig({ ...autoDialConfig, campaign: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-semibold"
                >
                  {campaigns.map(c => (
                    <option key={c.id} value={c.name}>{c.name} ({c.type})</option>
                  ))}
                  {campaigns.length === 0 && <option value="RIYA001">RIYA001 (PREDICTIVE)</option>}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Live Dial Ratio / Lines per Agent</label>
                <select
                  value={autoDialConfig.dialRatio}
                  onChange={e => setAutoDialConfig({ ...autoDialConfig, dialRatio: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                >
                  <option value="1.0">1.0 (Single Line)</option>
                  <option value="1.5">1.5 (Standard Predictive)</option>
                  <option value="2.0">2.0 (Aggressive)</option>
                  <option value="3.0">3.0 (High Pace)</option>
                  <option value="5.0">5.0 (Power Blast)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded border border-slate-200">
                <input
                  type="checkbox"
                  id="chk-auto-active"
                  checked={autoDialConfig.enabled}
                  onChange={e => setAutoDialConfig({ ...autoDialConfig, enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="chk-auto-active" className="text-slate-800 font-semibold cursor-pointer">
                  Enable Continuous Automated Hopper Dialing
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAutoDialControlOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-xs cursor-pointer"
                >
                  Apply Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Force Logout Confirmation Modal */}
      {isForceLogoutModalOpen && selectedAgentForLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Force Logout Agent?</h3>
                <p className="text-xs text-slate-500">
                  Disconnect {selectedAgentForLogout.name} (Ext: {selectedAgentForLogout.extension}) from active dialer session.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsForceLogoutModalOpen(false)}
                className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmForceLogout}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Live Audio Monitoring Modal */}
      <AudioPlayerModal
        isOpen={liveAudioModal.isOpen}
        onClose={() => setLiveAudioModal({ ...liveAudioModal, isOpen: false })}
        title={liveAudioModal.title}
        subtitle={liveAudioModal.subtitle}
        audioUrl={liveAudioModal.audioUrl}
        isLiveMonitoring={true}
      />
    </div>
  );
};
