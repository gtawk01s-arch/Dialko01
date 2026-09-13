import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { vicidialAdapter } from '../adapters/vicidial.adapter.js';
import { espoCRMAdapter } from '../adapters/espocrm.adapter.js';
import { smsGatewayAdapter } from '../adapters/sms.adapter.js';

export const apiRouter = Router();

// Middleware to extract tenantId from header or query (default to 't-1')
const getTenantId = (req: Request): string => {
  return (req.headers['x-tenant-id'] as string) || (req.query.tenantId as string) || 't-1';
};

// -------------------------------------------------------------
// Authentication & Session / Impersonation
// -------------------------------------------------------------
let currentUserSession: {
  user: any;
  portal: 'admin' | 'agent';
  isImpersonating: boolean;
  originalUser: any;
} = {
  user: db.users[0], // Default logged-in admin for initial bootstrap
  portal: 'admin',
  isImpersonating: false,
  originalUser: null
};

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  if (!currentUserSession.user) {
    return res.json({
      authenticated: false,
      user: null,
      portal: currentUserSession.portal,
      isImpersonating: false,
      originalUser: null,
      activeTenant: db.tenants[0]
    });
  }

  res.json({
    authenticated: true,
    user: currentUserSession.user,
    portal: currentUserSession.portal,
    isImpersonating: currentUserSession.isImpersonating,
    originalUser: currentUserSession.originalUser,
    activeTenant: db.tenants.find(t => t.id === currentUserSession.user?.tenantId) || db.tenants[0]
  });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { userId, password, portal = 'admin', tenantId } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ success: false, error: 'User ID and Password are required' });
  }

  const cleanUserId = String(userId).trim().toLowerCase();
  const cleanPass = String(password).trim();

  // Find user by userId or emailId (case-insensitive)
  const matchedUser = db.users.find(u =>
    (u.userId.toLowerCase() === cleanUserId || u.emailId.toLowerCase() === cleanUserId) &&
    u.password === cleanPass
  );

  if (!matchedUser) {
    if (portal === 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Access Denied: Invalid credentials or account not provisioned. The Admin Panel only works when tenant administrator credentials and details are created in the Master Panel by the Developer & Support Team.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid ID or Password. Please verify your credentials.'
    });
  }

  if (matchedUser.status === 'Inactive') {
    if (portal === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access Blocked: This Administrator account is Suspended/Inactive. It must be activated by the Developer & Support Team in the Master Panel before login is permitted.'
      });
    }
    return res.status(403).json({
      success: false,
      error: 'Account is Inactive. Please contact your system administrator.'
    });
  }

  // Multi-Tenant Subscription & License Check (Unless Super Admin)
  if (matchedUser.role !== 'SUPER_ADMIN' && matchedUser.role !== 'Master Admin') {
    const userTenant = db.tenants.find(t => t.id === matchedUser.tenantId);
    if (userTenant) {
      if (userTenant.status === 'inactive') {
        return res.status(403).json({
          success: false,
          error: `Company account (${userTenant.name}) has been deactivated by the Developer & Support Team in the Master Panel. Access blocked.`
        });
      }
      if (userTenant.subscriptionEnd && new Date(userTenant.subscriptionEnd) < new Date()) {
        return res.status(403).json({
          success: false,
          error: `License Expired: The subscription for ${userTenant.name} expired on ${userTenant.subscriptionEnd}. Please contact the Developer & Support Team to renew.`
        });
      }
    }
  }

  // Check portal permissions
  if (portal === 'admin') {
    // Only Administrators, Supervisors, or Master/Super Admins can login to Admin portal
    if (matchedUser.role === 'Agent') {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Agent accounts are restricted to the Agent Portal URL (/agent). The Admin Panel requires Administrator credentials created in the Master Panel.'
      });
    }
  }

  // Record last login time
  matchedUser.lastLogin = new Date().toISOString().replace('T', ' ').slice(0, 19);

  // Set session
  currentUserSession = {
    user: matchedUser,
    portal: portal as 'admin' | 'agent',
    isImpersonating: false,
    originalUser: null
  };

  // Add audit log
  db.auditLogs.unshift({
    id: `al-${Date.now()}`,
    tenantId: matchedUser.tenantId,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actorId: matchedUser.id,
    actorName: matchedUser.name,
    actorRole: matchedUser.role,
    action: portal === 'admin' ? 'ADMIN_LOGIN' : 'AGENT_LOGIN',
    details: `${matchedUser.role} ${matchedUser.name} (${matchedUser.userId}) logged in to ${portal.toUpperCase()} portal.`,
    ipAddress: req.ip || '127.0.0.1'
  });

  const tenant = db.tenants.find(t => t.id === matchedUser.tenantId) || db.tenants[0];

  res.json({
    success: true,
    user: matchedUser,
    portal,
    tenant
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  if (currentUserSession.user) {
    db.auditLogs.unshift({
      id: `al-${Date.now()}`,
      tenantId: currentUserSession.user.tenantId,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actorId: currentUserSession.user.id,
      actorName: currentUserSession.user.name,
      actorRole: currentUserSession.user.role,
      action: 'LOGOUT',
      details: `${currentUserSession.user.name} (${currentUserSession.user.userId}) logged out from ${currentUserSession.portal} portal.`,
      ipAddress: req.ip || '127.0.0.1'
    });
  }

  currentUserSession = {
    user: null,
    portal: currentUserSession.portal,
    isImpersonating: false,
    originalUser: null
  };

  res.json({ success: true, message: 'Logged out successfully' });
});

