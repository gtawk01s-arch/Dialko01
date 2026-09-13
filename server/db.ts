import {
  Tenant,
  User,
  UserGroupPermission,
  UserGroupItem,
  Team,
  Campaign,
  CampaignList,
  Lead,
  Contact,
  Ticket,
  Meeting,
  CallLog,
  CallRecording,
  CallTransfer,
  ActiveAgent,
  LiveCall,
  QueueItem,
  DispositionItem,
  PauseCodeItem,
  DIDItem,
  BlockedNumberItem,
  InboundRouteRule,
  StickyAgentRule,
  ParallelRingingConfig,
  SMSTemplate,
  SMSTrigger,
  SMSLog,
  SurveyForm,
  SurveyResponse,
  CallScript,
  AuditLog,
  ImpersonationLog
} from '../src/types/index.js';

class InMemoryDB {
  tenants: Tenant[] = [
    {
      id: 't-1',
      name: 'Somnath Enterprise Telecom',
      code: 'somnathlead',
      status: 'active',
      userLicenses: 10,
      availableMinutes: 120,
      viciUserGroup: 'somnathlead_admin',
      espoTeam: 'Somnath_Sales_Team',
      createdAt: '2026-08-01T08:00:00Z',
      subscriptionStart: '2026-01-01',
      subscriptionEnd: '2027-12-31',
      primaryContactEmail: 'admin@somnathtelecom.com',
      primaryContactPhone: '9480732001',
      planType: 'Enterprise',
      notifySupervisorOnImpersonate: true
    },
    {
      id: 't-2',
      name: 'Apex Global BPO Solutions',
      code: 'apexglobal',
      status: 'active',
      userLicenses: 25,
      availableMinutes: 4500,
      viciUserGroup: 'apexglobal_admin',
      espoTeam: 'Apex_Outbound_Support',
      createdAt: '2026-08-10T10:00:00Z',
      subscriptionStart: '2026-02-01',
      subscriptionEnd: '2026-11-30',
      primaryContactEmail: 'contact@apexglobalbpo.com',
      primaryContactPhone: '9845012345',
      planType: 'Professional',
      notifySupervisorOnImpersonate: false
    },
    {
      id: 't-3',
      name: 'Nexus Cloud Fintech Dialers',
      code: 'nexusfintech',
      status: 'inactive',
      userLicenses: 5,
      availableMinutes: 0,
      viciUserGroup: 'nexusfintech_admin',
      espoTeam: 'Nexus_Recovery_Desk',
      createdAt: '2026-07-15T14:30:00Z',
      subscriptionStart: '2026-01-01',
      subscriptionEnd: '2026-06-30',
      primaryContactEmail: 'finance@nexusdial.io',
      primaryContactPhone: '9123456789',
      planType: 'Starter',
      notifySupervisorOnImpersonate: false
    },
    {
      id: 't-4',
      name: 'Zenith Healthcare Services',
      code: 'zenithhealth',
      status: 'active',
      userLicenses: 40,
      availableMinutes: 15800,
      viciUserGroup: 'zenithhealth_admin',
      espoTeam: 'Zenith_Patient_Intake',
      createdAt: '2026-08-18T09:15:00Z',
      subscriptionStart: '2026-03-01',
      subscriptionEnd: '2027-03-01',
      primaryContactEmail: 'it@zenithhealth.org',
      primaryContactPhone: '9845112233',
      planType: 'Enterprise',
      notifySupervisorOnImpersonate: true
    },
    {
      id: 't-5',
      name: 'Quantum Real Estate Telesales',
      code: 'quantumrealty',
      status: 'active',
      userLicenses: 15,
      availableMinutes: 7200,
      viciUserGroup: 'quantumrealty_admin',
      espoTeam: 'Quantum_Lead_Gen',
      createdAt: '2026-08-22T11:00:00Z',
      subscriptionStart: '2026-04-01',
      subscriptionEnd: '2027-04-01',
      primaryContactEmail: 'ops@quantumrealty.com',
      primaryContactPhone: '9876543211',
      planType: 'Professional',
      notifySupervisorOnImpersonate: false
    }
  ];

