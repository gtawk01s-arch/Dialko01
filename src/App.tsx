import React from 'react';
import { Sidebar } from './components/Sidebar.js';
import { TopBar } from './components/TopBar.js';
import { ImpersonationBanner } from './components/ImpersonationBanner.js';
import { AudioPlayerModal } from './components/AudioPlayerModal.js';

// Auth & Portal Views
import { PortalGatewayPage } from './pages/PortalGatewayPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { AgentWorkspacePage } from './pages/AgentWorkspacePage.js';

// Admin Page Views
import { DashboardPage } from './pages/DashboardPage.js';
import { LeadsPage } from './pages/LeadsPage.js';
import { CampaignsPage } from './pages/CampaignsPage.js';
import { ListsPage } from './pages/ListsPage.js';
import { ContactsPage } from './pages/ContactsPage.js';
import { TicketsPage } from './pages/TicketsPage.js';
import { MeetingsPage } from './pages/MeetingsPage.js';
import { UsersGroupsPage } from './pages/UsersGroupsPage.js';
import { TeamManagementPage } from './pages/TeamManagementPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { RealTimeMonitoringPage } from './pages/RealTimeMonitoringPage.js';
import { ConfigurationsPage } from './pages/ConfigurationsPage.js';
import { SurveysPage } from './pages/SurveysPage.js';
import { SMSTriggersPage } from './pages/SMSTriggersPage.js';
import { CallFlowBuilderPage } from './pages/CallFlowBuilderPage.js';
import { MasterAdminPage } from './pages/MasterAdminPage.js';
import { SuperAdminDashboardPage } from './pages/SuperAdminDashboardPage.js';

import { Tenant, User } from './types/index.js';
import { ShieldAlert, ArrowRight, Building2, Headphones } from 'lucide-react';