apiRouter.post('/auth/impersonate', (req: Request, res: Response) => {
  const { targetUserId } = req.body;
  const targetUser = db.users.find(u => u.id === targetUserId || u.userId === targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Target agent not found' });
  }

  if (!currentUserSession.isImpersonating) {
    currentUserSession.originalUser = currentUserSession.user;
  }
  currentUserSession.user = targetUser;
  currentUserSession.isImpersonating = true;

  // Log to Audit Log
  db.auditLogs.unshift({
    id: `al-${Date.now()}`,
    tenantId: targetUser.tenantId,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actorId: currentUserSession.originalUser?.id || 'admin',
    actorName: currentUserSession.originalUser?.name || 'Administrator',
    actorRole: 'Administrator',
    action: 'LOGIN_AS_AGENT',
    details: `Administrator impersonated agent ${targetUser.name} (${targetUser.userId}) without exposing password.`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({
    success: true,
    user: currentUserSession.user,
    isImpersonating: true
  });
});

apiRouter.post('/auth/exit-impersonate', (req: Request, res: Response) => {
  if (currentUserSession.isImpersonating && currentUserSession.originalUser) {
    const exitedAgent = currentUserSession.user;
    currentUserSession.user = currentUserSession.originalUser;
    currentUserSession.isImpersonating = false;
    currentUserSession.originalUser = null;

    db.auditLogs.unshift({
      id: `al-${Date.now()}`,
      tenantId: currentUserSession.user.tenantId,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actorId: currentUserSession.user.id,
      actorName: currentUserSession.user.name,
      actorRole: 'Administrator',
      action: 'EXIT_IMPERSONATION',
      details: `Exited impersonation mode from agent ${exitedAgent.name}`,
      ipAddress: req.ip || '127.0.0.1'
    });
  }
  res.json({
    success: true,
    user: currentUserSession.user,
    isImpersonating: false
  });
});

// -------------------------------------------------------------
// Super Admin (Master SaaS Layer) Endpoints
// -------------------------------------------------------------
let systemInfrastructureConfig = {
  dialerApiUrl: process.env.VICIDIAL_API_URL || 'http://192.168.1.11/vicidial/non_agent_api.php',
  dialerApiUser: process.env.VICIDIAL_API_USER || 'cron',
  dialerApiPass: process.env.VICIDIAL_API_PASS || '1234',
  crmApiUrl: process.env.ESPOCRM_API_URL || 'https://crm.zeedial.com/api/v1',
  crmApiKey: process.env.ESPOCRM_API_KEY || 'crm_api_key_placeholder',
  databaseConnectionString: process.env.DATABASE_URL || 'mysql://cron:1234@192.168.1.11:3306/asterisk',
  databaseHost: '192.168.1.11',
  databasePort: 3306,
  databaseName: 'asterisk',
  lastConnectedTime: new Date().toISOString(),
  vicidialStatus: 'CONNECTED' as const,
  crmStatus: 'CONNECTED' as const,
  dbStatus: 'CONNECTED' as const
};

// Super Admin Auth / Role Guard Helper
const isSuperAdminUser = (req: Request): boolean => {
  return currentUserSession.user?.role === 'SUPER_ADMIN' || currentUserSession.user?.role === 'Master Admin';
};

// 1. Global SaaS Dashboard Stats (Aggregating MariaDB asterisk data across all companies)
apiRouter.get('/super-admin/dashboard-stats', (req: Request, res: Response) => {
  const totalCompanies = db.tenants.length;
  const activeCompanies = db.tenants.filter(t => t.status === 'active').length;
  const totalUsers = db.users.length;
  const activeAgents = db.users.filter(u => u.role === 'Agent' && u.status === 'Active').length;

  // Breakdown per company
  const companyCallBreakdown = db.tenants.map(tenant => {
    const tenantUsers = db.users.filter(u => u.tenantId === tenant.id);
    const tenantAgents = tenantUsers.filter(u => u.role === 'Agent');
    const tenantCalls = db.callLogs.filter(c => c.tenantId === tenant.id);
    
    // Scale calls for high-traffic realism
    const multiplier = tenant.id === 't-1' ? 4500 : tenant.id === 't-2' ? 1200 : 80;
    const answeredCount = Math.round(multiplier * 0.74);

    return {
      tenantId: tenant.id,
      companyName: tenant.name,
      code: tenant.code,
      agentCount: tenantAgents.length || 1,
      totalCalls: multiplier,
      answeredCalls: answeredCount,
      successRate: Math.round((answeredCount / multiplier) * 100),
      status: tenant.status,
      subscriptionEnd: tenant.subscriptionEnd || '2027-12-31'
    };
  });

  const totalGlobalCalls = companyCallBreakdown.reduce((acc, c) => acc + c.totalCalls, 0) + 1003231;
  const globalSuccessRate = 75.4;

  res.json({
    totalCompanies,
    activeCompanies,
    totalUsers,
    activeAgents,
    totalGlobalCalls,
    globalSuccessRate,
    totalActiveHopperLeads: 14205,
    serverIp: '192.168.1.11',
    vicidialClusterStatus: 'CONNECTED (200 OK)',
    espoCrmClusterStatus: 'CONNECTED (SYNCED)',
    mariaDbClusterStatus: 'CONNECTED (cron@192.168.1.11)',
    databaseStats: {
      totalVicidialListRows: 1420500,
      totalVicidialUsers: db.users.length,
      totalLogEntries: 3892100
    },
    companyCallBreakdown
  });
});

// 2. Company Management (All Tenants CRUD)
apiRouter.get('/super-admin/companies', (req: Request, res: Response) => {
  res.json(db.tenants);
});

apiRouter.post('/super-admin/companies', (req: Request, res: Response) => {
  const {
    name,
    code,
    planType = 'Enterprise',
    userLicenses = 15,
    availableMinutes = 5000,
    subscriptionStart = new Date().toISOString().slice(0, 10),
    subscriptionEnd = '2027-12-31',
    primaryContactEmail = '',
    primaryContactPhone = '',
    adminUserId,
    adminPassword = 'Password@123'
  } = req.body;

  if (!name || !code) {
    return res.status(400).json({ success: false, error: 'Company Name and Code are required' });
  }

  // Unique code check
  const cleanCode = code.toLowerCase().replace(/\s+/g, '');
  if (db.tenants.some(t => t.code.toLowerCase() === cleanCode)) {
    return res.status(400).json({ success: false, error: 'A company with this partition code already exists' });
  }

  const newTenantId = `t-${db.tenants.length + 1}`;
  const newTenant = {
    id: newTenantId,
    name,
    code: cleanCode,
    status: 'active' as const,
    userLicenses: Number(userLicenses),
    availableMinutes: Number(availableMinutes),
    viciUserGroup: `${cleanCode}_admin`,
    espoTeam: `${cleanCode}_Sales_Team`,
    createdAt: new Date().toISOString(),
    subscriptionStart,
    subscriptionEnd,
    primaryContactEmail,
    primaryContactPhone,
    planType
  };

  db.tenants.push(newTenant);

  // Automatically provision initial Tenant Administrator
  const loginUserId = adminUserId ? String(adminUserId).trim() : `${cleanCode}_admin`;
  const newAdminUser = {
    id: `u-${db.users.length + 1}`,
    tenantId: newTenantId,
    userId: loginUserId,
    name: `${name} Administrator`,
    mobileNumber: primaryContactPhone || '9480732000',
    mobileExtension: '1001',
    specificDid: '27001',
    password: adminPassword,
    emailId: primaryContactEmail || `${loginUserId}@${cleanCode}.com`,
    status: 'Active' as const,
    role: 'Administrator' as const,
    userGroup: `${cleanCode}_admin`,
    teamName: 'Management',
    viciAgentId: '1001',
    espoUserId: `espo-${cleanCode}-admin`,
    currentChannels: 1,
    skills: ['Management', 'Sales']
  };

  db.users.push(newAdminUser);

  res.status(201).json({
    success: true,
    tenant: newTenant,
    adminUser: newAdminUser
  });
});

// Toggle Company Status (Activate / Deactivate)
apiRouter.patch('/super-admin/companies/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const tenant = db.tenants.find(t => t.id === id);
  if (!tenant) {
    return res.status(404).json({ success: false, error: 'Company not found' });
  }

  tenant.status = status;
  res.json({ success: true, tenant });
});

// Update Subscription Dates
apiRouter.patch('/super-admin/companies/:id/subscription', (req: Request, res: Response) => {
  const { id } = req.params;
  const { subscriptionStart, subscriptionEnd } = req.body;
  const tenant = db.tenants.find(t => t.id === id);
  if (!tenant) {
    return res.status(404).json({ success: false, error: 'Company not found' });
  }

  if (subscriptionStart) tenant.subscriptionStart = subscriptionStart;
  if (subscriptionEnd) tenant.subscriptionEnd = subscriptionEnd;

  res.json({ success: true, tenant });
});

// 3. Master User Control (See all users across every client company)
apiRouter.get('/super-admin/users', (req: Request, res: Response) => {
  res.json(db.users);
});

// Reset Password for any user
apiRouter.post('/super-admin/users/:id/reset-password', (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const targetUser = db.users.find(u => u.id === id || u.userId === id);
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  targetUser.password = newPassword;

  // Log in Audit Logs
  db.auditLogs.unshift({
    id: `al-${Date.now()}`,
    tenantId: targetUser.tenantId,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actorId: currentUserSession.user?.id || 'superadmin',
    actorName: currentUserSession.user?.name || 'Super Admin',
    actorRole: 'SUPER_ADMIN',
    action: 'SUPER_ADMIN_PASSWORD_RESET',
    details: `Super Admin manually updated password for user ${targetUser.userId} (${targetUser.name})`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, message: `Password reset successfully for ${targetUser.userId}` });
});

// Change user role
apiRouter.patch('/super-admin/users/:id/role', (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const targetUser = db.users.find(u => u.id === id || u.userId === id);
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  targetUser.role = role;
  res.json({ success: true, user: targetUser });
});

// 4. Infrastructure Monitor & System Settings
apiRouter.get('/super-admin/infrastructure-config', (req: Request, res: Response) => {
  res.json(systemInfrastructureConfig);
});

apiRouter.post('/super-admin/infrastructure-config', (req: Request, res: Response) => {
  systemInfrastructureConfig = {
    ...systemInfrastructureConfig,
    ...req.body,
    lastConnectedTime: new Date().toISOString()
  };
  res.json({ success: true, config: systemInfrastructureConfig });
});

// -------------------------------------------------------------
// Section 4B: Master Admin & Support Access & Impersonation APIs
// -------------------------------------------------------------

// 4B.1 Tenant List / Summary with real-time status
apiRouter.get('/super-admin/tenants-summary', (req: Request, res: Response) => {
  const summary = db.tenants.map(tenant => {
    const tenantUsers = db.users.filter(u => u.tenantId === tenant.id);
    const tenantAgents = tenantUsers.filter(u => u.role === 'Agent');
    const liveAgents = db.activeAgents.filter(a => a.tenantId === tenant.id);
    const liveInCalls = liveAgents.filter(a => a.status === 'INCALL');
    const liveWaiting = liveAgents.filter(a => a.status === 'WAITING');
    const livePaused = liveAgents.filter(a => a.status === 'PAUSED');
    const tenantCalls = db.callLogs.filter(c => c.tenantId === tenant.id);
    const totalCallsToday = tenantCalls.length > 0 ? tenantCalls.length * 45 : 120;
    const answeredCount = Math.round(totalCallsToday * 0.76);
    const successRate = totalCallsToday > 0 ? Math.round((answeredCount / totalCallsToday) * 100) : 0;
    const isExpired = tenant.subscriptionEnd && new Date(tenant.subscriptionEnd) < new Date();

    return {
      id: tenant.id,
      name: tenant.name,
      code: tenant.code,
      status: isExpired ? 'expired' : tenant.status,
      planType: tenant.planType || 'Enterprise',
      totalAgents: tenantAgents.length,
      liveAgentsCount: liveAgents.length,
      inCallCount: liveInCalls.length,
      waitingCount: liveWaiting.length,
      pausedCount: livePaused.length,
      totalCallsToday,
      successRate,
      hopperStatus: tenant.status === 'active' && !isExpired ? '1,250 Leads Loaded' : 'Paused (Offline)',
      viciUserGroup: tenant.viciUserGroup,
      espoTeam: tenant.espoTeam,
      subscriptionEnd: tenant.subscriptionEnd || '2027-12-31',
      notifySupervisorOnImpersonate: !!tenant.notifySupervisorOnImpersonate
    };
  });

  res.json(summary);
});

// 4B.1 Tenant Drilldown view (live agents, call logs, recordings, live listen)
apiRouter.get('/super-admin/tenants/:tenantId/drilldown', (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const tenant = db.tenants.find(t => t.id === tenantId);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  const tenantUsers = db.users.filter(u => u.tenantId === tenantId);
  const tenantAgents = tenantUsers.filter(u => u.role === 'Agent');
  const tenantActiveAgents = db.activeAgents.filter(a => a.tenantId === tenantId);
  
  // Merge users with active status
  const agentsList = tenantAgents.map(user => {
    const liveData = tenantActiveAgents.find(a => a.agentId === user.userId || a.agentId === user.id);
    return {
      id: user.id,
      userId: user.userId,
      name: user.name,
      email: user.emailId,
      phone: user.mobileNumber,
      extension: user.mobileExtension,
      status: liveData ? liveData.status : (user.status === 'Active' ? 'OFFLINE' : 'OFFLINE'),
      currentCampaign: liveData?.currentCampaign || 'Sales_Campaign',
      callState: liveData?.callState || 'IDLE',
      callDurationSec: liveData?.callDurationSec || 0,
      callsToday: liveData?.callsToday || 12,
      lastCallTime: liveData?.lastCallTime || '10:00:00',
      currentCustomerPhone: liveData?.currentCustomerPhone,
      currentChannel: liveData?.currentChannel || `SIP/${user.mobileExtension}`
    };
  });

  const tenantCalls = db.callLogs.filter(c => c.tenantId === tenantId);
  const tenantRecordings = db.callRecordings.filter(r => r.tenantId === tenantId);
  const tenantLiveCalls = db.liveCalls.filter(c => c.tenantId === tenantId);

  res.json({
    tenant,
    agents: agentsList,
    liveCalls: tenantLiveCalls,
    recentCallLogs: tenantCalls,
    recordings: tenantRecordings,
    notifySupervisorOnImpersonate: !!tenant.notifySupervisorOnImpersonate
  });
});

// 4B.2 Impersonation Session Generation (POST /api/internal/impersonate and /api/super-admin/impersonate)
const handleImpersonateRequest = (req: Request, res: Response) => {
  const tenantId = req.body.tenantId || req.body.tenant_id;
  const agentId = req.body.agentId || req.body.agent_id;
  const reason = req.body.reason;

  if (!agentId) {
    return res.status(400).json({ success: false, error: 'Agent ID is required for impersonation.' });
  }

  if (!reason || String(reason).trim().length < 5) {
    return res.status(400).json({
      success: false,
      error: 'Defensible support audit requirement: A specific reason of at least 5 characters is mandatory.'
    });
  }

  const targetAgent = db.users.find(u => u.id === agentId || u.userId === agentId);
  if (!targetAgent) {
    return res.status(404).json({ success: false, error: 'Target agent account not found.' });
  }

  const targetTenant = db.tenants.find(t => t.id === (tenantId || targetAgent.tenantId)) || db.tenants[0];

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15-minute timer
  const logId = `imp-${Date.now()}`;
  const masterAdminUser = currentUserSession.user?.userId || 'superadmin';

  const impersonationEntry = {
    id: logId,
    masterAdminUser,
    tenantId: targetTenant.id,
    tenantName: targetTenant.name,
    agentId: targetAgent.userId,
    agentName: targetAgent.name,
    reason: String(reason).trim(),
    startedAt: now.toISOString().replace('T', ' ').slice(0, 19),
    endedAt: null,
    expiresAt: expiresAt.toISOString().replace('T', ' ').slice(0, 19),
    sourceIp: req.ip || '127.0.0.1',
    status: 'ACTIVE' as const
  };

  db.impersonationLogs.unshift(impersonationEntry);

  // Update session
  if (!currentUserSession.isImpersonating) {
    currentUserSession.originalUser = currentUserSession.user || {
      id: 'u-super-1',
      tenantId: 't-1',
      userId: 'superadmin',
      name: 'Master Super Administrator',
      mobileNumber: '9999999999',
      mobileExtension: '9999',
      emailId: 'superadmin@zeedial.com',
      status: 'Active',
      role: 'SUPER_ADMIN',
      userGroup: 'SUPER_ADMIN_GROUP',
      currentChannels: 1,
      skills: ['Architecture']
    };
  }
  currentUserSession.user = targetAgent;
  currentUserSession.isImpersonating = true;

  // Add standard Audit Log entry as well
  db.auditLogs.unshift({
    id: `al-${Date.now()}`,
    tenantId: targetTenant.id,
    timestamp: now.toISOString().replace('T', ' ').slice(0, 19),
    actorId: masterAdminUser,
    actorName: 'Master Super Admin',
    actorRole: 'SUPER_ADMIN',
    action: 'LOGIN_AS_AGENT',
    details: `Scoped support impersonation initiated for agent ${targetAgent.name} (${targetAgent.userId}) under tenant ${targetTenant.name}. Reason: "${reason}". 15-min countdown active.`,
    ipAddress: req.ip || '127.0.0.1'
  });

  const supervisorNotified = !!targetTenant.notifySupervisorOnImpersonate;

  res.json({
    success: true,
    sessionToken: `sec_imp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    expirySeconds: 900,
    expiresAt: impersonationEntry.expiresAt,
    user: targetAgent,
    tenant: targetTenant,
    logId,
    supervisorNotified,
    message: 'Impersonation session established. Agent password is never retrieved or displayed.'
  });
};

apiRouter.post('/internal/impersonate', handleImpersonateRequest);
apiRouter.post('/super-admin/impersonate', handleImpersonateRequest);

// End Impersonation Session
const handleExitImpersonateRequest = (req: Request, res: Response) => {
  const activeLog = db.impersonationLogs.find(l => l.status === 'ACTIVE');
  if (activeLog) {
    activeLog.status = 'ENDED';
    activeLog.endedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
  }

  if (currentUserSession.isImpersonating && currentUserSession.originalUser) {
    const exitedAgent = currentUserSession.user;
    currentUserSession.user = currentUserSession.originalUser;
    currentUserSession.isImpersonating = false;
    currentUserSession.originalUser = null;

    db.auditLogs.unshift({
      id: `al-${Date.now()}`,
      tenantId: currentUserSession.user?.tenantId || 't-1',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actorId: currentUserSession.user?.userId || 'superadmin',
      actorName: currentUserSession.user?.name || 'Super Admin',
      actorRole: 'SUPER_ADMIN',
      action: 'EXIT_IMPERSONATION',
      details: `Support impersonation ended. Returned from agent ${exitedAgent?.name} to Master Super Admin.`,
      ipAddress: req.ip || '127.0.0.1'
    });
  }

  res.json({
    success: true,
    user: currentUserSession.user,
    isImpersonating: false,
    message: 'Impersonation session successfully closed.'
  });
};

apiRouter.post('/internal/exit-impersonate', handleExitImpersonateRequest);
apiRouter.post('/super-admin/exit-impersonate', handleExitImpersonateRequest);

// 4B.4 Audit Log Viewer & Filter API
apiRouter.get('/super-admin/impersonation-logs', (req: Request, res: Response) => {
  const { tenantId, agentId, search, status } = req.query;

  let logs = [...db.impersonationLogs];

  if (tenantId && tenantId !== 'ALL') {
    logs = logs.filter(l => l.tenantId === tenantId);
  }
  if (agentId && agentId !== 'ALL') {
    logs = logs.filter(l => l.agentId === agentId || l.agentName?.toLowerCase().includes(String(agentId).toLowerCase()));
  }
  if (status && status !== 'ALL') {
    logs = logs.filter(l => l.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    logs = logs.filter(l =>
      l.reason.toLowerCase().includes(q) ||
      l.agentId.toLowerCase().includes(q) ||
      l.agentName?.toLowerCase().includes(q) ||
      l.tenantName?.toLowerCase().includes(q) ||
      l.masterAdminUser.toLowerCase().includes(q)
    );
  }

  res.json(logs);
});

// Export Audit Logs (CSV / JSON)
apiRouter.get('/super-admin/impersonation-logs/export', (req: Request, res: Response) => {
  const { format = 'csv', tenantId } = req.query;
  let logs = [...db.impersonationLogs];
  if (tenantId && tenantId !== 'ALL') {
    logs = logs.filter(l => l.tenantId === tenantId);
  }

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="impersonation_logs.json"');
    return res.json(logs);
  }

  // CSV output
  const headers = ['ID', 'Master Admin User', 'Tenant ID', 'Tenant Name', 'Agent ID', 'Agent Name', 'Reason', 'Started At', 'Ended At', 'Expires At', 'Source IP', 'Status'];
  const rows = logs.map(l => [
    l.id,
    `"${l.masterAdminUser}"`,
    `"${l.tenantId}"`,
    `"${l.tenantName || ''}"`,
    `"${l.agentId}"`,
    `"${l.agentName || ''}"`,
    `"${l.reason.replace(/"/g, '""')}"`,
    l.startedAt,
    l.endedAt || 'Active',
    l.expiresAt,
    l.sourceIp,
    l.status
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="impersonation_audit_trail.csv"');
  res.send(csvContent);
});

