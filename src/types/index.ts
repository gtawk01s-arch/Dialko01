export interface Tenant {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
  userLicenses: number;
  availableMinutes: number;
  viciUserGroup: string;
  espoTeam: string;
  createdAt: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  planType?: 'Starter' | 'Professional' | 'Enterprise' | 'Custom';
  notifySupervisorOnImpersonate?: boolean;
}

export type UserRole = 'Administrator' | 'Agent' | 'Supervisor' | 'Master Admin' | 'SUPER_ADMIN';

export interface User {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  mobileNumber: string;
  mobileExtension: string;
  specificDid?: string;
  password?: string;
  emailId: string;
  status: 'Active' | 'Inactive';
  role: UserRole;
  userGroup: string;
  teamId?: string;
  teamName?: string;
  viciAgentId?: string | null;
  espoUserId?: string | null;
  currentChannels: number;
  skills: string[];
  provisionedBy?: 'DEVELOPER_TEAM' | 'SUPPORT_TEAM' | 'MASTER_PANEL';
  provisionedAt?: string;
  ticketRef?: string;
  notes?: string;
  lastLogin?: string;
  adminPortalAccess?: boolean;
}

export interface AdminCredentialProvisionRequest {
  tenantId: string;
  name: string;
  userId: string;
  password: string;
  emailId: string;
  mobileNumber?: string;
  mobileExtension: string;
  role: 'Administrator' | 'Supervisor';
  status: 'Active' | 'Inactive';
  provisionedBy: 'DEVELOPER_TEAM' | 'SUPPORT_TEAM';
  ticketRef?: string;
  notes?: string;
}

export interface SystemInfrastructureConfig {
  dialerApiUrl: string;
  dialerApiUser: string;
  dialerApiPass: string;
  crmApiUrl: string;
  crmApiKey: string;
  databaseConnectionString: string;
  databaseHost: string;
  databasePort: number;
  databaseName: string;
  lastConnectedTime?: string;
  vicidialStatus?: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED';
  crmStatus?: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED';
  dbStatus?: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED';
}

export interface GlobalSaaSDashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  activeAgents: number;
  totalGlobalCalls: number;
  globalSuccessRate: number;
  totalActiveHopperLeads: number;
  serverIp: string;
  vicidialClusterStatus: string;
  espoCrmClusterStatus: string;
  mariaDbClusterStatus: string;
  databaseStats: {
    totalVicidialListRows: number;
    totalVicidialUsers: number;
    totalLogEntries: number;
  };
  companyCallBreakdown: {
    tenantId: string;
    companyName: string;
    code: string;
    agentCount: number;
    totalCalls: number;
    answeredCalls: number;
    successRate: number;
    status: 'active' | 'inactive';
    subscriptionEnd: string;
  }[];
}

export interface UserGroupPermission {
  groupName: string;
  realTime: boolean;
  reports: boolean;
  management: boolean;
  connection: boolean;
  configurations: boolean;
  leads: boolean;
  dashboard: boolean;
  call: boolean;
  template: boolean;
  formBuilder: boolean;
  customModule: boolean;
  supervisorControls?: {
    listen: boolean;
    whisper: boolean;
    barge: boolean;
    forceLogout: boolean;
    manualDial: boolean;
    autoDial: boolean;
  };
}

export interface UserGroupItem {
  id: string;
  tenantId: string;
  groupName: string;
  description: string;
  isSupervisorPanel: boolean;
  memberCount: number;
  status: 'Active' | 'Inactive';
  permissions: UserGroupPermission;
}

export interface Team {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: string;
  campaignId: string;
  campaignName: string;
  assignedCount: number;
  assignedUserIds?: string[];
  assignedUsers?: string[];
  status: 'Active' | 'Inactive';
}

export type CampaignType = 'PREDICTIVE' | 'PREVIEW' | 'VOICE BLAST' | 'AUTO' | 'POWER' | 'MANUAL';

export type DIDRotateStrategy = 'Direct' | 'Rotate' | 'Random' | 'Local Presence' | 'Agent';

export type ProcessType = 'Leads' | 'Tickets' | 'Meetings';

export type InboundRoutingType = 'Queue Routing' | 'Sticky Agent Routing' | 'External Number Routing' | 'Sticky Agent' | 'Extension Routing' | 'IVR Routing';

export type FallbackRoutingType = 'Voicemail' | 'Overflow Queue' | 'External Transfer' | 'Hangup';