  users: User[] = [
    {
      id: 'u-super-1',
      tenantId: 't-1',
      userId: 'superadmin',
      name: 'Master Super Administrator',
      mobileNumber: '9999999999',
      mobileExtension: '9999',
      specificDid: '8005490671',
      password: 'SuperAdminMaster@2026',
      emailId: 'superadmin@zeedial.com',
      status: 'Active',
      role: 'SUPER_ADMIN',
      userGroup: 'SUPER_ADMIN_GROUP',
      teamName: 'Master Infrastructure Operations',
      viciAgentId: '9999',
      espoUserId: 'espo-super-admin',
      currentChannels: 5,
      skills: ['All Platforms', 'System Architecture', 'Multi-Tenancy', 'Database']
    },
    {
      id: 'u-1',
      tenantId: 't-1',
      userId: 'somnathlead_admin',
      name: 'Somnath Enterprise Admin',
      mobileNumber: '9480732001',
      mobileExtension: '1001',
      specificDid: '27001',
      password: 'AdminPassword@123',
      emailId: 'somnathlead_admin@zeedial.com',
      status: 'Active',
      role: 'Administrator',
      userGroup: 'somnathlead_admin',
      teamName: 'Management',
      viciAgentId: '1001',
      espoUserId: 'espo-admin-1',
      currentChannels: 1,
      skills: ['Sales', 'Technical', 'Escalations'],
      provisionedBy: 'DEVELOPER_TEAM',
      provisionedAt: '2026-08-01T09:00:00Z',
      ticketRef: 'DEV-ONBOARD-T1',
      notes: 'Initial tenant provisioned by Dev Team with full call routing and agent management',
      lastLogin: '2026-09-07 08:30:15',
      adminPortalAccess: true
    },
    {
      id: 'u-2',
      tenantId: 't-1',
      userId: 'somnathlead_agent01',
      name: 'somnathlead_agent01',
      mobileNumber: '9480732002',
      mobileExtension: '1002',
      specificDid: '27001',
      password: 'AgentPass#1002',
      emailId: 'somnathlead_agent01@zeedial.com',
      status: 'Active',
      role: 'Agent',
      userGroup: 'somnathlead_agent',
      teamName: 'Sales Inbound',
      viciAgentId: '1002',
      espoUserId: 'espo-ag-1',
      currentChannels: 0,
      skills: ['Sales', 'English']
    },
    {
      id: 'u-3',
      tenantId: 't-2',
      userId: 'apex_admin',
      name: 'Apex Admin Manager',
      mobileNumber: '9845012346',
      mobileExtension: '2001',
      specificDid: '27002',
      password: 'ApexAdminPass@2026',
      emailId: 'admin@apexglobalbpo.com',
      status: 'Active',
      role: 'Administrator',
      userGroup: 'apexglobal_admin',
      teamName: 'Apex Leadership',
      viciAgentId: '2001',
      espoUserId: 'espo-apex-admin',
      currentChannels: 1,
      skills: ['BPO Management', 'Queue Optimization'],
      provisionedBy: 'SUPPORT_TEAM',
      provisionedAt: '2026-08-10T11:15:00Z',
      ticketRef: 'SUP-4412-APEX',
      notes: 'Provisioned by L2 Support team following enterprise BPO contract signing',
      lastLogin: '2026-09-06 17:42:00',
      adminPortalAccess: true
    },
    {
      id: 'u-zenith-admin',
      tenantId: 't-4',
      userId: 'zenith_admin',
      name: 'Zenith Health Operations Lead',
      mobileNumber: '9845112233',
      mobileExtension: '4000',
      specificDid: '27004',
      password: 'ZenithAdmin@2026',
      emailId: 'admin@zenithhealth.org',
      status: 'Active',
      role: 'Administrator',
      userGroup: 'zenithhealth_admin',
      teamName: 'Zenith Administration',
      viciAgentId: '4000',
      espoUserId: 'espo-zenith-adm',
      currentChannels: 1,
      skills: ['Healthcare Triage', 'HIPAA Compliance'],
      provisionedBy: 'DEVELOPER_TEAM',
      provisionedAt: '2026-08-18T10:00:00Z',
      ticketRef: 'DEV-HEALTH-901',
      notes: 'Configured with HIPAA compliance presets and priority doctor routing by Dev Team',
      lastLogin: '2026-09-07 09:12:44',
      adminPortalAccess: true
    },
    {
      id: 'u-quantum-admin',
      tenantId: 't-5',
      userId: 'quantum_admin',
      name: 'Quantum Telesales Director',
      mobileNumber: '9876543211',
      mobileExtension: '5000',
      specificDid: '27005',
      password: 'QuantumPass@2026',
      emailId: 'admin@quantumrealty.com',
      status: 'Active',
      role: 'Administrator',
      userGroup: 'quantumrealty_admin',
      teamName: 'Quantum Leadership',
      viciAgentId: '5000',
      espoUserId: 'espo-quantum-adm',
      currentChannels: 1,
      skills: ['High-Velocity Dialing', 'Real Estate Lead Gen'],
      provisionedBy: 'SUPPORT_TEAM',
      provisionedAt: '2026-08-22T14:20:00Z',
      ticketRef: 'SUP-7731-QUANTUM',
      notes: 'Provisioned for predictive blast telesales campaign monitoring by Support Team',
      lastLogin: '2026-09-05 14:10:20',
      adminPortalAccess: true
    },
    {
      id: 'u-4',
      tenantId: 't-2',
      userId: 'apex_agent_01',
      name: 'Apex Frontline Agent',
      mobileNumber: '9845012347',
      mobileExtension: '2002',
      specificDid: '27002',
      password: 'ApexAgent#2002',
      emailId: 'agent01@apexglobalbpo.com',
      status: 'Active',
      role: 'Agent',
      userGroup: 'apexglobal_agent',
      teamName: 'Apex Outbound',
      viciAgentId: '2002',
      espoUserId: 'espo-apex-ag1',
      currentChannels: 0,
      skills: ['Customer Support', 'Voice Collections']
    },
    {
      id: 'u-5',
      tenantId: 't-3',
      userId: 'nexus_lead',
      name: 'Nexus Team Lead',
      mobileNumber: '9123456788',
      mobileExtension: '3001',
      specificDid: '27003',
      password: 'NexusLead#3001',
      emailId: 'lead@nexusdial.io',
      status: 'Inactive',
      role: 'Supervisor',
      userGroup: 'nexusfintech_admin',
      teamName: 'Nexus Operations',
      viciAgentId: '3001',
      espoUserId: 'espo-nexus-lead',
      currentChannels: 0,
      skills: ['Fintech Calling']
    },
    {
      id: 'u-6',
      tenantId: 't-1',
      userId: 'somnathlead_agent02',
      name: 'Rahul Sharma (Senior Agent)',
      mobileNumber: '9480732003',
      mobileExtension: '1003',
      specificDid: '27001',
      password: 'AgentPass#1003',
      emailId: 'rahul.s@zeedial.com',
      status: 'Active',
      role: 'Agent',
      userGroup: 'somnathlead_agent',
      teamName: 'Sales Inbound',
      viciAgentId: '1003',
      espoUserId: 'espo-ag-2',
      currentChannels: 1,
      skills: ['Sales', 'Hindi', 'English']
    },
    {
      id: 'u-7',
      tenantId: 't-4',
      userId: 'zenith_agent_01',
      name: 'Dr. Priya Desai (Triage Desk)',
      mobileNumber: '9845112234',
      mobileExtension: '4001',
      specificDid: '27004',
      password: 'ZenithAgent#4001',
      emailId: 'priya@zenithhealth.org',
      status: 'Active',
      role: 'Agent',
      userGroup: 'zenithhealth_agent',
      teamName: 'Patient Intake',
      viciAgentId: '4001',
      espoUserId: 'espo-zenith-ag1',
      currentChannels: 1,
      skills: ['Medical Triage', 'Verification']
    },
    {
      id: 'u-8',
      tenantId: 't-5',
      userId: 'quantum_agent_01',
      name: 'Amit Patel (Property Advisor)',
      mobileNumber: '9876543212',
      mobileExtension: '5001',
      specificDid: '27005',
      password: 'QuantumAgent#5001',
      emailId: 'amit.p@quantumrealty.com',
      status: 'Active',
      role: 'Agent',
      userGroup: 'quantumrealty_agent',
      teamName: 'Lead Generation',
      viciAgentId: '5001',
      espoUserId: 'espo-quantum-ag1',
      currentChannels: 0,
      skills: ['Real Estate', 'Outbound Sales']
    }
  ];