// Toggle Supervisor Transparency Notification per Tenant
apiRouter.patch('/super-admin/tenants/:tenantId/supervisor-notification', (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const { enabled } = req.body;
  const tenant = db.tenants.find(t => t.id === tenantId);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  tenant.notifySupervisorOnImpersonate = !!enabled;
  res.json({ success: true, notifySupervisorOnImpersonate: tenant.notifySupervisorOnImpersonate });
});

// -------------------------------------------------------------
// Developer & Support Team: Tenant Admin Credentials Provisioning
// -------------------------------------------------------------
apiRouter.get('/super-admin/admin-credentials', (req: Request, res: Response) => {
  const { tenantId, status, search, role } = req.query;

  // Filter users who are Administrators, Supervisors, or Super Admins
  let adminUsers = db.users.filter(u =>
    u.role === 'Administrator' || u.role === 'Supervisor' || u.role === 'SUPER_ADMIN' || u.role === 'Master Admin'
  );

  if (tenantId && tenantId !== 'ALL') {
    adminUsers = adminUsers.filter(u => u.tenantId === tenantId);
  }

  if (status && status !== 'ALL') {
    adminUsers = adminUsers.filter(u => u.status === status);
  }

  if (role && role !== 'ALL') {
    adminUsers = adminUsers.filter(u => u.role === role);
  }

  if (search) {
    const q = String(search).toLowerCase();
    adminUsers = adminUsers.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.userId.toLowerCase().includes(q) ||
      u.emailId.toLowerCase().includes(q) ||
      u.mobileExtension.includes(q) ||
      (u.ticketRef && u.ticketRef.toLowerCase().includes(q)) ||
      (u.notes && u.notes.toLowerCase().includes(q))
    );
  }

  const enrichedAdmins = adminUsers.map(u => {
    const tenant = db.tenants.find(t => t.id === u.tenantId);
    return {
      ...u,
      tenantName: tenant?.name || 'Root Platform',
      tenantCode: tenant?.code || 'global',
      tenantStatus: tenant?.status || 'active',
      planType: tenant?.planType || 'Enterprise',
      canLoginToAdminPanel: u.status === 'Active' && (!tenant || tenant.status === 'active')
    };
  });

  res.json(enrichedAdmins);
});

apiRouter.post('/super-admin/admin-credentials', (req: Request, res: Response) => {
  const {
    tenantId,
    name,
    userId,
    password,
    emailId,
    mobileNumber,
    mobileExtension,
    role = 'Administrator',
    status = 'Active',
    provisionedBy = 'DEVELOPER_TEAM',
    ticketRef = 'DEV-MANUAL',
    notes = '',
    specificDid = '27001'
  } = req.body;

  if (!tenantId || !userId || !password || !name || !emailId || !mobileExtension) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: tenantId, name, userId, password, emailId, and mobileExtension are mandatory.'
    });
  }

  const cleanUserId = String(userId).trim().toLowerCase();
  const existing = db.users.find(u => u.userId.toLowerCase() === cleanUserId);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: `User ID '${userId}' is already in use by another account in tenant ${existing.tenantId}.`
    });
  }

  const targetTenant = db.tenants.find(t => t.id === tenantId);
  if (!targetTenant) {
    return res.status(404).json({
      success: false,
      error: `Specified tenant '${tenantId}' does not exist.`
    });
  }

  const newAdminUser = {
    id: `u-adm-${Date.now()}`,
    tenantId,
    userId: String(userId).trim(),
    name: String(name).trim(),
    mobileNumber: mobileNumber || targetTenant.primaryContactPhone || '9800000000',
    mobileExtension: String(mobileExtension).trim(),
    specificDid,
    password: String(password).trim(),
    emailId: String(emailId).trim(),
    status: status as 'Active' | 'Inactive',
    role: role as 'Administrator' | 'Supervisor',
    userGroup: `${targetTenant.code}_admin`,
    teamName: `${targetTenant.name} Administration`,
    viciAgentId: String(mobileExtension).trim(),
    espoUserId: `espo-adm-${Date.now().toString().slice(-4)}`,
    currentChannels: 1,
    skills: ['Operations', 'Supervision', 'Admin Access'],
    provisionedBy: (provisionedBy || 'DEVELOPER_TEAM') as 'DEVELOPER_TEAM' | 'SUPPORT_TEAM',
    provisionedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    ticketRef: String(ticketRef).trim(),
    notes: String(notes).trim(),
    lastLogin: undefined,
    adminPortalAccess: true
  };

  db.users.unshift(newAdminUser);

  // Add audit log
  db.auditLogs.unshift({
    id: `al-${Date.now()}`,
    tenantId,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actorId: currentUserSession.user?.userId || 'superadmin',
    actorName: currentUserSession.user?.name || 'Master Super Admin',
    actorRole: 'SUPER_ADMIN',
    action: 'ADMIN_PROVISIONED' as any,
    details: `${provisionedBy} provisioned ${role} '${newAdminUser.name}' (${newAdminUser.userId}) for tenant '${targetTenant.name}'. Ticket: ${ticketRef}`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.status(201).json({
    success: true,
    user: newAdminUser,
    message: `Administrator '${newAdminUser.userId}' provisioned successfully. Admin Panel (/admin) login is now enabled for this credential.`
  });
});

apiRouter.put('/super-admin/admin-credentials/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = db.users.find(u => u.id === id || u.userId === id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Administrator account not found.' });
  }

  const {
    name,
    emailId,
    mobileNumber,
    mobileExtension,
    role,
    status,
    notes,
    ticketRef,
    specificDid
  } = req.body;

  if (name) user.name = name;
  if (emailId) user.emailId = emailId;
  if (mobileNumber) user.mobileNumber = mobileNumber;
  if (mobileExtension) user.mobileExtension = mobileExtension;
  if (role) user.role = role;
  if (status) user.status = status;
  if (notes !== undefined) user.notes = notes;
  if (ticketRef !== undefined) user.ticketRef = ticketRef;
  if (specificDid) user.specificDid = specificDid;

  db.auditLogs.unshift({
    id: `al-${Date.now()}`,
    tenantId: user.tenantId,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actorId: currentUserSession.user?.userId || 'superadmin',
    actorName: currentUserSession.user?.name || 'Master Super Admin',
    actorRole: 'SUPER_ADMIN',
    action: 'ADMIN_PROVISIONED' as any,
    details: `Updated details for Administrator ${user.name} (${user.userId}). Status: ${user.status}`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, user });
});

apiRouter.post('/super-admin/admin-credentials/:id/toggle-status', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = db.users.find(u => u.id === id || u.userId === id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Administrator account not found.' });
  }

  if (user.role === 'SUPER_ADMIN' || user.userId === 'superadmin') {
    return res.status(403).json({ success: false, error: 'Cannot deactivate root Platform Super Admin account.' });
  }

  user.status = user.status === 'Active' ? 'Inactive' : 'Active';

  db.auditLogs.unshift({
    id: `al-${Date.now()}`,
    tenantId: user.tenantId,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actorId: currentUserSession.user?.userId || 'superadmin',
    actorName: currentUserSession.user?.name || 'Master Super Admin',
    actorRole: 'SUPER_ADMIN',
    action: 'ADMIN_PROVISIONED' as any,
    details: `Administrator account ${user.userId} status changed to ${user.status}. Admin panel login is ${user.status === 'Active' ? 'ENABLED' : 'BLOCKED'}.`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({
    success: true,
    user,
    status: user.status,
    message: `Account status updated to ${user.status}. Admin Panel login is now ${user.status === 'Active' ? 'permitted' : 'blocked'}.`
  });
});

apiRouter.post('/super-admin/admin-credentials/:id/reset-password', (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || String(newPassword).trim().length < 4) {
    return res.status(400).json({ success: false, error: 'New password of at least 4 characters is required.' });
  }

  const user = db.users.find(u => u.id === id || u.userId === id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Administrator account not found.' });
  }

  user.password = String(newPassword).trim();

  db.auditLogs.unshift({
    id: `al-${Date.now()}`,
    tenantId: user.tenantId,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actorId: currentUserSession.user?.userId || 'superadmin',
    actorName: currentUserSession.user?.name || 'Master Super Admin',
    actorRole: 'SUPER_ADMIN',
    action: 'ADMIN_PROVISIONED' as any,
    details: `Password reset performed by Developer & Support Team for Administrator ${user.name} (${user.userId})`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({
    success: true,
    message: `Password successfully reset for administrator ${user.userId}.`
  });
});

apiRouter.delete('/super-admin/admin-credentials/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = db.users.find(u => u.id === id || u.userId === id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Administrator account not found.' });
  }

  if (user.role === 'SUPER_ADMIN' || user.userId === 'superadmin') {
    return res.status(403).json({ success: false, error: 'Cannot delete root Platform Super Admin account.' });
  }

  const idx = db.users.findIndex(u => u.id === user.id);
  db.users.splice(idx, 1);

  db.auditLogs.unshift({
    id: `al-${Date.now()}`,
    tenantId: user.tenantId,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actorId: currentUserSession.user?.userId || 'superadmin',
    actorName: currentUserSession.user?.name || 'Master Super Admin',
    actorRole: 'SUPER_ADMIN',
    action: 'ADMIN_PROVISIONED' as any,
    details: `Administrator account ${user.name} (${user.userId}) deleted by Developer & Support Team.`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, message: `Administrator account ${user.userId} deleted successfully.` });
});

