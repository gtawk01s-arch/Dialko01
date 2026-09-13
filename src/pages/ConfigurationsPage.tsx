import React from 'react';
import {
  Settings,
  Plus,
  Search,
  GitFork,
  CheckCircle,
  X,
  FileText,
  Clock,
  Trash2,
  Edit2,
  Shield,
  Volume2,
  Layers,
  AlertCircle,
  Check
} from 'lucide-react';
import {
  QueueItem,
  DispositionItem,
  PauseCodeItem,
  CallScript,
  DIDItem,
  BlockedNumberItem,
  Campaign,
  Tenant
} from '../types/index.js';

interface ConfigurationsPageProps {
  activeTenant: Tenant;
  defaultSubTab?: string;
}

export const ConfigurationsPage: React.FC<ConfigurationsPageProps> = ({ activeTenant, defaultSubTab = 'queues' }) => {
  const [subTab, setSubTab] = React.useState(defaultSubTab);
  const [queues, setQueues] = React.useState<QueueItem[]>([]);
  const [dispositions, setDispositions] = React.useState<DispositionItem[]>([]);
  const [pauseCodes, setPauseCodes] = React.useState<PauseCodeItem[]>([]);
  const [scripts, setScripts] = React.useState<CallScript[]>([]);
  const [blockedNumbers, setBlockedNumbers] = React.useState<BlockedNumberItem[]>([]);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Modals state
  const [isAddQueueOpen, setIsAddQueueOpen] = React.useState(false);
  const [isAddDispoOpen, setIsAddDispoOpen] = React.useState(false);
  const [isAddPauseOpen, setIsAddPauseOpen] = React.useState(false);
  const [isAddScriptOpen, setIsAddScriptOpen] = React.useState(false);
  const [isAddBlockedOpen, setIsAddBlockedOpen] = React.useState(false);

  // Forms
  const [queueForm, setQueueForm] = React.useState({
    queueName: '',
    ringingStrategy: 'Round Robin',
    visitTimeoutSec: 30,
    description: '',
    musicOnHold: 'corporate_ambient_synth',
    assignedCampaignIds: [] as string[]
  });

  const [dispoForm, setDispoForm] = React.useState({
    disposition: '',
    description: '',
    category: 'Positive' as 'Positive' | 'Neutral' | 'Negative' | 'System',
    autoSmsTrigger: false,
    callbackFlag: false,
    dncFlag: false
  });

  const [pauseForm, setPauseForm] = React.useState({
    pauseCode: '',
    description: '',
    type: 'non-billing' as 'billing' | 'non-billing',
    durationLimit: '00:15:00'
  });

  const [scriptForm, setScriptForm] = React.useState({
    scriptName: '',
    description: '',
    type: 'Sales',
    content: ''
  });

  const [blockedForm, setBlockedForm] = React.useState({
    phoneNumber: '',
    reason: 'Customer Request',
    type: 'DNC'
  });

  const ringStrategiesList = [
    'Random',
    'Ring All (Simultaneous)',
    'Round Robin',
    'Fewest Calls',
    'Least Recent',
    'Linear',
    'Skill-based',
    'Sticky Agent'
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchConfigs = async () => {
    try {
      const [queuesRes, disposRes, pauseRes, scriptsRes, blockedRes, campsRes] = await Promise.all([
        fetch(`/api/configurations/queues?tenantId=${activeTenant.id}`),
        fetch(`/api/configurations/dispositions?tenantId=${activeTenant.id}`),
        fetch(`/api/configurations/pause-codes?tenantId=${activeTenant.id}`),
        fetch(`/api/configurations/scripts?tenantId=${activeTenant.id}`),
        fetch(`/api/configurations/blocked-numbers?tenantId=${activeTenant.id}`),
        fetch(`/api/campaigns?tenantId=${activeTenant.id}`)
      ]);
      setQueues(await queuesRes.json());
      setDispositions(await disposRes.json());
      setPauseCodes(await pauseRes.json());
      setScripts(await scriptsRes.json());
      setBlockedNumbers(await blockedRes.json());
      setCampaigns(await campsRes.json());
    } catch (err) {
      console.error('Failed to load configurations', err);
    }
  };

  React.useEffect(() => {
    setSubTab(defaultSubTab);
  }, [defaultSubTab]);

  React.useEffect(() => {
    fetchConfigs();
  }, [activeTenant.id]);

  // Handle Save Queue
  const handleSaveQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueForm.queueName.trim()) return;

    try {
      const res = await fetch('/api/configurations/queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify({
          queueName: queueForm.queueName.trim(),
          ringingStrategy: queueForm.ringingStrategy,
          visitTimeoutSec: queueForm.visitTimeoutSec,
          description: queueForm.description,
          musicOnHold: queueForm.musicOnHold
        })
      });

      if (res.ok) {
        // If campaigns were selected, update them to include this queue
        if (queueForm.assignedCampaignIds.length > 0) {
          for (const cId of queueForm.assignedCampaignIds) {
            const camp = campaigns.find(c => c.id === cId);
            if (camp) {
              const currentMapped = camp.mappedQueues || (camp.queue ? [camp.queue] : []);
              if (!currentMapped.includes(queueForm.queueName.trim())) {
                await fetch(`/api/campaigns/${cId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    mappedQueues: [...currentMapped, queueForm.queueName.trim()]
                  })
                });
              }
            }
          }
        }
        showToast(`Queue '${queueForm.queueName}' created successfully`);
        setIsAddQueueOpen(false);
        setQueueForm({
          queueName: '',
          ringingStrategy: 'Round Robin',
          visitTimeoutSec: 30,
          description: '',
          musicOnHold: 'corporate_ambient_synth',
          assignedCampaignIds: []
        });
        fetchConfigs();
      }
    } catch (err) {
      console.error('Failed to save queue', err);
    }
  };

  // Handle Save Disposition
  const handleSaveDispo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispoForm.disposition.trim()) return;
    try {
      const res = await fetch('/api/configurations/dispositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(dispoForm)
      });
      if (res.ok) {
        showToast(`Disposition '${dispoForm.disposition}' created successfully`);
        setIsAddDispoOpen(false);
        setDispoForm({
          disposition: '',
          description: '',
          category: 'Positive',
          autoSmsTrigger: false,
          callbackFlag: false,
          dncFlag: false
        });
        fetchConfigs();
      }
    } catch (err) {
      console.error('Failed to save disposition', err);
    }
  };

  // Handle Save Pause Code
  const handleSavePause = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pauseForm.pauseCode.trim()) return;
    try {
      const res = await fetch('/api/configurations/pause-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(pauseForm)
      });
      if (res.ok) {
        showToast(`Pause code '${pauseForm.pauseCode}' created successfully`);
        setIsAddPauseOpen(false);
        setPauseForm({
          pauseCode: '',
          description: '',
          type: 'non-billing',
          durationLimit: '00:15:00'
        });
        fetchConfigs();
      }
    } catch (err) {
      console.error('Failed to save pause code', err);
    }
  };

  // Handle Save Script
  const handleSaveScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptForm.scriptName.trim()) return;
    try {
      const res = await fetch('/api/configurations/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(scriptForm)
      });
      if (res.ok) {
        showToast(`Script '${scriptForm.scriptName}' created successfully`);
        setIsAddScriptOpen(false);
        setScriptForm({
          scriptName: '',
          description: '',
          type: 'Sales',
          content: ''
        });
        fetchConfigs();
      }
    } catch (err) {
      console.error('Failed to save script', err);
    }
  };

  // Handle Save Blocked Number
  const handleSaveBlocked = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockedForm.phoneNumber.trim()) return;
    try {
      const res = await fetch('/api/configurations/blocked-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(blockedForm)
      });
      if (res.ok) {
        showToast(`Number '${blockedForm.phoneNumber}' added to DNC blacklist`);
        setIsAddBlockedOpen(false);
        setBlockedForm({
          phoneNumber: '',
          reason: 'Customer Request',
          type: 'DNC'
        });
        fetchConfigs();
      }
    } catch (err) {
      console.error('Failed to save blocked number', err);
    }
  };

  // Direct Delete Handlers (No window.confirm to prevent iframe suppression)
  const handleDeleteQueue = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/configurations/queues/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Queue '${name}' deleted successfully`);
        fetchConfigs();
      }
    } catch (err) {
      console.error('Failed to delete queue', err);
    }
  };

  const handleDeleteDispo = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/configurations/dispositions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Disposition '${name}' deleted successfully`);
        fetchConfigs();
      }
    } catch (err) {
      console.error('Failed to delete disposition', err);
    }
  };

  const handleDeletePause = async (id: string, code: string) => {
    try {
      const res = await fetch(`/api/configurations/pause-codes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Pause code '${code}' deleted successfully`);
        fetchConfigs();
      }
    } catch (err) {
      console.error('Failed to delete pause code', err);
    }
  };

  const handleDeleteScript = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/configurations/scripts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Script '${name}' deleted successfully`);
        fetchConfigs();
      }
    } catch (err) {
      console.error('Failed to delete script', err);
    }
  };

  const handleDeleteBlocked = async (id: string, num: string) => {
    try {
      const res = await fetch(`/api/configurations/blocked-numbers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Number '${num}' removed from DNC list`);
        fetchConfigs();
      }
    } catch (err) {
      console.error('Failed to delete blocked number', err);
    }
  };

  // Status toggle handlers
  const handleToggleQueueStatus = async (id: string) => {
    await fetch(`/api/configurations/queues/${id}/status`, { method: 'PATCH' });
    fetchConfigs();
  };

  const handleToggleDispoStatus = async (id: string) => {
    await fetch(`/api/configurations/dispositions/${id}/status`, { method: 'PATCH' });
    fetchConfigs();
  };

  const handleTogglePauseStatus = async (id: string) => {
    await fetch(`/api/configurations/pause-codes/${id}/status`, { method: 'PATCH' });
    fetchConfigs();
  };

  const configTabs = [
    { id: 'queues', label: 'Queues & Ring Strategy', badge: `${queues.length}`, icon: GitFork, color: 'text-indigo-600' },
    { id: 'dispositions', label: 'Dispositions', badge: `${dispositions.length}`, icon: CheckCircle, color: 'text-emerald-600' },
    { id: 'pause-codes', label: 'Pause Codes', badge: `${pauseCodes.length}`, icon: Clock, color: 'text-amber-600' },
    { id: 'scripts', label: 'Call Scripts', badge: `${scripts.length}`, icon: FileText, color: 'text-blue-600' },
    { id: 'blocked-numbers', label: 'Blocked / DNC', badge: `${blockedNumbers.length}`, icon: Shield, color: 'text-rose-600' }
  ];

  return (
    <div id="configurations-page-container" className="p-4 space-y-4 select-none">
      {/* Top Notification Toast */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-emerald-700 rounded cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white text-sm font-bold shadow-xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Telephony Configurations</h2>
            <span className="text-xs text-slate-500">Manage queues, ringing strategies, pause codes, dispositions, and call scripts</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search configurations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-52 focus:bg-white focus:border-sky-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {configTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color}`} />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500 font-bold'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. QUEUES & RING STRATEGY TAB */}
      {/* ========================================================================= */}
      {subTab === 'queues' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Call Queues & Ringing Strategies</h3>
              <p className="text-xs text-slate-500">Configure queue priority, timeout rules, and campaign assignments</p>
            </div>
            <button
              onClick={() => setIsAddQueueOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Queue
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4 border-r border-slate-200">Queue Name</th>
                  <th className="py-3 px-4 border-r border-slate-200">Ringing Strategy</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-center">Visit Timeout</th>
                  <th className="py-3 px-4 border-r border-slate-200">Assigned Campaigns</th>
                  <th className="py-3 px-4 border-r border-slate-200">Music on Hold</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {queues
                  .filter(q => q.queueName.toLowerCase().includes(searchQuery.toLowerCase()) || q.ringingStrategy.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(q => {
                    const assignedCamps = campaigns.filter(c => 
                      c.queue === q.queueName || (c.mappedQueues && c.mappedQueues.includes(q.queueName))
                    );

                    return (
                      <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 border-r border-slate-100 font-bold text-sky-700">
                          <div className="flex items-center gap-2">
                            <GitFork className="w-3.5 h-3.5 text-slate-400" />
                            <span>{q.queueName}</span>
                          </div>
                          {q.description && <p className="text-[11px] text-slate-500 font-normal mt-0.5">{q.description}</p>}
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 font-medium">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
                            {q.ringingStrategy}
                          </span>
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 text-center font-mono font-bold text-slate-700">
                          {q.visitTimeoutSec}s
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100">
                          <div className="flex flex-wrap gap-1">
                            {assignedCamps.length > 0 ? (
                              assignedCamps.map(c => (
                                <span key={c.id} className="px-2 py-0.5 rounded text-[10px] bg-sky-50 text-sky-700 font-bold border border-sky-200">
                                  {c.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No campaigns assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 text-slate-600 text-[11px]">
                          <div className="flex items-center gap-1">
                            <Volume2 className="w-3 h-3 text-slate-400" />
                            <span>{q.musicOnHold || 'default'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 text-center">
                          <button
                            onClick={() => handleToggleQueueStatus(q.id)}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                              q.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {q.status}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteQueue(q.id, q.queueName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                            title="Delete Queue"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DISPOSITIONS TAB */}
      {/* ========================================================================= */}
      {subTab === 'dispositions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Call Dispositions & Outcomes</h3>
              <p className="text-xs text-slate-500">Configure call outcomes, SMS automation triggers, callback schedules, and DNC flags</p>
            </div>
            <button
              onClick={() => setIsAddDispoOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Disposition
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4 border-r border-slate-200">Disposition Name</th>
                  <th className="py-3 px-4 border-r border-slate-200">Category</th>
                  <th className="py-3 px-4 border-r border-slate-200">Description</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-center">Auto SMS Trigger</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-center">Schedule Callback</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-center">DNC Blacklist</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {dispositions
                  .filter(d => d.disposition.toLowerCase().includes(searchQuery.toLowerCase()) || d.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(d => {
                    const getCategoryBadge = (cat?: string) => {
                      switch (cat) {
                        case 'Positive': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        case 'Negative': return 'bg-rose-50 text-rose-700 border-rose-200';
                        case 'System': return 'bg-slate-100 text-slate-700 border-slate-200';
                        default: return 'bg-blue-50 text-blue-700 border-blue-200';
                      }
                    };

                    return (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-800 font-mono">
                          {d.disposition}
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryBadge(d.category)}`}>
                            {d.category || 'Neutral'}
                          </span>
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 text-slate-600">
                          {d.description}
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 text-center">
                          {d.autoSmsTrigger ? (
                            <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-bold text-[10px]">Active</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 text-center">
                          {d.callbackFlag ? (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px]">Yes</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 text-center">
                          {d.dncFlag ? (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px]">DNC</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 border-r border-slate-100 text-center">
                          <button
                            onClick={() => handleToggleDispoStatus(d.id)}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                              d.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {d.status}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteDispo(d.id, d.disposition)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                            title="Delete Disposition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PAUSE CODES TAB */}
      {/* ========================================================================= */}
      {subTab === 'pause-codes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Agent Pause Codes</h3>
              <p className="text-xs text-slate-500">Configure allowable break codes, duration limits, and billing classifications</p>
            </div>
            <button
              onClick={() => setIsAddPauseOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Pause Code
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4 border-r border-slate-200">Pause Code</th>
                  <th className="py-3 px-4 border-r border-slate-200">Description</th>
                  <th className="py-3 px-4 border-r border-slate-200">Classification</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-center">Max Duration Limit</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pauseCodes
                  .filter(p => p.pauseCode.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 border-r border-slate-100 font-bold text-amber-800 font-sans">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{p.pauseCode}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 border-r border-slate-100 text-slate-600">
                        {p.description}
                      </td>
                      <td className="py-3 px-4 border-r border-slate-100">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.type === 'billing' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-r border-slate-100 text-center font-mono text-slate-700 font-bold">
                        {p.durationLimit || '00:15:00'}
                      </td>
                      <td className="py-3 px-4 border-r border-slate-100 text-center">
                        <button
                          onClick={() => handleTogglePauseStatus(p.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            p.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {p.status}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeletePause(p.id, p.pauseCode)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                          title="Delete Pause Code"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CALL SCRIPTS TAB */}
      {/* ========================================================================= */}
      {subTab === 'scripts' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Dynamic Call Scripts</h3>
              <p className="text-xs text-slate-500">Provide live prompts, compliance guidelines, and rebuttals to agents during calls</p>
            </div>
            <button
              onClick={() => setIsAddScriptOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Call Script
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4 border-r border-slate-200">Script Name</th>
                  <th className="py-3 px-4 border-r border-slate-200">Type</th>
                  <th className="py-3 px-4 border-r border-slate-200">Description</th>
                  <th className="py-3 px-4 border-r border-slate-200">Preview Content</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {scripts.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 border-r border-slate-100 font-bold text-blue-700">{s.scriptName}</td>
                    <td className="py-3 px-4 border-r border-slate-100 font-medium text-slate-700">{s.type}</td>
                    <td className="py-3 px-4 border-r border-slate-100 text-slate-600">{s.description}</td>
                    <td className="py-3 px-4 border-r border-slate-100 text-slate-600 truncate max-w-[280px]">{s.content}</td>
                    <td className="py-3 px-4 border-r border-slate-100 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteScript(s.id, s.scriptName)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                        title="Delete Script"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BLOCKED NUMBERS / DNC TAB */}
      {/* ========================================================================= */}
      {subTab === 'blocked-numbers' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Do Not Call (DNC) & Blacklisted Numbers</h3>
              <p className="text-xs text-slate-500">Prevent outbound dialer campaigns from contacting restricted consumer records</p>
            </div>
            <button
              onClick={() => setIsAddBlockedOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Blocked Number
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4 border-r border-slate-200">Phone Number</th>
                  <th className="py-3 px-4 border-r border-slate-200">Reason</th>
                  <th className="py-3 px-4 border-r border-slate-200">Scope Type</th>
                  <th className="py-3 px-4 border-r border-slate-200">Added Date</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {blockedNumbers.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 border-r border-slate-100 font-bold text-rose-700 font-mono">{b.phoneNumber}</td>
                    <td className="py-3 px-4 border-r border-slate-100 text-slate-600">{b.reason}</td>
                    <td className="py-3 px-4 border-r border-slate-100">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                        {b.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100 font-mono text-[11px] text-slate-500">{b.addedAt || '2026-08-25'}</td>
                    <td className="py-3 px-4 border-r border-slate-100 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200">
                        Blocked
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteBlocked(b.id, b.phoneNumber)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                        title="Remove from DNC"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Add Queue Modal */}
      {isAddQueueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Add New Call Queue</h3>
                <p className="text-indigo-100 text-[11px]">Configure queue name, ringing strategy, and campaign assignments</p>
              </div>
              <button onClick={() => setIsAddQueueOpen(false)} className="p-1 hover:bg-white/20 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveQueue} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Queue Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inbound_VIP_Queue"
                  value={queueForm.queueName}
                  onChange={e => setQueueForm({ ...queueForm, queueName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ringing Strategy *</label>
                  <select
                    value={queueForm.ringingStrategy}
                    onChange={e => setQueueForm({ ...queueForm, ringingStrategy: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold"
                  >
                    {ringStrategiesList.map(strat => (
                      <option key={strat} value={strat}>{strat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Visit Timeout (Seconds) *</label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={300}
                    value={queueForm.visitTimeoutSec}
                    onChange={e => setQueueForm({ ...queueForm, visitTimeoutSec: parseInt(e.target.value) || 30 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Assign to Campaigns */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Assign to Campaign(s)</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 max-h-32 overflow-y-auto">
                  {campaigns.map(c => {
                    const isChecked = queueForm.assignedCampaignIds.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-1 rounded hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setQueueForm({
                                ...queueForm,
                                assignedCampaignIds: queueForm.assignedCampaignIds.filter(id => id !== c.id)
                              });
                            } else {
                              setQueueForm({
                                ...queueForm,
                                assignedCampaignIds: [...queueForm.assignedCampaignIds, c.id]
                              });
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Queues are assigned to campaigns to route agent calls</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Music on Hold</label>
                  <select
                    value={queueForm.musicOnHold}
                    onChange={e => setQueueForm({ ...queueForm, musicOnHold: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  >
                    <option value="corporate_ambient_synth">Corporate Ambient Synth</option>
                    <option value="default_classical_loop">Default Classical Loop</option>
                    <option value="soft_guitar_stream">Soft Guitar Stream</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Escalation Queue"
                    value={queueForm.description}
                    onChange={e => setQueueForm({ ...queueForm, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddQueueOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs cursor-pointer">
                  Save Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Disposition Modal */}
      {isAddDispoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Add New Disposition</h3>
                <p className="text-emerald-100 text-[11px]">Define call outcome status and automated workflows</p>
              </div>
              <button onClick={() => setIsAddDispoOpen(false)} className="p-1 hover:bg-white/20 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDispo} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Disposition Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SALE, CALLBACK, NOT_INTERESTED"
                  value={dispoForm.disposition}
                  onChange={e => setDispoForm({ ...dispoForm, disposition: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Category *</label>
                <select
                  value={dispoForm.category}
                  onChange={e => setDispoForm({ ...dispoForm, category: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium"
                >
                  <option value="Positive">Positive (Sale, Interested, Converted)</option>
                  <option value="Neutral">Neutral (Callback, Answer, Busy)</option>
                  <option value="Negative">Negative (Not Interested, Reject, Unreachable)</option>
                  <option value="System">System (DNC, Disconnected, Invalid)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="Customer confirmed purchase or subscription"
                  value={dispoForm.description}
                  onChange={e => setDispoForm({ ...dispoForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dispoForm.callbackFlag}
                    onChange={e => setDispoForm({ ...dispoForm, callbackFlag: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-700">Schedule Callback on selecting this dispo</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dispoForm.dncFlag}
                    onChange={e => setDispoForm({ ...dispoForm, dncFlag: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-bold text-slate-700">Add to Do Not Call (DNC) list</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddDispoOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer">Save Disposition</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Pause Code Modal */}
      {isAddPauseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Add Agent Pause Code</h3>
                <p className="text-amber-100 text-[11px]">Define break code name and duration limit</p>
              </div>
              <button onClick={() => setIsAddPauseOpen(false)} className="p-1 hover:bg-white/20 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePause} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Pause Code Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Training, Team Sync, Lunch"
                  value={pauseForm.pauseCode}
                  onChange={e => setPauseForm({ ...pauseForm, pauseCode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Classification *</label>
                <select
                  value={pauseForm.type}
                  onChange={e => setPauseForm({ ...pauseForm, type: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium"
                >
                  <option value="non-billing">Non-Billing (Regular Agent Break)</option>
                  <option value="billing">Billing (Productive Offline Work)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Max Duration Limit (HH:MM:SS) *</label>
                <input
                  type="text"
                  required
                  placeholder="00:15:00"
                  value={pauseForm.durationLimit}
                  onChange={e => setPauseForm({ ...pauseForm, durationLimit: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddPauseOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold cursor-pointer">Save Pause Code</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Call Script Modal */}
      {isAddScriptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Add New Call Script</h3>
                <p className="text-blue-100 text-[11px]">Define prompts and guidance displayed to agents during calls</p>
              </div>
              <button onClick={() => setIsAddScriptOpen(false)} className="p-1 hover:bg-white/20 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveScript} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Script Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Customer Onboarding Script"
                  value={scriptForm.scriptName}
                  onChange={e => setScriptForm({ ...scriptForm, scriptName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Script Content *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Welcome the customer, verify their account ID, explain promotional plans..."
                  value={scriptForm.content}
                  onChange={e => setScriptForm({ ...scriptForm, content: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-normal"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddScriptOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer">Save Script</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Blocked Number Modal */}
      {isAddBlockedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Add Blocked / DNC Number</h3>
              <button onClick={() => setIsAddBlockedOpen(false)} className="p-1 hover:bg-white/20 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBlocked} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={blockedForm.phoneNumber}
                  onChange={e => setBlockedForm({ ...blockedForm, phoneNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer Requested DNC"
                  value={blockedForm.reason}
                  onChange={e => setBlockedForm({ ...blockedForm, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddBlockedOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer">Block Number</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