  userGroups: UserGroupItem[] = [
    {
      id: 'ug-1',
      tenantId: 't-1',
      groupName: 'somnathlead_admin',
      description: 'Full Administrative and Root Permissions',
      isSupervisorPanel: true,
      memberCount: 1,
      status: 'Active',
      permissions: {
        groupName: 'somnathlead_admin',
        realTime: true,
        reports: true,
        management: true,
        connection: true,
        configurations: true,
        leads: true,
        dashboard: true,
        call: true,
        template: true,
        formBuilder: true,
        customModule: true,
        supervisorControls: {
          listen: true,
          whisper: true,
          barge: true,
          forceLogout: true,
          manualDial: true,
          autoDial: true
        }
      }
    },
    {
      id: 'ug-2',
      tenantId: 't-1',
      groupName: 'somnathlead_agent',
      description: 'Standard Frontline Agent Dialing & Dispositions',
      isSupervisorPanel: false,
      memberCount: 1,
      status: 'Active',
      permissions: {
        groupName: 'somnathlead_agent',
        realTime: false,
        reports: true,
        management: false,
        connection: true,
        configurations: false,
        leads: true,
        dashboard: true,
        call: true,
        template: false,
        formBuilder: false,
        customModule: false,
        supervisorControls: {
          listen: false,
          whisper: false,
          barge: false,
          forceLogout: false,
          manualDial: true,
          autoDial: false
        }
      }
    }
  ];