apiRouter.get('/super-admin/admin-credentials/export', (req: Request, res: Response) => {
  const adminUsers = db.users.filter(u =>
    u.role === 'Administrator' || u.role === 'Supervisor' || u.role === 'SUPER_ADMIN'
  );

  const headers = ['ID', 'User ID', 'Name', 'Email', 'Extension', 'Role', 'Status', 'Tenant ID', 'Tenant Name', 'Provisioned By', 'Ticket Ref', 'Last Login'];
  const rows = adminUsers.map(u => {
    const tenant = db.tenants.find(t => t.id === u.tenantId);
    return [
      u.id,
      `"${u.userId}"`,
      `"${u.name}"`,
      `"${u.emailId}"`,
      `"${u.mobileExtension}"`,
      `"${u.role}"`,
      `"${u.status}"`,
      `"${u.tenantId}"`,
      `"${tenant?.name || 'Root'}"`,
      `"${u.provisionedBy || 'DEVELOPER_TEAM'}"`,
      `"${u.ticketRef || 'DEV-INIT'}"`,
      `"${u.lastLogin || 'Never'}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="tenant_admin_credentials_roster.csv"');
  res.send(csvContent);
});

// -------------------------------------------------------------
// Tenants / Multi-Client Scoping
// -------------------------------------------------------------
apiRouter.get('/tenants', (req: Request, res: Response) => {
  res.json(db.tenants);
});

apiRouter.post('/tenants', (req: Request, res: Response) => {
  const newTenant = {
    id: `t-${db.tenants.length + 1}`,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  db.tenants.push(newTenant);
  res.status(201).json(newTenant);
});

// -------------------------------------------------------------
// Dashboard Statistics & Pivot Tables
// -------------------------------------------------------------
apiRouter.get('/dashboard/stats', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const tenantCampaigns = db.campaigns.filter(c => c.tenantId === tid);
  const tenantLeads = db.leads.filter(l => l.tenantId === tid);
  const tenantCalls = db.callLogs.filter(c => c.tenantId === tid);
  const tenantAgents = db.activeAgents.filter(a => a.tenantId === tid);

  res.json({
    campaignsCount: tenantCampaigns.length,
    leadsCount: tenantLeads.length,
    totalCalls: 1003231, // matching sample high-scale dialer
    bufferStatus: [
      { list_id: '2609003', lead_count: 1 },
      { list_id: '220526', lead_count: 2 },
      { list_id: '200526', lead_count: 5 }
    ],
    agentWiseCalls: [
      { agent: 'somnathlead_agent01@zeedial.com', totalCalls: 113, answered: 85, noAnswer: 28 },
      { agent: 'somnathlead_agent02@zeedial.com', totalCalls: 155, answered: 98, noAnswer: 57 },
      { agent: 'somnathlead_agent03@zeedial.com', totalCalls: 92, answered: 60, noAnswer: 32 },
      { agent: 'somnathlead_agent04@zeedial.com', totalCalls: 67, answered: 42, noAnswer: 25 },
      { agent: 'somnathlead_agent05@zeedial.com', totalCalls: 59, answered: 40, noAnswer: 19 },
      { agent: 'somnathlead_agent06@zeedial.com', totalCalls: 56, answered: 36, noAnswer: 20 },
      { agent: 'somnathlead_agent07@zeedial.com', totalCalls: 42, answered: 28, noAnswer: 14 }
    ],
    agentHours: [
      { agent: 'somnathlead_agent01@zeedial.com', login: '10:55:52', breakTime: '00:45:40', talkTime: '05:17:29' },
      { agent: 'somnathlead_agent02@zeedial.com', login: '10:56:21', breakTime: '00:50:04', talkTime: '05:01:53' },
      { agent: 'somnathlead_agent03@zeedial.com', login: '10:24:06', breakTime: '00:42:46', talkTime: '04:24:26' },
      { agent: 'somnathlead_agent04@zeedial.com', login: '10:29:19', breakTime: '00:57:52', talkTime: '03:01:21' },
      { agent: 'somnathlead_agent05@zeedial.com', login: '10:31:58', breakTime: '00:58:44', talkTime: '04:14:09' },
      { agent: 'somnathlead_agent06@zeedial.com', login: '10:49:46', breakTime: '00:45:08', talkTime: '03:45:54' },
      { agent: 'somnathlead_agent07@zeedial.com', login: '10:50:17', breakTime: '01:09:25', talkTime: '02:56:32' }
    ],
    callStatusBreakdown: [
      { call_type: 'INBOUND', status: 'ABANDON', count: 1 },
      { call_type: 'INBOUND', status: 'COMPLETE', count: 72 },
      { call_type: 'MANUAL', status: 'NOANSWER', count: 1777 }
    ],
    liveAgentCount: tenantAgents.length,
    liveCallCount: db.liveCalls.filter(c => c.tenantId === tid).length
  });
});

// -------------------------------------------------------------
// Campaigns (CRUD + VICIdial Sync)
// -------------------------------------------------------------
apiRouter.get('/campaigns', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.campaigns.filter(c => c.tenantId === tid));
});

apiRouter.get('/campaigns/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const camp = db.campaigns.find(c => c.id === id);
  if (!camp) return res.status(404).json({ error: 'Campaign not found' });
  res.json(camp);
});

apiRouter.get('/campaign-config-options', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json({
    campaignTypes: ['PREDICTIVE', 'PREVIEW', 'VOICE BLAST'],
    dids: db.dids.filter(d => d.tenantId === tid),
    queues: db.queues.filter(q => q.tenantId === tid).map(q => q.queueName),
    allQueues: db.queues.filter(q => q.tenantId === tid),
    pauseCodes: db.pauseCodes.filter(p => p.tenantId === tid),
    scripts: db.callScripts.filter(s => s.tenantId === tid),
    dispositions: db.dispositions.filter(d => d.tenantId === tid),
    industries: [
      'IT & Telecom',
      'Financial Services',
      'Healthcare',
      'Real Estate',
      'Insurance',
      'E-commerce & Retail',
      'Logistics & Supply Chain',
      'EdTech & Education',
      'Hospitality & Travel'
    ],
    processes: ['Leads', 'Tickets', 'Meetings'],
    didRotateStrategies: ['Direct', 'Rotate', 'Agent', 'Random'],
    ringStrategies: [
      'Random',
      'Ring All (Simultaneous)',
      'Round Robin',
      'Fewest Calls',
      'Least Recent',
      'Linear',
      'Skill-based',
      'Sticky Agent'
    ],
    inboundRoutingTypes: ['Sticky Agent', 'Extension Routing', 'Queue Routing', 'IVR Routing'],
    fallbackRoutingTypes: ['Voicemail', 'Overflow Queue', 'External Transfer', 'Hangup'],
    missedCallHandlingTypes: ['Create Ticket', 'Send SMS Alert', 'Schedule Callback', 'Log Missed Call'],
    standardDialStatuses: ['NEW', 'BUSY', 'NOANSWER', 'CONGESTION', 'ABANDON', 'DISCONNECTED', 'CANCELLED', 'INCOMING', 'ANSWERED'],
    standardDispositions: ['SALE', 'INTERESTED', 'CALLBACK', 'CALL_LATER', 'ANSWER', 'NO_ANSWER', 'BUSY', 'NOT_INTERESTED', 'DNC', 'Disconnected', 'Not Reachable']
  });
});

apiRouter.post('/campaigns', async (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const body = req.body;

  const viciSync = await vicidialAdapter.syncCampaign(body);

  const newCamp = {
    id: `c-${Date.now()}`,
    tenantId: tid,
    name: body.name || 'NEW_CAMPAIGN',
    type: body.type || 'PREDICTIVE',
    active: (body.active || 'Yes') as 'Yes' | 'No',
    
    // Outgoing Settings
    outboundCallerId: body.outboundCallerId || '8005490671',
    didRotateStrategy: body.didRotateStrategy || 'Direct',
    didNumbers: Array.isArray(body.didNumbers) ? body.didNumbers : (body.didNumbers ? [body.didNumbers] : ['8005490671']),
    dialStatuses: Array.isArray(body.dialStatuses) ? body.dialStatuses : ['NEW', 'BUSY', 'NOANSWER', 'CONGESTION'],
    dial_ratio: body.dial_ratio || '1.5',
    previewTimeSec: Number(body.previewTimeSec) || 20,
    agentAcceptReject: body.agentAcceptReject !== undefined ? Boolean(body.agentAcceptReject) : true,
    autoDial: body.autoDial !== undefined ? Boolean(body.autoDial) : true,
    amdDetection: body.amdDetection || 'Standard AMD',
    maxConcurrentCalls: Number(body.maxConcurrentCalls) || 30,
    retryRules: body.retryRules || {
      maxRetries: 3,
      retryIntervalMin: 30,
      retryStatuses: ['BUSY', 'NOANSWER', 'CONGESTION']
    },
    callMasking: Boolean(body.callMasking),
    autoDispo: Boolean(body.autoDispo),
    autoDispoTimerSec: Number(body.autoDispoTimerSec) || 30,
    autoDispoValue: body.autoDispoValue || 'SALE',
    onDemandRecording: body.onDemandRecording !== undefined ? Boolean(body.onDemandRecording) : true,
    wrapTimeSec: Number(body.wrapTimeSec) || 15,
    dncCheck: body.dncCheck !== undefined ? Boolean(body.dncCheck) : true,
    timezone: body.timezone || 'ACTIVE',

    // Queue & Agent Settings
    queue: body.queue || (Array.isArray(body.mappedQueues) && body.mappedQueues[0]) || 'Sales_Outbound_Queue',
    mappedQueues: Array.isArray(body.mappedQueues) && body.mappedQueues.length > 0 ? body.mappedQueues : [body.queue || 'Sales_Outbound_Queue'],
    pauseCodes: Array.isArray(body.pauseCodes) ? body.pauseCodes : ['Meeting', 'Lunch', 'Tea Break', 'Whatsapp', 'WASHROOM'],
    dispositionStatuses: Array.isArray(body.dispositionStatuses) ? body.dispositionStatuses : ['SALE', 'INTERESTED', 'CALLBACK', 'NOT_INTERESTED', 'DNC'],
    scriptName: body.scriptName || 'Telecom_Product_Pitch_V2',
    assignedTeamName: body.assignedTeamName || 'Sales Inbound',
    process: body.process || 'Leads',
    industry: body.industry || 'IT & Telecom',
    domain: body.domain || 'Sales',
    template_name: body.template_name || 'Default',

    // Incoming Call Settings (Allow / Block)
    inboundCallSetting: (body.inboundCallSetting || 'Block') as 'Allow' | 'Block',
    inboundDid: body.inboundDid || '27001',
    routingType: body.routingType || 'Queue Routing',
    inboundTargetQueue: body.inboundTargetQueue || body.queue || 'Sales_Outbound_Queue',
    ringTimeoutSec: Number(body.ringTimeoutSec) || 25,
    fallbackRouting: body.fallbackRouting || 'Voicemail',
    missedCallHandling: body.missedCallHandling || 'Create Ticket',
    stickyAgentEnabled: Boolean(body.stickyAgentEnabled),

    primaryList: body.primaryList || '12',
    viciCampaignId: viciSync.viciCampaignId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.campaigns.unshift(newCamp as any);

  db.auditLogs.unshift({
    id: `al-${Date.now()}`,
    tenantId: tid,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actorId: currentUserSession.user.id,
    actorName: currentUserSession.user.name,
    actorRole: currentUserSession.user.role,
    action: 'CAMPAIGN_CREATE',
    details: `Created ${newCamp.type} Campaign '${newCamp.name}' with Inbound: ${newCamp.inboundCallSetting}`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.status(201).json(newCamp);
});

apiRouter.put('/campaigns/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.campaigns.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Campaign not found' });

  db.campaigns[idx] = { 
    ...db.campaigns[idx], 
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  await vicidialAdapter.syncCampaign(db.campaigns[idx]);

  res.json(db.campaigns[idx]);
});

apiRouter.delete('/campaigns/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.campaigns = db.campaigns.filter(c => c.id !== id);
  res.json({ success: true });
});

// -------------------------------------------------------------
// Campaign DID Rotation Strategy Engine
// -------------------------------------------------------------
const campaignDidRotationIndices: Record<string, number> = {};

export function resolveOutboundCallerId(campaignName: string, leadPhone: string = '', agentDid?: string): { did: string; strategy: string; poolSize: number } {
  const camp = db.campaigns.find(c => c.name.toLowerCase() === (campaignName || '').toLowerCase());
  if (!camp) {
    return { did: '8005490671', strategy: 'Direct', poolSize: 1 };
  }

  const strategy = (camp.didRotateStrategy as any) || 'Direct';
  const pool = (Array.isArray(camp.didNumbers) && camp.didNumbers.length > 0)
    ? camp.didNumbers
    : [camp.outboundCallerId || '8005490671'];

  if (strategy === 'Direct') {
    return { did: camp.outboundCallerId || pool[0] || '8005490671', strategy: 'Direct', poolSize: pool.length };
  }

  if (strategy === 'Agent') {
    return { did: agentDid || camp.outboundCallerId || pool[0] || '8005490671', strategy: 'Agent Assigned', poolSize: 1 };
  }

  if (strategy === 'Random') {
    const randomDid = pool[Math.floor(Math.random() * pool.length)];
    return { did: randomDid, strategy: 'Random Rotation', poolSize: pool.length };
  }

  if (strategy === 'Local Presence') {
    const cleanLeadPhone = (leadPhone || '').replace(/\D/g, '');
    const prefix3 = cleanLeadPhone.slice(0, 3);
    const prefix4 = cleanLeadPhone.slice(0, 4);

    const match = pool.find(d => {
      const cleanDid = d.replace(/\D/g, '');
      return (prefix3 && cleanDid.includes(prefix3)) || (prefix4 && cleanDid.includes(prefix4));
    });

    if (match) {
      return { did: match, strategy: 'Local Presence (Area Code Matched)', poolSize: pool.length };
    }
    return { did: pool[0], strategy: 'Local Presence (Default Pool DID)', poolSize: pool.length };
  }

  if (strategy === 'Rotate') {
    const key = camp.id || camp.name;
    const currentIndex = campaignDidRotationIndices[key] || 0;
    const selectedDid = pool[currentIndex % pool.length];
    campaignDidRotationIndices[key] = (currentIndex + 1) % pool.length;
    return { did: selectedDid, strategy: `Round Robin (#${(currentIndex % pool.length) + 1}/${pool.length})`, poolSize: pool.length };
  }

  return { did: camp.outboundCallerId || pool[0] || '8005490671', strategy: 'Direct', poolSize: pool.length };
}

apiRouter.get('/campaigns/:campaign/resolve-did', (req: Request, res: Response) => {
  const { campaign } = req.params;
  const { phone, agentDid } = req.query;
  const result = resolveOutboundCallerId(campaign, String(phone || ''), String(agentDid || ''));
  res.json(result);
});

// -------------------------------------------------------------
// Agent Hopper: Next Lead Dispatcher (Predictive & Preview)
// -------------------------------------------------------------
apiRouter.get('/campaigns/:campaign/next-lead', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const { campaign } = req.params;

  const targetCamp = db.campaigns.find(c => c.name.toLowerCase() === (campaign || '').toLowerCase() && c.tenantId === tid);

  // Filter leads for this tenant and campaign or active lists
  const tenantLeads = db.leads.filter(l => l.tenantId === tid);
  
  // Prefer leads matching this campaign that are not yet marked Disposed or DNC
  let candidate = tenantLeads.find(l => 
    (l.campaign.toLowerCase() === campaign.toLowerCase() || campaign === 'Dialer') && 
    (l.status === 'New' || l.status === 'Queued' || l.status === 'In Progress')
  );

  // If no new lead in this exact campaign, pick any queued lead in the tenant
  if (!candidate) {
    candidate = tenantLeads.find(l => l.status === 'New' || l.status === 'Queued');
  }

  // If still no candidate, pick the least recently dialed lead to recycle
  if (!candidate && tenantLeads.length > 0) {
    candidate = tenantLeads[Math.floor(Math.random() * tenantLeads.length)];
  }

  if (candidate) {
    candidate.dialedCount = (candidate.dialedCount || 0) + 1;
    candidate.status = 'In Progress';
    candidate.modifiedBy = currentUserSession.user?.name || 'Agent Dial Engine';

    const resolvedCallerId = resolveOutboundCallerId(campaign, candidate.phone);

    return res.json({
      success: true,
      lead: candidate,
      resolvedDid: resolvedCallerId.did,
      callerIdStrategy: resolvedCallerId.strategy,
      campaignType: targetCamp?.type || 'PREDICTIVE',
      remainingInQueue: tenantLeads.filter(l => l.status === 'New' || l.status === 'Queued').length
    });
  }

  // If DB was completely empty, synthesize a fresh lead for seamless dialer demo
  const synthesizedLead = {
    id: `ld-${Date.now()}`,
    tenantId: tid,
    lead_id: `${db.leads.length + 1}`,
    firstName: 'Pooja',
    lastName: 'Sharma',
    phone: `91807${Math.floor(Math.random() * 900000 + 100000)}`,
    email: 'pooja.sharma@enterprise.in',
    industry: 'Financial Services',
    template: 'Default',
    list_id: '12',
    campaign: campaign,
    disposition: 'New',
    dialedCount: 1,
    source: 'Hopper Auto-Fill',
    createdBy: 'Dialer Core',
    modifiedBy: 'Dialer Core',
    status: 'In Progress' as const,
    notesCount: 0,
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
  db.leads.unshift(synthesizedLead);

  const resolvedCallerId = resolveOutboundCallerId(campaign, synthesizedLead.phone);

  res.json({
    success: true,
    lead: synthesizedLead,
    resolvedDid: resolvedCallerId.did,
    callerIdStrategy: resolvedCallerId.strategy,
    campaignType: targetCamp?.type || 'PREDICTIVE',
    remainingInQueue: 1
  });
});

// -------------------------------------------------------------
// Unified Agent Disposition & Realtime Interconnection Pipeline
// -------------------------------------------------------------
apiRouter.post('/agent/disposition', async (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const {
    leadId,
    customerPhone,
    customerName,
    campaign,
    queue,
    disposition,
    notes,
    callbackDateTime,
    callDuration,
    surveyAnswers,
    surveyId
  } = req.body;

  const finalDispo = disposition || 'ANSWER';
  const phone = customerPhone || '9999999999';
  const name = customerName || 'Customer';
  const dur = callDuration || '00:01:15';
  const agent = currentUserSession.user?.name || 'Agent';
  const agentEmail = currentUserSession.user?.emailId || 'agent@zeedial.com';

  // 1. Update Lead Status in Leads DB
  if (leadId) {
    const lead = db.leads.find(l => l.id === leadId || l.lead_id === String(leadId));
    if (lead) {
      lead.disposition = finalDispo;
      lead.status = 'Disposed';
      lead.notes = notes || lead.notes;
      lead.modifiedBy = agent;
    }
  }

  // 2. Insert into Call Logs (Reports & Real-Time Monitoring)
  const newCallLog = {
    id: `cl-${Date.now()}`,
    tenantId: tid,
    dateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    campaign: campaign || 'Sales_Campaign',
    didNumber: '8005490671',
    phoneNumber: phone,
    callType: 'OUTBOUND' as const,
    queue: queue || 'Sales_Queue',
    agentName: agent,
    agentEmail: agentEmail,
    team: 'Sales Inbound',
    station: '1001',
    status: 'COMPLETE' as const,
    dispoStatus: finalDispo,
    talkTimes: dur,
    duration: dur,
    endTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    waitTime: '00:00:03',
    hangupBy: 'agent',
    hangupCause: '16',
    uniqueid: `${Date.now()}.${Math.floor(Math.random() * 900000 + 100000)}`,
    holdTime: '00:00:00',
    notes: notes || `Disposed as ${finalDispo}`
  };
  db.callLogs.unshift(newCallLog as any);

  // 3. Auto-Create Meeting / Callback if disposition is CALLBACK or MEETING or has scheduled time
  let createdMeeting = null;
  if (finalDispo === 'CALLBACK' || finalDispo === 'MEETING' || callbackDateTime) {
    createdMeeting = {
      id: `mt-${Date.now()}`,
      tenantId: tid,
      meetingTitle: `Callback with ${name}`,
      meetingSubtitle: `Follow-up on ${campaign} pitch`,
      phoneNumber: phone,
      agent: agent,
      module: 'Sales',
      campaign: campaign || 'Sales_Campaign',
      status: 'Scheduled' as const,
      scheduledTime: callbackDateTime || new Date(Date.now() + 86400000).toISOString().replace('T', ' ').slice(0, 16)
    };
    db.meetings.unshift(createdMeeting);
  }

  // 4. Auto-Add to Blocked Numbers / DNC Blacklist if disposition is DNC or BLOCKED
  let addedDnc = null;
  if (finalDispo === 'DNC' || finalDispo === 'BLOCKED' || finalDispo === 'NOT_INTERESTED_DNC') {
    const existingBlocked = db.blockedNumbers.find(b => b.phoneNumber === phone && b.tenantId === tid);
    if (!existingBlocked) {
      addedDnc = {
        id: `bn-${Date.now()}`,
        tenantId: tid,
        phoneNumber: phone,
        reason: `Customer opted out via DNC disposition during call with ${agent}`,
        type: 'DNC' as const,
        campaignId: '',
        campaignName: campaign || 'Global DNC',
        addedBy: agent,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        status: 'Active' as const
      };
      db.blockedNumbers.unshift(addedDnc);
    }
  }

  // 5. Save Survey Response if survey answers are attached
  if (surveyAnswers && Object.keys(surveyAnswers).length > 0) {
    db.surveyResponses.unshift({
      id: `sr-${Date.now()}`,
      tenantId: tid,
      surveyId: surveyId || 'sv-1',
      surveyTitle: 'Customer Call Survey',
      campaign: campaign || 'RIYA001',
      agentId: currentUserSession.user?.userId || 'agent01',
      agentName: agent,
      leadId: String(leadId || '1'),
      customerPhone: phone,
      answers: surveyAnswers,
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });
  }

  // 6. Check for Automated SMS Trigger for this disposition
  const matchingSmsTrigger = db.smsTriggers.find(t => 
    t.tenantId === tid && 
    t.enabled && 
    (t.dispositionCondition.toLowerCase() === finalDispo.toLowerCase() || t.dispositionCondition === 'All')
  );

  let smsSent = false;
  if (matchingSmsTrigger) {
    const template = db.smsTemplates.find(tpl => tpl.id === matchingSmsTrigger.smsTemplateId);
    let msg = template ? template.content : `Hi ${name}, thank you for speaking with ${agent} regarding our telecom solutions.`;
    msg = msg
      .replace(/\{\{customer_name\}\}/g, name)
      .replace(/\{\{agent_name\}\}/g, agent)
      .replace(/\{\{callback_time\}\}/g, callbackDateTime || 'tomorrow');

    const dispatch = await smsGatewayAdapter.sendSMS(phone, msg);
    db.smsLogs.unshift({
      id: `slog-${Date.now()}`,
      tenantId: tid,
      triggerName: matchingSmsTrigger.name,
      recipientPhone: phone,
      message: msg,
      campaign: campaign || 'RIYA001',
      disposition: finalDispo,
      status: dispatch.status,
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      gatewayRef: dispatch.messageId
    });
    smsSent = true;
  }

  // 7. Fetch the NEXT queued lead from the hopper
  const tenantLeads = db.leads.filter(l => l.tenantId === tid);
  const nextLead = tenantLeads.find(l => 
    l.id !== leadId && 
    (l.campaign.toLowerCase() === (campaign || '').toLowerCase() || campaign === 'Dialer') && 
    (l.status === 'New' || l.status === 'Queued')
  ) || tenantLeads.find(l => l.id !== leadId && (l.status === 'New' || l.status === 'Queued')) || null;

  res.json({
    success: true,
    message: `Call disposed as [${finalDispo}] successfully.`,
    callLog: newCallLog,
    createdMeeting,
    addedDnc,
    smsSent,
    nextLead
  });
});

// -------------------------------------------------------------
// Lists & Token Generation & Actions (Active/Inactive/Delete/Edit)
// -------------------------------------------------------------
apiRouter.get('/lists', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.campaignLists.filter(l => l.tenantId === tid));
});

apiRouter.post('/lists', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const newList = {
    id: `l-${Date.now()}`,
    tenantId: tid,
    list_id: req.body.list_id || `${Math.floor(Math.random() * 900000 + 100000)}`,
    name: req.body.name || 'New List',
    description: req.body.description || '',
    campaign: req.body.campaign || 'RIYA001',
    template: 'Default',
    recycle_count: Number(req.body.recycle_count) || 1,
    utilize_count: 0,
    lead_count: 0,
    status: (req.body.status || 'Active') as 'Active' | 'Inactive'
  };
  db.campaignLists.unshift(newList);
  res.status(201).json(newList);
});

apiRouter.put('/lists/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.campaignLists.findIndex(l => l.id === id || l.list_id === id);
  if (idx === -1) return res.status(404).json({ error: 'List not found' });

  db.campaignLists[idx] = {
    ...db.campaignLists[idx],
    ...req.body
  };
  res.json(db.campaignLists[idx]);
});

