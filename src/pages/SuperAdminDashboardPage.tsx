import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  PhoneCall,
  Activity,
  Server,
  Database,
  ShieldAlert,
  Search,
  Plus,
  Lock,
  Unlock,
  KeyRound,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Radio,
  Settings,
  HardDrive,
  RefreshCw,
  Sliders,
  DollarSign,
  AlertTriangle,
  FileCheck,
  Zap,
  Globe,
  X,
  Headphones,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Clock,
  Play,
  Volume2,
  Bell,
  Eye,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Info,
  Mic,
  MicOff,
  UserCheck,
  Copy,
  Check,
  Edit3,
  Trash2,
  Filter,
  Wrench
} from 'lucide-react';
import {
  Tenant,
  User,
  GlobalSaaSDashboardStats,
  SystemInfrastructureConfig,
  ImpersonationLog,
  CallLog,
  CallRecording,
  LiveCall
} from '../types/index.js';
import { ImpersonationReasonModal } from '../components/ImpersonationReasonModal.js';

interface SuperAdminDashboardPageProps {
  currentUser: User;
  onLogout?: () => void;
  onOpenAdminPanel?: () => void;
  onStartImpersonation?: (agent: User, tenant: Tenant, reason: string) => void;
}

interface TenantSummaryItem {
  id: string;
  name: string;
  code: string;
  status: string;
  planType: string;
  totalAgents: number;
  liveAgentsCount: number;
  inCallCount: number;
  waitingCount: number;
  pausedCount: number;
  totalCallsToday: number;
  successRate: number;
  hopperStatus: string;
  viciUserGroup?: string;
  espoTeam?: string;
  subscriptionEnd: string;
  notifySupervisorOnImpersonate: boolean;
}

interface TenantDrilldownData {
  tenant: Tenant;
  agents: Array<{
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    extension: string;
    status: string;
    currentCampaign: string;
    callState: string;
    callDurationSec: number;
    callsToday: number;
    lastCallTime: string;
    currentCustomerPhone?: string;
    currentChannel?: string;
  }>;
  liveCalls: LiveCall[];
  recentCallLogs: CallLog[];
  recordings: CallRecording[];
  notifySupervisorOnImpersonate: boolean;
}

export interface EnrichedAdminCredential extends User {
  tenantName: string;
  tenantCode: string;
  tenantStatus: string;
  planType: string;
  canLoginToAdminPanel: boolean;
}

