import React from 'react';
import {
  Plus,
  Filter as FilterIcon,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Radio,
  Eye,
  PhoneIncoming,
  Volume2,
  Layers,
  PhoneForwarded,
  Shield,
  CheckCircle,
  HelpCircle,
  Activity,
  PhoneCall,
  RotateCw,
  ChevronRight,
  Sparkles,
  Megaphone,
  Lock,
  Clock
} from 'lucide-react';
import { Campaign, Tenant, CampaignType } from '../types/index.js';
import { FilterDrawer } from '../components/FilterDrawer.js';
import { CampaignWizardModal } from '../components/campaigns/CampaignWizardModal.js';
import { CampaignDetailDrawer } from '../components/campaigns/CampaignDetailDrawer.js';

interface CampaignsPageProps {
  activeTenant: Tenant;
}

export const CampaignsPage: React.FC<CampaignsPageProps> = ({ activeTenant }) => {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [isWizardOpen, setIsWizardOpen] = React.useState(false);
  const [editingCampaign, setEditingCampaign] = React.useState<Campaign | null>(null);
  const [selectedCampaign, setSelectedCampaign] = React.useState<Campaign | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = React.useState(false);

  // Top Type Selector Filter
  const [selectedTypeFilter, setSelectedTypeFilter] = React.useState<string>('ALL');

  // Filter Drawer State
  const [filterActive, setFilterActive] = React.useState('All');
  const [filterIndustry, setFilterIndustry] = React.useState('All');
  const [filterProcess, setFilterProcess] = React.useState('All');
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [campaignToDelete, setCampaignToDelete] = React.useState<{ id: string; name: string } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/campaigns?tenantId=${activeTenant.id}`);
      const data = await res.json();
      setCampaigns(data);
    } catch (err) {
      console.error('Failed to load campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCampaigns();
  }, [activeTenant.id]);

  const confirmDelete = async () => {
    if (!campaignToDelete) return;
    try {
      await fetch(`/api/campaigns/${campaignToDelete.id}`, { method: 'DELETE' });
      showToast(`Campaign '${campaignToDelete.name}' deleted successfully`);
      setCampaignToDelete(null);
      fetchCampaigns();
    } catch (err) {
      console.error('Failed to delete campaign', err);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setCampaignToDelete({ id, name });
  };

  const handleToggleActive = async (camp: Campaign) => {
    const nextStatus = camp.active === 'Yes' ? 'No' : 'Yes';
    try {
      await fetch(`/api/campaigns/${camp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextStatus })
      });
      fetchCampaigns();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.industry && c.industry.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.queue && c.queue.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.outboundCallerId && c.outboundCallerId.includes(searchTerm));

    const matchesTypeTab =
      selectedTypeFilter === 'ALL' ||
      c.type === selectedTypeFilter ||
      (selectedTypeFilter === 'PREDICTIVE' && (c.type === 'AUTO' || c.type === 'POWER'));

    const matchesActive = filterActive === 'All' || c.active === filterActive;
    const matchesIndustry = filterIndustry === 'All' || c.industry === filterIndustry;
    const matchesProcess = filterProcess === 'All' || c.process === filterProcess;

    return matchesSearch && matchesTypeTab && matchesActive && matchesIndustry && matchesProcess;
  });

  // Calculate high-level counters
  const predictiveCount = campaigns.filter(c => c.type === 'PREDICTIVE' || c.type === 'AUTO' || c.type === 'POWER').length;
  const previewCount = campaigns.filter(c => c.type === 'PREVIEW').length;
  const voiceBlastCount = campaigns.filter(c => c.type === 'VOICE BLAST').length;

  return (
    <div id="campaigns-page-container" className="p-4 space-y-4 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-emerald-700 rounded cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            <PhoneCall className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">Campaign Management</h2>
              <span className="text-[10px] px-2 py-0.5 bg-sky-100 text-sky-800 rounded font-semibold border border-sky-200">
                Core Dialing Engine
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Configure Predictive, Preview, and Voice Blast campaigns with queue mapping and inbound controls
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search campaigns, DIDs, queues..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 w-48 sm:w-60 focus:bg-white focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <button
            id="btn-refresh-campaigns"
            onClick={fetchCampaigns}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer"
            title="Refresh Campaigns"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="btn-create-campaign"
            onClick={() => {
              setEditingCampaign(null);
              setIsWizardOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Campaign Type Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => setSelectedTypeFilter('ALL')}
          className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
            selectedTypeFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-sky-400" />
            <div>
              <span className="font-bold text-xs block">All Campaigns</span>
              <span className="text-[10px] opacity-70">Total configured</span>
            </div>
          </div>
          <span className="font-mono font-bold text-sm">{campaigns.length}</span>
        </button>

        <button
          onClick={() => setSelectedTypeFilter('PREDICTIVE')}
          className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
            selectedTypeFilter === 'PREDICTIVE'
              ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-sky-500" />
            <div>
              <span className="font-bold text-xs block">Predictive</span>
              <span className="text-[10px] opacity-70">Auto-pacing dialer</span>
            </div>
          </div>
          <span className="font-mono font-bold text-sm">{predictiveCount}</span>
        </button>

        <button
          onClick={() => setSelectedTypeFilter('PREVIEW')}
          className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
            selectedTypeFilter === 'PREVIEW'
              ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-indigo-500" />
            <div>
              <span className="font-bold text-xs block">Preview</span>
              <span className="text-[10px] opacity-70">Agent-initiated</span>
            </div>
          </div>
          <span className="font-mono font-bold text-sm">{previewCount}</span>
        </button>

        <button
          onClick={() => setSelectedTypeFilter('VOICE BLAST')}
          className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
            selectedTypeFilter === 'VOICE BLAST'
              ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Megaphone className="w-4 h-4 text-amber-500" />
            <div>
              <span className="font-bold text-xs block">Voice Blast</span>
              <span className="text-[10px] opacity-70">Broadcast audio</span>
            </div>
          </div>
          <span className="font-mono font-bold text-sm">{voiceBlastCount}</span>
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3.5 border-r border-slate-200">Campaign Name</th>
                <th className="py-3 px-3 border-r border-slate-200">Type</th>
                <th className="py-3 px-3 border-r border-slate-200">Mapped Queues</th>
                <th className="py-3 px-3 border-r border-slate-200">Outbound DID</th>
                <th className="py-3 px-3 border-r border-slate-200 text-center">Inbound Setting</th>
                <th className="py-3 px-3 border-r border-slate-200">Security & Automation</th>
                <th className="py-3 px-3 border-r border-slate-200 text-center">Status</th>
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No campaigns found matching filter criteria. Click 'Create Campaign' to add one.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map(camp => (
                  <tr
                    key={camp.id}
                    className="hover:bg-slate-50/90 transition group cursor-pointer"
                    onClick={() => {
                      setSelectedCampaign(camp);
                      setIsDetailDrawerOpen(true);
                    }}
                  >
                    {/* Name */}
                    <td className="py-3 px-3.5 border-r border-slate-100 font-bold text-sky-700">
                      <div className="flex items-center gap-1.5">
                        <span>{camp.name}</span>
                        {camp.viciCampaignId && (
                          <span className="text-[9px] px-1 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono font-normal">
                            VICI
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal block">
                        {camp.industry || 'IT & Telecom'} • {camp.domain || 'Sales'}
                      </span>
                    </td>

                    {/* Campaign Type */}
                    <td className="py-3 px-3 border-r border-slate-100">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          camp.type === 'PREDICTIVE' || camp.type === 'AUTO' || camp.type === 'POWER'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : camp.type === 'PREVIEW'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {camp.type === 'PREDICTIVE' || camp.type === 'AUTO' || camp.type === 'POWER' ? (
                          <Radio className="w-3 h-3 text-sky-600" />
                        ) : camp.type === 'PREVIEW' ? (
                          <Eye className="w-3 h-3 text-indigo-600" />
                        ) : (
                          <Megaphone className="w-3 h-3 text-amber-600" />
                        )}
                        {camp.type}
                      </span>
                    </td>

                    {/* Mapped Queues */}
                    <td className="py-3 px-3 border-r border-slate-100 text-slate-700">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(camp.mappedQueues && camp.mappedQueues.length > 0 ? camp.mappedQueues : [camp.queue || 'Sales_Outbound_Queue']).map((q, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-mono">
                            {q}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Outbound DID */}
                    <td className="py-3 px-3 border-r border-slate-100 font-mono text-slate-700">
                      <span className="font-bold text-slate-800 block">{camp.outboundCallerId || '8005490671'}</span>
                      <span className="text-[10px] text-slate-500 font-sans font-medium">
                        {camp.didRotateStrategy || 'Direct'} Strategy
                      </span>
                    </td>

                    {/* Inbound Setting */}
                    <td className="py-3 px-3 border-r border-slate-100 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          camp.inboundCallSetting === 'Allow'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <PhoneIncoming className="w-3 h-3" />
                        {camp.inboundCallSetting || 'Block'} Inbound
                      </span>
                    </td>

                    {/* Security & Automation */}
                    <td className="py-3 px-3 border-r border-slate-100 text-slate-600">
                      <div className="flex flex-wrap gap-1.5">
                        {camp.callMasking && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Masked
                          </span>
                        )}
                        {camp.autoDispo ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> Auto-Dispo ({camp.autoDispoTimerSec || 30}s)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                            Wrap: {camp.wrapTimeSec || 15}s
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 border-r border-slate-100 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleActive(camp)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                          camp.active === 'Yes'
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
                            : 'text-slate-500 bg-slate-100 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {camp.active === 'Yes' ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCampaign(camp);
                            setIsWizardOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="Edit Campaign"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(camp.id, camp.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Creation / Edit Wizard Modal */}
      <CampaignWizardModal
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setEditingCampaign(null);
        }}
        onSaved={fetchCampaigns}
        activeTenant={activeTenant}
        editingCampaign={editingCampaign}
      />

      {/* Campaign Detail Drawer */}
      {selectedCampaign && (
        <CampaignDetailDrawer
          isOpen={isDetailDrawerOpen}
          onClose={() => {
            setIsDetailDrawerOpen(false);
            setSelectedCampaign(null);
          }}
          campaign={selectedCampaign}
          activeTenant={activeTenant}
          onEdit={() => {
            setIsDetailDrawerOpen(false);
            setEditingCampaign(selectedCampaign);
            setIsWizardOpen(true);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Delete Campaign</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete campaign <strong className="text-slate-900 font-bold">"{campaignToDelete.name}"</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCampaignToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Delete Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
