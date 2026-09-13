import React from 'react';
import {
  Building2,
  Plus,
  Search,
  Shield,
  CreditCard,
  Database,
  Activity,
  CheckCircle,
  X,
  LogIn,
  Edit2,
  Server,
  RefreshCw
} from 'lucide-react';
import { Tenant, User } from '../types/index.js';

interface MasterAdminPageProps {
  tenants: Tenant[];
  activeTenant: Tenant;
  onSelectTenant: (tenant: Tenant) => void;
}

export const MasterAdminPage: React.FC<MasterAdminPageProps> = ({
  tenants,
  activeTenant,
  onSelectTenant
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddTenantOpen, setIsAddTenantOpen] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState('');

  const [newTenantForm, setNewTenantForm] = React.useState({
    name: '',
    slug: '',
    maxUsers: 15,
    minutesBalance: 5000,
    vicidialIp: '192.168.1.150',
    espocrmUrl: 'https://crm.zeedial.com'
  });

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTenantForm,
          status: 'Active',
          expiryDate: '2027-12-31'
        })
      });
      setIsAddTenantOpen(false);
      window.location.reload();
    } catch (err) {
      console.error('Failed to create tenant', err);
    }
  };

  const handleSyncVicidial = async () => {
    setSyncStatus('Connecting to Asterisk/VICIdial clusters...');
    try {
      const res = await fetch('/api/vicidial/sync');
      const data = await res.json();
      setSyncStatus(`Sync Successful: ${data.message}`);
      setTimeout(() => setSyncStatus(''), 4000);
    } catch (err) {
      setSyncStatus('Sync Failed. Check server log.');
    }
  };

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="master-admin-container" className="p-4 space-y-3 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            MA
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Master Admin & Multi-Client Management</h2>
            <span className="text-[11px] text-slate-500">Client provisioning, license quotas, telephony minutes, and cluster sync</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {syncStatus && (
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              {syncStatus}
            </span>
          )}

          <button
            onClick={handleSyncVicidial}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync VICIdial Clusters
          </button>

          <button
            onClick={() => setIsAddTenantOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Provision Client
          </button>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5 border-r border-slate-200">Client / Company Name</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Tenant Slug</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 text-center">Seat Quota</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 text-right">Talk Minutes Balance</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Telephony IP / Cluster</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-center">Tenant ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map(tenant => (
                <tr key={tenant.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-bold text-slate-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
                    {tenant.name}
                    {tenant.id === activeTenant.id && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                        CURRENT ACTIVE
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-sky-700">{tenant.slug}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-center font-mono font-bold text-slate-800">
                    {tenant.maxUsers || 10} Seats
                  </td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-right font-mono font-bold text-emerald-600">
                    {(tenant.minutesBalance || 5000).toLocaleString()} mins
                  </td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-slate-600 text-[11px]">
                    192.168.1.150 (Asterisk 18)
                  </td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-center">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-700 bg-emerald-50">
                      {tenant.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-center font-mono text-slate-500 font-medium">
                    {tenant.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Tenant Modal */}
      {isAddTenantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#0284c7] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Provision New Client</h3>
              <button onClick={() => setIsAddTenantOpen(false)} className="p-1 hover:bg-white/20 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Client / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Logistics"
                  value={newTenantForm.name}
                  onChange={e => setNewTenantForm({ ...newTenantForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tenant Slug Identifier *</label>
                <input
                  type="text"
                  required
                  value={newTenantForm.slug}
                  onChange={e => setNewTenantForm({ ...newTenantForm, slug: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Max Agent Seats</label>
                  <input
                    type="number"
                    value={newTenantForm.maxUsers}
                    onChange={e => setNewTenantForm({ ...newTenantForm, maxUsers: parseInt(e.target.value) || 10 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Minutes Balance</label>
                  <input
                    type="number"
                    value={newTenantForm.minutesBalance}
                    onChange={e => setNewTenantForm({ ...newTenantForm, minutesBalance: parseInt(e.target.value) || 5000 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setIsAddTenantOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded font-bold shadow-xs">
                  Provision Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