  userGroupPermissions: UserGroupPermission[] = [
    {
      groupName: 'somnathlead_admin',
      realTime: true,
      reports: true,
      management: true,
      connection: true,
      configurations: true,
      leads: true,
      dashboard: true,
      call: true,
      template: true,
      formBuilder: true,
      customModule: true,
      supervisorControls: {
        listen: true,
        whisper: true,
        barge: true,
        forceLogout: true,
        manualDial: true,
        autoDial: true
      }
    },
    {
      groupName: 'somnathlead_agent',
      realTime: false,
      reports: true,
      management: false,
      connection: true,
      configurations: false,
      leads: true,
      dashboard: true,
      call: true,
      template: false,
      formBuilder: false,
      customModule: false,
      supervisorControls: {
        listen: false,
        whisper: false,
        barge: false,
        forceLogout: false,
        manualDial: true,
        autoDial: false
      }
    }
  ];

  teams: Team[] = [
    {
      id: 'tm-1',
      tenantId: 't-1',
      name: 'Sales Inbound',
      description: 'Dedicated sales & support inbound group',
      type: 'Inbound',
      campaignId: 'c-1',
      campaignName: 'Sales_Campaign',
      assignedCount: 1,
      assignedUserIds: ['u-2'],
      assignedUsers: ['somnathlead_agent01'],
      status: 'Active'
    }
  ];

  blockedNumbers: BlockedNumberItem[] = [];