export type MissedCallHandlingType = 'Create Ticket' | 'Send SMS Alert' | 'Schedule Callback' | 'Log Missed Call';

export type IVRDestinationType = 'Agent' | 'Extension' | 'Queue' | 'IVR';

export interface DTMFOption {
  key: string;
  label: string;
  destinationType: IVRDestinationType;
  destinationValue: string;
}

export interface RetryRules {
  maxRetries: number;
  retryIntervalMin: number;
  retryStatuses: string[];
}

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  type: CampaignType;
  active: 'Yes' | 'No';

  // Outgoing Settings
  outboundCallerId: string;
  didRotateStrategy: DIDRotateStrategy;
  didNumbers?: string[];
  dialStatuses?: string[];
  dial_ratio?: string;
  previewTimeSec?: number;
  agentAcceptReject?: boolean;
  autoDial?: boolean;
  amdDetection?: 'Disabled' | 'Standard AMD' | 'Aggressive AMD' | 'Silence Detection';
  maxConcurrentCalls?: number;
  retryRules?: RetryRules;
  callMasking: boolean;
  autoDispo: boolean;
  autoDispoTimerSec?: number;
  autoDispoValue?: string;
  onDemandRecording?: boolean;
  wrapTimeSec?: number;
  dncCheck?: boolean;
  timezone?: string;

  // Queue & Agent Settings
  queue?: string;
  mappedQueues?: string[];
  pauseCodes: string[];
  dispositionStatuses?: string[];
  scriptName?: string;
  assignedUserGroup?: string;
  assignedTeamId?: string;
  assignedTeamName?: string;
  process?: ProcessType;
  industry: string;
  domain?: string;
  template_name?: string;

  // Incoming Call Settings (Allow / Block toggle)
  inboundCallSetting: 'Allow' | 'Block';
  inboundDid?: string;
  routingType?: InboundRoutingType;
  inboundTargetQueue?: string;
  externalForwardNumber?: string;
  ringTimeoutSec?: number;
  fallbackRouting?: FallbackRoutingType;
  missedCallHandling?: MissedCallHandlingType;
  stickyAgentEnabled?: boolean;

  // Extra metadata & legacy compatibility
  autoAnswer?: boolean;
  primaryList?: string;
  addQueue?: string;
  viciCampaignId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CampaignList {
  id: string;
  tenantId: string;
  list_id: string;
  name: string;
  description: string;
  campaign: string;
  template: string;
  recycle_count: number;
  utilize_count: number;
  lead_count: number;
  status: 'Active' | 'Inactive';
}

export interface Lead {
  id: string;
  tenantId: string;
  lead_id: string;
  firstName: string;
  lastName: string;
  phone: string;
  altPhone?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  industry: string;
  template: string;
  list_id: string;
  campaign: string;
  disposition: string;
  subDisposition?: string;
  dialedCount: number;
  source: string;
  createdBy: string;
  modifiedBy: string;
  assignedAgent?: string;
  status: 'New' | 'Queued' | 'Ringing' | 'Connected' | 'Disposed' | 'Callback' | 'Failed' | 'In Progress';
  notes?: string;
  notesCount: number;
  createdAt: string;
  espoLeadId?: string | null;
}

export interface Contact {
  id: string;
  tenantId: string;
  name: string;
  phoneNumber: string;
  altPhoneNumber?: string;
  email: string;
  primaryAddress: string;
  altAddress?: string;
  city: string;
  state: string;
  country: string;
  tags: string[];
  createdAt: string;
  espoContactId?: string | null;
}