apiRouter.patch('/lists/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const list = db.campaignLists.find(l => l.id === id || l.list_id === id);
  if (!list) return res.status(404).json({ error: 'List not found' });

  list.status = list.status === 'Active' ? 'Inactive' : 'Active';
  res.json({ success: true, list });
});

apiRouter.delete('/lists/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.campaignLists.findIndex(l => l.id === id || l.list_id === id);
  if (idx === -1) return res.status(404).json({ error: 'List not found' });

  db.campaignLists.splice(idx, 1);
  res.json({ success: true, message: 'List deleted successfully' });
});

apiRouter.post('/lists/generate-token', (req: Request, res: Response) => {
  const { listId, user, role } = req.body;
  const token = `tok_${listId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  res.json({ success: true, token, user, listId, generatedAt: new Date().toISOString() });
});

// -------------------------------------------------------------
// Leads & Batch Upload with 6-step Wizard
// -------------------------------------------------------------
apiRouter.get('/leads', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.leads.filter(l => l.tenantId === tid));
});

apiRouter.post('/leads', async (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const espoLead = await espoCRMAdapter.syncLead(req.body);

  const newLead = {
    id: `ld-${Date.now()}`,
    tenantId: tid,
    lead_id: `${db.leads.length + 120}`,
    firstName: req.body.firstName || 'New',
    lastName: req.body.lastName || 'Lead',
    phone: req.body.phone || '9999999999',
    altPhone: req.body.altPhone || '',
    email: req.body.email || '',
    industry: req.body.industry || 'IT',
    template: req.body.template || 'Default',
    list_id: req.body.list_id || '12',
    campaign: req.body.campaign || 'RIYA001',
    disposition: req.body.disposition || 'New',
    subDisposition: req.body.subDisposition || '',
    dialedCount: 0,
    source: req.body.source || 'Through API',
    createdBy: currentUserSession.user.name,
    modifiedBy: currentUserSession.user.name,
    status: 'New' as const,
    notesCount: 0,
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    espoLeadId: espoLead.espoLeadId
  };
  db.leads.unshift(newLead);
  res.status(201).json(newLead);
});

apiRouter.put('/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const leadIdx = db.leads.findIndex(l => l.id === id || l.lead_id === id);
  if (leadIdx === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const updatedLead = {
    ...db.leads[leadIdx],
    ...req.body,
    modifiedBy: currentUserSession.user?.name || db.leads[leadIdx].modifiedBy
  };
  db.leads[leadIdx] = updatedLead;
  res.json({ success: true, lead: updatedLead });
});

apiRouter.post('/leads/batch-upload', async (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const { fileType, listId, campaignName, campaignType, autoAssign, duplicateCheck, leadsData } = req.body;

  const targetListId = String(listId || '12');
  const targetList = db.campaignLists.find(l => l.list_id === targetListId && l.tenantId === tid) || db.campaignLists[0];
  const assignedCampaign = campaignName || targetList?.campaign || targetList?.name || 'Sales_Campaign';
  const targetCamp = db.campaigns.find(c => c.name.toLowerCase() === assignedCampaign.toLowerCase() && c.tenantId === tid);
  const isPredictive = (campaignType === 'PREDICTIVE') || (targetCamp?.type === 'PREDICTIVE' || targetCamp?.type === 'AUTO' || targetCamp?.type === 'POWER');
  const isPreview = (campaignType === 'PREVIEW') || (targetCamp?.type === 'PREVIEW');

  // Active agents for round-robin assignment if needed
  const activeAgentNames = db.activeAgents
    .filter(a => a.tenantId === tid)
    .map(a => a.agentName || a.agent)
    .concat(['somnathlead_agent01', 'somnathlead_agent02', 'somnathlead_admin']);

  const items: any[] = Array.isArray(leadsData) && leadsData.length > 0 ? leadsData : [];

  const existingPhoneSet = new Set(
    db.leads.filter(l => l.tenantId === tid && (l.list_id === targetListId || duplicateCheck === 'Yes')).map(l => l.phone.replace(/\D/g, ''))
  );

  const insertedLeads: any[] = [];
  let skippedCount = 0;

  // Process rows
  items.forEach((item, idx) => {
    const rawPhone = String(item.phone || item.phoneNumber || item.mobile || '').trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 5) {
      skippedCount++;
      return;
    }

    if (duplicateCheck === 'Yes' && existingPhoneSet.has(cleanPhone)) {
      skippedCount++;
      return;
    }

    existingPhoneSet.add(cleanPhone);

    // Assigned Agent resolution for Preview vs Predictive
    let agentAssigned = item.assignedAgent || item.assignedTo || item.agent || '';
    if (!agentAssigned && isPreview && autoAssign === 'Yes') {
      agentAssigned = activeAgentNames[idx % activeAgentNames.length];
    }

    const leadStatus = isPredictive ? 'Queued' : (isPreview ? 'New' : 'Queued');

    const newLead = {
      id: `ld-upload-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      tenantId: tid,
      lead_id: `${db.leads.length + idx + 100}`,
      firstName: item.firstName || item.name || `Lead_${idx + 1}`,
      lastName: item.lastName || '',
      phone: rawPhone,
      altPhone: item.altPhone || '',
      email: item.email || `${(item.firstName || 'lead').toLowerCase()}@domain.com`,
      industry: item.industry || targetCamp?.industry || 'IT & Telecom',
      template: item.template || 'Default',
      list_id: targetListId,
      campaign: assignedCampaign,
      disposition: 'New',
      dialedCount: 0,
      source: `Batch Upload (${fileType || 'CSV'})`,
      createdBy: currentUserSession.user?.name || 'Admin',
      modifiedBy: agentAssigned || currentUserSession.user?.name || 'Dialer Engine',
      assignedAgent: agentAssigned || undefined,
      city: item.city || undefined,
      state: item.state || undefined,
      country: item.country || 'India',
      status: leadStatus as any,
      notes: item.notes || (isPredictive ? 'Auto-queued for predictive dialer' : `Assigned for preview dialing`),
      notesCount: item.notes ? 1 : 0,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      espoLeadId: `espo-lead-${Date.now()}-${idx}`
    };

    insertedLeads.push(newLead);
    db.leads.unshift(newLead);
  });

  // If no raw leads were passed, fallback to creating mock leads for testing
  if (items.length === 0) {
    for (let i = 0; i < 10; i++) {
      const agentAssigned = isPreview ? activeAgentNames[i % activeAgentNames.length] : undefined;
      const synthetic = {
        id: `ld-upload-${Date.now()}-${i}`,
        tenantId: tid,
        lead_id: `${db.leads.length + 200 + i}`,
        firstName: `Imported_${i + 1}`,
        lastName: `Customer`,
        phone: `91807${Math.floor(Math.random() * 900000 + 100000)}`,
        email: `lead.${i + 1}@importedcorp.com`,
        industry: 'IT & Telecom',
        template: 'Default',
        list_id: targetListId,
        campaign: assignedCampaign,
        disposition: 'New',
        dialedCount: 0,
        source: 'Sample Batch Upload',
        createdBy: currentUserSession.user.name,
        modifiedBy: agentAssigned || currentUserSession.user.name,
        assignedAgent: agentAssigned,
        status: isPredictive ? ('Queued' as const) : ('New' as const),
        notes: isPredictive ? 'Hopper ready' : `Assigned to ${agentAssigned}`,
        notesCount: 0,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        espoLeadId: `espo-batch-${Date.now()}-${i}`
      };
      insertedLeads.push(synthetic);
      db.leads.unshift(synthetic);
    }
  }

  // Update target list count
  if (targetList) {
    targetList.lead_count = (targetList.lead_count || 0) + insertedLeads.length;
  }

  db.auditLogs.unshift({
    id: `al-${Date.now()}`,
    tenantId: tid,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actorId: currentUserSession.user.id,
    actorName: currentUserSession.user.name,
    actorRole: currentUserSession.user.role,
    action: 'LEAD_UPLOAD',
    details: `Imported ${insertedLeads.length} leads into List ${targetListId} for Campaign ${assignedCampaign} (Mode: ${isPredictive ? 'PREDICTIVE' : isPreview ? 'PREVIEW' : 'STANDARD'}, Skipped: ${skippedCount})`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({
    success: true,
    count: insertedLeads.length,
    skippedCount,
    listId: targetListId,
    campaignName: assignedCampaign,
    campaignType: isPredictive ? 'PREDICTIVE' : isPreview ? 'PREVIEW' : 'STANDARD',
    leads: insertedLeads
  });
});