  campaigns: Campaign[] = [
    {
      id: 'c-1',
      tenantId: 't-1',
      name: 'Sales_Campaign',
      industry: 'IT & Telecom',
      domain: 'Sales & Inbound',
      template_name: 'Default',
      type: 'PREDICTIVE',
      active: 'Yes',
      process: 'Leads',
      outboundCallerId: '8005490671',
      didRotateStrategy: 'Direct',
      didNumbers: ['8005490671'],
      dialStatuses: ['NEW', 'BUSY', 'NOANSWER', 'CONGESTION', 'ABANDON'],
      dial_ratio: '1.5',
      maxConcurrentCalls: 30,
      amdDetection: 'Standard AMD',
      retryRules: {
        maxRetries: 3,
        retryIntervalMin: 30,
        retryStatuses: ['BUSY', 'NOANSWER', 'CONGESTION']
      },
      callMasking: false,
      autoDispo: false,
      autoDispoTimerSec: 30,
      autoDispoValue: 'SALE',
      onDemandRecording: true,
      wrapTimeSec: 15,
      dncCheck: true,
      timezone: 'ACTIVE',
      queue: 'Sales_Queue',
      mappedQueues: ['Sales_Queue', 'Support_Queue'],
      pauseCodes: ['Lunch', 'Tea Break', 'Meeting', 'Personal'],
      dispositionStatuses: ['SALE', 'INTERESTED', 'CALLBACK', 'NOT_INTERESTED', 'DNC', 'CALL_LATER'],
      scriptName: 'Standard_Sales_Script',
      assignedTeamName: 'Sales Inbound',
      inboundCallSetting: 'Allow',
      inboundDid: '27001',
      routingType: 'Queue Routing',
      inboundTargetQueue: 'Sales_Queue',
      ringTimeoutSec: 25,
      fallbackRouting: 'Voicemail',
      missedCallHandling: 'Create Ticket',
      stickyAgentEnabled: false,
      primaryList: '1001',
      viciCampaignId: 'CAMP_SALES'
    }
  ];

  campaignLists: CampaignList[] = [
    {
      id: 'l-1',
      tenantId: 't-1',
      list_id: '1001',
      name: 'Default Campaign List',
      description: 'Initial dialing list',
      campaign: 'Sales_Campaign',
      template: 'Default',
      recycle_count: 0,
      utilize_count: 0,
      lead_count: 0,
      status: 'Active'
    }
  ];

  leads: Lead[] = [];
  contacts: Contact[] = [];
  tickets: Ticket[] = [];
  meetings: Meeting[] = [];
  callLogs: CallLog[] = [
    {
      id: 'cl-1',
      tenantId: 't-1',
      callDate: new Date().toISOString().slice(0, 10),
      callTime: '10:15:30',
      callerId: '9845012340',
      destination: '27001',
      agentId: 'somnathlead_agent01',
      agentName: 'somnathlead_agent01',
      campaign: 'Sales_Campaign',
      durationSec: 142,
      talkTimeSec: 125,
      disposition: 'SALE',
      hangupCause: 'NORMAL_CLEARING',
      recordingUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      callType: 'INBOUND'
    },
    {
      id: 'cl-2',
      tenantId: 't-1',
      callDate: new Date().toISOString().slice(0, 10),
      callTime: '10:42:15',
      callerId: '9123456780',
      destination: '27001',
      agentId: 'somnathlead_agent02',
      agentName: 'Rahul Sharma (Senior Agent)',
      campaign: 'Sales_Campaign',
      durationSec: 95,
      talkTimeSec: 80,
      disposition: 'INTERESTED',
      hangupCause: 'NORMAL_CLEARING',
      recordingUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      callType: 'INBOUND'
    },
    {
      id: 'cl-3',
      tenantId: 't-2',
      callDate: new Date().toISOString().slice(0, 10),
      callTime: '11:05:22',
      callerId: '9988776655',
      destination: '27002',
      agentId: 'apex_agent_01',
      agentName: 'Apex Frontline Agent',
      campaign: 'Apex_Outbound_Direct',
      durationSec: 210,
      talkTimeSec: 195,
      disposition: 'SALE',
      hangupCause: 'NORMAL_CLEARING',
      recordingUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      callType: 'OUTBOUND'
    },
    {
      id: 'cl-4',
      tenantId: 't-4',
      callDate: new Date().toISOString().slice(0, 10),
      callTime: '09:30:11',
      callerId: '9845119988',
      destination: '27004',
      agentId: 'zenith_agent_01',
      agentName: 'Dr. Priya Desai (Triage Desk)',
      campaign: 'Patient_Triage_Inbound',
      durationSec: 320,
      talkTimeSec: 310,
      disposition: 'SALE',
      hangupCause: 'NORMAL_CLEARING',
      recordingUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      callType: 'INBOUND'
    }
  ];