export default function App() {
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = React.useState<Tenant>({
    id: '',
    name: 'No Organization Provisioned',
    code: '',
    status: 'active',
    userLicenses: 0,
    availableMinutes: 0,
    viciUserGroup: '',
    espoTeam: '',
    createdAt: ''
  });

  // Dedicated URL Portal Detection
  const [portalMode, setPortalMode] = React.useState<'super-admin' | 'admin' | 'agent' | 'gateway'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path === '/super-admin' || path.startsWith('/super-admin/')) return 'super-admin';
      if (path === '/agent' || path.startsWith('/agent/') || search.includes('portal=agent')) return 'agent';
      if (path === '/admin' || path.startsWith('/admin/') || search.includes('portal=admin')) return 'admin';
      if (path === '/' || path === '') return 'gateway';
    }
    return 'super-admin';
  });

  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(true);
  const [currentUser, setCurrentUser] = React.useState<User | null>({
    id: 'u-super-1',
    tenantId: '',
    userId: 'superadmin',
    name: 'Dialko Master Administrator',
    emailId: 'superadmin@dialko.com',
    mobileNumber: '9999999999',
    mobileExtension: '9999',
    status: 'Active',
    role: 'SUPER_ADMIN',
    userGroup: 'SUPER_ADMIN_GROUP',
    currentChannels: 5,
    skills: ['Master Admin', 'Dialko Telephony']
  });

  const [activePage, setActivePage] = React.useState('dashboard');
  const [activeSubPage, setActiveSubPage] = React.useState<string | undefined>();
  const [impersonatedUser, setImpersonatedUser] = React.useState<User | null>(null);
  const [impersonationReason, setImpersonationReason] = React.useState<string>('');
  const [impersonationExpiresAt, setImpersonationExpiresAt] = React.useState<string>('');
  const [originalPortalBeforeImpersonation, setOriginalPortalBeforeImpersonation] = React.useState<'super-admin' | 'admin'>('super-admin');

  const [agentCampaignInfo, setAgentCampaignInfo] = React.useState<{ campaign: string; queues: string[] }>({
    campaign: 'Dialer',
    queues: ['queue_sales_807889336']
  });

  // Global Audio modal (for Random Live Listen)
  const [randomAudioModal, setRandomAudioModal] = React.useState<{
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

  // Check auth and fetch tenants on initial mount
  React.useEffect(() => {
    // 1. Fetch tenants
    fetch('/api/tenants')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTenants(data);
          if (!activeTenant.id) {
            setActiveTenant(data[0]);
          }
        }
      })
      .catch(err => console.error('Failed to load tenants', err));

    // 2. Fetch session
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          setIsAuthenticated(true);
          if (data.activeTenant) setActiveTenant(data.activeTenant);
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      })
      .catch(err => console.error('Auth verification failed', err));
  }, []);

  // Sync URL changes with popstate (browser back/forward or direct bookmark)
  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path === '/super-admin' || path.startsWith('/super-admin/')) {
        setPortalMode('super-admin');
      } else if (path === '/agent' || path.startsWith('/agent/') || search.includes('portal=agent')) {
        setPortalMode('agent');
      } else if (path === '/admin' || path.startsWith('/admin/') || search.includes('portal=admin')) {
        setPortalMode('admin');
      } else if (path === '/' || path === '') {
        setPortalMode('gateway');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSwitchPortal = (targetPortal: 'super-admin' | 'admin' | 'agent' | 'gateway') => {
    setPortalMode(targetPortal);
    if (typeof window !== 'undefined' && window.history) {
      if (targetPortal === 'gateway') {
        window.history.pushState({}, '', '/');
      } else {
        window.history.pushState({}, '', `/${targetPortal}`);
      }
    }
  };

  const handleLoginSuccess = (
    user: User,
    portal: 'super-admin' | 'admin' | 'agent',
    tenant: Tenant,
    campaignInfo?: { campaign: string; queues: string[] }
  ) => {
    setCurrentUser(user);
    setPortalMode(portal);
    setActiveTenant(tenant);
    setIsAuthenticated(true);
    if (campaignInfo) {
      setAgentCampaignInfo(campaignInfo);
    }
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', `/${portal}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error', err);
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setImpersonatedUser(null);
    setImpersonationReason('');
  };

  const handleSelectTenant = (t: Tenant) => {
    setActiveTenant(t);
    setImpersonatedUser(null);
  };

  const handleImpersonate = async (user: User) => {
    try {
      const res = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: user.id || user.userId
        })
      });
      const data = await res.json();
      if (data.success) {
        setImpersonatedUser(data.user);
        setOriginalPortalBeforeImpersonation(portalMode === 'super-admin' ? 'super-admin' : 'admin');
      }
    } catch (err) {
      console.error('Impersonation failed', err);
    }
  };

  const handleStartImpersonationFromSuperAdmin = (agent: User, tenant: Tenant, reason: string) => {
    setImpersonatedUser(agent);
    setActiveTenant(tenant);
    setImpersonationReason(reason);
    setImpersonationExpiresAt(new Date(Date.now() + 15 * 60 * 1000).toISOString());
    setOriginalPortalBeforeImpersonation('super-admin');
    setPortalMode('agent');
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', '/agent');
    }
  };

  const handleRevertImpersonation = async () => {
    try {
      await fetch('/api/internal/exit-impersonate', { method: 'POST' });
    } catch (err) {
      console.error('Revert failed', err);
    }
    setImpersonatedUser(null);
    setImpersonationReason('');
    const target = originalPortalBeforeImpersonation || 'super-admin';
    setPortalMode(target);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', `/${target}`);
    }
  };

  const handleRandomLiveListen = async () => {
    try {
      const res = await fetch(`/api/realtime/random-listen?tenantId=${activeTenant.id}`);
      const data = await res.json();
      setRandomAudioModal({
        isOpen: true,
        title: `Supervisor Live Channel: ${data.customerPhone || '919876543210'}`,
        subtitle: `Agent: ${data.agentName || 'somnathlead_agent01'} • Campaign: ${data.campaign || 'RIYA001'} • Channel: ${data.channelId || 'SIP/8600051'}`,
        audioUrl: data.audioStreamUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
      });
    } catch (err) {
      console.error('Random listen failed', err);
    }
  };

  const handleNavigate = (page: string, subPage?: string) => {
    setActivePage(page);
    setActiveSubPage(subPage);
  };

  // 1. Root Gateway View (Directory of 3 distinct URLs)
  if (portalMode === 'gateway') {
    return <PortalGatewayPage onNavigateToPortal={handleSwitchPortal} />;
  }

  // 2. Unauthenticated: Show dedicated login page for the active URL portal
  if (!isAuthenticated || !currentUser) {
    return (
      <LoginPage
        portal={portalMode}
        tenants={tenants}
        activeTenant={activeTenant}
        onSelectTenant={handleSelectTenant}
        onLoginSuccess={handleLoginSuccess}
        onSwitchPortal={handleSwitchPortal}
      />
    );
  }

  // 3. Super Admin URL (/super-admin)
  if (portalMode === 'super-admin') {
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'Master Admin') {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 bg-rose-950/60 border border-rose-800 text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white">403 Super Admin Access Required</h2>
            <p className="text-xs text-slate-300">
              You are currently logged in as <strong className="text-white">{currentUser.userId}</strong> ({currentUser.role}). The <code className="text-indigo-400 bg-slate-900 px-1.5 py-0.5 rounded">/super-admin</code> URL is strictly reserved for the Master Platform Owner.
            </p>
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => handleSwitchPortal('admin')}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>Go to Tenant Admin Console (/admin)</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
        <SuperAdminDashboardPage
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAdminPanel={() => handleSwitchPortal('admin')}
          onStartImpersonation={handleStartImpersonationFromSuperAdmin}
        />
      </div>
    );
  }

  // 4. Agent Softphone URL (/agent)
  if (portalMode === 'agent') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-900">
        {impersonatedUser && (
          <ImpersonationBanner
            impersonatedUser={impersonatedUser}
            activeTenant={activeTenant}
            reason={impersonationReason}
            expiresAt={impersonationExpiresAt}
            onRevert={handleRevertImpersonation}
          />
        )}
        <div className="flex-1 min-h-0">
          <AgentWorkspacePage
            currentUser={impersonatedUser || currentUser}
            activeTenant={activeTenant}
            onLogout={handleLogout}
            initialCampaign={agentCampaignInfo.campaign}
            initialQueues={agentCampaignInfo.queues}
          />
        </div>
      </div>
    );
  }

  // 5. Tenant Administrator & Supervisor Console (/admin)
  return (
    <div id="dialko-admin-root" className="min-h-screen bg-[#f1f5f9] flex flex-col text-slate-800 font-sans antialiased">
      {/* Impersonation Security Banner */}
      {impersonatedUser && (
        <ImpersonationBanner
          impersonatedUser={impersonatedUser}
          activeTenant={activeTenant}
          reason={impersonationReason}
          expiresAt={impersonationExpiresAt}
          onRevert={handleRevertImpersonation}
        />
      )}

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          userRole={currentUser.role}
        />

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar with Logout, Static Tenant, and Telephony Controls */}
          <TopBar
            activeTenant={activeTenant}
            tenants={tenants}
            onSelectTenant={handleSelectTenant}
            onRandomLiveListen={handleRandomLiveListen}
            impersonatedUser={impersonatedUser}
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />

          {/* Dynamic Page Router (Tabs stay inside /admin without mutating URL) */}
          <main className="flex-1 overflow-x-hidden">
            {activePage === 'super-admin' && (
              currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'Master Admin' ? (
                <SuperAdminDashboardPage
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  onOpenAdminPanel={() => handleSwitchPortal('admin')}
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <div className="text-rose-600 font-black text-lg">403 Access Denied</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    The Master SaaS Controller and Super Admin Console is strictly reserved for the Platform Owner (SUPER_ADMIN role).
                  </p>
                </div>
              )
            )}
            {activePage === 'dashboard' && <DashboardPage activeTenant={activeTenant} />}
            {activePage === 'leads' && <LeadsPage activeTenant={activeTenant} />}
            {activePage === 'campaigns' && <CampaignsPage activeTenant={activeTenant} />}
            {activePage === 'lists' && <ListsPage activeTenant={activeTenant} />}
            {activePage === 'contacts' && <ContactsPage activeTenant={activeTenant} />}
            {activePage === 'tickets' && <TicketsPage activeTenant={activeTenant} />}
            {activePage === 'meetings' && <MeetingsPage activeTenant={activeTenant} />}
            {activePage === 'users-groups' && (
              <UsersGroupsPage
                activeTenant={activeTenant}
                onImpersonate={handleImpersonate}
              />
            )}
            {activePage === 'teams' && <TeamManagementPage activeTenant={activeTenant} />}
            {activePage === 'reports' && (
              <ReportsPage
                activeTenant={activeTenant}
                reportType={activeSubPage || 'call-logs'}
              />
            )}
            {activePage === 'realtime' && (
              <RealTimeMonitoringPage
                activeTenant={activeTenant}
                onRandomLiveListen={handleRandomLiveListen}
              />
            )}
            {activePage === 'configurations' && (
              <ConfigurationsPage
                activeTenant={activeTenant}
                defaultSubTab={activeSubPage || 'inbound-route'}
              />
            )}
            {activePage === 'surveys' && <SurveysPage activeTenant={activeTenant} />}
            {activePage === 'sms-triggers' && <SMSTriggersPage activeTenant={activeTenant} />}
            {activePage === 'call-flow' && <CallFlowBuilderPage activeTenant={activeTenant} />}
            {activePage === 'master-admin' && (
              <MasterAdminPage
                tenants={tenants}
                activeTenant={activeTenant}
                onSelectTenant={handleSelectTenant}
              />
            )}
          </main>
        </div>
      </div>

      {/* Global Random Live Listen Modal */}
      <AudioPlayerModal
        isOpen={randomAudioModal.isOpen}
        onClose={() => setRandomAudioModal({ ...randomAudioModal, isOpen: false })}
        title={randomAudioModal.title}
        subtitle={randomAudioModal.subtitle}
        audioUrl={randomAudioModal.audioUrl}
        isLiveMonitoring={true}
      />
    </div>
  );
}