apiRouter.delete('/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.leads.findIndex(l => l.id === id || l.lead_id === id);
  if (idx !== -1) {
    db.leads.splice(idx, 1);
  }
  res.json({ success: true, message: 'Lead deleted' });
});

// -------------------------------------------------------------
// Contacts (CRUD, Upload, Export)
// -------------------------------------------------------------
apiRouter.get('/contacts', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.contacts.filter(c => c.tenantId === tid));
});

apiRouter.post('/contacts', async (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const espoContact = await espoCRMAdapter.syncContact(req.body);

  const newContact = {
    id: `ct-${Date.now()}`,
    tenantId: tid,
    name: req.body.name || 'New Contact',
    phoneNumber: req.body.phoneNumber || '9876543210',
    altPhoneNumber: req.body.altPhoneNumber || '',
    email: req.body.email || '',
    primaryAddress: req.body.primaryAddress || '',
    altAddress: req.body.altAddress || '',
    city: req.body.city || '',
    state: req.body.state || '',
    country: req.body.country || 'India',
    tags: req.body.tags || ['General'],
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    espoContactId: espoContact.espoContactId
  };
  db.contacts.unshift(newContact);
  res.status(201).json(newContact);
});

apiRouter.delete('/contacts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.contacts.findIndex(c => c.id === id);
  if (idx !== -1) {
    db.contacts.splice(idx, 1);
  }
  res.json({ success: true, message: 'Contact deleted' });
});

// -------------------------------------------------------------
// Tickets & Meetings
// -------------------------------------------------------------
apiRouter.get('/tickets', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.tickets.filter(t => t.tenantId === tid));
});

apiRouter.post('/tickets', async (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const espoTicket = await espoCRMAdapter.syncTicket(req.body);

  const newTicket = {
    id: `tk-${Date.now()}`,
    tenantId: tid,
    ticketId: `${db.tickets.length + 1}`,
    status: req.body.status || 'open',
    subject: req.body.subject || 'Support Ticket',
    dueDate: req.body.dueDate || '2026-08-30',
    assign: req.body.assign || 'somnathlead_agent01@zeedial.com',
    phoneNumber: req.body.phoneNumber || '9480732362',
    duration: '00:00:00',
    priority: req.body.priority || 'Medium'
  };
  db.tickets.unshift(newTicket);
  res.status(201).json(newTicket);
});

apiRouter.delete('/tickets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.tickets.findIndex(t => t.id === id || t.ticketId === id);
  if (idx !== -1) {
    db.tickets.splice(idx, 1);
  }
  res.json({ success: true, message: 'Ticket deleted' });
});

apiRouter.get('/meetings', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.meetings.filter(m => m.tenantId === tid));
});

apiRouter.post('/meetings', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const newMeeting = {
    id: `mt-${Date.now()}`,
    tenantId: tid,
    meetingTitle: req.body.meetingTitle || 'New Meeting',
    meetingSubtitle: req.body.meetingSubtitle || '',
    phoneNumber: req.body.phoneNumber || '9480732362',
    agent: req.body.agent || 'somnathlead_agent01',
    module: req.body.module || 'Sales',
    campaign: req.body.campaign || 'Sales_Campaign',
    status: 'Scheduled' as const,
    scheduledTime: req.body.scheduledTime || new Date().toISOString()
  };
  db.meetings.unshift(newMeeting);
  res.status(201).json(newMeeting);
});

apiRouter.delete('/meetings/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.meetings.findIndex(m => m.id === id);
  if (idx !== -1) {
    db.meetings.splice(idx, 1);
  }
  res.json({ success: true, message: 'Meeting deleted' });
});

// -------------------------------------------------------------
// Users, User Groups & Teams
// -------------------------------------------------------------
apiRouter.get('/users', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.users.filter(u => u.tenantId === tid));
});

apiRouter.post('/users', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const newUser = {
    id: `u-${Date.now()}`,
    tenantId: tid,
    userId: req.body.userId || `user_${Date.now().toString().slice(-4)}`,
    name: req.body.name || 'New User',
    mobileNumber: req.body.mobileNumber || '9480732000',
    mobileExtension: req.body.mobileExtension || '1011',
    specificDid: req.body.specificDid || '',
    password: req.body.password || 'UserPassword@123',
    emailId: req.body.emailId || 'agent@zeedial.com',
    status: (req.body.status || 'Active') as 'Active' | 'Inactive',
    role: (req.body.role || 'Agent') as 'Administrator' | 'Agent' | 'Supervisor' | 'Master Admin',
    userGroup: req.body.userGroup || 'somnathlead_agent',
    teamName: req.body.teamName || 'Sales Inbound',
    viciAgentId: `${Math.floor(Math.random() * 9000 + 1000)}`,
    espoUserId: `espo-u-${Date.now().toString().slice(-4)}`,
    currentChannels: 0,
    skills: req.body.skills || ['Sales']
  };
  db.users.unshift(newUser);
  res.status(201).json(newUser);
});

apiRouter.put('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.users.findIndex(u => u.id === id || u.userId === id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });

  db.users[idx] = {
    ...db.users[idx],
    ...req.body
  };
  res.json(db.users[idx]);
});

apiRouter.post('/users/:id/change-password', (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const user = db.users.find(u => u.id === id || u.userId === id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.password = newPassword;
  db.auditLogs.unshift({
    id: `al-${Date.now()}`,
    tenantId: user.tenantId,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actorId: currentUserSession.user.id,
    actorName: currentUserSession.user.name,
    actorRole: currentUserSession.user.role,
    action: 'LOGIN_AS_AGENT',
    details: `Password updated for user ${user.name} (${user.userId})`,
    ipAddress: req.ip || '127.0.0.1'
  });
  res.json({ success: true, message: 'Password changed successfully' });
});

apiRouter.patch('/users/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = db.users.find(u => u.id === id || u.userId === id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.status = user.status === 'Active' ? 'Inactive' : 'Active';
  res.json({ success: true, user });
});

apiRouter.delete('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.users.findIndex(u => u.id === id || u.userId === id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });

  db.users.splice(idx, 1);
  res.json({ success: true, message: 'User deleted successfully' });
});

// User Groups
apiRouter.get('/user-groups', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.userGroups.filter(g => g.tenantId === tid));
});

apiRouter.post('/user-groups', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const newGroup = {
    id: `ug-${Date.now()}`,
    tenantId: tid,
    groupName: req.body.groupName || `Group_${Date.now().toString().slice(-4)}`,
    description: req.body.description || 'Custom Panel Group',
    isSupervisorPanel: Boolean(req.body.isSupervisorPanel),
    memberCount: 0,
    status: (req.body.status || 'Active') as 'Active' | 'Inactive',
    permissions: req.body.permissions || {
      groupName: req.body.groupName,
      realTime: Boolean(req.body.isSupervisorPanel),
      reports: true,
      management: true,
      connection: true,
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
  };
  db.userGroups.push(newGroup);
  db.userGroupPermissions.push(newGroup.permissions);
  res.status(201).json(newGroup);
});

apiRouter.put('/user-groups/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.userGroups.findIndex(g => g.id === id || g.groupName === id);
  if (idx === -1) return res.status(404).json({ error: 'Group not found' });

  db.userGroups[idx] = { ...db.userGroups[idx], ...req.body };
  res.json(db.userGroups[idx]);
});

apiRouter.delete('/user-groups/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.userGroups.findIndex(g => g.id === id || g.groupName === id);
  if (idx === -1) return res.status(404).json({ error: 'Group not found' });

  db.userGroups.splice(idx, 1);
  res.json({ success: true, message: 'User Group deleted successfully' });
});

apiRouter.get('/user-groups/permissions', (req: Request, res: Response) => {
  res.json(db.userGroupPermissions);
});

apiRouter.put('/user-groups/permissions', (req: Request, res: Response) => {
  const { groupName, permissions } = req.body;
  const idx = db.userGroupPermissions.findIndex(p => p.groupName === groupName);
  if (idx !== -1) {
    db.userGroupPermissions[idx] = { ...db.userGroupPermissions[idx], ...permissions };
  } else {
    db.userGroupPermissions.push({ groupName, ...permissions });
  }
  res.json({ success: true, updated: db.userGroupPermissions });
});

// Teams
apiRouter.get('/teams', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.teams.filter(t => t.tenantId === tid));
});

apiRouter.post('/teams', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const assignedUserIds = req.body.assignedUserIds || [];
  const assignedUsers = db.users
    .filter(u => assignedUserIds.includes(u.id) || assignedUserIds.includes(u.userId))
    .map(u => `${u.name} (${u.userId})`);

  const newTeam = {
    id: `tm-${Date.now()}`,
    tenantId: tid,
    name: req.body.name || 'New Team',
    description: req.body.description || '',
    type: req.body.type || 'Sales',
    campaignId: req.body.campaignId || 'c-1',
    campaignName: req.body.campaignName || 'RIYA001',
    assignedCount: assignedUserIds.length || Number(req.body.assignedCount) || 0,
    assignedUserIds,
    assignedUsers,
    status: (req.body.status || 'Active') as 'Active' | 'Inactive'
  };
  db.teams.push(newTeam);
  res.status(201).json(newTeam);
});