  callRecordings: CallRecording[] = [
    {
      id: 'rec-1',
      tenantId: 't-1',
      leadId: '100101',
      callerNumber: '9845012340',
      agentId: 'somnathlead_agent01',
      agentName: 'somnathlead_agent01',
      campaign: 'Sales_Campaign',
      recordingUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      durationSec: 142,
      recordedAt: new Date().toISOString()
    },
    {
      id: 'rec-2',
      tenantId: 't-1',
      leadId: '100102',
      callerNumber: '9123456780',
      agentId: 'somnathlead_agent02',
      agentName: 'Rahul Sharma (Senior Agent)',
      campaign: 'Sales_Campaign',
      recordingUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      durationSec: 95,
      recordedAt: new Date().toISOString()
    },
    {
      id: 'rec-3',
      tenantId: 't-2',
      leadId: '200101',
      callerNumber: '9988776655',
      agentId: 'apex_agent_01',
      agentName: 'Apex Frontline Agent',
      campaign: 'Apex_Outbound_Direct',
      recordingUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      durationSec: 210,
      recordedAt: new Date().toISOString()
    },
    {
      id: 'rec-4',
      tenantId: 't-4',
      leadId: '400101',
      callerNumber: '9845119988',
      agentId: 'zenith_agent_01',
      agentName: 'Dr. Priya Desai (Triage Desk)',
      campaign: 'Patient_Triage_Inbound',
      recordingUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      durationSec: 320,
      recordedAt: new Date().toISOString()
    }
  ];

  callTransfers: CallTransfer[] = [];

  activeAgents: ActiveAgent[] = [
    {
      agentId: 'somnathlead_agent01',
      name: 'somnathlead_agent01',
      extension: '1002',
      tenantId: 't-1',
      status: 'INCALL',
      currentCampaign: 'Sales_Campaign',
      callState: 'INCALL',
      callDurationSec: 64,
      callsToday: 28,
      lastCallTime: '10:48:10',
      currentCustomerPhone: '9845012340',
      currentChannel: 'SIP/1002-00001a4f'
    },
    {
      agentId: 'somnathlead_agent02',
      name: 'Rahul Sharma (Senior Agent)',
      extension: '1003',
      tenantId: 't-1',
      status: 'WAITING',
      currentCampaign: 'Sales_Campaign',
      callState: 'READY',
      callDurationSec: 0,
      callsToday: 34,
      lastCallTime: '10:45:00',
      currentChannel: 'SIP/1003'
    },
    {
      agentId: 'apex_agent_01',
      name: 'Apex Frontline Agent',
      extension: '2002',
      tenantId: 't-2',
      status: 'INCALL',
      currentCampaign: 'Apex_Outbound_Direct',
      callState: 'INCALL',
      callDurationSec: 112,
      callsToday: 41,
      lastCallTime: '10:50:00',
      currentCustomerPhone: '9988776655',
      currentChannel: 'SIP/2002-00001b2c'
    },
    {
      agentId: 'zenith_agent_01',
      name: 'Dr. Priya Desai (Triage Desk)',
      extension: '4001',
      tenantId: 't-4',
      status: 'INCALL',
      currentCampaign: 'Patient_Triage_Inbound',
      callState: 'INCALL',
      callDurationSec: 185,
      callsToday: 19,
      lastCallTime: '10:42:00',
      currentCustomerPhone: '9845119988',
      currentChannel: 'SIP/4001-00002c1d'
    },
    {
      agentId: 'quantum_agent_01',
      name: 'Amit Patel (Property Advisor)',
      extension: '5001',
      tenantId: 't-5',
      status: 'PAUSED',
      currentCampaign: 'Quantum_Lead_Gen',
      callState: 'PAUSED',
      callDurationSec: 0,
      callsToday: 15,
      lastCallTime: '10:30:00',
      pauseReason: 'Tea Break',
      currentChannel: 'SIP/5001'
    }
  ];

