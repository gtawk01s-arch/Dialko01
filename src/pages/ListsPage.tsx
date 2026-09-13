import React from 'react';
import {
  Plus,
  Filter as FilterIcon,
  Search,
  Key,
  Edit2,
  Trash2,
  X,
  Copy,
  Check,
  Power,
  AlertTriangle
} from 'lucide-react';
import { CampaignList, Tenant, Campaign } from '../types/index.js';
import { FilterDrawer } from '../components/FilterDrawer.js';

interface ListsPageProps {
  activeTenant: Tenant;
}

export const ListsPage: React.FC<ListsPageProps> = ({ activeTenant }) => {
  const [lists, setLists] = React.useState<CampaignList[]>([]);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [selectedList, setSelectedList] = React.useState<CampaignList | null>(null);
  const [generatedToken, setGeneratedToken] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const [newListForm, setNewListForm] = React.useState({
    list_id: '',
    name: '',
    description: '',
    campaign: 'RIYA001',
    recycle_count: 1,
    status: 'Active' as 'Active' | 'Inactive'
  });

  const [editListForm, setEditListForm] = React.useState({
    id: '',
    list_id: '',
    name: '',
    description: '',
    campaign: 'RIYA001',
    recycle_count: 1,
    status: 'Active' as 'Active' | 'Inactive'
  });

  const fetchLists = async () => {
    try {
      const res = await fetch(`/api/lists?tenantId=${activeTenant.id}`);
      const data = await res.json();
      setLists(data);
    } catch (err) {
      console.error('Failed to load lists', err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`/api/campaigns?tenantId=${activeTenant.id}`);
      const data = await res.json();
      setCampaigns(data);
      if (data.length > 0 && !newListForm.campaign) {
        setNewListForm(prev => ({ ...prev, campaign: data[0].name }));
      }
    } catch (err) {
      console.error('Failed to load campaigns', err);
    }
  };

  React.useEffect(() => {
    fetchLists();
    fetchCampaigns();
  }, [activeTenant.id]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(newListForm)
      });
      setIsCreateModalOpen(false);
      setNewListForm({ list_id: '', name: '', description: '', campaign: campaigns[0]?.name || 'RIYA001', recycle_count: 1, status: 'Active' });
      fetchLists();
    } catch (err) {
      console.error('Failed to create list', err);
    }
  };

  const handleOpenEdit = (list: CampaignList) => {
    setSelectedList(list);
    setEditListForm({
      id: list.id,
      list_id: list.list_id,
      name: list.name,
      description: list.description || '',
      campaign: list.campaign,
      recycle_count: list.recycle_count || 1,
      status: list.status || 'Active'
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedList) return;
    try {
      await fetch(`/api/lists/${selectedList.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(editListForm)
      });
      setIsEditModalOpen(false);
      setSelectedList(null);
      fetchLists();
    } catch (err) {
      console.error('Failed to update list', err);
    }
  };

  const handleToggleStatus = async (list: CampaignList) => {
    try {
      await fetch(`/api/lists/${list.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id }
      });
      fetchLists();
    } catch (err) {
      console.error('Failed to toggle list status', err);
    }
  };

  const handleDeleteList = async () => {
    if (!selectedList) return;
    try {
      await fetch(`/api/lists/${selectedList.id}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': activeTenant.id }
      });
      setIsDeleteModalOpen(false);
      setSelectedList(null);
      fetchLists();
    } catch (err) {
      console.error('Failed to delete list', err);
    }
  };

  const handleGenerateToken = async (list: CampaignList) => {
    setSelectedList(list);
    try {
      const res = await fetch('/api/lists/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: list.list_id, user: 'admin', role: 'Administrator' })
      });
      const data = await res.json();
      setGeneratedToken(data.token);
      setIsTokenModalOpen(true);
    } catch (err) {
      console.error('Failed to generate token', err);
    }
  };

  const filteredLists = lists.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.list_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.campaign.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="lists-page-container" className="p-4 space-y-3 select-none">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            LI
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Lists</h2>
            <span className="text-[11px] text-slate-500">Manage campaign lead containers and hopper tokens</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search lists..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 w-44 sm:w-56 focus:bg-white focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-200 transition cursor-pointer"
          >
            <FilterIcon className="w-3.5 h-3.5" />
            Filter
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Create List
          </button>
        </div>
      </div>

      {/* Lists Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5 border-r border-slate-200">List ID</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Name</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Campaign</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Template</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 text-center">Recycle Count</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 text-center">Utilize Count</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 text-right">Lead Count</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLists.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">No lists found.</td>
                </tr>
              ) : (
                filteredLists.map(list => (
                  <tr key={list.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono font-bold text-sky-700">{list.list_id}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-medium text-slate-800">{list.name}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600">{list.campaign}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-500">{list.template}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-center font-mono">{list.recycle_count}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-center font-mono">{list.utilize_count}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-right font-mono font-bold text-slate-800">
                      {list.lead_count.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-center">
                      <button
                        onClick={() => handleToggleStatus(list)}
                        className={`px-2.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition ${
                          list.status === 'Active'
                            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                            : 'text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300'
                        }`}
                        title="Click to toggle Active / Inactive"
                      >
                        {list.status || 'Active'}
                      </button>
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleGenerateToken(list)}
                          className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="Generate List Ingestion Token"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(list)}
                          className="p-1 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="Edit List"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedList(list);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Delete List"
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

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {}}
        onReset={() => setSearchTerm('')}
        title="Filter Lists"
      >
        <div>
          <label className="block text-slate-700 font-bold mb-1">Campaign</label>
          <select
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
          >
            <option value="">All Campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </FilterDrawer>

      {/* Create List Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-blue-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Create New List</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">List ID (Unique Number) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1005"
                  value={newListForm.list_id}
                  onChange={e => setNewListForm({ ...newListForm, list_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">List Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inbound Campaign Leads Batch 1"
                  value={newListForm.name}
                  onChange={e => setNewListForm({ ...newListForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assign Campaign *</label>
                <select
                  value={newListForm.campaign}
                  onChange={e => setNewListForm({ ...newListForm, campaign: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                >
                  {campaigns.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  {campaigns.length === 0 && <option value="RIYA001">RIYA001</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Recycle Count</label>
                  <input
                    type="number"
                    min="1"
                    value={newListForm.recycle_count}
                    onChange={e => setNewListForm({ ...newListForm, recycle_count: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Initial Status</label>
                  <select
                    value={newListForm.status}
                    onChange={e => setNewListForm({ ...newListForm, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-xs cursor-pointer"
                >
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit List Modal */}
      {isEditModalOpen && selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Edit List ({editListForm.list_id})</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateList} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">List Name *</label>
                <input
                  type="text"
                  required
                  value={editListForm.name}
                  onChange={e => setEditListForm({ ...editListForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assign Campaign *</label>
                <select
                  value={editListForm.campaign}
                  onChange={e => setEditListForm({ ...editListForm, campaign: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                >
                  {campaigns.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  {campaigns.length === 0 && <option value="RIYA001">RIYA001</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Recycle Count</label>
                  <input
                    type="number"
                    min="1"
                    value={editListForm.recycle_count}
                    onChange={e => setEditListForm({ ...editListForm, recycle_count: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status</label>
                  <select
                    value={editListForm.status}
                    onChange={e => setEditListForm({ ...editListForm, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete List Confirmation Modal */}
      {isDeleteModalOpen && selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Delete List?</h3>
                <p className="text-xs text-slate-500">This action will remove List {selectedList.list_id}.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
              List: <strong>{selectedList.name}</strong> ({selectedList.lead_count} leads)
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteList}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Token Modal */}
      {isTokenModalOpen && selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                <h3 className="font-bold text-sm">List API Ingestion Token</h3>
              </div>
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg">
                This token allows external CRM systems or landing page webhooks to inject leads directly into{' '}
                <strong>List {selectedList.list_id} ({selectedList.name})</strong> without manual upload.
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Generated Bearer Token</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedToken}
                    className="w-full bg-slate-100 font-mono text-[11px] border border-slate-300 rounded p-2 text-slate-800"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedToken);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[10px] space-y-1">
                <p className="text-slate-400 font-sans font-bold">API Webhook Endpoint:</p>
                <p className="text-sky-400">POST /api/leads</p>
                <p className="text-slate-400">Headers: Authorization: Bearer {generatedToken.slice(0, 16)}...</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsTokenModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-medium cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
