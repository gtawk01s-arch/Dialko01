import React from 'react';
import { Plus, Search, Users, Edit2, Trash2, X, AlertTriangle, CheckSquare, Square, Power } from 'lucide-react';
import { Team, Tenant, User, Campaign } from '../types/index.js';

interface TeamManagementPageProps {
  activeTenant: Tenant;
}

export const TeamManagementPage: React.FC<TeamManagementPageProps> = ({ activeTenant }) => {
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [availableUsers, setAvailableUsers] = React.useState<User[]>([]);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null);

  const [newTeamForm, setNewTeamForm] = React.useState({
    name: '',
    description: '',
    type: 'Sales',
    campaignName: 'RIYA001',
    assignedUserIds: [] as string[],
    status: 'Active' as 'Active' | 'Inactive'
  });

  const [editTeamForm, setEditTeamForm] = React.useState({
    id: '',
    name: '',
    description: '',
    type: 'Sales',
    campaignName: 'RIYA001',
    assignedUserIds: [] as string[],
    status: 'Active' as 'Active' | 'Inactive'
  });

  const fetchData = async () => {
    try {
      const [teamsRes, usersRes, campsRes] = await Promise.all([
        fetch(`/api/teams?tenantId=${activeTenant.id}`),
        fetch(`/api/users?tenantId=${activeTenant.id}`),
        fetch(`/api/campaigns?tenantId=${activeTenant.id}`)
      ]);
      const teamsData = await teamsRes.json();
      const usersData = await usersRes.json();
      const campsData = await campsRes.json();
      
      setTeams(teamsData);
      setAvailableUsers(usersData);
      setCampaigns(campsData);
      if (campsData.length > 0 && !newTeamForm.campaignName) {
        setNewTeamForm(prev => ({ ...prev, campaignName: campsData[0].name }));
      }
    } catch (err) {
      console.error('Failed to load team management data', err);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [activeTenant.id]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const assignedNames = availableUsers
        .filter(u => newTeamForm.assignedUserIds.includes(u.id))
        .map(u => u.name);

      await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify({
          ...newTeamForm,
          assignedCount: newTeamForm.assignedUserIds.length,
          assignedUsers: assignedNames
        })
      });
      setIsCreateModalOpen(false);
      setNewTeamForm({
        name: '',
        description: '',
        type: 'Sales',
        campaignName: campaigns[0]?.name || 'RIYA001',
        assignedUserIds: [],
        status: 'Active'
      });
      fetchData();
    } catch (err) {
      console.error('Failed to create team', err);
    }
  };

  const handleOpenEdit = (team: Team) => {
    setSelectedTeam(team);
    setEditTeamForm({
      id: team.id,
      name: team.name,
      description: team.description || '',
      type: team.type || 'Sales',
      campaignName: team.campaignName || 'RIYA001',
      assignedUserIds: team.assignedUserIds || [],
      status: team.status || 'Active'
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    try {
      const assignedNames = availableUsers
        .filter(u => editTeamForm.assignedUserIds.includes(u.id))
        .map(u => u.name);

      await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify({
          ...editTeamForm,
          assignedCount: editTeamForm.assignedUserIds.length,
          assignedUsers: assignedNames
        })
      });
      setIsEditModalOpen(false);
      setSelectedTeam(null);
      fetchData();
    } catch (err) {
      console.error('Failed to update team', err);
    }
  };

  const handleToggleStatus = async (team: Team) => {
    try {
      await fetch(`/api/teams/${team.id}/status`, {
        method: 'PATCH',
        headers: { 'x-tenant-id': activeTenant.id }
      });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle team status', err);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;
    try {
      await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': activeTenant.id }
      });
      setIsDeleteModalOpen(false);
      setSelectedTeam(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete team', err);
    }
  };

  const toggleUserInNewForm = (userId: string) => {
    setNewTeamForm(prev => {
      const exists = prev.assignedUserIds.includes(userId);
      return {
        ...prev,
        assignedUserIds: exists
          ? prev.assignedUserIds.filter(id => id !== userId)
          : [...prev.assignedUserIds, userId]
      };
    });
  };

  const toggleUserInEditForm = (userId: string) => {
    setEditTeamForm(prev => {
      const exists = prev.assignedUserIds.includes(userId);
      return {
        ...prev,
        assignedUserIds: exists
          ? prev.assignedUserIds.filter(id => id !== userId)
          : [...prev.assignedUserIds, userId]
      };
    });
  };

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.campaignName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="teams-page-container" className="p-4 space-y-3 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            TM
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Team Management</h2>
            <span className="text-[11px] text-slate-500">Group agents by skill, shift, and assigned campaigns</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 w-44 sm:w-56 focus:bg-white focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Team
          </button>
        </div>
      </div>

      {/* Teams Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5 border-r border-slate-200">Team Name</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Description</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Type</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Assigned Campaign</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Assigned Members</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No teams found.</td>
                </tr>
              ) : (
                filteredTeams.map(team => (
                  <tr key={team.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-bold text-slate-800">{team.name}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600">{team.description}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                        {team.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-medium text-sky-700">{team.campaignName}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100">
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="font-bold text-slate-800 mr-1">{team.assignedCount || 0} Agents</span>
                        {team.assignedUsers && team.assignedUsers.slice(0, 2).map((name, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                            {name}
                          </span>
                        ))}
                        {team.assignedUsers && team.assignedUsers.length > 2 && (
                          <span className="text-[10px] text-slate-400">+{team.assignedUsers.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-center">
                      <button
                        onClick={() => handleToggleStatus(team)}
                        className={`px-2.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition ${
                          team.status === 'Active'
                            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                            : 'text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300'
                        }`}
                        title="Click to toggle status"
                      >
                        {team.status || 'Active'}
                      </button>
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(team)}
                          className="p-1 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="Edit Team & User Assignments"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTeam(team);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Delete Team"
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

      {/* Add Team Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3.5 bg-blue-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Add New Agent Team</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Team Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inbound Support Tier 1"
                    value={newTeamForm.name}
                    onChange={e => setNewTeamForm({ ...newTeamForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Team Type</label>
                  <select
                    value={newTeamForm.type}
                    onChange={e => setNewTeamForm({ ...newTeamForm, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Support">Support</option>
                    <option value="Retention">Retention</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Campaign</label>
                  <select
                    value={newTeamForm.campaignName}
                    onChange={e => setNewTeamForm({ ...newTeamForm, campaignName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    {campaigns.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {campaigns.length === 0 && <option value="RIYA001">RIYA001</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status</label>
                  <select
                    value={newTeamForm.status}
                    onChange={e => setNewTeamForm({ ...newTeamForm, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Primary queue handling daytime incoming customer queries"
                  value={newTeamForm.description}
                  onChange={e => setNewTeamForm({ ...newTeamForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>

              {/* Assign Users Multi-select */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Assign Agents ({newTeamForm.assignedUserIds.length} selected)
                </label>
                <div className="border border-slate-300 rounded p-2 bg-slate-50 max-h-36 overflow-y-auto space-y-1.5">
                  {availableUsers.map(user => {
                    const isSelected = newTeamForm.assignedUserIds.includes(user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() => toggleUserInNewForm(user.id)}
                        className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition ${
                          isSelected ? 'bg-blue-50 border border-blue-200 text-blue-900' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-300" />
                          )}
                          <span className="font-semibold">{user.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({user.userId})</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Ext: {user.mobileExtension || '101'}</span>
                      </div>
                    );
                  })}
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
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {isEditModalOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Edit Team ({editTeamForm.name})</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTeam} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Team Name *</label>
                  <input
                    type="text"
                    required
                    value={editTeamForm.name}
                    onChange={e => setEditTeamForm({ ...editTeamForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Team Type</label>
                  <select
                    value={editTeamForm.type}
                    onChange={e => setEditTeamForm({ ...editTeamForm, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Support">Support</option>
                    <option value="Retention">Retention</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Campaign</label>
                  <select
                    value={editTeamForm.campaignName}
                    onChange={e => setEditTeamForm({ ...editTeamForm, campaignName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    {campaigns.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {campaigns.length === 0 && <option value="RIYA001">RIYA001</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status</label>
                  <select
                    value={editTeamForm.status}
                    onChange={e => setEditTeamForm({ ...editTeamForm, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <input
                  type="text"
                  value={editTeamForm.description}
                  onChange={e => setEditTeamForm({ ...editTeamForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>

              {/* Edit Assign Users Multi-select */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Assign Agents ({editTeamForm.assignedUserIds.length} selected)
                </label>
                <div className="border border-slate-300 rounded p-2 bg-slate-50 max-h-36 overflow-y-auto space-y-1.5">
                  {availableUsers.map(user => {
                    const isSelected = editTeamForm.assignedUserIds.includes(user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() => toggleUserInEditForm(user.id)}
                        className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition ${
                          isSelected ? 'bg-blue-50 border border-blue-200 text-blue-900' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-300" />
                          )}
                          <span className="font-semibold">{user.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({user.userId})</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Ext: {user.mobileExtension || '101'}</span>
                      </div>
                    );
                  })}
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

      {/* Delete Team Modal */}
      {isDeleteModalOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Delete Team?</h3>
                <p className="text-xs text-slate-500">Remove team "{selectedTeam.name}".</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTeam}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