export const SuperAdminDashboardPage: React.FC<SuperAdminDashboardPageProps> = ({
  currentUser,
  onLogout,
  onOpenAdminPanel,
  onStartImpersonation
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'credentials' | 'overview' | 'impersonation' | 'security' | 'infrastructure' | 'billing'>('matrix');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Tenant Summary Matrix State
  const [tenantsSummary, setTenantsSummary] = useState<TenantSummaryItem[]>([]);
  const [tenantSearch, setTenantSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'expired'>('ALL');

  // Developer & Support Team Admin Credentials State
  const [adminCredentials, setAdminCredentials] = useState<EnrichedAdminCredential[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [credentialSearch, setCredentialSearch] = useState('');
  const [credentialTenantFilter, setCredentialTenantFilter] = useState('ALL');
  const [credentialStatusFilter, setCredentialStatusFilter] = useState('ALL');
  const [credentialProvisionedByFilter, setCredentialProvisionedByFilter] = useState('ALL');

  // Modals for Developer & Support Admin Provisioning
  const [isProvisionAdminModalOpen, setIsProvisionAdminModalOpen] = useState(false);
  const [adminProvisionForm, setAdminProvisionForm] = useState({
    tenantId: 't-1',
    name: '',
    userId: '',
    password: 'AdminPassword@123',
    emailId: '',
    mobileNumber: '',
    mobileExtension: '1001',
    role: 'Administrator' as 'Administrator' | 'Supervisor',
    status: 'Active' as 'Active' | 'Inactive',
    provisionedBy: 'DEVELOPER_TEAM' as 'DEVELOPER_TEAM' | 'SUPPORT_TEAM',
    notes: 'Provisioned by Developer Team for tenant administration',
    specificDid: '27001'
  });

  const [isResetAdminPassModalOpen, setIsResetAdminPassModalOpen] = useState(false);
  const [adminUserForPasswordReset, setAdminUserForPasswordReset] = useState<EnrichedAdminCredential | null>(null);
  const [adminResetNewPassword, setAdminResetNewPassword] = useState('');

  const [isEditAdminModalOpen, setIsEditAdminModalOpen] = useState(false);
  const [editingAdminUser, setEditingAdminUser] = useState<EnrichedAdminCredential | null>(null);

  // Tenant Drilldown View State
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<TenantDrilldownData | null>(null);
  const [drilldownSubTab, setDrilldownSubTab] = useState<'agents' | 'live_calls' | 'call_logs' | 'recordings' | 'admin_credentials'>('agents');
  const [isDrilldownLoading, setIsDrilldownLoading] = useState(false);

  // Impersonation Reason Modal State
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);
  const [selectedAgentForImpersonate, setSelectedAgentForImpersonate] = useState<User | null>(null);
  const [isImpersonateSubmitting, setIsImpersonateSubmitting] = useState(false);

  // Impersonation Audit Logs State
  const [impersonationLogs, setImpersonationLogs] = useState<ImpersonationLog[]>([]);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logTenantFilter, setLogTenantFilter] = useState('ALL');
  const [logStatusFilter, setLogStatusFilter] = useState('ALL');

  // Live Listen Audio Stream Modal
  const [activeAudioStream, setActiveAudioStream] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    audioUrl: string;
  } | null>(null);

  // Reset Password Modal
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // New Company Provisioning Form
  const [isNewCompanyOpen, setIsNewCompanyOpen] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    code: '',
    planType: 'Enterprise' as const,
    userLicenses: 15,
    availableMinutes: 10000,
    subscriptionStart: new Date().toISOString().slice(0, 10),
    subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    primaryContactEmail: '',
    primaryContactPhone: '',
    adminUserId: '',
    adminPassword: 'Password@123'
  });

  // Edit Tenant / Agent Seats Modal State
  const [isEditTenantOpen, setIsEditTenantOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<{
    id: string;
    name: string;
    code: string;
    planType: string;
    userLicenses: number;
    availableMinutes: number;
    subscriptionEnd: string;
    status: 'active' | 'inactive';
  } | null>(null);

  // Global Infrastructure Config
  const [infraConfig, setInfraConfig] = useState<SystemInfrastructureConfig>({
    viciDbHost: '192.168.1.11',
    viciDbPort: 3306,
    viciDbUser: 'cron_asterisk_user',
    viciDbPassword: '••••••••••••',
    viciDbName: 'asterisk',
    viciApiUrl: 'http://192.168.1.11/vicidial/non_agent_api.php',
    viciApiUser: '6666_api_master',
    viciApiPassword: '••••••••••••',
    espoApiUrl: 'https://crm.dialko.internal/api/v1',
    espoApiKey: '••••••••••••',
    carrierSipTrunk: 'sbc-us-east.dialko-sip.net:5060',
    maxConcurrentChannels: 120,
    status: 'Connected',
    lastConnectedTime: new Date().toISOString()
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleUpdateTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    try {
      const res = await fetch(`/api/tenants/${editingTenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingTenant.name,
          code: editingTenant.code,
          planType: editingTenant.planType,
          userLicenses: Number(editingTenant.userLicenses),
          status: editingTenant.status,
          subscriptionEnd: editingTenant.subscriptionEnd
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Tenant "${editingTenant.name}" updated successfully. Agent quota set to ${editingTenant.userLicenses} seats.`);
        setIsEditTenantOpen(false);
        setEditingTenant(null);
        loadTenantsSummary();
        if (selectedTenantId) {
          loadDrilldown(selectedTenantId);
        }
      } else {
        showToast(data.error || 'Failed to update tenant');
      }
    } catch (err) {
      showToast('Error updating tenant');
    }
  };

  const handleToggleTenantStatus = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Tenant status updated to ${newStatus.toUpperCase()}`);
        loadTenantsSummary();
        if (selectedTenantId) {
          loadDrilldown(selectedTenantId);
        }
      } else {
        showToast('Failed to toggle status');
      }
    } catch (err) {
      showToast('Error updating tenant status');
    }
  };

  // Initial Data Fetch
  const loadTenantsSummary = async () => {
    try {
      const res = await fetch('/api/super-admin/tenants-summary');
      if (res.ok) {
        const data = await res.json();
        setTenantsSummary(data);
      }
    } catch (err) {
      console.error('Failed to load tenants summary', err);
    }
  };

  const loadImpersonationLogs = async () => {
    try {
      const res = await fetch('/api/super-admin/impersonation-logs');
      if (res.ok) {
        const data = await res.json();
        setImpersonationLogs(data);
      }
    } catch (err) {
      console.error('Failed to load impersonation logs', err);
    }
  };

  const loadDrilldown = async (tenantId: string) => {
    setIsDrilldownLoading(true);
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/drilldown`);
      if (res.ok) {
        const data = await res.json();
        setDrilldownData(data);
        setSelectedTenantId(tenantId);
      }
    } catch (err) {
      console.error('Failed to load tenant drilldown', err);
      showToast('Failed to load tenant drilldown data');
    } finally {
      setIsDrilldownLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadTenantsSummary(), loadImpersonationLogs(), loadAdminCredentials()]);
      setIsLoading(false);
    };
    init();

    // Polling interval for live status updates
    const timer = setInterval(() => {
      loadTenantsSummary();
      loadAdminCredentials();
      if (selectedTenantId) {
        loadDrilldown(selectedTenantId);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [selectedTenantId]);

  const loadAdminCredentials = async () => {
    setIsLoadingCredentials(true);
    try {
      const res = await fetch('/api/super-admin/admin-credentials');
      if (res.ok) {
        const data = await res.json();
        setAdminCredentials(data);
      }
    } catch (err) {
      console.error('Failed to load admin credentials', err);
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const handleCopyCredentialPack = (admin: EnrichedAdminCredential) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pack = `=== DIALKO TENANT ADMIN CREDENTIALS ===
Tenant Name: ${admin.tenantName} (${admin.tenantCode})
Admin Portal URL: ${origin}/admin
Username / User ID: ${admin.userId}
Password: ${admin.password || 'AdminPassword@123'}
SIP Extension: ${admin.mobileExtension}
Role: ${admin.role}
Access Status: ${admin.status} (${admin.canLoginToAdminPanel ? 'Authorized to login' : 'Blocked from login'})
Provisioned By: ${admin.provisionedBy || 'DEVELOPER_TEAM'}
========================================`;
    navigator.clipboard.writeText(pack);
    showToast(`Copied credentials for '${admin.userId}' to clipboard!`);
  };

  const handleToggleAdminStatus = async (admin: EnrichedAdminCredential) => {
    try {
      const res = await fetch(`/api/super-admin/admin-credentials/${admin.id}/toggle-status`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        loadAdminCredentials();
      } else {
        showToast(data.error || 'Failed to toggle status');
      }
    } catch (err) {
      showToast('Status update failed');
    }
  };

  const handleProvisionAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/super-admin/admin-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminProvisionForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setIsProvisionAdminModalOpen(false);
        loadAdminCredentials();
        // Reset form
        setAdminProvisionForm({
          tenantId: tenantsSummary[0]?.id || 't-1',
          name: '',
          userId: '',
          password: 'AdminPass#' + Math.floor(100 + Math.random() * 900),
          emailId: '',
          mobileNumber: '',
          mobileExtension: `${Math.floor(1000 + Math.random() * 8000)}`,
          role: 'Administrator',
          status: 'Active',
          provisionedBy: 'DEVELOPER_TEAM',
          notes: '',
          specificDid: '27001'
        });
      } else {
        showToast(data.error || 'Failed to provision admin');
      }
    } catch (err) {
      showToast('Error provisioning admin credential');
    }
  };

  const handleResetAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUserForPasswordReset || !adminResetNewPassword.trim()) return;
    try {
      const res = await fetch(`/api/super-admin/admin-credentials/${adminUserForPasswordReset.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          newPassword: adminResetNewPassword.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setIsResetAdminPassModalOpen(false);
        setAdminResetNewPassword('');
        setAdminUserForPasswordReset(null);
        loadAdminCredentials();
      } else {
        showToast(data.error || 'Failed to reset password');
      }
    } catch (err) {
      showToast('Error resetting password');
    }
  };

  const handleEditAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminUser) return;
    try {
      const res = await fetch(`/api/super-admin/admin-credentials/${editingAdminUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingAdminUser.name,
          emailId: editingAdminUser.emailId,
          mobileNumber: editingAdminUser.mobileNumber,
          mobileExtension: editingAdminUser.mobileExtension,
          role: editingAdminUser.role,
          status: editingAdminUser.status,
          notes: editingAdminUser.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Updated details for administrator '${editingAdminUser.userId}'`);
        setIsEditAdminModalOpen(false);
        setEditingAdminUser(null);
        loadAdminCredentials();
      } else {
        showToast(data.error || 'Failed to update admin');
      }
    } catch (err) {
      showToast('Error updating admin details');
    }
  };

  const handleDeleteAdmin = async (admin: EnrichedAdminCredential) => {
    if (!window.confirm(`Are you sure you want to delete administrator account '${admin.userId}' (${admin.name})? This user will no longer be able to access the Admin Panel.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/super-admin/admin-credentials/${admin.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        loadAdminCredentials();
      } else {
        showToast(data.error || 'Failed to delete admin');
      }
    } catch (err) {
      showToast('Error deleting admin');
    }
  };

  const handleExportAdminCredentials = () => {
    const url = '/api/super-admin/admin-credentials/export';
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'tenant_admin_credentials_roster.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported admin credentials roster (CSV).');
  };

  // Handle Supervisor Notification Toggle
  const handleToggleSupervisorNotification = async (tenantId: string, currentVal: boolean) => {
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/supervisor-notification`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentVal })
      });
      if (res.ok) {
        showToast(`Supervisor transparency notification ${!currentVal ? 'enabled' : 'disabled'} for this tenant.`);
        loadTenantsSummary();
        if (drilldownData && drilldownData.tenant.id === tenantId) {
          setDrilldownData({
            ...drilldownData,
            notifySupervisorOnImpersonate: !currentVal
          });
        }
      }
    } catch (err) {
      console.error('Failed to update supervisor notification', err);
      showToast('Failed to update supervisor notification setting');
    }
  };

  // Launch Impersonation Modal
  const handleOpenImpersonate = (agent: any) => {
    const targetUser: User = {
      id: agent.id || agent.userId,
      tenantId: drilldownData?.tenant.id || selectedTenantId || 't-1',
      userId: agent.userId,
      name: agent.name,
      mobileNumber: agent.phone || '9480732001',
      mobileExtension: agent.extension || '1002',
      emailId: agent.email || `${agent.userId}@dialko.com`,
      status: 'Active',
      role: 'Agent',
      userGroup: drilldownData?.tenant.viciUserGroup || 'somnathlead_agent',
      currentChannels: 1,
      skills: ['Inbound Support', 'Sales']
    };
    setSelectedAgentForImpersonate(targetUser);
    setIsImpersonateModalOpen(true);
  };

  // Execute Impersonation Request
  const handleExecuteImpersonation = async (reason: string) => {
    if (!selectedAgentForImpersonate) return;
    setIsImpersonateSubmitting(true);

    try {
      const targetTenant = drilldownData?.tenant || {
        id: selectedTenantId || 't-1',
        name: 'Client',
        code: 'TENANT'
      } as Tenant;

      const res = await fetch('/api/internal/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: targetTenant.id,
          agentId: selectedAgentForImpersonate.userId || selectedAgentForImpersonate.id,
          reason
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsImpersonateModalOpen(false);
        showToast(`Impersonation session established. 15-minute token generated.`);

        if (onStartImpersonation) {
          onStartImpersonation(data.user || selectedAgentForImpersonate, data.tenant || targetTenant, reason);
        } else {
          // Trigger redirect
          window.location.href = '/agent';
        }
      } else {
        showToast(data.error || 'Failed to establish impersonation session.');
      }
    } catch (err) {
      console.error('Impersonation error', err);
      showToast('Impersonation request failed.');
    } finally {
      setIsImpersonateSubmitting(false);
    }
  };

  // Export Impersonation Logs
  const handleExportLogs = (format: 'csv' | 'json') => {
    const url = `/api/super-admin/impersonation-logs/export?format=${format}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `impersonation_audit_trail.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${format.toUpperCase()} audit trail successfully.`);
  };

  // Reset Password for a User
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset || !newPasswordValue.trim()) return;

    try {
      const res = await fetch(`/api/super-admin/users/${selectedUserForReset.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPasswordValue })
      });
      if (res.ok) {
        showToast(`Password successfully reset for ${selectedUserForReset.userId}`);
        setIsResetPassModalOpen(false);
        setNewPasswordValue('');
        setSelectedUserForReset(null);
      }
    } catch (err) {
      showToast('Failed to reset password');
    }
  };

  // Filtered Lists
  const filteredTenants = tenantsSummary.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.code.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.planType.toLowerCase().includes(tenantSearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredLogs = impersonationLogs.filter(log => {
    const matchesSearch =
      !logSearchQuery ||
      log.reason.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.agentId.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.tenantName?.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.masterAdminUser.toLowerCase().includes(logSearchQuery.toLowerCase());
    const matchesTenant = logTenantFilter === 'ALL' || log.tenantId === logTenantFilter;
    const matchesStatus = logStatusFilter === 'ALL' || log.status === logStatusFilter;
    return matchesSearch && matchesTenant && matchesStatus;
  });

  const filteredAdmins = adminCredentials.filter(admin => {
    const q = credentialSearch.toLowerCase();
    const matchesSearch =
      !q ||
      admin.name.toLowerCase().includes(q) ||
      admin.userId.toLowerCase().includes(q) ||
      admin.emailId.toLowerCase().includes(q) ||
      admin.mobileExtension.includes(q) ||
      admin.tenantName.toLowerCase().includes(q) ||
      (admin.notes && admin.notes.toLowerCase().includes(q));

    const matchesTenant = credentialTenantFilter === 'ALL' || admin.tenantId === credentialTenantFilter;
    const matchesStatus = credentialStatusFilter === 'ALL' || admin.status === credentialStatusFilter;
    const matchesProvisionedBy =
      credentialProvisionedByFilter === 'ALL' ||
      admin.provisionedBy === credentialProvisionedByFilter ||
      (!admin.provisionedBy && credentialProvisionedByFilter === 'DEVELOPER_TEAM');

    return matchesSearch && matchesTenant && matchesStatus && matchesProvisionedBy;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-indigo-400 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-black text-lg shadow-lg border border-indigo-400/30">
            DK
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base text-white tracking-tight">Dialko Cloud Master Controller</h1>
              <span className="bg-indigo-950 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                Master Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Multi-Tenant Architecture & Carrier Dialing Engine</span>
              <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" />
              <span className="text-emerald-400 font-mono text-[10px]">Asterisk DB Connected ({infraConfig.viciDbHost}:3306)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Master Admin Profile */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-slate-300">{currentUser.userId}</span>
          </div>

          <button
            onClick={onLogout}
            className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-bold border border-rose-800/40 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Primary Tab Navigation */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-2 flex flex-wrap items-center gap-2">
        <button
          onClick={() => { setActiveTab('matrix'); setSelectedTenantId(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Client Matrix & Live Status</span>
          <span className="bg-indigo-900/80 text-indigo-200 px-1.5 py-0.2 rounded-md text-[10px] font-mono">
            {tenantsSummary.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('credentials'); setSelectedTenantId(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'credentials'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <KeyRound className="w-4 h-4 text-emerald-300" />
          <span>Admin Credentials (Dev & Support)</span>
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold">
            {adminCredentials.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('impersonation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'impersonation'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Impersonation Audit Trail</span>
          <span className="bg-amber-950 text-amber-300 border border-amber-800/50 px-1.5 py-0.2 rounded-md text-[10px] font-mono">
            {impersonationLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Infrastructure Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'billing'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Lock className="w-4 h-4 text-blue-400" />
          <span>Licensing & Expiration Control</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: TENANT MATRIX & REAL-TIME STATUS (4B.1) */}
        {/* ========================================================================= */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            {!selectedTenantId ? (
              <>
                {/* Section Header & Search */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-400" />
                      <span>Client Tenant Telephony Matrix</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Real-time live call monitoring, active agent states, hopper leads, and single-click support drilldown.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search company or tenant code..."
                        value={tenantSearch}
                        onChange={e => setTenantSearch(e.target.value)}
                        className="bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-indigo-500 w-64"
                      />
                    </div>

                    <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                      <button
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${statusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                      >
                        All ({tenantsSummary.length})
                      </button>
                      <button
                        onClick={() => setStatusFilter('active')}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => setStatusFilter('expired')}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${statusFilter === 'expired' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}
                      >
                        Expired
                      </button>
                    </div>

                    <button
                      onClick={() => setIsNewCompanyOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Provision New Tenant</span>
                    </button>
                  </div>
                </div>

                {/* Tenants Grid Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredTenants.map(tenant => (
                    <div
                      key={tenant.id}
                      className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-xl transition space-y-4 relative group"
                    >
                      {/* Tenant Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-white">{tenant.name}</h3>
                            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                              {tenant.code}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Plan: <strong className="text-indigo-300">{tenant.planType}</strong> • Expires: {tenant.subscriptionEnd}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            tenant.status === 'active'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                              : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                          }`}
                        >
                          {tenant.status}
                        </span>
                      </div>

                      {/* Live Telephony Meters */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Live In-Call</span>
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            {tenant.inCallCount > 0 && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                            <span className="text-sm font-black text-emerald-400">{tenant.inCallCount}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Waiting (Ready)</span>
                          <span className="text-sm font-black text-blue-400 block mt-0.5">{tenant.waitingCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Paused</span>
                          <span className="text-sm font-black text-amber-400 block mt-0.5">{tenant.pausedCount}</span>
                        </div>
                      </div>

                      {/* Performance & Hopper Status */}
                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Total Calls Today:</span>
                          <strong className="font-mono text-white">{tenant.totalCallsToday} calls</strong>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Connect Rate:</span>
                          <strong className="text-emerald-400 font-mono">{tenant.successRate}%</strong>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Hopper Feed:</span>
                          <span className="text-indigo-300 font-mono text-[10px]">{tenant.hopperStatus}</span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
                        <button
                          onClick={() => handleToggleSupervisorNotification(tenant.id, tenant.notifySupervisorOnImpersonate)}
                          className={`text-[11px] flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                            tenant.notifySupervisorOnImpersonate
                              ? 'bg-amber-950/40 text-amber-300 border-amber-800/50 hover:bg-amber-900/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                          title="Toggle whether supervisor receives an audit alert when admin impersonates an agent"
                        >
                          <Bell className="w-3 h-3" />
                          <span>Notify: {tenant.notifySupervisorOnImpersonate ? 'ON' : 'OFF'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditingTenant({
                              id: tenant.id,
                              name: tenant.name,
                              code: tenant.code,
                              planType: tenant.planType || 'Enterprise',
                              userLicenses: tenant.userLicenses || 15,
                              availableMinutes: tenant.availableMinutes || 10000,
                              subscriptionEnd: tenant.subscriptionEnd || '2027-12-31',
                              status: tenant.status as 'active' | 'inactive'
                            });
                            setIsEditTenantOpen(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold border border-slate-700 transition cursor-pointer ml-auto"
                        >
                          <Settings className="w-3 h-3 text-indigo-400" />
                          <span>Edit Seats ({tenant.userLicenses || 15})</span>
                        </button>

                        <button
                          onClick={() => loadDrilldown(tenant.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
                        >
                          <span>Drilldown</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* ---------------- TENANT DRILLDOWN DETAILED VIEW ---------------- */
              <div className="space-y-6 animate-in fade-in-50">
                {/* Drilldown Header */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedTenantId(null)}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold mb-2 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Tenant Matrix</span>
                    </button>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black text-white">{drilldownData?.tenant.name}</h2>
                      <span className="bg-indigo-950 text-indigo-300 border border-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
                        {drilldownData?.tenant.code}
                      </span>
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">
                        Plan: {drilldownData?.tenant.planType || 'Enterprise'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Partition User Group: <code className="text-indigo-300">{drilldownData?.tenant.viciUserGroup}</code> • EspoCRM Team: <code className="text-indigo-300">{drilldownData?.tenant.espoTeam}</code>
                    </p>
                  </div>

                  {/* Header Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        const t = drilldownData!.tenant;
                        setEditingTenant({
                          id: t.id,
                          name: t.name,
                          code: t.code,
                          planType: t.planType || 'Enterprise',
                          userLicenses: t.userLicenses || 15,
                          availableMinutes: t.availableMinutes || 10000,
                          subscriptionEnd: t.subscriptionEnd || '2027-12-31',
                          status: t.status as 'active' | 'inactive'
                        });
                        setIsEditTenantOpen(true);
                      }}
                      className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Edit Tenant & Seats ({drilldownData?.tenant.userLicenses || 15} Max)</span>
                    </button>

                    <button
                      onClick={() => handleToggleSupervisorNotification(drilldownData!.tenant.id, drilldownData!.notifySupervisorOnImpersonate)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        drilldownData?.notifySupervisorOnImpersonate
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <Bell className="w-4 h-4 text-amber-400" />
                      <span>Supervisor Transparency Alert: {drilldownData?.notifySupervisorOnImpersonate ? 'ENABLED' : 'DISABLED'}</span>
                    </button>
                  </div>
                </div>

                {/* Drilldown Sub-Tabs */}
                <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold w-fit">
                  <button
                    onClick={() => setDrilldownSubTab('agents')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
                      drilldownSubTab === 'agents' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Live Agents & Softphones ({drilldownData?.agents.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setDrilldownSubTab('live_calls')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
                      drilldownSubTab === 'live_calls' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <span>Live Active Calls ({drilldownData?.liveCalls.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setDrilldownSubTab('call_logs')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
                      drilldownSubTab === 'call_logs' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <PhoneCall className="w-4 h-4 text-blue-400" />
                    <span>Call Logs (CDR) ({drilldownData?.recentCallLogs.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setDrilldownSubTab('recordings')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
                      drilldownSubTab === 'recordings' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Headphones className="w-4 h-4 text-purple-400" />
                    <span>Recordings ({drilldownData?.recordings.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setDrilldownSubTab('admin_credentials')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
                      drilldownSubTab === 'admin_credentials' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <KeyRound className="w-4 h-4 text-emerald-300" />
                    <span>Admin Credentials ({adminCredentials.filter(a => a.tenantId === drilldownData?.tenant.id).length})</span>
                  </button>
                </div>

                {/* Sub-Tab 1: Live Agents List with "Login as Agent" Action */}
                {drilldownSubTab === 'agents' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                          Agent Telephony Status & Impersonation Launchpad
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Password-free login creates a defensible 15-min audit record
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800 text-[11px]">
                          <tr>
                            <th className="py-3 px-4">Agent Name / User ID</th>
                            <th className="py-3 px-4">Extension</th>
                            <th className="py-3 px-4">Live State</th>
                            <th className="py-3 px-4">Current Campaign</th>
                            <th className="py-3 px-4">Channel ID</th>
                            <th className="py-3 px-4">Calls Today</th>
                            <th className="py-3 px-4 text-right">Support Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {drilldownData?.agents.map(agent => (
                            <tr key={agent.id} className="hover:bg-slate-800/40 transition">
                              <td className="py-3.5 px-4 font-bold text-white">
                                <div>{agent.name}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{agent.userId}</div>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                                {agent.extension}
                              </td>
                              <td className="py-3.5 px-4">
                                {agent.status === 'INCALL' && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    IN CALL ({agent.callDurationSec}s)
                                  </span>
                                )}
                                {agent.status === 'WAITING' && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-950 text-blue-400 border border-blue-800 font-bold text-[10px]">
                                    WAITING (READY)
                                  </span>
                                )}
                                {agent.status === 'PAUSED' && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-bold text-[10px]">
                                    PAUSED
                                  </span>
                                )}
                                {agent.status === 'OFFLINE' && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-bold text-[10px]">
                                    OFFLINE
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-300">
                                {agent.currentCampaign}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                                {agent.currentChannel}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-white font-bold">
                                {agent.callsToday}
                              </td>
                              <td className="py-3.5 px-4 text-right space-x-2">
                                {/* Live Listen Button if in call */}
                                {agent.status === 'INCALL' && (
                                  <button
                                    onClick={() => setActiveAudioStream({
                                      isOpen: true,
                                      title: `Live Audio Listen: ${agent.name}`,
                                      subtitle: `Channel: ${agent.currentChannel} • Customer: ${agent.currentCustomerPhone || 'Inbound Call'}`,
                                      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
                                    })}
                                    className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-800 transition cursor-pointer"
                                  >
                                    <Headphones className="w-3.5 h-3.5 inline mr-1" />
                                    <span>Listen</span>
                                  </button>
                                )}

                                {/* Login as Agent (Impersonate) Button */}
                                <button
                                  onClick={() => handleOpenImpersonate(agent)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer inline-flex items-center gap-1.5"
                                  title="Establish 15-minute time-scoped support session"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                  <span>Login as Agent</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 2: Live Active Calls */}
                {drilldownSubTab === 'live_calls' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-white">Direct Live Channel Telephony Monitor</h3>
                        <p className="text-xs text-slate-400">Monitor Asterisk channels without logging into agent accounts.</p>
                      </div>
                    </div>

                    {drilldownData?.liveCalls && drilldownData.liveCalls.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {drilldownData.liveCalls.map(call => (
                          <div key={call.channelId} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs text-indigo-300 font-bold">{call.callerNumber}</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                                {call.status} ({call.callDurationSec}s)
                              </span>
                            </div>
                            <div className="text-xs text-slate-300 space-y-1">
                              <div>Agent: <strong>{call.agentName}</strong> ({call.agentId})</div>
                              <div>Campaign: <span className="font-mono text-slate-400">{call.campaign}</span> • Queue: <span className="font-mono text-slate-400">{call.queue}</span></div>
                              <div className="font-mono text-[11px] text-slate-500">{call.channelId}</div>
                            </div>
                            <div className="pt-2 flex items-center gap-2 border-t border-slate-800/80">
                              <button
                                onClick={() => setActiveAudioStream({
                                  isOpen: true,
                                  title: `Channel Monitor: ${call.callerNumber}`,
                                  subtitle: `Agent: ${call.agentName} • Duration: ${call.callDurationSec}s`,
                                  audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
                                })}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Headphones className="w-3.5 h-3.5" />
                                <span>Listen Live</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        No active live calls currently connected for this tenant.
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-Tab 3: Call Logs (CDR) */}
                {drilldownSubTab === 'call_logs' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px]">
                          <tr>
                            <th className="py-3 px-4">Date & Time</th>
                            <th className="py-3 px-4">Caller ID</th>
                            <th className="py-3 px-4">Destination</th>
                            <th className="py-3 px-4">Agent</th>
                            <th className="py-3 px-4">Duration / Talk</th>
                            <th className="py-3 px-4">Disposition</th>
                            <th className="py-3 px-4">Recording</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {drilldownData?.recentCallLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-800/40 transition">
                              <td className="py-3 px-4 font-mono">{log.callDate} {log.callTime}</td>
                              <td className="py-3 px-4 font-mono font-bold text-white">{log.callerId}</td>
                              <td className="py-3 px-4 font-mono text-slate-400">{log.destination}</td>
                              <td className="py-3 px-4">{log.agentName}</td>
                              <td className="py-3 px-4 font-mono">{log.durationSec}s ({log.talkTimeSec}s)</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[10px] font-bold">
                                  {log.disposition}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {log.recordingUrl ? (
                                  <button
                                    onClick={() => setActiveAudioStream({
                                      isOpen: true,
                                      title: `Call Recording: ${log.callerId}`,
                                      subtitle: `Agent: ${log.agentName} • Date: ${log.callDate} ${log.callTime}`,
                                      audioUrl: log.recordingUrl!
                                    })}
                                    className="text-indigo-400 hover:text-indigo-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                    <span>Play MP3</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-600 text-[11px]">N/A</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 4: Recordings */}
                {drilldownSubTab === 'recordings' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
                    <h3 className="font-bold text-sm text-white">Direct MP3 Call Recordings Archive</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {drilldownData?.recordings.map(rec => (
                        <div key={rec.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-white font-bold">{rec.callerNumber}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{rec.durationSec} seconds</span>
                          </div>
                          <div className="text-xs text-slate-300">
                            Agent: <strong>{rec.agentName}</strong> • Campaign: <span className="font-mono text-slate-400">{rec.campaign}</span>
                          </div>
                          <button
                            onClick={() => setActiveAudioStream({
                              isOpen: true,
                              title: `Audio Recording: ${rec.callerNumber}`,
                              subtitle: `Agent: ${rec.agentName} • Campaign: ${rec.campaign}`,
                              audioUrl: rec.recordingUrl
                            })}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Play Recording Stream</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-Tab 5: Admin Credentials for this specific Tenant */}
                {drilldownSubTab === 'admin_credentials' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-emerald-400" />
                          <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                            Authorized Administrator Credentials ({drilldownData?.tenant.name})
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Only administrators provisioned here in the Master Panel can access <code className="text-emerald-300 font-mono">/admin</code>.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAdminProvisionForm({
                            tenantId: drilldownData?.tenant.id || 't-1',
                            name: '',
                            userId: `${drilldownData?.tenant.slug || 'tenant'}_admin`,
                            password: 'AdminPass#' + Math.floor(100 + Math.random() * 900),
                            emailId: '',
                            mobileNumber: '',
                            mobileExtension: `${Math.floor(1000 + Math.random() * 8000)}`,
                            role: 'Administrator',
                            status: 'Active',
                            provisionedBy: 'DEVELOPER_TEAM',
                            notes: `Provisioned for ${drilldownData?.tenant.name}`,
                            specificDid: '27001'
                          });
                          setIsProvisionAdminModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Provision New Admin for this Tenant</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800 text-[11px]">
                          <tr>
                            <th className="py-3 px-4">User ID & Name</th>
                            <th className="py-3 px-4">Extension</th>
                            <th className="py-3 px-4">Role</th>
                            <th className="py-3 px-4">Provisioned By</th>
                            <th className="py-3 px-4">Login Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {adminCredentials.filter(a => a.tenantId === drilldownData?.tenant.id).length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-500">
                                No administrators provisioned for this tenant yet. Click "Provision New Admin" above to authorize an admin.
                              </td>
                            </tr>
                          ) : (
                            adminCredentials
                              .filter(a => a.tenantId === drilldownData?.tenant.id)
                              .map(admin => (
                                <tr key={admin.id} className="hover:bg-slate-800/40 transition">
                                  <td className="py-3.5 px-4 font-bold text-white">
                                    <div className="font-mono text-emerald-300">{admin.userId}</div>
                                    <div className="text-[11px] text-slate-400 font-normal">{admin.name} • {admin.emailId}</div>
                                  </td>
                                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                                    {admin.mobileExtension}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                      {admin.role}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      admin.provisionedBy === 'DEVELOPER_TEAM'
                                        ? 'bg-purple-950/80 text-purple-300 border-purple-800/50'
                                        : 'bg-cyan-950/80 text-cyan-300 border-cyan-800/50'
                                    }`}>
                                      {admin.provisionedBy === 'DEVELOPER_TEAM' ? 'Developer Team' : 'Support Team'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                        admin.status === 'Active'
                                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                          : 'bg-rose-950 text-rose-400 border-rose-800'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${admin.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                        {admin.status === 'Active' ? 'Active (/admin Enabled)' : 'Suspended (/admin Blocked)'}
                                      </span>
                                      <button
                                        onClick={() => handleToggleAdminStatus(admin)}
                                        className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                                        title="Toggle Active/Suspended status"
                                      >
                                        {admin.status === 'Active' ? 'Suspend' : 'Activate'}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 text-right space-x-2">
                                    <button
                                      onClick={() => handleCopyCredentialPack(admin)}
                                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                                      title="Copy Credentials to Clipboard"
                                    >
                                      <Copy className="w-3 h-3 inline mr-1 text-emerald-400" />
                                      Copy
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedUserForReset(admin);
                                        setAdminUserForPasswordReset(admin);
                                        setIsResetAdminPassModalOpen(true);
                                      }}
                                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                                      title="Reset Password"
                                    >
                                      Reset
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingAdminUser(admin);
                                        setIsEditAdminModalOpen(true);
                                      }}
                                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                                      title="Edit Details"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAdmin(admin)}
                                      className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg text-xs font-semibold border border-rose-800/40 transition cursor-pointer"
                                      title="Delete Credential"
                                    >
                                      <Trash2 className="w-3 h-3 inline" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: DEVELOPER & SUPPORT ADMIN CREDENTIALS & PROVISIONING */}
        {/* ========================================================================= */}
        {activeTab === 'credentials' && (
          <div className="space-y-6">
            {/* Top Operations Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                      Authoritative Admin Provisioning
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800/60">
                      Developer & Support Teams
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-emerald-400" />
                    <span>Master Tenant Admin Credentials & Access Control</span>
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    The <strong>Tenant Admin Panel (/admin)</strong> strictly authorizes logins <em>only</em> for credentials created and provisioned here in the Master Panel by the <strong>Developer Team</strong> or <strong>Support Team</strong>. Accounts cannot log into <code className="text-emerald-300 font-mono">/admin</code> unless their record exists in this authoritative registry and is marked <strong>Active</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => {
                      setAdminProvisionForm({
                        tenantId: tenantsSummary[0]?.id || 't-1',
                        name: '',
                        userId: '',
                        password: 'AdminPass#' + Math.floor(100 + Math.random() * 900),
                        emailId: '',
                        mobileNumber: '',
                        mobileExtension: `${Math.floor(1000 + Math.random() * 8000)}`,
                        role: 'Administrator',
                        status: 'Active',
                        provisionedBy: 'DEVELOPER_TEAM',
                        notes: 'Provisioned by Developer Team for tenant operations',
                        specificDid: '27001'
                      });
                      setIsProvisionAdminModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Provision New Tenant Admin</span>
                  </button>

                  <button
                    onClick={handleExportAdminCredentials}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-1">
                <span className="text-xs text-slate-400">Total Provisioned Admins</span>
                <div className="text-2xl font-black text-white">{adminCredentials.length}</div>
                <span className="text-[11px] text-slate-500 font-medium">Developer & Support registered</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-1">
                <span className="text-xs text-slate-400">Active Login Permitted</span>
                <div className="text-2xl font-black text-emerald-400">
                  {adminCredentials.filter(a => a.status === 'Active').length}
                </div>
                <span className="text-[11px] text-emerald-400/80 font-medium">Can authenticate to /admin</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-1">
                <span className="text-xs text-slate-400">Suspended / Blocked</span>
                <div className="text-2xl font-black text-rose-400">
                  {adminCredentials.filter(a => a.status !== 'Active').length}
                </div>
                <span className="text-[11px] text-rose-400/80 font-medium">Denied access at /admin</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-1">
                <span className="text-xs text-slate-400">Provisioning Teams</span>
                <div className="text-sm font-bold text-white flex items-center gap-3 pt-1">
                  <span className="text-purple-300">
                    Dev: {adminCredentials.filter(a => a.provisionedBy === 'DEVELOPER_TEAM').length}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-cyan-300">
                    Support: {adminCredentials.filter(a => a.provisionedBy === 'SUPPORT_TEAM').length}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Authoritative teams</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative min-w-[240px] flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by User ID, Name, Email, Ext..."
                    value={credentialSearch}
                    onChange={e => setCredentialSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-indigo-500"
                  />
                </div>

                {/* Tenant Filter */}
                <select
                  value={credentialTenantFilter}
                  onChange={e => setCredentialTenantFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-indigo-500"
                >
                  <option value="ALL">All Client Tenants ({tenantsSummary.length})</option>
                  {tenantsSummary.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={credentialStatusFilter}
                  onChange={e => setCredentialStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-indigo-500"
                >
                  <option value="ALL">All Access Statuses</option>
                  <option value="Active">Active (Permitted)</option>
                  <option value="Inactive">Suspended (Blocked)</option>
                </select>

                {/* Provisioned By Filter */}
                <select
                  value={credentialProvisionedByFilter}
                  onChange={e => setCredentialProvisionedByFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-indigo-500"
                >
                  <option value="ALL">All Provisioning Teams</option>
                  <option value="DEVELOPER_TEAM">Developer Team</option>
                  <option value="SUPPORT_TEAM">Support Team</option>
                </select>
              </div>

              {(credentialSearch || credentialTenantFilter !== 'ALL' || credentialStatusFilter !== 'ALL' || credentialProvisionedByFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setCredentialSearch('');
                    setCredentialTenantFilter('ALL');
                    setCredentialStatusFilter('ALL');
                    setCredentialProvisionedByFilter('ALL');
                  }}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Roster Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                    Provisioned Admin Accounts ({filteredAdmins.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Click 'Copy' to share tenant admin onboarding details
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Client Tenant</th>
                      <th className="py-3.5 px-4">Admin Username & Details</th>
                      <th className="py-3.5 px-4">Extension</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Provisioned By</th>
                      <th className="py-3.5 px-4">Login Access</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredAdmins.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          <p className="text-sm font-semibold">No admin credentials match your filters.</p>
                          <p className="text-xs text-slate-600 mt-1">Try resetting the search or filter options, or click "Provision New Tenant Admin".</p>
                        </td>
                      </tr>
                    ) : (
                      filteredAdmins.map(admin => (
                        <tr key={admin.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{admin.tenantName}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-indigo-300 bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-800/40">
                                {admin.tenantCode}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {admin.planType}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                              <span>{admin.userId}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(admin.userId);
                                  showToast(`Copied username '${admin.userId}'`);
                                }}
                                className="text-slate-500 hover:text-white cursor-pointer"
                                title="Copy username"
                              >
                                <Copy className="w-3 h-3 inline" />
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-300">{admin.name}</div>
                            <div className="text-[10px] text-slate-500">{admin.emailId}</div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                            {admin.mobileExtension}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              {admin.role}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              admin.provisionedBy === 'DEVELOPER_TEAM'
                                ? 'bg-purple-950/80 text-purple-300 border-purple-800/50'
                                : 'bg-cyan-950/80 text-cyan-300 border-cyan-800/50'
                            }`}>
                              {admin.provisionedBy === 'DEVELOPER_TEAM' ? 'Developer Team' : 'Support Team'}
                            </span>
                            {admin.notes && (
                              <div className="text-[10px] text-slate-500 italic truncate max-w-xs" title={admin.notes}>
                                {admin.notes}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                admin.status === 'Active'
                                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                  : 'bg-rose-950 text-rose-400 border-rose-800'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${admin.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                {admin.status === 'Active' ? 'Active (/admin Enabled)' : 'Suspended (/admin Blocked)'}
                              </span>
                              <div>
                                <button
                                  onClick={() => handleToggleAdminStatus(admin)}
                                  className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                                >
                                  {admin.status === 'Active' ? 'Suspend Access' : 'Reactivate Access'}
                                </button>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleCopyCredentialPack(admin)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center gap-1"
                                title="Copy Full Credential Pack to Clipboard"
                              >
                                <Copy className="w-3 h-3 text-emerald-400" />
                                <span>Copy</span>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedUserForReset(admin);
                                  setAdminUserForPasswordReset(admin);
                                  setIsResetAdminPassModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                                title="Reset Administrator Password"
                              >
                                Reset Pass
                              </button>

                              <button
                                onClick={() => {
                                  setEditingAdminUser(admin);
                                  setIsEditAdminModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                                title="Edit Administrator Profile"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleDeleteAdmin(admin)}
                                className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg text-xs font-semibold border border-rose-800/40 transition cursor-pointer"
                                title="Delete Administrator"
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: IMPERSONATION AUDIT TRAIL (4B.4) */}
        {/* ========================================================================= */}
        {activeTab === 'impersonation' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <span>Support Impersonation Defensible Audit Trail</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Immutable record of every support login session, mandatory technician justification, duration, and originating IP.
                </p>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleExportLogs('csv')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => handleExportLogs('json')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search reason, agent, tenant, or admin user..."
                  value={logSearchQuery}
                  onChange={e => setLogSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-indigo-500"
                />
              </div>

              <select
                value={logTenantFilter}
                onChange={e => setLogTenantFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-indigo-500"
              >
                <option value="ALL">All Tenants</option>
                {tenantsSummary.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <select
                value={logStatusFilter}
                onChange={e => setLogStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-indigo-500"
              >
                <option value="ALL">All Session Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ENDED">ENDED</option>
              </select>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Log ID</th>
                      <th className="py-3 px-4">Master Admin</th>
                      <th className="py-3 px-4">Tenant</th>
                      <th className="py-3 px-4">Target Agent</th>
                      <th className="py-3 px-4">Mandatory Reason</th>
                      <th className="py-3 px-4">Started At</th>
                      <th className="py-3 px-4">Ended At</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-mono text-indigo-400 font-bold">{log.id}</td>
                        <td className="py-3.5 px-4 font-mono text-white">{log.masterAdminUser}</td>
                        <td className="py-3.5 px-4 font-bold text-white">{log.tenantName || log.tenantId}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{log.agentName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{log.agentId}</div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs text-slate-200">
                          <span className="italic">"{log.reason}"</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{log.startedAt}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {log.endedAt || <span className="text-emerald-400 font-bold">In Session</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              log.status === 'ACTIVE'
                                ? 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: INFRASTRUCTURE OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>Platform Infrastructure & Cluster Health</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                <span className="text-xs text-slate-400">Total Client Tenants</span>
                <div className="text-2xl font-black text-white">{tenantsSummary.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                <span className="text-xs text-slate-400">Active Live Agents</span>
                <div className="text-2xl font-black text-emerald-400">
                  {tenantsSummary.reduce((acc, t) => acc + t.liveAgentsCount, 0)}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                <span className="text-xs text-slate-400">Concurrent SIP Channels</span>
                <div className="text-2xl font-black text-blue-400">
                  {tenantsSummary.reduce((acc, t) => acc + t.inCallCount, 0)} / {infraConfig.maxConcurrentChannels}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                <span className="text-xs text-slate-400">Carrier SIP Trunk</span>
                <div className="text-xs font-mono font-bold text-indigo-300 truncate">{infraConfig.carrierSipTrunk}</div>
              </div>
            </div>

            {/* Database & Non-Agent API Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-sm text-white">ViciDial & EspoCRM Telephony Cluster Topology</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-indigo-400 font-bold">Asterisk MariaDB Partition:</div>
                  <div>Host: {infraConfig.viciDbHost}:{infraConfig.viciDbPort}</div>
                  <div>Database: {infraConfig.viciDbName}</div>
                  <div>User: {infraConfig.viciDbUser}</div>
                  <div className="text-emerald-400">Status: {infraConfig.status}</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-indigo-400 font-bold">Integration Endpoints:</div>
                  <div>ViciDial API: {infraConfig.viciApiUrl}</div>
                  <div>EspoCRM API: {infraConfig.espoApiUrl}</div>
                  <div>Last Sync: {infraConfig.lastConnectedTime}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: BILLING & LICENSING */}
        {/* ========================================================================= */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-400" />
                  <span>Tenant Licensing & Expiry Lockout Controls</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage subscription periods, agent seat quotas, and licensing status (switch between Active and Inactive).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Quick Legend:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active = Fully Licensed & Logins Allowed
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Inactive = Locked Out / Suspended
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Client Tenant</th>
                    <th className="py-3 px-4">Tenant Code</th>
                    <th className="py-3 px-4">Plan Tier</th>
                    <th className="py-3 px-4">Agent Seats Quota</th>
                    <th className="py-3 px-4">Expiration Date</th>
                    <th className="py-3 px-4">Licensing Status (Click to Toggle)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {tenantsSummary.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div>{t.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {t.id}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-indigo-300 font-bold">{t.code}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {t.planType || 'Enterprise'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-bold text-sm">{t.userLicenses || 15}</span>
                          <span className="text-slate-500 text-[10px]">max agents</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {t.subscriptionEnd || '2027-12-31'}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleTenantStatus(t.id, t.status)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                            t.status === 'active'
                              ? 'bg-emerald-950 hover:bg-emerald-900/80 text-emerald-300 border-emerald-700 shadow-sm'
                              : 'bg-rose-950 hover:bg-rose-900/80 text-rose-300 border-rose-700 shadow-sm'
                          }`}
                          title={`Currently ${t.status}. Click to change to ${t.status === 'active' ? 'inactive' : 'active'}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${t.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                          <span>{t.status === 'active' ? 'Active (Operational)' : 'Inactive (Suspended)'}</span>
                          <span className="text-[10px] opacity-70 underline ml-1">Change</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingTenant({
                              id: t.id,
                              name: t.name,
                              code: t.code,
                              planType: t.planType || 'Enterprise',
                              userLicenses: t.userLicenses || 15,
                              availableMinutes: t.availableMinutes || 10000,
                              subscriptionEnd: t.subscriptionEnd || '2027-12-31',
                              status: t.status as 'active' | 'inactive'
                            });
                            setIsEditTenantOpen(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Edit License & Seats</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Impersonation Reason Mandatory Prompt Modal */}
      <ImpersonationReasonModal
        isOpen={isImpersonateModalOpen}
        onClose={() => setIsImpersonateModalOpen(false)}
        targetAgent={selectedAgentForImpersonate}
        targetTenant={drilldownData?.tenant}
        onSubmit={handleExecuteImpersonation}
        isLoading={isImpersonateSubmitting}
      />

      {/* Real-time Audio Stream Playback Modal */}
      {activeAudioStream?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">{activeAudioStream.title}</h3>
              </div>
              <button
                onClick={() => setActiveAudioStream(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">{activeAudioStream.subtitle}</p>
            <audio controls autoPlay className="w-full mt-2">
              <source src={activeAudioStream.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      )}

      {/* Provision New Tenant Modal */}
      {isNewCompanyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">Provision New Client Tenant</h3>
              <button onClick={() => setIsNewCompanyOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch('/api/tenants', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: newCompanyForm.name,
                      code: newCompanyForm.code,
                      planType: newCompanyForm.planType,
                      userLicenses: Number(newCompanyForm.userLicenses) || 10,
                      adminUserId: newCompanyForm.adminUserId || `${newCompanyForm.code.toLowerCase()}_admin`,
                      adminPassword: newCompanyForm.adminPassword || 'Password@123',
                      primaryContactEmail: newCompanyForm.primaryContactEmail,
                      viciUserGroup: `${newCompanyForm.code.toLowerCase()}_admin`,
                      espoTeam: `${newCompanyForm.name} Team`,
                      subscriptionEnd: newCompanyForm.subscriptionEnd
                    })
                  });
                  const resData = await res.json();
                  if (res.ok) {
                    showToast(`Client "${newCompanyForm.name}" provisioned successfully with ${newCompanyForm.userLicenses} licenses! Admin User ID: ${newCompanyForm.adminUserId || `${newCompanyForm.code.toLowerCase()}_admin`}`);
                    setIsNewCompanyOpen(false);
                    loadTenantsSummary();
                  } else {
                    showToast(resData.error || 'Failed to provision client');
                  }
                } catch (err: any) {
                  showToast(err.message || 'Failed to provision client');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-slate-300 font-bold mb-1">Client Name *</label>
                <input
                  required
                  type="text"
                  value={newCompanyForm.name}
                  onChange={e => {
                    const val = e.target.value;
                    const autoCode = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
                    setNewCompanyForm({
                      ...newCompanyForm,
                      name: val,
                      code: newCompanyForm.code || autoCode,
                      adminUserId: newCompanyForm.adminUserId || (autoCode ? `${autoCode.toLowerCase()}_admin` : '')
                    });
                  }}
                  placeholder="e.g. Apex Global BPO"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Client Code *</label>
                  <input
                    required
                    type="text"
                    value={newCompanyForm.code}
                    onChange={e => {
                      const c = e.target.value.toUpperCase();
                      setNewCompanyForm({
                        ...newCompanyForm,
                        code: c,
                        adminUserId: `${c.toLowerCase()}_admin`
                      });
                    }}
                    placeholder="e.g. APEXBPO"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Plan Type</label>
                  <select
                    value={newCompanyForm.planType}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, planType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              {/* License Count / Max Users */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    User Licenses (Seat Quota) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="1000"
                    value={newCompanyForm.userLicenses}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, userLicenses: parseInt(e.target.value) || 1 })}
                    placeholder="e.g. 15"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-300 font-mono font-bold outline-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Number of users = license count. The Client Admin can only create users up to this limit.
                  </p>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Subscription Expiry Date</label>
                  <input
                    type="date"
                    value={newCompanyForm.subscriptionEnd}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, subscriptionEnd: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500"
                  />
                </div>
              </div>

              {/* Initial Client Admin Account Details */}
              <div className="pt-2 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[11px]">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Initial Client Admin Credentials (for /admin panel)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Admin Username *</label>
                    <input
                      required
                      type="text"
                      value={newCompanyForm.adminUserId}
                      onChange={e => setNewCompanyForm({ ...newCompanyForm, adminUserId: e.target.value })}
                      placeholder="e.g. apexbpo_admin"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Admin Password *</label>
                    <input
                      required
                      type="text"
                      value={newCompanyForm.adminPassword}
                      onChange={e => setNewCompanyForm({ ...newCompanyForm, adminPassword: e.target.value })}
                      placeholder="e.g. Password@123"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-indigo-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Primary Contact Email</label>
                  <input
                    type="email"
                    value={newCompanyForm.primaryContactEmail}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, primaryContactEmail: e.target.value })}
                    placeholder="admin@client.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewCompanyOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Provision Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT TENANT, AGENT SEATS QUOTA & LICENSING STATUS */}
      {/* ========================================================================= */}
      {isEditTenantOpen && editingTenant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Client Tenant & Licensing</h3>
                  <p className="text-xs text-slate-400">Configure agent capacity, licensing status, and subscription</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditTenantOpen(false);
                  setEditingTenant(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTenantSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Company / Tenant Name *</label>
                <input
                  required
                  type="text"
                  value={editingTenant.name}
                  onChange={e => setEditingTenant({ ...editingTenant, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tenant Code</label>
                  <input
                    required
                    type="text"
                    value={editingTenant.code}
                    onChange={e => setEditingTenant({ ...editingTenant, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Plan Type</label>
                  <select
                    value={editingTenant.planType}
                    onChange={e => setEditingTenant({ ...editingTenant, planType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              {/* Number of Agents / Agent Seats Quota */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                <label className="block text-slate-200 font-bold">
                  Number of Agents (Agent Seats Quota) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    required
                    type="number"
                    min="1"
                    max="5000"
                    value={editingTenant.userLicenses}
                    onChange={e => setEditingTenant({ ...editingTenant, userLicenses: parseInt(e.target.value) || 1 })}
                    className="w-32 bg-slate-900 border border-slate-700 rounded-lg p-2 text-emerald-300 font-mono font-bold text-sm outline-indigo-500"
                  />
                  <span className="text-slate-400 text-[11px]">
                    Maximum active concurrent agents permitted for this client.
                  </span>
                </div>
              </div>

              {/* Licensing & Expiration Status - Active / Inactive */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <label className="block text-slate-200 font-bold">
                  Licensing Operational Status *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTenant({ ...editingTenant, status: 'active' })}
                    className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                      editingTenant.status === 'active'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs">Active</span>
                    <span className="text-[10px] font-normal text-emerald-400/80">Platform Unlocked & Live</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingTenant({ ...editingTenant, status: 'inactive' })}
                    className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                      editingTenant.status === 'inactive'
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-md ring-1 ring-rose-500/50'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs">Inactive</span>
                    <span className="text-[10px] font-normal text-rose-400/80">Suspended / Locked Out</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Subscription Expiration Date</label>
                <input
                  type="date"
                  value={editingTenant.subscriptionEnd}
                  onChange={e => setEditingTenant({ ...editingTenant, subscriptionEnd: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditTenantOpen(false);
                    setEditingTenant(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PROVISION NEW TENANT ADMIN (DEVELOPER & SUPPORT TEAMS) */}
      {/* ========================================================================= */}
      {isProvisionAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-gradient-to-r from-slate-950 via-emerald-950/40 to-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Provision Tenant Administrator Credential</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Master Auth
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Authorizes access to the Tenant Admin Panel (<code className="text-emerald-300 font-mono">/admin</code>). Only accounts registered here can log in.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProvisionAdminModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProvisionAdminSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Target Client Tenant */}
                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">
                    Client Tenant *
                  </label>
                  <select
                    required
                    value={adminProvisionForm.tenantId}
                    onChange={e => setAdminProvisionForm({ ...adminProvisionForm, tenantId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500 font-medium"
                  >
                    {tenantsSummary.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code}) • Plan: {t.planType} • Status: {t.status}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    The newly provisioned administrator will only have authority over this specific tenant partition.
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Administrator Full Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Rachel Adams"
                    value={adminProvisionForm.name}
                    onChange={e => setAdminProvisionForm({ ...adminProvisionForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500"
                  />
                </div>

                {/* Login User ID */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Username / Login ID * <span className="text-slate-500 font-normal">(Used on /admin)</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. apex_admin_rachel"
                    value={adminProvisionForm.userId}
                    onChange={e => setAdminProvisionForm({ ...adminProvisionForm, userId: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-300 font-mono font-bold outline-indigo-500"
                  />
                </div>

                {/* Initial Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold">Initial Password *</label>
                    <button
                      type="button"
                      onClick={() => {
                        const randomPass = 'AdminPass#' + Math.floor(1000 + Math.random() * 9000);
                        setAdminProvisionForm({ ...adminProvisionForm, password: randomPass });
                      }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                    >
                      Generate Secure
                    </button>
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="Minimum 6 characters"
                    value={adminProvisionForm.password}
                    onChange={e => setAdminProvisionForm({ ...adminProvisionForm, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono outline-indigo-500"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    placeholder="rachel@apexbpo.com"
                    value={adminProvisionForm.emailId}
                    onChange={e => setAdminProvisionForm({ ...adminProvisionForm, emailId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500"
                  />
                </div>

                {/* SIP Extension */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">SIP Phone Extension *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 1001"
                    value={adminProvisionForm.mobileExtension}
                    onChange={e => setAdminProvisionForm({ ...adminProvisionForm, mobileExtension: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-indigo-300 font-mono outline-indigo-500"
                  />
                </div>

                {/* Mobile / Direct Phone */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Contact Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 019-2831"
                    value={adminProvisionForm.mobileNumber}
                    onChange={e => setAdminProvisionForm({ ...adminProvisionForm, mobileNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500"
                  />
                </div>

                {/* Administrative Role */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Administrative Role *</label>
                  <select
                    value={adminProvisionForm.role}
                    onChange={e => setAdminProvisionForm({ ...adminProvisionForm, role: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500"
                  >
                    <option value="Administrator">Administrator (Full Tenant Governance)</option>
                    <option value="Supervisor">Supervisor (Campaign & Agent Oversight)</option>
                  </select>
                </div>

                {/* Provisioning Authoritative Team */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Authoritative Provisioning Team *</label>
                  <select
                    value={adminProvisionForm.provisionedBy}
                    onChange={e => setAdminProvisionForm({ ...adminProvisionForm, provisionedBy: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500 font-bold"
                  >
                    <option value="DEVELOPER_TEAM">Developer Team (DevOps / Core Engineering)</option>
                    <option value="SUPPORT_TEAM">Support Team (Technical Operations / Onboarding)</option>
                  </select>
                </div>

                {/* Initial Access Status */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Access Status</label>
                  <select
                    value={adminProvisionForm.status}
                    onChange={e => setAdminProvisionForm({ ...adminProvisionForm, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500 font-bold"
                  >
                    <option value="Active">Active (Permitted to log into /admin)</option>
                    <option value="Inactive">Suspended (Blocked from /admin)</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Provisioning Notes / Scope</label>
                  <textarea
                    rows={2}
                    placeholder="Provide context regarding who authorized this admin or special requirements..."
                    value={adminProvisionForm.notes}
                    onChange={e => setAdminProvisionForm({ ...adminProvisionForm, notes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Master Credential Guarantee</span>
                </div>
                <p>
                  Upon submission, this credential is recorded in the platform database with Master Provisioning Metadata. The user will be able to authenticate directly on <code className="text-white font-mono">/admin</code> using the provided username and password.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProvisionAdminModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Authorize & Provision Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESET ADMIN PASSWORD */}
      {/* ========================================================================= */}
      {isResetAdminPassModalOpen && adminUserForPasswordReset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white">Reset Tenant Admin Password</h3>
              </div>
              <button
                onClick={() => {
                  setIsResetAdminPassModalOpen(false);
                  setAdminUserForPasswordReset(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetAdminPasswordSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 text-slate-300">
                <div className="text-slate-400 text-[11px]">Administrator Account:</div>
                <div className="font-bold text-white text-sm">{adminUserForPasswordReset.name}</div>
                <div className="font-mono text-emerald-400 font-bold">{adminUserForPasswordReset.userId}</div>
                <div className="text-[11px] text-slate-400">Tenant: {adminUserForPasswordReset.tenantName} ({adminUserForPasswordReset.tenantCode})</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-bold">New Secure Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newPass = 'Admin#' + Math.floor(1000 + Math.random() * 9000);
                      setAdminResetNewPassword(newPass);
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  required
                  type="text"
                  placeholder="Enter new password (min 6 characters)"
                  value={adminResetNewPassword}
                  onChange={e => setAdminResetNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono outline-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetAdminPassModalOpen(false);
                    setAdminUserForPasswordReset(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition cursor-pointer"
                >
                  Set New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT ADMIN DETAILS */}
      {/* ========================================================================= */}
      {isEditAdminModalOpen && editingAdminUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Edit Administrator Profile</h3>
                  <div className="text-[11px] text-slate-400 font-mono">{editingAdminUser.userId} • {editingAdminUser.tenantName}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditAdminModalOpen(false);
                  setEditingAdminUser(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditAdminSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={editingAdminUser.name}
                    onChange={e => setEditingAdminUser({ ...editingAdminUser, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={editingAdminUser.emailId}
                    onChange={e => setEditingAdminUser({ ...editingAdminUser, emailId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">SIP Extension *</label>
                  <input
                    required
                    type="text"
                    value={editingAdminUser.mobileExtension}
                    onChange={e => setEditingAdminUser({ ...editingAdminUser, mobileExtension: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-indigo-300 font-mono outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingAdminUser.mobileNumber || ''}
                    onChange={e => setEditingAdminUser({ ...editingAdminUser, mobileNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Role *</label>
                  <select
                    value={editingAdminUser.role}
                    onChange={e => setEditingAdminUser({ ...editingAdminUser, role: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Login Access Status *</label>
                  <select
                    value={editingAdminUser.status}
                    onChange={e => setEditingAdminUser({ ...editingAdminUser, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500 font-bold"
                  >
                    <option value="Active">Active (Can log into /admin)</option>
                    <option value="Inactive">Suspended (Blocked from /admin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Authoritative Team *</label>
                  <select
                    value={editingAdminUser.provisionedBy || 'DEVELOPER_TEAM'}
                    onChange={e => setEditingAdminUser({ ...editingAdminUser, provisionedBy: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500"
                  >
                    <option value="DEVELOPER_TEAM">Developer Team</option>
                    <option value="SUPPORT_TEAM">Support Team</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={editingAdminUser.notes || ''}
                  onChange={e => setEditingAdminUser({ ...editingAdminUser, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditAdminModalOpen(false);
                    setEditingAdminUser(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition cursor-pointer"
                >
                  Save Profile Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