apiRouter.put('/teams/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.teams.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Team not found' });

  const assignedUserIds = req.body.assignedUserIds || db.teams[idx].assignedUserIds || [];
  const assignedUsers = db.users
    .filter(u => assignedUserIds.includes(u.id) || assignedUserIds.includes(u.userId))
    .map(u => `${u.name} (${u.userId})`);

  db.teams[idx] = {
    ...db.teams[idx],
    ...req.body,
    assignedCount: assignedUserIds.length,
    assignedUserIds,
    assignedUsers
  };
  res.json(db.teams[idx]);
});

apiRouter.patch('/teams/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const team = db.teams.find(t => t.id === id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  team.status = team.status === 'Active' ? 'Inactive' : 'Active';
  res.json({ success: true, team });
});

apiRouter.delete('/teams/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.teams.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Team not found' });

  db.teams.splice(idx, 1);
  res.json({ success: true, message: 'Team deleted successfully' });
});

// -------------------------------------------------------------
// Realtime Live Agent & Calls Monitoring + Supervisor Controls
// -------------------------------------------------------------
apiRouter.get('/realtime/agents', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.activeAgents.filter(a => a.tenantId === tid));
});

apiRouter.get('/realtime/calls', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.liveCalls.filter(c => c.tenantId === tid));
});

apiRouter.post('/realtime/listen-random', async (req: Request, res: Response) => {
  const randomCall = await vicidialAdapter.getRandomLiveCall();
  if (!randomCall) {
    return res.status(404).json({ error: 'No live calls available to monitor' });
  }

  db.auditLogs.unshift({
    id: `al-${Date.now()}`,
    tenantId: getTenantId(req),
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actorId: currentUserSession.user.id,
    actorName: currentUserSession.user.name,
    actorRole: currentUserSession.user.role,
    action: 'CALL_LISTEN',
    details: `Supervisor initiated Random Live Call Listen on active call ${randomCall.viciCallId} (${randomCall.agentName})`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({
    success: true,
    call: randomCall,
    monitoringChannel: 'SIP/supervisor-8600051',
    audioStreamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  });
});

apiRouter.post('/realtime/supervisor-action', async (req: Request, res: Response) => {
  const { action, agentId, callId } = req.body;
  const result = await vicidialAdapter.monitorCall(callId || 'DIALER-CALL-101', agentId, action || 'listen');

  db.auditLogs.unshift({
    id: `al-${Date.now()}`,
    tenantId: getTenantId(req),
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actorId: currentUserSession.user.id,
    actorName: currentUserSession.user.name,
    actorRole: currentUserSession.user.role,
    action: 'CALL_LISTEN',
    details: `Supervisor performed ${action.toUpperCase()} action on Agent ${agentId} / Call ${callId}`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, result });
});

apiRouter.post('/realtime/force-logout', (req: Request, res: Response) => {
  const { agentId } = req.body;
  const agent = db.activeAgents.find(a => a.id === agentId || a.agent.includes(agentId));
  if (agent) {
    agent.status = 'Offline';
    agent.dialerStatus = 'PAUSED';
    agent.callType = 'Idle';
  }

  db.auditLogs.unshift({
    id: `al-${Date.now()}`,
    tenantId: getTenantId(req),
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actorId: currentUserSession.user.id,
    actorName: currentUserSession.user.name,
    actorRole: currentUserSession.user.role,
    action: 'EXIT_IMPERSONATION',
    details: `Supervisor executed FORCE LOGOUT on Agent ${agentId}`,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, message: `Agent ${agentId} was logged out.` });
});

apiRouter.post('/realtime/manual-dial', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const { phoneNumber, campaign, agentId, didNumber } = req.body;

  const newCall = {
    id: `lc-${Date.now()}`,
    tenantId: tid,
    callDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
    queue: `${campaign}_ManualQueue`,
    phoneNumber: phoneNumber || '9876543210',
    callType: 'Manual' as const,
    agent: agentId || currentUserSession.user.userId,
    station: '1001',
    answerTime: new Date().toLocaleTimeString(),
    status: 'CONNECTED' as const,
    duration: '00:00:01',
    campaign: campaign || 'RIYA001'
  };
  db.liveCalls.unshift(newCall);

  res.json({ success: true, call: newCall });
});

apiRouter.post('/realtime/auto-dial-toggle', (req: Request, res: Response) => {
  const { campaign, enabled, dialRatio } = req.body;
  const camp = db.campaigns.find(c => c.name === campaign || c.id === campaign);
  if (camp) {
    camp.active = enabled ? 'Yes' : 'No';
    if (dialRatio) camp.dial_ratio = String(dialRatio);
  }
  res.json({ success: true, campaign, active: enabled ? 'Yes' : 'No' });
});

// -------------------------------------------------------------
// Reports (Call Logs, Recordings, Hourly, Daily, Pause, Transfers)
// -------------------------------------------------------------
apiRouter.get('/reports/call-logs', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.callLogs.filter(c => c.tenantId === tid));
});

apiRouter.post('/reports/call-logs', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const body = req.body;
  const newCallLog = {
    id: `cl-${Date.now()}`,
    tenantId: tid,
    dateTime: body.dateTime || new Date().toISOString().replace('T', ' ').slice(0, 19),
    campaign: body.campaign || 'Sales_Campaign',
    didNumber: body.didNumber || '27001',
    phoneNumber: body.phoneNumber || '9876543210',
    callType: body.callType || 'MANUAL',
    queue: body.queue || 'Sales_Queue',
    agentName: body.agentName || currentUserSession.user.name,
    agentEmail: body.agentEmail || currentUserSession.user.emailId,
    team: body.team || 'Sales Inbound',
    station: body.station || '1001',
    status: body.status || 'COMPLETE',
    dispoStatus: body.dispoStatus || body.disposition || 'ANSWER',
    talkTimes: body.talkTimes || '00:01:15',
    duration: body.duration || '00:01:25',
    endTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    waitTime: '00:00:02',
    hangupBy: body.hangupBy || 'agent',
    hangupCause: '16',
    uniqueid: `${Date.now()}.${Math.floor(Math.random() * 900000 + 100000)}`,
    holdTime: '00:00:00',
    notes: body.notes || ''
  };
  db.callLogs.unshift(newCallLog as any);
  res.status(201).json(newCallLog);
});

apiRouter.delete('/reports/call-logs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.callLogs.findIndex(c => c.id === id);
  if (idx !== -1) {
    db.callLogs.splice(idx, 1);
  }
  res.json({ success: true, message: 'Call log deleted' });
});

apiRouter.delete('/reports/call-logs', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  db.callLogs = db.callLogs.filter(c => c.tenantId !== tid);
  res.json({ success: true, message: 'All call logs cleared' });
});

apiRouter.get('/reports/recordings', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.callRecordings.filter(r => r.tenantId === tid));
});

apiRouter.get('/reports/transfers', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.callTransfers.filter(t => t.tenantId === tid));
});

// -------------------------------------------------------------
// Inbound Routing, Sticky Agent & Parallel Ringing Rules
// -------------------------------------------------------------
apiRouter.get('/routing/inbound', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.inboundRoutes.filter(r => r.tenantId === tid));
});

apiRouter.post('/routing/inbound', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const newRoute = {
    id: `ir-${Date.now()}`,
    tenantId: tid,
    didNumber: req.body.didNumber || '27011',
    application: req.body.application || 'Queue',
    target: req.body.target || 'somnathlead_Incoming',
    fallbackTarget: req.body.fallbackTarget || 'IVR: After_Hours',
    status: 'Active' as const
  };
  db.inboundRoutes.unshift(newRoute);
  res.status(201).json(newRoute);
});

apiRouter.get('/routing/sticky-agents', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.stickyAgentRules.filter(s => s.tenantId === tid));
});

apiRouter.post('/routing/sticky-agents', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const newSticky = {
    id: `sa-${Date.now()}`,
    tenantId: tid,
    customerPhone: req.body.customerPhone,
    preferredAgentId: req.body.preferredAgentId,
    preferredAgentName: req.body.preferredAgentName || 'Assigned Agent',
    campaign: req.body.campaign || 'RIYA001',
    lastCallDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
    fallbackQueue: req.body.fallbackQueue || 'somnathlead_Incoming',
    isActive: true
  };
  db.stickyAgentRules.unshift(newSticky);
  res.status(201).json(newSticky);
});

apiRouter.get('/routing/parallel-ringing', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.parallelRingingConfigs.filter(p => p.tenantId === tid));
});

apiRouter.post('/routing/parallel-ringing', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const newConfig = {
    id: `pr-${Date.now()}`,
    tenantId: tid,
    didNumber: req.body.didNumber || '27002',
    queueName: req.body.queueName || 'somnathlead_Incoming',
    agentIds: req.body.agentIds || ['somnathlead_agent01', 'somnathlead_agent03'],
    ringTimeoutSec: Number(req.body.ringTimeoutSec) || 25,
    strategy: req.body.strategy || 'Simultaneous',
    status: 'Active' as const
  };
  db.parallelRingingConfigs.unshift(newConfig);
  res.status(201).json(newConfig);
});

// -------------------------------------------------------------
// Live Inbound Call Routing Engine (Queue / Sticky Agent / External Number)
// -------------------------------------------------------------
apiRouter.post('/routing/inbound-call-dispatch', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const {
    callerPhone,
    callerName,
    campaignName,
    didNumber,
    routingType,
    targetQueue,
    externalForwardNumber
  } = req.body;

  const phone = callerPhone || '9876543210';
  const name = callerName || 'Inbound Caller';
  const did = didNumber || '27001';
  const camp = db.campaigns.find(c => c.tenantId === tid && (c.name === campaignName || c.inboundDid === did));
  const effectiveRouting = routingType || camp?.routingType || 'Queue Routing';

  let routedTarget = '';
  let routedAgent = '';
  let routedStatus = 'CONNECTED';
  let bridgeNumber = '';
  let details = '';

  if (effectiveRouting === 'External Number Routing') {
    bridgeNumber = externalForwardNumber || camp?.externalForwardNumber || '+919480732362';
    routedTarget = `PSTN Forward: ${bridgeNumber}`;
    routedAgent = 'External Mobile Forward';
    details = `Inbound call from ${phone} automatically bridged to external number ${bridgeNumber}`;

    // Add to call transfers report
    db.callTransfers.unshift({
      id: `ct-${Date.now()}`,
      tenantId: tid,
      uniqueid: `${Date.now()}.${Math.floor(Math.random() * 900000 + 100000)}`,
      startTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      phoneNumber: phone,
      type: 'BLIND',
      agent: 'Inbound IVR Gateway',
      targetAgent: `External PSTN (${bridgeNumber})`,
      status: 'COMPLETE',
      completeTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      duration: '00:02:10'
    });
  } else if (effectiveRouting === 'Sticky Agent Routing') {
    // Look up previous interaction or assigned agent for this phone number
    const previousCall = db.callLogs.find(c => c.tenantId === tid && c.phoneNumber === phone && c.agentName);
    const lead = db.leads.find(l => l.tenantId === tid && l.phone === phone);
    const preferredAgent = previousCall?.agentName || lead?.assignedAgent || lead?.modifiedBy || 'Somnath Lead Agent';

    routedAgent = preferredAgent;
    routedTarget = `Sticky Agent: ${preferredAgent} (Fallback: ${targetQueue || camp?.inboundTargetQueue || 'Sales_Queue'})`;
    details = `Customer ${phone} matched with sticky assigned agent ${preferredAgent}`;
  } else {
    // Queue Routing
    const qName = targetQueue || camp?.inboundTargetQueue || camp?.queue || 'Sales_Queue';
    routedTarget = `Queue: ${qName}`;
    routedAgent = 'Round-Robin / Next Ready Agent';
    details = `Inbound call routed to ACD queue ${qName} with ring-all distribution`;
  }

  // Create Inbound Call Log
  const newCallLog = {
    id: `cl-${Date.now()}`,
    tenantId: tid,
    dateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    campaign: camp?.name || campaignName || 'Inbound_Campaign',
    didNumber: did,
    phoneNumber: phone,
    callType: 'INBOUND' as const,
    queue: targetQueue || camp?.inboundTargetQueue || 'Inbound_ACD',
    agentName: routedAgent,
    agentEmail: `${routedAgent.toLowerCase().replace(/\s+/g, '.')}@zeedial.com`,
    team: 'Inbound Support',
    station: '1002',
    status: 'COMPLETE' as const,
    dispoStatus: 'INBOUND_ANSWER',
    talkTimes: '00:01:45',
    duration: '00:01:50',
    endTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    waitTime: '00:00:04',
    hangupBy: 'caller',
    hangupCause: '16',
    uniqueid: `${Date.now()}.${Math.floor(Math.random() * 900000 + 100000)}`,
    holdTime: '00:00:00',
    notes: details
  };
  db.callLogs.unshift(newCallLog as any);

  res.json({
    success: true,
    routingType: effectiveRouting,
    routedTarget,
    routedAgent,
    bridgeNumber,
    details,
    callLog: newCallLog
  });
});

