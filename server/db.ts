import {
  Tenant,
  User,
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
  // Completely empty client/tenant list as requested
  tenants: Tenant[] = [];

  // Master administrator for login to Master Panel / Super Admin
  users: User[] = [
    {
      id: 'u-super-1',
      tenantId: '',
      userId: 'superadmin',
      name: 'Dialko Master Administrator',
      mobileNumber: '9999999999',
      mobileExtension: '9999',
      specificDid: '8005490671',
      password: 'SuperAdminMaster@2026',
      emailId: 'superadmin@dialko.com',
      status: 'Active',
      role: 'SUPER_ADMIN',
      userGroup: 'SUPER_ADMIN_GROUP',
      teamName: 'Master Operations',
      viciAgentId: '9999',
      espoUserId: 'espo-super-admin',
      currentChannels: 5,
      skills: ['Master Admin', 'Dialko Telephony']
    }
  ];

  userGroups: UserGroupItem[] = [];
  teams: Team[] = [];
  campaigns: Campaign[] = [];
  campaignLists: CampaignList[] = [];
  leads: Lead[] = [];
  contacts: Contact[] = [];
  tickets: Ticket[] = [];
  meetings: Meeting[] = [];
  callLogs: CallLog[] = [];
  callRecordings: CallRecording[] = [];
  callTransfers: CallTransfer[] = [];
  activeAgents: ActiveAgent[] = [];
  liveCalls: LiveCall[] = [];
  queueItems: QueueItem[] = [];
  get queues(): QueueItem[] { return this.queueItems; }
  set queues(val: QueueItem[]) { this.queueItems = val; }

  dispositionItems: DispositionItem[] = [];
  get dispositions(): DispositionItem[] { return this.dispositionItems; }
  set dispositions(val: DispositionItem[]) { this.dispositionItems = val; }

  pauseCodeItems: PauseCodeItem[] = [];
  get pauseCodes(): PauseCodeItem[] { return this.pauseCodeItems; }
  set pauseCodes(val: PauseCodeItem[]) { this.pauseCodeItems = val; }

  didItems: DIDItem[] = [];
  get dids(): DIDItem[] { return this.didItems; }
  set dids(val: DIDItem[]) { this.didItems = val; }

  userGroupPermissions: any[] = [];
  blockedNumbers: BlockedNumberItem[] = [];
  inboundRoutes: InboundRouteRule[] = [];
  stickyAgentRules: StickyAgentRule[] = [];
  parallelRingingConfigs: ParallelRingingConfig[] = [];
  smsTemplates: SMSTemplate[] = [];
  smsTriggers: SMSTrigger[] = [];
  smsLogs: SMSLog[] = [];
  surveyForms: SurveyForm[] = [];
  surveyResponses: SurveyResponse[] = [];
  callScripts: CallScript[] = [];
  auditLogs: AuditLog[] = [];
  impersonationLogs: ImpersonationLog[] = [];

  clearAll() {
    this.tenants = [];
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
    this.impersonationLogs = [];
    this.campaigns = [];
    this.campaignLists = [];
    this.userGroups = [];
    this.teams = [];
    this.queueItems = [];
    this.dispositionItems = [];
    this.pauseCodeItems = [];
    this.didItems = [];
    this.userGroupPermissions = [];
  }
}

export const db = new InMemoryDB();