export interface Ticket {
  id: string;
  tenantId: string;
  ticketId: string;
  status: 'open' | 'pending' | 'resolved' | 'unresolve' | 'closed' | 'on_hold' | 'over_due' | 'unassigned';
  subject: string;
  dueDate: string;
  assign: string;
  phoneNumber: string;
  duration: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

export interface Meeting {
  id: string;
  tenantId: string;
  meetingTitle: string;
  meetingSubtitle: string;
  phoneNumber: string;
  agent: string;
  module: string;
  campaign: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  scheduledTime: string;
}

export interface CallLog {
  id: string;
  tenantId: string;
  dateTime?: string;
  callDate?: string;
  callTime?: string;
  callerId?: string;
  destination?: string;
  campaign: string;
  didNumber?: string;
  phoneNumber?: string;
  callType: 'Inbound' | 'Outbound' | 'MANUAL' | 'INBOUND' | 'OUTBOUND';
  queue?: string;
  agentId?: string;
  agentName: string;
  agentEmail?: string;
  team?: string;
  station?: string;
  status?: 'COMPLETE' | 'NOANSWER' | 'BUSY' | 'ANSWER' | 'DROP' | 'CANCEL';
  disposition?: string;
  dispoStatus?: string;
  talkTimes?: string;
  talkTimeSec?: number;
  duration?: string;
  durationSec?: number;
  endTime?: string;
  waitTime?: string;
  hangupBy?: 'agent' | 'caller' | 'system';
  hangupCause?: string;
  uniqueid?: string;
  subDispoStatus?: string;
  userOption?: string;
  holdTime?: string;
  viciCallId?: string | null;
  recordingUrl?: string;
}

export interface CallRecording {
  id: string;
  tenantId: string;
  leadId?: string;
  callerNumber?: string;
  callDate?: string;
  recordedAt?: string;
  phoneNumber?: string;
  campaign: string;
  callType?: 'Inbound' | 'MANUAL' | 'AUTO' | 'INBOUND' | 'OUTBOUND';
  agentId?: string;
  agentName: string;
  agentEmail?: string;
  team?: string;
  station?: string;
  talkTimes?: string;
  duration?: string;
  durationSec?: number;
  audioUrl?: string;
  recordingUrl?: string;
  uniqueid?: string;
  comments?: string;
}

export interface CallTransfer {
  id: string;
  tenantId: string;
  uniqueid: string;
  startTime: string;
  phoneNumber: string;
  type: 'ATTENDED' | 'BLIND' | 'WARM';
  agent: string;
  targetAgent?: string;
  status: 'COMPLETE' | 'FAILED' | 'CANCELLED';
  completeTime: string;
  duration: string;
}

export interface ActiveAgent {
  id?: string;
  agentId?: string;
  name?: string;
  extension?: string;
  tenantId: string;
  agent?: string;
  agentName?: string;
  team?: string;
  queue?: string;
  callType?: 'Inbound' | 'Outbound' | 'Manual' | 'Idle' | 'INBOUND' | 'OUTBOUND';
  phoneNumber?: string;
  status: 'Ready' | 'On Call' | 'Paused' | 'Wrap-up' | 'Offline' | 'Ringing' | 'INCALL' | 'WAITING' | 'PAUSED' | 'OFFLINE';
  campaign?: string;
  currentCampaign?: string;
  callState?: string;
  callDurationSec?: number;
  callsToday?: number;
  lastCallTime?: string;
  currentCustomerPhone?: string;
  currentChannel?: string;
  pauseReason?: string;
  duration?: string;
  dialerStatus?: 'PAUSED' | 'INCALL' | 'CLOSER' | 'READY' | 'DISPO';
  customerName?: string;
  channels?: number;
  maxChannels?: number;
  viciAgentId?: string;
}

export interface LiveCall {
  id?: string;
  channelId?: string;
  tenantId: string;
  callerNumber?: string;
  agentId?: string;
  agentName?: string;
  callDate?: string;
  queue?: string;
  phoneNumber?: string;
  callType?: 'Inbound' | 'Outbound' | 'Manual' | 'Inbound Customer Inquiry' | 'Outbound Predictive Blast' | 'Medical Intake Hotline' | string;
  direction?: 'INBOUND' | 'OUTBOUND' | 'MANUAL';
  agent?: string;
  station?: string;
  answerTime?: string;
  callDurationSec?: number;
  status: 'CONNECTED' | 'RINGING' | 'WAITING' | 'IVR' | 'TALKING';
  duration?: string;
  campaign?: string;
}

export type RingingStrategyType =
  | 'Random'
  | 'Ring All (Simultaneous)'
  | 'Round Robin'
  | 'Fewest Calls'
  | 'Least Recent'
  | 'Linear'
  | 'Skill-based'
  | 'Sticky Agent';

export interface QueueItem {
  id: string;
  tenantId: string;
  queueName: string;
  ringingStrategy: RingingStrategyType;
  visitTimeoutSec: number;
  assignedAgents: string[];
  description?: string;
  musicOnHold?: string;
  status: 'Active' | 'Inactive';
}

export type QueueConfig = QueueItem;

export interface DispositionItem {
  id: string;
  tenantId: string;
  disposition: string;
  code?: string;
  description: string;
  category?: 'Positive' | 'Neutral' | 'Negative' | 'System';
  autoSmsTrigger?: boolean;
  dncFlag?: boolean;
  callbackFlag?: boolean;
  status: 'Active' | 'Inactive';
}

export type DispositionConfig = DispositionItem;

export interface PauseCodeItem {
  id: string;
  tenantId: string;
  pauseCode: string;
  code?: string;
  description: string;
  type: 'billing' | 'non-billing';
  status: 'Active' | 'Inactive';
  durationLimit: string;
}

export type PauseCodeConfig = PauseCodeItem;

export interface DIDItem {
  id: string;
  tenantId: string;
  didNumber: string;
  application: string;
  assignedCampaign?: string;
  assignedQueue?: string;
  status: 'Active' | 'Inactive';
}

export interface BlockedNumberItem {
  id: string;
  tenantId: string;
  phoneNumber: string;
  reason: string;
  type: 'DNC' | 'BLOCKED' | 'CAMPAIGN_DNC';
  campaignId?: string;
  campaignName?: string;
  addedBy: string;
  createdAt: string;
  status: 'Active' | 'Inactive';
}

export interface InboundRouteRule {
  id: string;
  tenantId: string;
  didNumber: string;
  application: 'Queue' | 'IVR' | 'Agent' | 'Sticky-Agent' | 'Parallel Ringing' | 'Time-based' | 'Overflow';
  target: string;
  fallbackTarget: string;
  status: 'Active' | 'Inactive';
  timeCondition?: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  };
}