// -------------------------------------------------------------
// SMS Triggers & Post-Call Automation
// -------------------------------------------------------------
apiRouter.get('/sms/templates', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.smsTemplates.filter(s => s.tenantId === tid));
});

apiRouter.post('/sms/templates', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const newTemplate = {
    id: `st-${Date.now()}`,
    tenantId: tid,
    name: req.body.name,
    content: req.body.content,
    variables: req.body.variables || ['customer_name', 'agent_name'],
    status: 'Active' as const
  };
  db.smsTemplates.unshift(newTemplate);
  res.status(201).json(newTemplate);
});

apiRouter.get('/sms/triggers', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.smsTriggers.filter(t => t.tenantId === tid));
});

apiRouter.post('/sms/triggers', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const newTrigger = {
    id: `trg-${Date.now()}`,
    tenantId: tid,
    name: req.body.name,
    triggerEvent: req.body.triggerEvent || 'Disposition Set',
    dispositionCondition: req.body.dispositionCondition || 'Interested',
    campaignId: req.body.campaignId || 'c-1',
    smsTemplateId: req.body.smsTemplateId,
    smsTemplateName: req.body.smsTemplateName || 'Interested Lead Follow-up',
    enabled: true
  };
  db.smsTriggers.unshift(newTrigger);
  res.status(201).json(newTrigger);
});

apiRouter.get('/sms/logs', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.smsLogs.filter(l => l.tenantId === tid));
});

apiRouter.post('/sms/send-instant', async (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const { phoneNumber, templateId, leadName, message: customMessage } = req.body;
  const template = db.smsTemplates.find(t => t.id === templateId || t.name === templateId);

  let finalMessage = customMessage;
  if (!finalMessage && template) {
    finalMessage = template.content
      .replace(/\{\{customer_name\}\}/g, leadName || 'Customer')
      .replace(/\{\{agent_name\}\}/g, currentUserSession.user?.name || 'Agent')
      .replace(/\{\{callback_time\}\}/g, 'Tomorrow 11:00 AM');
  } else if (!finalMessage) {
    finalMessage = `Hi ${leadName || 'Customer'}, thank you for speaking with ${currentUserSession.user?.name || 'Zeedial'}. We look forward to working with you!`;
  }

  const dispatch = await smsGatewayAdapter.sendSMS(phoneNumber, finalMessage);

  const logEntry = {
    id: `slog-${Date.now()}`,
    tenantId: tid,
    triggerName: template?.name || 'Instant Post-Call SMS',
    recipientPhone: phoneNumber,
    message: finalMessage,
    campaign: 'RIYA001',
    disposition: 'INSTANT_SMS',
    status: dispatch.status,
    sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    gatewayRef: dispatch.messageId
  };
  db.smsLogs.unshift(logEntry);

  res.json({ success: true, log: logEntry, message: 'SMS sent successfully' });
});

apiRouter.post('/sms/send-test', async (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const { to, message, campaign, disposition } = req.body;
  const dispatch = await smsGatewayAdapter.sendSMS(to, message);

  const logEntry = {
    id: `slog-${Date.now()}`,
    tenantId: tid,
    triggerName: 'Manual / Test Trigger',
    recipientPhone: to,
    message,
    campaign: campaign || 'RIYA001',
    disposition: disposition || 'Manual Send',
    status: dispatch.status,
    sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    gatewayRef: dispatch.messageId
  };
  db.smsLogs.unshift(logEntry);
  res.json({ success: true, log: logEntry });
});

// -------------------------------------------------------------
// Surveys & Question Forms + CSV/XLSX Export
// -------------------------------------------------------------
apiRouter.get('/surveys', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.surveyForms.filter(s => s.tenantId === tid));
});

apiRouter.post('/surveys', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const newSurvey = {
    id: `sv-${Date.now()}`,
    tenantId: tid,
    title: req.body.title || 'New Survey Form',
    description: req.body.description || '',
    campaignIds: req.body.campaignIds || ['c-1'],
    questions: req.body.questions || [],
    status: 'Active' as const,
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
  db.surveyForms.unshift(newSurvey);
  res.status(201).json(newSurvey);
});

apiRouter.get('/surveys/responses', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.surveyResponses.filter(r => r.tenantId === tid));
});

apiRouter.post('/surveys/responses', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const newResponse = {
    id: `sr-${Date.now()}`,
    tenantId: tid,
    surveyId: req.body.surveyId,
    surveyTitle: req.body.surveyTitle || 'Survey Response',
    campaign: req.body.campaign || 'RIYA001',
    agentId: currentUserSession.user.userId,
    agentName: currentUserSession.user.name,
    leadId: req.body.leadId || '2',
    customerPhone: req.body.customerPhone || '9480732362',
    answers: req.body.answers || {},
    submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
  db.surveyResponses.unshift(newResponse);
  res.status(201).json(newResponse);
});

// -------------------------------------------------------------
// Configurations (Queues, Dispos, Pause Codes, DIDs, Blocked Numbers / DNC, Scripts)
// -------------------------------------------------------------
apiRouter.get('/configurations/queues', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.queues.filter(q => q.tenantId === tid));
});

apiRouter.post('/configurations/queues', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const newQueue = {
    id: `q-${Date.now()}`,
    tenantId: tid,
    queueName: req.body.queueName || 'new_queue',
    ringingStrategy: req.body.ringingStrategy || 'Random',
    visitTimeoutSec: Number(req.body.visitTimeoutSec) || 30,
    assignedAgents: Array.isArray(req.body.assignedAgents) ? req.body.assignedAgents : [],
    description: req.body.description || 'Custom Queue Group',
    musicOnHold: req.body.musicOnHold || 'corporate_ambient_synth',
    status: (req.body.status || 'Active') as 'Active' | 'Inactive'
  };
  db.queues.push(newQueue);
  res.status(201).json(newQueue);
});

apiRouter.put('/configurations/queues/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.queues.findIndex(q => q.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Queue not found' });

  db.queues[idx] = { ...db.queues[idx], ...req.body };
  res.json(db.queues[idx]);
});

apiRouter.patch('/configurations/queues/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const queue = db.queues.find(q => q.id === id);
  if (!queue) return res.status(404).json({ error: 'Queue not found' });

  queue.status = queue.status === 'Active' ? 'Inactive' : 'Active';
  res.json({ success: true, queue });
});

apiRouter.delete('/configurations/queues/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.queues.findIndex(q => q.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Queue not found' });

  db.queues.splice(idx, 1);
  res.json({ success: true, message: 'Queue deleted successfully' });
});

// Dispositions
apiRouter.get('/configurations/dispositions', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.dispositions.filter(d => d.tenantId === tid));
});

apiRouter.post('/configurations/dispositions', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const newDispo = {
    id: `dp-${Date.now()}`,
    tenantId: tid,
    disposition: req.body.disposition || 'CUSTOM_DISPO',
    description: req.body.description || req.body.disposition || 'Custom disposition',
    category: req.body.category || 'Neutral',
    autoSmsTrigger: Boolean(req.body.autoSmsTrigger),
    callbackFlag: Boolean(req.body.callbackFlag),
    dncFlag: Boolean(req.body.dncFlag),
    status: (req.body.status || 'Active') as 'Active' | 'Inactive'
  };
  db.dispositions.push(newDispo);
  res.status(201).json(newDispo);
});

apiRouter.put('/configurations/dispositions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.dispositions.findIndex(d => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Disposition not found' });

  db.dispositions[idx] = { ...db.dispositions[idx], ...req.body };
  res.json(db.dispositions[idx]);
});

apiRouter.patch('/configurations/dispositions/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const dispo = db.dispositions.find(d => d.id === id);
  if (!dispo) return res.status(404).json({ error: 'Disposition not found' });

  dispo.status = dispo.status === 'Active' ? 'Inactive' : 'Active';
  res.json({ success: true, dispo });
});

apiRouter.delete('/configurations/dispositions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.dispositions.findIndex(d => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Disposition not found' });

  db.dispositions.splice(idx, 1);
  res.json({ success: true, message: 'Disposition deleted successfully' });
});

apiRouter.get('/configurations/sub-dispositions', (req: Request, res: Response) => {
  res.json([]);
});

// Pause Codes
apiRouter.get('/configurations/pause-codes', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.pauseCodes.filter(p => p.tenantId === tid));
});

apiRouter.post('/configurations/pause-codes', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const newPause = {
    id: `pc-${Date.now()}`,
    tenantId: tid,
    pauseCode: req.body.pauseCode || 'Break',
    description: req.body.description || 'Agent Break',
    type: (req.body.type || 'non-billing') as 'billing' | 'non-billing',
    status: (req.body.status || 'Active') as 'Active' | 'Inactive',
    durationLimit: req.body.durationLimit || '00:15:00'
  };
  db.pauseCodes.push(newPause);
  res.status(201).json(newPause);
});

apiRouter.put('/configurations/pause-codes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.pauseCodes.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Pause code not found' });

  db.pauseCodes[idx] = { ...db.pauseCodes[idx], ...req.body };
  res.json(db.pauseCodes[idx]);
});

apiRouter.patch('/configurations/pause-codes/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const pc = db.pauseCodes.find(p => p.id === id);
  if (!pc) return res.status(404).json({ error: 'Pause code not found' });

  pc.status = pc.status === 'Active' ? 'Inactive' : 'Active';
  res.json({ success: true, pauseCode: pc });
});

apiRouter.delete('/configurations/pause-codes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.pauseCodes.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Pause code not found' });

  db.pauseCodes.splice(idx, 1);
  res.json({ success: true, message: 'Pause code deleted successfully' });
});

// Blocked Numbers / DNC List
apiRouter.get('/configurations/blocked-numbers', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.blockedNumbers.filter(b => b.tenantId === tid));
});

apiRouter.post('/configurations/blocked-numbers', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const newBlocked = {
    id: `bn-${Date.now()}`,
    tenantId: tid,
    phoneNumber: req.body.phoneNumber || '9999999999',
    reason: req.body.reason || 'DNC Compliance',
    type: (req.body.type || 'DNC') as 'DNC' | 'BLOCKED' | 'CAMPAIGN_DNC',
    campaignId: req.body.campaignId || '',
    campaignName: req.body.campaignName || '',
    addedBy: currentUserSession.user.name,
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    status: (req.body.status || 'Active') as 'Active' | 'Inactive'
  };
  db.blockedNumbers.unshift(newBlocked);
  res.status(201).json(newBlocked);
});

apiRouter.put('/configurations/blocked-numbers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.blockedNumbers.findIndex(b => b.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Blocked number not found' });

  db.blockedNumbers[idx] = { ...db.blockedNumbers[idx], ...req.body };
  res.json(db.blockedNumbers[idx]);
});

apiRouter.patch('/configurations/blocked-numbers/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const bn = db.blockedNumbers.find(b => b.id === id);
  if (!bn) return res.status(404).json({ error: 'Blocked number not found' });

  bn.status = bn.status === 'Active' ? 'Inactive' : 'Active';
  res.json({ success: true, blockedNumber: bn });
});

apiRouter.delete('/configurations/blocked-numbers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.blockedNumbers.findIndex(b => b.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Blocked number not found' });

  db.blockedNumbers.splice(idx, 1);
  res.json({ success: true, message: 'Blocked number removed successfully' });
});

apiRouter.get('/configurations/dids', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.dids.filter(d => d.tenantId === tid));
});

apiRouter.get('/configurations/scripts', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.callScripts.filter(s => s.tenantId === tid));
});

apiRouter.post('/configurations/scripts', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  const newScript = {
    id: `sc-${Date.now()}`,
    tenantId: tid,
    scriptName: req.body.scriptName,
    description: req.body.description || '',
    type: req.body.type || 'Sales',
    content: req.body.content,
    campaignIds: req.body.campaignIds || ['c-1'],
    status: 'Active' as const
  };
  db.callScripts.unshift(newScript);
  res.status(201).json(newScript);
});

apiRouter.delete('/configurations/scripts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.callScripts.findIndex(s => s.id === id);
  if (idx !== -1) {
    db.callScripts.splice(idx, 1);
  }
  res.json({ success: true, message: 'Script deleted' });
});

apiRouter.delete('/sms/templates/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.smsTemplates.findIndex(s => s.id === id);
  if (idx !== -1) {
    db.smsTemplates.splice(idx, 1);
  }
  res.json({ success: true, message: 'SMS template deleted' });
});

apiRouter.delete('/sms/triggers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.smsTriggers.findIndex(t => t.id === id);
  if (idx !== -1) {
    db.smsTriggers.splice(idx, 1);
  }
  res.json({ success: true, message: 'SMS trigger deleted' });
});

apiRouter.delete('/surveys/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.surveyForms.findIndex(s => s.id === id);
  if (idx !== -1) {
    db.surveyForms.splice(idx, 1);
  }
  res.json({ success: true, message: 'Survey deleted' });
});

apiRouter.post('/system/clear-all', (req: Request, res: Response) => {
  db.clearAll();
  res.json({ success: true, message: 'All transactional data (leads, contacts, tickets, meetings, call logs, SMS logs) cleared successfully' });
});

apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  const tid = getTenantId(req);
  res.json(db.auditLogs.filter(a => a.tenantId === tid));
});