  liveCalls: LiveCall[] = [
    {
      channelId: 'SIP/1002-00001a4f',
      tenantId: 't-1',
      callerNumber: '9845012340',
      agentId: 'somnathlead_agent01',
      agentName: 'somnathlead_agent01',
      campaign: 'Sales_Campaign',
      queue: 'Sales_Queue',
      callDurationSec: 64,
      status: 'TALKING',
      direction: 'INBOUND',
      callType: 'Inbound Customer Inquiry'
    },
    {
      channelId: 'SIP/2002-00001b2c',
      tenantId: 't-2',
      callerNumber: '9988776655',
      agentId: 'apex_agent_01',
      agentName: 'Apex Frontline Agent',
      campaign: 'Apex_Outbound_Direct',
      queue: 'Apex_Queue',
      callDurationSec: 112,
      status: 'TALKING',
      direction: 'OUTBOUND',
      callType: 'Outbound Predictive Blast'
    },
    {
      channelId: 'SIP/4001-00002c1d',
      tenantId: 't-4',
      callerNumber: '9845119988',
      agentId: 'zenith_agent_01',
      agentName: 'Dr. Priya Desai (Triage Desk)',
      campaign: 'Patient_Triage_Inbound',
      queue: 'Triage_Queue',
      callDurationSec: 185,
      status: 'TALKING',
      direction: 'INBOUND',
      callType: 'Medical Intake Hotline'
    }
  ];

  impersonationLogs: ImpersonationLog[] = [
    {
      id: 'imp-1',
      masterAdminUser: 'superadmin',
      tenantId: 't-1',
      tenantName: 'Somnath Enterprise Telecom',
      agentId: 'somnathlead_agent01',
      agentName: 'somnathlead_agent01',
      reason: 'Agent reported one-way audio on extension 1002 during inbound queue calls',
      startedAt: '2026-09-02 14:15:00',
      endedAt: '2026-09-02 14:26:30',
      expiresAt: '2026-09-02 14:30:00',
      sourceIp: '192.168.1.1',
      status: 'ENDED'
    },
    {
      id: 'imp-2',
      masterAdminUser: 'superadmin',
      tenantId: 't-2',
      tenantName: 'Apex Global BPO Solutions',
      agentId: 'apex_agent_01',
      agentName: 'Apex Frontline Agent',
      reason: 'Test-dial verification after campaign DID route rotation upgrade',
      startedAt: '2026-09-02 16:00:12',
      endedAt: '2026-09-02 16:11:45',
      expiresAt: '2026-09-02 16:15:12',
      sourceIp: '192.168.1.1',
      status: 'ENDED'
    },
    {
      id: 'imp-3',
      masterAdminUser: 'superadmin',
      tenantId: 't-4',
      tenantName: 'Zenith Healthcare Services',
      agentId: 'zenith_agent_01',
      agentName: 'Dr. Priya Desai (Triage Desk)',
      reason: 'Reproduce EspoCRM automatic patient intake contact creation failure',
      startedAt: '2026-09-03 08:30:00',
      endedAt: '2026-09-03 08:44:10',
      expiresAt: '2026-09-03 08:45:00',
      sourceIp: '192.168.1.1',
      status: 'ENDED'
    }
  ];

  queues: QueueItem[] = [
    {
      id: 'q-1',
      tenantId: 't-1',
      queueName: 'Sales_Queue',
      ringingStrategy: 'Round Robin',
      visitTimeoutSec: 30,
      assignedAgents: ['somnathlead_agent01'],
      description: 'Primary Sales Inbound Queue',
      musicOnHold: 'default',
      status: 'Active'
    },
    {
      id: 'q-2',
      tenantId: 't-1',
      queueName: 'Support_Queue',
      ringingStrategy: 'Fewest Calls',
      visitTimeoutSec: 30,
      assignedAgents: ['somnathlead_agent01'],
      description: 'Customer Support Escalation Queue',
      musicOnHold: 'default',
      status: 'Active'
    }
  ];