export interface StickyAgentRule {
  id: string;
  tenantId: string;
  customerPhone: string;
  preferredAgentId: string;
  preferredAgentName: string;
  campaign: string;
  lastCallDate: string;
  fallbackQueue: string;
  isActive: boolean;
}

export interface ParallelRingingConfig {
  id: string;
  tenantId: string;
  didNumber: string;
  queueName: string;
  agentIds: string[];
  ringTimeoutSec: number;
  strategy: 'Simultaneous' | 'Tiered';
  status: 'Active' | 'Inactive';
}

export interface SMSTemplate {
  id: string;
  tenantId: string;
  name: string;
  content: string;
  variables: string[];
  status: 'Active' | 'Inactive';
}

export interface SMSTrigger {
  id: string;
  tenantId: string;
  name: string;
  triggerEvent: 'Call Completed' | 'Disposition Set' | 'Callback Scheduled' | 'Lead Created';
  dispositionCondition: string;
  campaignId: string;
  smsTemplateId: string;
  smsTemplateName: string;
  enabled: boolean;
}

export interface SMSLog {
  id: string;
  tenantId: string;
  triggerName: string;
  recipientPhone: string;
  message: string;
  campaign: string;
  disposition: string;
  status: 'Delivered' | 'Sent' | 'Failed' | 'Queued';
  sentAt: string;
  gatewayRef: string;
}

export interface SurveyQuestion {
  id: string;
  title: string;
  type: 'Text' | 'Dropdown' | 'Radio' | 'Checkbox' | 'Rating' | 'Number' | 'Date';
  options?: string[];
  required: boolean;
}

export interface SurveyForm {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  campaignIds: string[];
  questions: SurveyQuestion[];
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface SurveyResponse {
  id: string;
  tenantId: string;
  surveyId: string;
  surveyTitle: string;
  campaign: string;
  agentId: string;
  agentName: string;
  leadId: string;
  customerPhone: string;
  answers: Record<string, any>;
  submittedAt: string;
}

export interface CallScript {
  id: string;
  tenantId: string;
  scriptName: string;
  description: string;
  type: 'Sales' | 'Support' | 'Verification' | 'Survey';
  content: string;
  campaignIds: string[];
  status: 'Active' | 'Inactive';
}

export interface ImpersonationLog {
  id: string;
  masterAdminUser: string;
  tenantId: string;
  tenantName?: string;
  agentId: string;
  agentName?: string;
  reason: string;
  startedAt: string;
  endedAt?: string | null;
  expiresAt: string;
  sourceIp: string;
  status: 'ACTIVE' | 'EXPIRED' | 'ENDED';
}

export interface AuditLog {
  id: string;
  tenantId: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: 'ADMIN_LOGIN' | 'AGENT_LOGIN' | 'LOGOUT' | 'LOGIN_AS_AGENT' | 'EXIT_IMPERSONATION' | 'CAMPAIGN_CREATE' | 'CAMPAIGN_UPDATE' | 'LEAD_UPLOAD' | 'SURVEY_EXPORT' | 'CALL_LISTEN' | 'ROUTING_UPDATE' | 'SMS_DISPATCH' | string;
  details: string;
  ipAddress: string;
}
