import React from 'react';
import {
  Plus,
  Search,
  Shield,
  UserCheck,
  Edit2,
  Trash2,
  X,
  Lock,
  LogIn,
  CheckSquare,
  Square,
  AlertTriangle,
  Key,
  Phone,
  Radio,
  Sliders
} from 'lucide-react';
import { User, UserGroupPermission, UserGroupItem, Tenant } from '../types/index.js';

interface UsersGroupsPageProps {
  activeTenant: Tenant;
  onImpersonate: (user: User) => void;
}

export const UsersGroupsPage: React.FC<UsersGroupsPageProps> = ({ activeTenant, onImpersonate }) => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [userGroups, setUserGroups] = React.useState<UserGroupItem[]>([]);
  const [permissions, setPermissions] = React.useState<UserGroupPermission[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'users' | 'groups' | 'permissions'>('users');
  
  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = React.useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = React.useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = React.useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = React.useState(false);
  
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [newPassword, setNewPassword] = React.useState('');
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);

  // Forms
  const [newUserForm, setNewUserForm] = React.useState({
    userId: '',
    name: '',
    mobileNumber: '',
    mobileExtension: '101',
    specificDid: '',
    password: '',
    emailId: '',
    status: 'Active' as 'Active' | 'Inactive',
    role: 'Agent' as 'Administrator' | 'Agent' | 'Supervisor',
    userGroup: 'somnathlead_admin',
    teamName: 'Sales Inbound'
  });

  const [editUserForm, setEditUserForm] = React.useState({
    id: '',
    userId: '',
    name: '',
    mobileNumber: '',
    mobileExtension: '',
    specificDid: '',
    emailId: '',
    status: 'Active' as 'Active' | 'Inactive',
    role: 'Agent' as 'Administrator' | 'Agent' | 'Supervisor',
    userGroup: 'somnathlead_admin',
    teamName: 'Sales Inbound'
  });

  const [newGroupForm, setNewGroupForm] = React.useState({
    groupName: '',
    description: '',
    isSupervisorPanel: false,
    permissions: {
      realTime: true,
      reports: true,
      management: false,
      connection: false,
      configurations: false,
      leads: true,
      dashboard: true,
      call: true,
      template: true,
      formBuilder: false,
      customModule: false,
      supervisorControls: {
        listen: true,
        whisper: true,
        barge: true,
        forceLogout: true,
        manualDial: true,
        autoDial: true
      }
    }
  });

  const fetchData = async () => {
    try {
      const [usersRes, permsRes, groupsRes] = await Promise.all([
        fetch(`/api/users?tenantId=${activeTenant.id}`),
        fetch('/api/user-groups/permissions'),
        fetch(`/api/user-groups?tenantId=${activeTenant.id}`)
      ]);
      const usersData = await usersRes.json();
      const permsData = await permsRes.json();
      const groupsData = await groupsRes.json();
      setUsers(usersData);
      setPermissions(permsData);
      setUserGroups(groupsData);
    } catch (err) {
      console.error('Failed to load users & groups', err);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [activeTenant.id]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(newUserForm)
      });
      setIsAddUserModalOpen(false);
      setNewUserForm({
        userId: '',
        name: '',
        mobileNumber: '',
        mobileExtension: '',
        specificDid: '',
        password: '',
        emailId: '',
        status: 'Active',
        role: 'Agent',
        userGroup: 'somnathlead_admin',
        teamName: 'Sales Inbound'
      });
      fetchData();
    } catch (err) {
      console.error('Failed to create user', err);
    }
  };

  const handleOpenEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUserForm({
      id: user.id,
      userId: user.userId,
      name: user.name,
      mobileNumber: user.mobileNumber || '',
      mobileExtension: user.mobileExtension || '',
      specificDid: user.specificDid || '',
      emailId: user.emailId,
      status: user.status,
      role: user.role as any,
      userGroup: user.userGroup || 'somnathlead_admin',
      teamName: user.teamName || 'Sales Inbound'
    });
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(editUserForm)
      });
      setIsEditUserModalOpen(false);
      setSelectedUser(null);
      fetchData();
    } catch (err) {
      console.error('Failed to update user', err);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'x-tenant-id': activeTenant.id }
      });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle user status', err);
    }
  };

  const handleOpenPasswordModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setPasswordSuccess(false);
    setIsPasswordModalOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    try {
      await fetch(`/api/users/${selectedUser.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify({ password: newPassword })
      });
      setPasswordSuccess(true);
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess(false);
        setSelectedUser(null);
      }, 1200);
    } catch (err) {
      console.error('Failed to update password', err);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': activeTenant.id }
      });
      setIsDeleteUserModalOpen(false);
      setSelectedUser(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/user-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(newGroupForm)
      });
      setIsAddGroupModalOpen(false);
      setNewGroupForm({
        groupName: '',
        description: '',
        isSupervisorPanel: false,
        permissions: {
          realTime: true,
          reports: true,
          management: false,
          connection: false,
          configurations: false,
          leads: true,
          dashboard: true,
          call: true,
          template: true,
          formBuilder: false,
          customModule: false,
          supervisorControls: {
            listen: true,
            whisper: true,
            barge: true,
            forceLogout: true,
            manualDial: true,
            autoDial: true
          }
        }
      });
      fetchData();
    } catch (err) {
      console.error('Failed to create group', err);
    }
  };

  const handleTogglePermission = async (groupName: string, key: keyof UserGroupPermission) => {
    const updated = permissions.map(p => {
      if (p.groupName === groupName) {
        return { ...p, [key]: !p[key] };
      }
      return p;
    });
    setPermissions(updated);

    const groupObj = updated.find(p => p.groupName === groupName);
    if (groupObj) {
      await fetch('/api/user-groups/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName, permissions: groupObj })
      });
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.emailId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.mobileExtension && u.mobileExtension.includes(searchTerm)) ||
    (u.specificDid && u.specificDid.includes(searchTerm))
  );

  return (
    <div id="users-groups-container" className="p-4 space-y-3 select-none">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            UG
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Users & Access Groups</h2>
            <span className="text-[11px] text-slate-500">Agent provisioning, custom supervisor panels, and credential security</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="bg-slate-100 p-1 rounded-md flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1 rounded font-semibold transition cursor-pointer ${
                activeTab === 'users' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-3 py-1 rounded font-semibold transition cursor-pointer ${
                activeTab === 'groups' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              User Groups ({userGroups.length})
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-3 py-1 rounded font-semibold transition cursor-pointer ${
                activeTab === 'permissions' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Permissions Matrix
            </button>
          </div>

          {activeTab === 'users' && (
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add User
            </button>
          )}

          {activeTab === 'groups' && (
            <button
              onClick={() => setIsAddGroupModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Group
            </button>
          )}
        </div>
      </div>

      {activeTab === 'users' && (
        <>
          {/* Search bar */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search user name, email, extn, or DID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 w-full focus:bg-white focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredUsers.length} users
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3.5 border-r border-slate-200">User ID</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200">Name</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200">Mobile Extn</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200">Specific DID</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200">Email ID</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200">Role</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200">User Group</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200">Team</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 text-center">Status</th>
                    <th className="py-2.5 px-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono font-bold text-sky-700">{user.userId}</td>
                      <td className="py-2.5 px-3.5 border-r border-slate-100 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {user.name}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-slate-700 font-semibold">{user.mobileExtension || user.mobileNumber}</td>
                      <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-emerald-700">
                        {user.specificDid ? user.specificDid : <span className="text-slate-400 font-sans italic text-[10px]">Campaign Default</span>}
                      </td>
                      <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600 truncate max-w-[150px]">{user.emailId}</td>
                      <td className="py-2.5 px-3.5 border-r border-slate-100">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          user.role === 'Administrator' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'Supervisor' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600 font-mono text-[11px]">{user.userGroup}</td>
                      <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600">{user.teamName}</td>
                      <td className="py-2.5 px-3.5 border-r border-slate-100 text-center">
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition ${
                            user.status === 'Active'
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                              : 'text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300'
                          }`}
                          title="Click to toggle status"
                        >
                          {user.status}
                        </button>
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`btn-pwd-${user.id}`}
                            onClick={() => handleOpenPasswordModal(user)}
                            className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition cursor-pointer"
                            title="Change Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-impersonate-${user.id}`}
                            onClick={() => onImpersonate(user)}
                            className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[10px] shadow-xs transition cursor-pointer"
                            title="Login as this agent"
                          >
                            <LogIn className="w-3 h-3" />
                            <span>Login</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditUser(user)}
                            className="p-1 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteUserModalOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'groups' && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-xs">Configured User Groups & Panels</h3>
                <p className="text-[11px] text-slate-500">Manage role clusters, supervisor dashboard authorizations, and team grouping</p>
              </div>
              <button
                onClick={() => setIsAddGroupModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Group
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {userGroups.map(group => (
                <div key={group.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-sm text-slate-800 font-mono">{group.groupName}</span>
                      {group.isSupervisorPanel && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">
                          Supervisor Panel
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold border border-emerald-200">
                        {group.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{group.description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <span className="font-bold text-slate-700">{group.memberCount} Members</span>
                      <p className="text-[10px] text-slate-400">Assigned Agents</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('permissions')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition cursor-pointer"
                    >
                      Edit Matrix
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-xs">User Group Permission Matrix</h3>
              <p className="text-[11px] text-slate-500">Configure role module accessibility, administrative overrides, and supervisor controls</p>
            </div>
            <button
              onClick={() => setIsAddGroupModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Group
            </button>
          </div>
          <div className="p-4 space-y-6">
            {permissions.map(group => (
              <div key={group.groupName} className="space-y-3 p-4 bg-slate-50/50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-800 text-xs font-mono">Group: {group.groupName}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
                  {[
                    { key: 'realTime', label: 'Real Time Monitoring' },
                    { key: 'reports', label: 'Reports & Analytics' },
                    { key: 'management', label: 'User & Team Mgmt' },
                    { key: 'connection', label: 'Telephony Connection' },
                    { key: 'configurations', label: 'Configurations' },
                    { key: 'leads', label: 'Leads & Lists' },
                    { key: 'dashboard', label: 'Dashboard' },
                    { key: 'call', label: 'Dialer Controls' },
                    { key: 'template', label: 'Templates' },
                    { key: 'formBuilder', label: 'Surveys & Forms' },
                    { key: 'customModule', label: 'Custom Modules' }
                  ].map(item => {
                    const isChecked = !!group[item.key as keyof UserGroupPermission];
                    return (
                      <div
                        key={item.key}
                        onClick={() => handleTogglePermission(group.groupName, item.key as keyof UserGroupPermission)}
                        className="flex items-center gap-2 p-2 bg-white hover:bg-slate-100 rounded border border-slate-200 cursor-pointer transition"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span className={`font-medium ${isChecked ? 'text-slate-800' : 'text-slate-400'}`}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3.5 bg-blue-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Add New User / Agent</h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">User ID / Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. agent105"
                    value={newUserForm.userId}
                    onChange={e => setNewUserForm({ ...newUserForm, userId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Green"
                    value={newUserForm.name}
                    onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Extension *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 105"
                    value={newUserForm.mobileExtension}
                    onChange={e => setNewUserForm({ ...newUserForm, mobileExtension: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Specific DID (For Agent DID Rotate)</label>
                  <input
                    type="text"
                    placeholder="e.g. 918045678905"
                    value={newUserForm.specificDid}
                    onChange={e => setNewUserForm({ ...newUserForm, specificDid: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                  <span className="text-[10px] text-slate-400">Used when campaign strategy is 'agent'</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email ID *</label>
                  <input
                    type="email"
                    required
                    placeholder="rachel@zeedial.com"
                    value={newUserForm.emailId}
                    onChange={e => setNewUserForm({ ...newUserForm, emailId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newUserForm.password}
                    onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    <option value="Agent">Agent</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">User Group</label>
                  <select
                    value={newUserForm.userGroup}
                    onChange={e => setNewUserForm({ ...newUserForm, userGroup: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    <option value="somnathlead_admin">somnathlead_admin</option>
                    <option value="supervisor_panel">supervisor_panel</option>
                    <option value="support_tier1">support_tier1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Team Name</label>
                  <select
                    value={newUserForm.teamName}
                    onChange={e => setNewUserForm({ ...newUserForm, teamName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    <option value="Sales Inbound">Sales Inbound</option>
                    <option value="HNI Wealth Direct">HNI Wealth Direct</option>
                    <option value="Technical Support">Technical Support</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-xs cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Edit User ({editUserForm.userId})</h3>
              <button
                onClick={() => setIsEditUserModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editUserForm.name}
                    onChange={e => setEditUserForm({ ...editUserForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email ID *</label>
                  <input
                    type="email"
                    required
                    value={editUserForm.emailId}
                    onChange={e => setEditUserForm({ ...editUserForm, emailId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Extension *</label>
                  <input
                    type="text"
                    required
                    value={editUserForm.mobileExtension}
                    onChange={e => setEditUserForm({ ...editUserForm, mobileExtension: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Specific DID</label>
                  <input
                    type="text"
                    value={editUserForm.specificDid}
                    onChange={e => setEditUserForm({ ...editUserForm, specificDid: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Role</label>
                  <select
                    value={editUserForm.role}
                    onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    <option value="Agent">Agent</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status</label>
                  <select
                    value={editUserForm.status}
                    onChange={e => setEditUserForm({ ...editUserForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Team Name</label>
                  <select
                    value={editUserForm.teamName}
                    onChange={e => setEditUserForm({ ...editUserForm, teamName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    <option value="Sales Inbound">Sales Inbound</option>
                    <option value="HNI Wealth Direct">HNI Wealth Direct</option>
                    <option value="Technical Support">Technical Support</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
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

      {/* Change Password Modal */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                <h3 className="font-bold text-sm">Change Password</h3>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 space-y-4 text-xs">
              <div>
                <p className="text-slate-600 mb-2">
                  Update password for user <strong className="text-slate-800">{selectedUser.name}</strong> ({selectedUser.userId}):
                </p>
                <label className="block text-slate-700 font-bold mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>

              {passwordSuccess && (
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 font-medium text-center">
                  Password updated successfully!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold shadow-xs cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {isDeleteUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Delete User?</h3>
                <p className="text-xs text-slate-500">Remove {selectedUser.name} ({selectedUser.userId}).</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDeleteUserModalOpen(false)}
                className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Group Modal */}
      {isAddGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <h3 className="font-bold text-sm">Create New User Group / Panel</h3>
              </div>
              <button
                onClick={() => setIsAddGroupModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Group ID / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. supervisor_tier2_panel"
                  value={newGroupForm.groupName}
                  onChange={e => setNewGroupForm({ ...newGroupForm, groupName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Quality Monitoring & Floor Supervisor Panel"
                  value={newGroupForm.description}
                  onChange={e => setNewGroupForm({ ...newGroupForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded">
                <input
                  type="checkbox"
                  id="chk-sup-panel"
                  checked={newGroupForm.isSupervisorPanel}
                  onChange={e => setNewGroupForm({ ...newGroupForm, isSupervisorPanel: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="chk-sup-panel" className="text-slate-800 font-semibold cursor-pointer">
                  Designate as Dedicated Supervisor Panel
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddGroupModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-xs cursor-pointer"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