  dispositions: DispositionItem[] = [
    { id: 'dp-1', tenantId: 't-1', disposition: 'SALE', description: 'Customer confirmed sale/order', category: 'Positive', autoSmsTrigger: false, callbackFlag: false, dncFlag: false, status: 'Active' },
    { id: 'dp-2', tenantId: 't-1', disposition: 'INTERESTED', description: 'Customer interested in product', category: 'Positive', autoSmsTrigger: false, callbackFlag: false, dncFlag: false, status: 'Active' },
    { id: 'dp-3', tenantId: 't-1', disposition: 'CALLBACK', description: 'Customer requested scheduled callback', category: 'Neutral', autoSmsTrigger: false, callbackFlag: true, dncFlag: false, status: 'Active' },
    { id: 'dp-4', tenantId: 't-1', disposition: 'CALL_LATER', description: 'Customer asked to call back later', category: 'Neutral', autoSmsTrigger: false, callbackFlag: true, dncFlag: false, status: 'Active' },
    { id: 'dp-5', tenantId: 't-1', disposition: 'NOT_INTERESTED', description: 'Prospect declined proposal', category: 'Negative', autoSmsTrigger: false, callbackFlag: false, dncFlag: false, status: 'Active' },
    { id: 'dp-6', tenantId: 't-1', disposition: 'DNC', description: 'Do Not Call registry', category: 'System', autoSmsTrigger: false, callbackFlag: false, dncFlag: true, status: 'Active' }
  ];

  pauseCodes: PauseCodeItem[] = [
    { id: 'pc-1', tenantId: 't-1', pauseCode: 'Lunch', description: 'Lunch break', type: 'non-billing', status: 'Active', durationLimit: '00:45:00' },
    { id: 'pc-2', tenantId: 't-1', pauseCode: 'Tea Break', description: 'Tea / snack break', type: 'non-billing', status: 'Active', durationLimit: '00:15:00' },
    { id: 'pc-3', tenantId: 't-1', pauseCode: 'Meeting', description: 'Internal team briefing', type: 'non-billing', status: 'Active', durationLimit: '00:30:00' },
    { id: 'pc-4', tenantId: 't-1', pauseCode: 'Personal', description: 'Personal break', type: 'non-billing', status: 'Active', durationLimit: '00:10:00' }
  ];

  dids: DIDItem[] = [
    { id: 'did-1', tenantId: 't-1', didNumber: '27001', application: 'queue', assignedCampaign: 'Sales_Campaign', assignedQueue: 'Sales_Queue', status: 'Active' }
  ];

  inboundRoutes: InboundRouteRule[] = [];
  stickyAgentRules: StickyAgentRule[] = [];
  parallelRingingConfigs: ParallelRingingConfig[] = [];
  smsTemplates: SMSTemplate[] = [];
  smsTriggers: SMSTrigger[] = [];
  smsLogs: SMSLog[] = [];
  surveyForms: SurveyForm[] = [];
  surveyResponses: SurveyResponse[] = [];

  callScripts: CallScript[] = [
    {
      id: 'sc-1',
      tenantId: 't-1',
      scriptName: 'Standard_Sales_Script',
      description: 'General sales pitch template',
      type: 'Sales',
      content: 'Hello {{customer_name}}, this is {{agent_name}} calling from our team. How can I help you today?',
      campaignIds: ['c-1'],
      status: 'Active'
    }
  ];

  auditLogs: AuditLog[] = [];

  clearAll() {
    this.leads = [];
    this.contacts = [];
    this.tickets = [];
    this.meetings = [];
    this.callLogs = [];
    this.callRecordings = [];
    this.callTransfers = [];
    this.liveCalls = [];
    this.surveyResponses = [];
    this.smsLogs = [];
    this.blockedNumbers = [];
    this.auditLogs = [];
  }
}

export const db = new InMemoryDB();
