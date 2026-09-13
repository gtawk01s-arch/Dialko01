import React from 'react';
import {
  Phone,
  PhoneOff,
  PhoneCall,
  PhoneForwarded,
  Mic,
  MicOff,
  Pause,
  Play,
  LogOut,
  User,
  Users,
  Clock,
  Send,
  FileText,
  Calendar,
  MessageSquare,
  Search,
  Plus,
  Info,
  Check,
  X,
  Star,
  Grid3X3,
  Bell,
  Mail,
  Grid,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  Sparkles,
  RotateCcw,
  Sliders,
  Radio,
  Building2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  CalendarClock,
  Shield,
  Lock,
  History,
  Eye,
  Megaphone,
  CheckSquare,
  Square,
  Share2
} from 'lucide-react';
import {
  User as UserType,
  Tenant,
  Lead,
  Contact,
  Meeting,
  SMSTemplate,
  SurveyForm,
  Campaign,
  DispositionConfig,
  PauseCodeConfig,
  QueueConfig
} from '../types/index.js';

interface AgentWorkspacePageProps {
  currentUser: UserType;
  activeTenant: Tenant;
  onLogout: () => void;
  initialCampaign?: string;
  initialQueues?: string[];
}

export const AgentWorkspacePage: React.FC<AgentWorkspacePageProps> = ({
  currentUser,
  activeTenant,
  onLogout,
  initialCampaign = 'RIYA001',
  initialQueues = ['queue_sales_807889336']
}) => {
  // Active Campaign & Queues (with dynamic campaign switching)
  const [activeCampaign, setActiveCampaign] = React.useState<string>(initialCampaign);
  const [activeQueues, setActiveQueues] = React.useState<string[]>(initialQueues);
  const [availableCampaigns, setAvailableCampaigns] = React.useState<Campaign[]>([]);
  const [showSwitchCampaignModal, setShowSwitchCampaignModal] = React.useState(false);
  const [tempSelectedCampaign, setTempSelectedCampaign] = React.useState(initialCampaign);
  const [tempSelectedQueues, setTempSelectedQueues] = React.useState<string[]>(initialQueues);

  // Dynamic Telephony Settings from Server
  const [configuredDispositions, setConfiguredDispositions] = React.useState<DispositionConfig[]>([]);
  const [configuredPauseCodes, setConfiguredPauseCodes] = React.useState<PauseCodeConfig[]>([]);
  const [configuredQueues, setConfiguredQueues] = React.useState<QueueConfig[]>([]);

  // Navigation Views: 'dashboard' (Agent Personal Reports) | 'dispositionHistory' (Call & Redial History) | 'callWorkspace' | 'contacts' | 'meetings' | 'script'
  const [currentView, setCurrentView] = React.useState<
    'dashboard' | 'dispositionHistory' | 'callWorkspace' | 'contacts' | 'meetings' | 'script'
  >('dashboard');

  // Customer sub-tab inside Call Workspace: 'survey' | 'details' | 'history' | 'comments'
  const [customerSubTab, setCustomerSubTab] = React.useState<'survey' | 'details' | 'history' | 'comments'>('survey');

  // Softphone / Station States: READY, INCALL, PAUSED, WRAPUP
  const [agentStatus, setAgentStatus] = React.useState<'READY' | 'INCALL' | 'PAUSED' | 'WRAPUP'>('READY');
  const [activePauseCode, setActivePauseCode] = React.useState('Lunch');
  const [showPauseMenu, setShowPauseMenu] = React.useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = React.useState(false);

  // Softphone Dock (Right Sidebar)
  const [dockTab, setDockTab] = React.useState<'history' | 'contacts' | 'dialPad'>('history');
  const [callLogFilter, setCallLogFilter] = React.useState<'all' | 'SALE' | 'INTERESTED' | 'CALLBACK' | 'DNC'>('all');
  const [callLogSearch, setCallLogSearch] = React.useState('');
  const [isMuted, setIsMuted] = React.useState(false);
  const [isOnHold, setIsOnHold] = React.useState(false);
  const [callDuration, setCallDuration] = React.useState(0);
  const [loginTimeSec, setLoginTimeSec] = React.useState(1800);
  const [dialPadNumber, setDialPadNumber] = React.useState('');

  // Dispo countdown timer & Post-Call Wrap-up State
  const [dispoCountdown, setDispoCountdown] = React.useState(30);
  const [selectedDispo, setSelectedDispo] = React.useState('');
  const [dispoNotes, setDispoNotes] = React.useState('');
  const [callbackDateTime, setCallbackDateTime] = React.useState('');

  // Active Lead / Customer in Detail View
  const [currentLead, setCurrentLead] = React.useState<any>({
    id: 'ld-1',
    lead_id: '6',
    firstName: 'Aarav',
    lastName: 'Sharma',
    phone: '9304206595',
    altPhone: '9304206596',
    email: 'aarav.sharma@enterprise.in',
    address: 'Indiranagar 100ft Road, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    user: currentUser.emailId || 'agent01@zeedial.com',
    tags: ['VIP', 'Hot Lead', 'Telecom Upgrade'],
    associatedContacts: 'Ravi Tech Corp',
    leadStatus: 'In Discussion',
    source: 'Outbound Campaign',
    comments: 'Customer requested quick deployment of 25 SIP lines and EspoCRM sync.'
  });

  // Call Records / Disposition History (Agent's personal logged call outcomes for re-dialing)
  const [agentDispoHistory, setAgentDispoHistory] = React.useState<any[]>([
    {
      id: 'dh-1',
      phone: '9304206595',
      customerName: 'Aarav Sharma',
      campaign: 'RIYA001',
      disposition: 'INTERESTED',
      notes: 'Customer interested in 25 SIP lines. Call back after 4 PM.',
      timestamp: '2026-08-27 10:45 AM',
      duration: '04:12',
      callbackScheduled: '2026-08-27 16:00'
    },
    {
      id: 'dh-2',
      phone: '9980807408',
      customerName: 'Pooja Verma',
      campaign: 'RIYA001',
      disposition: 'CALLBACK',
      notes: 'Busy in meeting, asked to call tomorrow at 11 AM.',
      timestamp: '2026-08-27 10:15 AM',
      duration: '01:05',
      callbackScheduled: '2026-08-28 11:00'
    },
    {
      id: 'dh-3',
      phone: '9172199999',
      customerName: 'Vikram Joshi',
      campaign: 'MAHI002',
      disposition: 'SALE',
      notes: 'Deal closed! Contract sent via email for signature.',
      timestamp: '2026-08-27 09:40 AM',
      duration: '08:34',
      callbackScheduled: null
    },
    {
      id: 'dh-4',
      phone: '8866033902',
      customerName: 'Kavita Reddy',
      campaign: 'RIYA001',
      disposition: 'NOT_INTERESTED',
      notes: 'Current contract valid for 6 months.',
      timestamp: '2026-08-27 09:12 AM',
      duration: '02:10',
      callbackScheduled: null
    },
    {
      id: 'dh-5',
      phone: '9508742634',
      customerName: 'Rajesh Nair',
      campaign: 'NISHA 005',
      disposition: 'DNC',
      notes: 'Customer requested number removal.',
      timestamp: '2026-08-26 05:20 PM',
      duration: '00:45',
      callbackScheduled: null
    }
  ]);

  // Data Store Lists
  const [contactsList, setContactsList] = React.useState<Contact[]>([]);
  const [meetingsList, setMeetingsList] = React.useState<Meeting[]>([]);
  const [surveyForms, setSurveyForms] = React.useState<SurveyForm[]>([]);
  const [activeSurvey, setActiveSurvey] = React.useState<SurveyForm | null>(null);

  // Live Survey Answers State
  const [surveyAnswers, setSurveyAnswers] = React.useState<Record<string, any>>({
    provider: 'VICIdial Native',
    seats: 25,
    primaryFocus: 'Predictive Outbound',
    interestRating: 5,
    targetDate: '2026-09-01',
    callSummary: 'Customer requires high concurrency dialer with CRM sync and instant SMS alerts.'
  });

  // SMS Templates & Trigger Modal State
  const [smsTemplates, setSmsTemplates] = React.useState<SMSTemplate[]>([]);
  const [showSmsModal, setShowSmsModal] = React.useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState('');
  const [customSmsMessage, setCustomSmsMessage] = React.useState('');
  const [toastMessage, setToastMessage] = React.useState<string | null>('Agent Station Ready');

  // Contact & Meeting Modals
  const [showAddContactModal, setShowAddContactModal] = React.useState(false);
  const [newContactForm, setNewContactForm] = React.useState({
    name: '',
    phoneNumber: '',
    altPhoneNumber: '',
    email: '',
    primaryAddress: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    tags: 'Sales Lead'
  });

  const [showCreateMeetingModal, setShowCreateMeetingModal] = React.useState(false);
  const [newMeetingForm, setNewMeetingForm] = React.useState({
    meetingTitle: '',
    phoneNumber: '9304206595',
    module: 'Sales',
    scheduleDate: '2026-08-27 16:00',
    description: ''
  });

  // Current campaign object & properties
  const currentCampaignObj = React.useMemo(() => {
    return (
      availableCampaigns.find(c => c.name.toLowerCase() === activeCampaign.toLowerCase()) ||
      availableCampaigns[0] ||
      null
    );
  }, [availableCampaigns, activeCampaign]);

  // Number Masking Helper: if callMasking is true on campaign, mask as XXXXXXX95
  const formatCustomerNumber = (phoneStr: string) => {
    if (!phoneStr) return '-';
    if (currentCampaignObj?.callMasking) {
      if (phoneStr.length > 2) {
        return 'X'.repeat(phoneStr.length - 2) + phoneStr.slice(-2);
      }
      return 'XX';
    }
    return phoneStr;
  };

  // Campaign-Mapped Dispositions strictly filtered to logged-in campaign
  const campaignMappedDispositions = React.useMemo(() => {
    if (currentCampaignObj && Array.isArray(currentCampaignObj.dispositionStatuses) && currentCampaignObj.dispositionStatuses.length > 0) {
      return currentCampaignObj.dispositionStatuses;
    }
    if (configuredDispositions.length > 0) {
      return configuredDispositions.map(d => d.disposition || d.code || '');
    }
    return ['SALE', 'INTERESTED', 'CALLBACK', 'NOT_INTERESTED', 'DNC', 'CALL_LATER'];
  }, [currentCampaignObj, configuredDispositions]);

  // Campaign-Mapped Pause Codes
  const campaignMappedPauseCodes = React.useMemo(() => {
    if (currentCampaignObj && Array.isArray(currentCampaignObj.pauseCodes) && currentCampaignObj.pauseCodes.length > 0) {
      return currentCampaignObj.pauseCodes;
    }
    if (configuredPauseCodes.length > 0) {
      return configuredPauseCodes.map(p => p.pauseCode || p.code || '');
    }
    return ['Lunch', 'Tea Break', 'Team Meeting', 'Training', 'Washroom', 'Personal'];
  }, [currentCampaignObj, configuredPauseCodes]);

  // Toast Auto-Dismiss
  React.useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Session & Call Timers + Auto-Dispo Wrap-up Countdown
  React.useEffect(() => {
    const timer = setInterval(() => {
      setLoginTimeSec(prev => prev + 1);
      if (agentStatus === 'INCALL') {
        setCallDuration(prev => prev + 1);
      }
      if (agentStatus === 'WRAPUP') {
        setDispoCountdown(prev => {
          if (prev <= 1) {
            // Auto-Dispo trigger when timer runs out
            const autoVal = currentCampaignObj?.autoDispoValue || selectedDispo || campaignMappedDispositions[0] || 'CALL_LATER';
            handleCompleteDisposition(autoVal);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [agentStatus, campaignMappedDispositions, currentCampaignObj, selectedDispo]);

  // Load Initial Tenant, Campaign, and Configuration Data
  const fetchData = React.useCallback(async () => {
    try {
      const [contactsRes, meetingsRes, surveysRes, smsRes, campsRes, dispoRes, pauseRes, queuesRes] = await Promise.all([
        fetch(`/api/contacts?tenantId=${activeTenant.id}`),
        fetch(`/api/meetings?tenantId=${activeTenant.id}`),
        fetch(`/api/surveys?tenantId=${activeTenant.id}`),
        fetch(`/api/sms/templates?tenantId=${activeTenant.id}`),
        fetch(`/api/campaigns?tenantId=${activeTenant.id}`),
        fetch(`/api/configurations/dispositions?tenantId=${activeTenant.id}`),
        fetch(`/api/configurations/pause-codes?tenantId=${activeTenant.id}`),
        fetch(`/api/configurations/queues?tenantId=${activeTenant.id}`)
      ]);

      const [contacts, meetings, surveys, sms, camps, dispos, pauses, queues] = await Promise.all([
        contactsRes.json(),
        meetingsRes.json(),
        surveysRes.json(),
        smsRes.json(),
        campsRes.json(),
        dispoRes.json(),
        pauseRes.json(),
        queuesRes.json()
      ]);

      if (Array.isArray(contacts)) setContactsList(contacts);
      if (Array.isArray(meetings)) setMeetingsList(meetings);
      if (Array.isArray(camps) && camps.length > 0) {
        setAvailableCampaigns(camps);
      }
      if (Array.isArray(surveys) && surveys.length > 0) {
        setSurveyForms(surveys);
        setActiveSurvey(surveys[0]);
      }
      if (Array.isArray(sms) && sms.length > 0) {
        setSmsTemplates(sms);
        setSelectedTemplateId(sms[0].id);
      }
      if (Array.isArray(dispos)) setConfiguredDispositions(dispos);
      if (Array.isArray(pauses)) setConfiguredPauseCodes(pauses);
      if (Array.isArray(queues)) setConfiguredQueues(queues);
    } catch (err) {
      console.error('Agent data loading error', err);
    }
  }, [activeTenant.id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format seconds to HH:MM:SS
  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Dial a number (Transitions to IN-CALL and auto-opens Call Workspace with Live Survey)
  const handleDialNumber = (phoneNumber: string, customerName?: string) => {
    setCurrentLead((prev: any) => ({
      ...prev,
      phone: phoneNumber,
      firstName: customerName ? customerName.split(' ')[0] : prev.firstName || 'Customer',
      lastName: customerName ? customerName.split(' ').slice(1).join(' ') : prev.lastName || 'Lead'
    }));
    setCallDuration(0);
    setAgentStatus('INCALL');
    setCurrentView('callWorkspace');
    setCustomerSubTab('survey');
    setToastMessage(`Call connected to ${formatCustomerNumber(phoneNumber)}`);
  };

  // Hangup call -> Enter WRAPUP mode immediately with Auto-dispo timer
  const handleHangupCall = () => {
    setAgentStatus('WRAPUP');
    const wrapSec = currentCampaignObj?.autoDispoTimerSec || currentCampaignObj?.wrapTimeSec || 15;
    const defaultDispo = currentCampaignObj?.autoDispoValue || campaignMappedDispositions[0] || 'CALL_LATER';
    setDispoCountdown(wrapSec);
    setSelectedDispo(defaultDispo);
    setToastMessage(`Call ended. Wrap-up auto-disposition in ${wrapSec}s.`);
  };

  // Fetch Next Lead from Active Campaign Hopper
  const fetchNextLead = React.useCallback(async (autoDialOnLoad: boolean = false) => {
    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(activeCampaign)}/next-lead?tenantId=${activeTenant.id}`);
      const data = await res.json();
      if (data.success && data.lead) {
        setCurrentLead({
          id: data.lead.id,
          lead_id: data.lead.lead_id || '1',
          firstName: data.lead.firstName || 'Customer',
          lastName: data.lead.lastName || 'Lead',
          phone: data.lead.phone || '9999999999',
          altPhone: data.lead.altPhone || '',
          email: data.lead.email || '',
          address: data.lead.address || 'Bengaluru, India',
          city: data.lead.city || 'Bengaluru',
          state: data.lead.state || 'Karnataka',
          country: data.lead.country || 'India',
          user: currentUser.emailId || 'agent@zeedial.com',
          tags: [data.lead.industry || 'Telecom', 'Auto-Hopper'],
          associatedContacts: data.lead.lastName || 'Enterprise Corp',
          leadStatus: data.lead.status || 'In Progress',
          source: data.lead.source || activeCampaign,
          comments: data.lead.notes || 'Fetched from campaign lead hopper'
        });

        setToastMessage(`Hopper loaded lead #${data.lead.lead_id} (${data.lead.firstName} ${data.lead.lastName})`);

        if (autoDialOnLoad) {
          handleDialNumber(data.lead.phone, `${data.lead.firstName} ${data.lead.lastName}`);
        }
      }
    } catch (err) {
      console.error('Failed to fetch next hopper lead', err);
    }
  }, [activeCampaign, activeTenant.id, currentUser.emailId]);

  // Select disposition & Complete Wrap-Up
  const handleCompleteDisposition = async (dispoToSave?: string) => {
    const finalDispo = dispoToSave || selectedDispo || campaignMappedDispositions[0] || 'INTERESTED';

    // Record into local Agent Disposition History for instant re-dialing
    const newRecord = {
      id: `dh-${Date.now()}`,
      phone: currentLead.phone,
      customerName: `${currentLead.firstName} ${currentLead.lastName}`.trim(),
      campaign: activeCampaign,
      disposition: finalDispo,
      notes: dispoNotes || 'Standard call wrap-up completed.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: formatTimer(callDuration),
      callbackScheduled: callbackDateTime || null
    };

    setAgentDispoHistory([newRecord, ...agentDispoHistory]);

    try {
      // Call Unified Backend Pipeline
      const res = await fetch('/api/agent/disposition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify({
          leadId: currentLead.id,
          customerPhone: currentLead.phone,
          customerName: `${currentLead.firstName} ${currentLead.lastName}`.trim(),
          campaign: activeCampaign,
          queue: activeQueues[0] || 'Sales_Queue',
          disposition: finalDispo,
          notes: dispoNotes || `Call completed by ${currentUser.name}`,
          callbackDateTime: callbackDateTime || undefined,
          callDuration: formatTimer(callDuration),
          surveyAnswers: Object.keys(surveyAnswers).length > 0 ? surveyAnswers : undefined,
          surveyId: activeSurvey?.id
        })
      });

      const data = await res.json();

      if (data.createdMeeting) {
        setMeetingsList(prev => [data.createdMeeting, ...prev]);
      }

      if (data.nextLead) {
        setCurrentLead({
          id: data.nextLead.id,
          lead_id: data.nextLead.lead_id || '1',
          firstName: data.nextLead.firstName || 'Customer',
          lastName: data.nextLead.lastName || 'Lead',
          phone: data.nextLead.phone || '9999999999',
          altPhone: data.nextLead.altPhone || '',
          email: data.nextLead.email || '',
          address: data.nextLead.address || 'Bengaluru, India',
          city: data.nextLead.city || 'Bengaluru',
          state: data.nextLead.state || 'Karnataka',
          country: data.nextLead.country || 'India',
          user: currentUser.emailId || 'agent@zeedial.com',
          tags: [data.nextLead.industry || 'Telecom', 'Auto-Hopper'],
          associatedContacts: data.nextLead.lastName || 'Enterprise Corp',
          leadStatus: data.nextLead.status || 'In Progress',
          source: data.nextLead.source || activeCampaign,
          comments: data.nextLead.notes || 'Fetched from campaign lead hopper'
        });
      }
    } catch (e) {
      console.error('Failed to execute unified disposition pipeline', e);
    }

    setToastMessage(`Call marked as [${finalDispo}]`);
    setAgentStatus('READY');
    setDispoCountdown(30);
    setDispoNotes('');
    setCallbackDateTime('');

    // If dispo is interested or callback, optionally trigger SMS confirmation
    if (finalDispo === 'INTERESTED' || finalDispo === 'CALLBACK') {
      setShowSmsModal(true);
    }
  };

  // Save Survey Responses
  const handleSaveSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/surveys/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify({
          surveyId: activeSurvey?.id || 'sv-1',
          surveyTitle: activeSurvey?.title || 'Customer Call Survey',
          campaign: activeCampaign,
          leadId: currentLead.lead_id || '6',
          customerPhone: currentLead.phone,
          answers: surveyAnswers
        })
      });
      if (res.ok) {
        setToastMessage('Survey & call notes saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save survey', err);
    }
  };

  // Send Instant Post-Call SMS
  const handleSendSms = async () => {
    if (!currentLead.phone) return;
    try {
      await fetch('/api/sms/send-instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify({
          phoneNumber: currentLead.phone,
          templateId: selectedTemplateId,
          leadName: `${currentLead.firstName} ${currentLead.lastName}`.trim(),
          message: customSmsMessage || undefined
        })
      });
      setShowSmsModal(false);
      setToastMessage(`Instant SMS dispatched to ${formatCustomerNumber(currentLead.phone)}!`);
    } catch (err) {
      console.error('Failed to send SMS', err);
    }
  };

  // Calculate Available Queues for selected Campaign in Switch Modal
  const selectedCampObjInModal = React.useMemo(() => {
    return availableCampaigns.find(c => c.name === tempSelectedCampaign) || availableCampaigns[0] || null;
  }, [availableCampaigns, tempSelectedCampaign]);

  const mappedQueuesForSelectedCamp = React.useMemo(() => {
    if (selectedCampObjInModal) {
      if (Array.isArray(selectedCampObjInModal.mappedQueues) && selectedCampObjInModal.mappedQueues.length > 0) {
        return selectedCampObjInModal.mappedQueues;
      }
      if (selectedCampObjInModal.queue) {
        return [selectedCampObjInModal.queue];
      }
    }
    return ['Sales_Outbound_Queue', 'General_Support_Queue'];
  }, [selectedCampObjInModal]);

  // When switching campaign selection inside modal, automatically update available queues
  const handleSelectCampaignInModal = (campName: string) => {
    setTempSelectedCampaign(campName);
    const targetCamp = availableCampaigns.find(c => c.name === campName);
    const available = targetCamp?.mappedQueues && targetCamp.mappedQueues.length > 0
      ? targetCamp.mappedQueues
      : [targetCamp?.queue || 'Sales_Outbound_Queue'];
    setTempSelectedQueues(available);
  };

  // Apply Campaign Switch
  const handleApplyCampaignSwitch = () => {
    setActiveCampaign(tempSelectedCampaign);
    setActiveQueues(tempSelectedQueues);
    setShowSwitchCampaignModal(false);
    setToastMessage(`Switched to campaign [${tempSelectedCampaign}] with ${tempSelectedQueues.length} queue(s)`);
  };

  // Schedule Callback / Meeting
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingForm.meetingTitle || !newMeetingForm.phoneNumber) return;
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify({
          meetingTitle: newMeetingForm.meetingTitle,
          phoneNumber: newMeetingForm.phoneNumber,
          module: newMeetingForm.module,
          scheduledTime: newMeetingForm.scheduleDate,
          agent: currentUser.userId,
          campaign: activeCampaign
        })
      });
      const data = await res.json();
      setMeetingsList([data, ...meetingsList]);
      setShowCreateMeetingModal(false);
      setToastMessage('Callback scheduled successfully!');
      setNewMeetingForm({
        meetingTitle: '',
        phoneNumber: '9304206595',
        module: 'Sales',
        scheduleDate: '2026-08-27 16:00',
        description: ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Add Contact
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactForm.name || !newContactForm.phoneNumber) return;
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify({
          ...newContactForm,
          tags: newContactForm.tags.split(',').map(t => t.trim())
        })
      });
      const data = await res.json();
      setContactsList([data, ...contactsList]);
      setShowAddContactModal(false);
      setToastMessage('Contact added successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Disposition History list
  const filteredDispoHistory = agentDispoHistory.filter(item => {
    const matchesFilter = callLogFilter === 'all' || item.disposition === callLogFilter;
    const matchesSearch = item.phone.includes(callLogSearch) || item.customerName.toLowerCase().includes(callLogSearch.toLowerCase()) || (item.notes && item.notes.toLowerCase().includes(callLogSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div id="zeedial-agent-panel-root" className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 select-none antialiased">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & SOFTPHONE TELEPHONY BAR                                   */}
      {/* ========================================================================= */}
      <header className="bg-slate-900 text-white shadow-md px-4 py-2.5 flex items-center justify-between sticky top-0 z-40">
        
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              Z
            </div>
            <div className="leading-tight">
              <span className="font-bold text-base text-white tracking-tight block">Zeedial</span>
              <span className="text-[10px] text-slate-400 block font-medium">Agent Workspace</span>
            </div>
          </div>

          {/* Primary View Switcher */}
          <nav className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            {/* View 1: Agent Personal Dashboard Report */}
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentView === 'dashboard' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>My Reports</span>
            </button>

            {/* View 2: Disposition History & Re-Call (Meeting / History Icon) */}
            <button
              onClick={() => setCurrentView('dispositionHistory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentView === 'dispositionHistory' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
              <span>Disposition History</span>
            </button>

            {/* View 3: Live Call & Survey Workspace */}
            <button
              onClick={() => {
                setCurrentView('callWorkspace');
                setCustomerSubTab('survey');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentView === 'callWorkspace'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-700'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Live Call & Survey</span>
            </button>

            {/* View 4: Contacts */}
            <button
              onClick={() => setCurrentView('contacts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentView === 'contacts' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Contacts</span>
            </button>

            {/* View 5: Meetings / Callbacks */}
            <button
              onClick={() => setCurrentView('meetings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentView === 'meetings' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Meetings</span>
            </button>

            {/* View 6: Pitch Script */}
            <button
              onClick={() => setCurrentView('script')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentView === 'script' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Script</span>
            </button>
          </nav>
        </div>

        {/* Center: Current Campaign & Quick Switch */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
            <span className="text-[11px] text-slate-400 font-medium">Campaign:</span>
            <span className="font-bold text-xs text-sky-400 font-mono">{activeCampaign}</span>
            {currentCampaignObj?.didRotateStrategy && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700 flex items-center gap-1 font-mono" title={`DID Rotation Strategy: ${currentCampaignObj.didRotateStrategy} (${currentCampaignObj.didNumbers?.length || 1} Pool DIDs)`}>
                <Share2 className="w-2.5 h-2.5 text-indigo-400" />
                <span>{currentCampaignObj.didRotateStrategy}</span>
              </span>
            )}
            {currentCampaignObj?.callMasking && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-700 flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> Masked
              </span>
            )}
            <button
              onClick={() => {
                setTempSelectedCampaign(activeCampaign);
                setTempSelectedQueues(activeQueues);
                setShowSwitchCampaignModal(true);
              }}
              className="ml-1.5 px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold rounded flex items-center gap-1 transition cursor-pointer shadow-xs"
              title="Switch Campaign or Mapped Queues"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Switch</span>
            </button>
          </div>
        </div>

        {/* Right: Softphone Status Pill & Agent Controls */}
        <div className="flex items-center gap-3">
          
          {/* Status Badge Toggle */}
          {agentStatus === 'READY' && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                Ready (Auto-Dialing)
              </span>
              <button
                onClick={() => setShowPauseMenu(!showPauseMenu)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer"
                title="Take a break"
              >
                <Pause className="w-3 h-3" />
                <span>Pause</span>
              </button>
            </div>
          )}

          {agentStatus === 'INCALL' && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs flex items-center gap-1.5 animate-pulse">
                <PhoneCall className="w-3.5 h-3.5" />
                On Call ({formatTimer(callDuration)})
              </span>
              <button
                onClick={handleHangupCall}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
              >
                <PhoneOff className="w-3 h-3" />
                <span>End Call</span>
              </button>
            </div>
          )}

          {agentStatus === 'PAUSED' && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-xs flex items-center gap-1.5">
                <Pause className="w-3 h-3" />
                Paused ({activePauseCode})
              </span>
              <button
                onClick={() => {
                  setAgentStatus('READY');
                  setToastMessage('Agent status set to READY');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>Resume</span>
              </button>
            </div>
          )}

          {agentStatus === 'WRAPUP' && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-900 shadow-xs flex items-center gap-1.5 animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              Wrap-Up ({dispoCountdown}s)
            </span>
          )}

          {/* Pause Code Popover */}
          {showPauseMenu && (
            <div className="absolute top-14 right-44 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in w-48 text-xs">
              <span className="block font-bold text-slate-400 text-[10px] uppercase px-2 py-1">Select Pause Reason</span>
              <div className="space-y-1">
                {campaignMappedPauseCodes.map(code => (
                  <button
                    key={code}
                    onClick={() => {
                      setActivePauseCode(code);
                      setAgentStatus('PAUSED');
                      setShowPauseMenu(false);
                      setToastMessage(`Agent Paused: ${code}`);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-sky-50 hover:text-sky-600 rounded-lg font-semibold transition cursor-pointer flex items-center justify-between"
                  >
                    <span>{code}</span>
                    <Pause className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="h-6 w-px bg-slate-700" />
          
          <div className="text-right hidden sm:block">
            <span className="block text-xs font-semibold text-slate-200">{currentUser.name || 'Agent User'}</span>
            <span className="text-[10px] text-slate-400 font-mono">Ext: {currentUser.mobileExtension || '1011'}</span>
          </div>

          <button
            onClick={() => setShowProfileDrawer(true)}
            className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs hover:ring-2 hover:ring-sky-400 cursor-pointer"
            title="User Profile & Station Info"
          >
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
          </button>

        </div>

      </header>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 text-xs font-medium animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE VIEW ROUTER                                             */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Main Center Stage */}
        <main className="flex-1 p-5 overflow-y-auto bg-slate-50">
          
          {/* ========================================================================= */}
          {/* VIEW 1: AGENT REPORTS & PERFORMANCE DASHBOARD (User Request #1 - No Leads)*/}
          {/* ========================================================================= */}
          {currentView === 'dashboard' && (
            <div className="space-y-5 max-w-7xl mx-auto animate-in fade-in">
              
              {/* Top Banner with Agent's Personal Performance Metrics */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>Agent Shift Report: {currentUser.name || 'Somnath Lead Agent'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      Live Telephony Stats
                    </span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Personal calling metrics, talk time, break utilization, and conversion statistics for campaign <strong className="text-sky-700">{activeCampaign}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span>Session: <strong>{formatTimer(loginTimeSec)}</strong></span>
                </div>
              </div>

              {/* KPI Summary Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
                    <span className="font-semibold">Calls Handled Today</span>
                    <PhoneCall className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">113</div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                    85 Connected (75.2%)
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
                    <span className="font-semibold">Total Talk Time</span>
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700 font-mono">05:17:29</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    Avg Talk Time: <strong className="text-slate-800">03:42</strong>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
                    <span className="font-semibold">Break & Pause Time</span>
                    <Pause className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-600 font-mono">00:45:40</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    3 breaks taken (Lunch: 30m)
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
                    <span className="font-semibold">Conversions & Sales</span>
                    <Star className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black text-purple-700 font-mono">18 Deals</div>
                  <div className="text-[11px] text-purple-700 font-bold mt-1">
                    Conversion: 21.1%
                  </div>
                </div>
              </div>

              {/* Mid Row: Hourly Call Activity + Disposition Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* Hourly Performance Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Your Hourly Call Volume</h3>
                      <p className="text-xs text-slate-500">Calls connected and customer interactions by hour</p>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">Shift: 09:00 - 18:00</span>
                  </div>

                  <div className="grid grid-cols-8 gap-2 items-end h-44 pt-3 pb-2 border-b border-slate-100">
                    {[
                      { hour: '09:00', total: 10, answered: 7 },
                      { hour: '10:00', total: 18, answered: 14 },
                      { hour: '11:00', total: 22, answered: 17 },
                      { hour: '12:00', total: 20, answered: 15 },
                      { hour: '13:00', total: 6, answered: 4 }, // lunch break
                      { hour: '14:00', total: 16, answered: 12 },
                      { hour: '15:00', total: 14, answered: 11 },
                      { hour: '16:00', total: 7, answered: 5 }
                    ].map(item => (
                      <div key={item.hour} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                        <div className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.answered}/{item.total}
                        </div>
                        <div className="w-full max-w-[32px] bg-sky-100 rounded-t-md relative flex flex-col justify-end overflow-hidden" style={{ height: `${(item.total / 25) * 100}%` }}>
                          <div className="w-full bg-sky-600 rounded-t-xs" style={{ height: `${(item.answered / item.total) * 100}%` }}></div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{item.hour}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-3 text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-sky-600 rounded-xs"></span> Connected Calls
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-sky-100 rounded-xs"></span> Attempted Dialing
                    </span>
                  </div>
                </div>

                {/* Personal Disposition Outcomes */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 mb-1">Your Dispositions Marked</h3>
                    <p className="text-xs text-slate-500 mb-4">Breakdown of calls marked today</p>

                    <div className="space-y-3">
                      {[
                        { dispo: 'SALE', count: 18, pct: 21.1, color: 'bg-emerald-500' },
                        { dispo: 'INTERESTED', count: 28, pct: 32.9, color: 'bg-sky-500' },
                        { dispo: 'CALLBACK', count: 22, pct: 25.8, color: 'bg-amber-500' },
                        { dispo: 'NOT_INTERESTED', count: 14, pct: 16.4, color: 'bg-slate-400' },
                        { dispo: 'DNC', count: 3, pct: 3.5, color: 'bg-rose-500' }
                      ].map(d => (
                        <div key={d.dispo} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-slate-700">{d.dispo}</span>
                            <span className="text-slate-500 font-mono">
                              <strong>{d.count}</strong> ({d.pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className={`${d.color} h-full rounded-full`} style={{ width: `${d.pct}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentView('dispositionHistory')}
                    className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                    <span>View Disposition Call History & Re-Call</span>
                  </button>
                </div>

              </div>

              {/* Bottom Row: Shift Log & Break Audit */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Today's Shift Activity & Break History</h3>
                  <span className="text-xs text-slate-500 font-mono">Agent ID: {currentUser.userId}</span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-4 border-r border-slate-100">Event</th>
                      <th className="py-2.5 px-4 border-r border-slate-100">State / Reason</th>
                      <th className="py-2.5 px-4 border-r border-slate-100">Start Time</th>
                      <th className="py-2.5 px-4 border-r border-slate-100">End Time</th>
                      <th className="py-2.5 px-4 text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 border-r border-slate-100 font-bold text-emerald-700">LOGIN</td>
                      <td className="py-2.5 px-4 border-r border-slate-100 font-mono">Campaign: {activeCampaign}</td>
                      <td className="py-2.5 px-4 border-r border-slate-100 font-mono">10:55:52 AM</td>
                      <td className="py-2.5 px-4 border-r border-slate-100 font-mono">-</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">{formatTimer(loginTimeSec)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 border-r border-slate-100 font-bold text-amber-600">PAUSE</td>
                      <td className="py-2.5 px-4 border-r border-slate-100 font-semibold">Tea Break</td>
                      <td className="py-2.5 px-4 border-r border-slate-100 font-mono">11:45:00 AM</td>
                      <td className="py-2.5 px-4 border-r border-slate-100 font-mono">12:00:40 PM</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-600">15m 40s</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 border-r border-slate-100 font-bold text-amber-600">PAUSE</td>
                      <td className="py-2.5 px-4 border-r border-slate-100 font-semibold">Lunch</td>
                      <td className="py-2.5 px-4 border-r border-slate-100 font-mono">01:00:00 PM</td>
                      <td className="py-2.5 px-4 border-r border-slate-100 font-mono">01:30:00 PM</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-600">30m 00s</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ========================================================================================= */}
          {/* VIEW 2: DISPOSITION HISTORY & ONE-CLICK RE-CALL (User Request #3 - Meeting/Calendar Icon)  */}
          {/* ========================================================================================= */}
          {currentView === 'dispositionHistory' && (
            <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-amber-500" />
                    <span>Disposition Call Records & Re-Call Center</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View customer numbers marked with dispositions, review call notes, and re-dial immediately.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search phone or note..."
                      value={callLogSearch}
                      onChange={e => setCallLogSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-48 shadow-xs"
                    />
                  </div>

                  <select
                    value={callLogFilter}
                    onChange={e => setCallLogFilter(e.target.value as any)}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    <option value="all">All Dispositions</option>
                    <option value="INTERESTED">INTERESTED</option>
                    <option value="CALLBACK">CALLBACK</option>
                    <option value="SALE">SALE</option>
                    <option value="DNC">DNC</option>
                  </select>
                </div>
              </div>

              {/* Disposition History Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 border-r border-slate-200">Customer Number</th>
                      <th className="py-3 px-4 border-r border-slate-200">Customer Name</th>
                      <th className="py-3 px-4 border-r border-slate-200">Marked Disposition</th>
                      <th className="py-3 px-4 border-r border-slate-200">Timestamp</th>
                      <th className="py-3 px-4 border-r border-slate-200">Duration</th>
                      <th className="py-3 px-4 border-r border-slate-200">Notes / Remarks</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDispoHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No disposition records found matching search filter.
                        </td>
                      </tr>
                    ) : (
                      filteredDispoHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 border-r border-slate-100 font-mono font-bold text-slate-900">
                            {formatCustomerNumber(item.phone)}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 font-medium text-slate-800">
                            {item.customerName || 'Lead'}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                item.disposition === 'SALE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : item.disposition === 'INTERESTED'
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : item.disposition === 'CALLBACK'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : item.disposition === 'DNC'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              <CalendarClock className="w-2.5 h-2.5" />
                              {item.disposition}
                            </span>
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 font-mono text-slate-600">
                            {item.timestamp}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 font-mono text-slate-600">
                            {item.duration}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 text-slate-600 max-w-xs truncate">
                            {item.notes}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDialNumber(item.phone, item.customerName)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 mx-auto transition cursor-pointer shadow-xs"
                              title={`Call ${item.customerName} again`}
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>Re-Call</span>
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

          {/* ========================================================================================= */}
          {/* VIEW 3: LIVE CALL & SURVEY WORKSPACE                                                      */}
          {/* ========================================================================================= */}
          {currentView === 'callWorkspace' && (
            <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in">
              
              {/* Call Header Banner */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                    agentStatus === 'INCALL' ? 'bg-emerald-600 animate-pulse' : 'bg-sky-600'
                  }`}>
                    {agentStatus === 'INCALL' ? <PhoneCall className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        {currentLead.firstName} {currentLead.lastName}
                      </h2>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        agentStatus === 'INCALL' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {agentStatus === 'INCALL' ? `LIVE CALL • ${formatTimer(callDuration)}` : 'Customer Profile'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                      Phone: <strong>{formatCustomerNumber(currentLead.phone)}</strong> • Alt: {formatCustomerNumber(currentLead.altPhone)} • Campaign: <strong>{activeCampaign}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchNextLead(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Load next available lead from campaign hopper without dialing"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Next Hopper Lead</span>
                  </button>

                  <button
                    onClick={() => setShowSmsModal(true)}
                    className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send SMS</span>
                  </button>

                  {agentStatus === 'INCALL' ? (
                    <button
                      onClick={handleHangupCall}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <PhoneOff className="w-3.5 h-3.5" />
                      <span>End & Dispose Call</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDialNumber(currentLead.phone, `${currentLead.firstName} ${currentLead.lastName}`)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Dial Customer</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Two-Column Clean Layout: Left Customer Details + Right Live Survey Form */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left (4 Cols): Customer Information & Pitch Script */}
                <div className="lg:col-span-4 space-y-4">
                  
                  {/* Customer Information Card */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                      Customer Information
                    </h3>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Full Name</span>
                        <input
                          type="text"
                          value={`${currentLead.firstName || ''} ${currentLead.lastName || ''}`.trim()}
                          onChange={e => {
                            const parts = e.target.value.split(' ');
                            setCurrentLead({ ...currentLead, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') });
                          }}
                          className="w-full p-2 border border-slate-200 rounded-lg font-semibold text-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Primary Phone</span>
                          <input
                            type="text"
                            value={formatCustomerNumber(currentLead.phone || '')}
                            readOnly={currentCampaignObj?.callMasking}
                            onChange={e => setCurrentLead({ ...currentLead, phone: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Alternative Phone</span>
                          <input
                            type="text"
                            value={formatCustomerNumber(currentLead.altPhone || '')}
                            readOnly={currentCampaignObj?.callMasking}
                            onChange={e => setCurrentLead({ ...currentLead, altPhone: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded-lg font-mono text-slate-700"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Email Address</span>
                        <input
                          type="email"
                          value={currentLead.email || ''}
                          onChange={e => setCurrentLead({ ...currentLead, email: e.target.value })}
                          className="w-full p-2 border border-slate-200 rounded-lg text-slate-700"
                        />
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Location</span>
                        <input
                          type="text"
                          value={currentLead.address || ''}
                          onChange={e => setCurrentLead({ ...currentLead, address: e.target.value })}
                          className="w-full p-2 border border-slate-200 rounded-lg text-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Pitch Card */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Live Pitch Helper</span>
                      <span className="text-[10px] font-mono text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">Sales v2</span>
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      "Hello <strong>{currentLead.firstName}</strong>, I'm calling from <strong>Zeedial Cloud Telephony</strong>. We help companies scale high-concurrency autodialing with 99.99% uptime."
                    </p>
                  </div>

                </div>

                {/* Right (8 Cols): Interactive Dynamic Survey Form */}
                <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-sky-600" />
                        <span>Customer Qualification Survey Form</span>
                      </h3>
                      <p className="text-xs text-slate-500">Record customer requirements and qualification metrics in real-time</p>
                    </div>
                    <span className="px-2.5 py-1 bg-sky-50 text-sky-800 text-xs font-bold rounded-lg border border-sky-200 font-mono">
                      Form #SV-01
                    </span>
                  </div>

                  <form onSubmit={handleSaveSurvey} className="space-y-4 text-xs">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Current Telephony / Dialer Setup *</label>
                        <select
                          value={surveyAnswers.provider || 'VICIdial Native'}
                          onChange={e => setSurveyAnswers({ ...surveyAnswers, provider: e.target.value })}
                          className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-semibold"
                        >
                          <option value="VICIdial Native">VICIdial Native (On-Prem / CentOS 7)</option>
                          <option value="VICIBox Cluster">VICIBox OpenSUSE Cluster</option>
                          <option value="Cloud PBX">Asterisk / FreePBX Custom</option>
                          <option value="None">None (Manual Mobile Dialing)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Target Agent Seat Count *</label>
                        <input
                          type="number"
                          value={surveyAnswers.seats || 25}
                          onChange={e => setSurveyAnswers({ ...surveyAnswers, seats: parseInt(e.target.value) })}
                          className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Primary Campaign Interest</label>
                        <select
                          value={surveyAnswers.primaryFocus || 'Predictive Outbound'}
                          onChange={e => setSurveyAnswers({ ...surveyAnswers, primaryFocus: e.target.value })}
                          className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-semibold"
                        >
                          <option value="Predictive Outbound">Predictive Outbound (High Concurrency)</option>
                          <option value="Preview Dialer">Preview Dialer (High-Touch CRM)</option>
                          <option value="Inbound Sticky Agent">Inbound Routing & Sticky Agent</option>
                          <option value="Voice Blast">Voice Blast Broadcast</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Customer Interest Rating (1 - 5)</label>
                        <div className="flex items-center gap-2 pt-1">
                          {[1, 2, 3, 4, 5].map(rating => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setSurveyAnswers({ ...surveyAnswers, interestRating: rating })}
                              className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-xs transition cursor-pointer ${
                                (surveyAnswers.interestRating || 5) >= rating
                                  ? 'bg-sky-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${ (surveyAnswers.interestRating || 5) >= rating ? 'fill-white' : '' }`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Detailed Discussion Notes & Next Steps</label>
                      <textarea
                        rows={3}
                        value={surveyAnswers.callSummary || ''}
                        onChange={e => setSurveyAnswers({ ...surveyAnswers, callSummary: e.target.value })}
                        placeholder="Enter key customer pain points, budget, and follow-up timeline..."
                        className="w-full p-3 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowSmsModal(true)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-sky-600" />
                        <span>Send SMS Confirmation</span>
                      </button>

                      <button
                        type="submit"
                        className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Save Survey Responses</span>
                      </button>
                    </div>

                  </form>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 4: CONTACTS DIRECTORY                                                */}
          {/* ========================================================================= */}
          {currentView === 'contacts' && (
            <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Tenant Contacts Directory</h1>
                  <p className="text-xs text-slate-500">Corporate accounts and key customer contacts</p>
                </div>
                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Contact</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 border-r border-slate-200">Contact Name</th>
                      <th className="py-3 px-4 border-r border-slate-200">Phone Number</th>
                      <th className="py-3 px-4 border-r border-slate-200">Email Address</th>
                      <th className="py-3 px-4 border-r border-slate-200">City / Location</th>
                      <th className="py-3 px-4 border-r border-slate-200">Tags</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contactsList.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-900">{c.name}</td>
                        <td className="py-3 px-4 border-r border-slate-100 font-mono text-slate-700">{formatCustomerNumber(c.phoneNumber)}</td>
                        <td className="py-3 px-4 border-r border-slate-100 text-slate-600">{c.email || '-'}</td>
                        <td className="py-3 px-4 border-r border-slate-100 text-slate-600">{c.city || 'Bengaluru'}</td>
                        <td className="py-3 px-4 border-r border-slate-100">
                          <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[10px] font-bold rounded">
                            {Array.isArray(c.tags) ? c.tags[0] : c.tags || 'Contact'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDialNumber(c.phoneNumber, c.name)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 mx-auto cursor-pointer shadow-xs"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Dial</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 5: SCHEDULED MEETINGS & CALLBACKS                                    */}
          {/* ========================================================================= */}
          {currentView === 'meetings' && (
            <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Scheduled Callbacks & Meetings</h1>
                  <p className="text-xs text-slate-500">Scheduled appointments and callbacks across all campaigns</p>
                </div>
                <button
                  onClick={() => setShowCreateMeetingModal(true)}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule Callback</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {meetingsList.map(m => (
                  <div key={m.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="font-bold text-sm text-slate-900">{m.meetingTitle}</span>
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                          {m.module || 'Sales'}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-sky-600" />
                          <span className="font-mono font-semibold">{m.scheduledTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-bold">{formatCustomerNumber(m.phoneNumber)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDialNumber(m.phoneNumber, m.meetingTitle)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Start Scheduled Call</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 6: PITCH SCRIPT & GUIDELINES                                         */}
          {/* ========================================================================= */}
          {currentView === 'script' && (
            <div className="space-y-4 max-w-4xl mx-auto animate-in fade-in">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Campaign Pitch Script & Guidelines</h2>
                    <span className="text-xs text-slate-500">Active script assigned to <strong>{activeCampaign}</strong></span>
                  </div>
                  <span className="px-2.5 py-1 bg-sky-50 text-sky-800 text-xs font-bold rounded-lg border border-sky-200">
                    Standard Enterprise v3
                  </span>
                </div>

                <div className="prose prose-sm text-slate-700 space-y-4">
                  <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100">
                    <h4 className="font-bold text-sky-900 text-xs uppercase tracking-wider mb-1">1. Greeting & Permission</h4>
                    <p className="text-xs leading-relaxed text-slate-700">
                      "Good day! Am I speaking with <strong>[Customer Name]</strong>? My name is <strong>{currentUser.name}</strong> calling from Zeedial Cloud Telephony. I’m reaching out regarding high-capacity dialer scaling for your business."
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">2. Value Proposition</h4>
                    <p className="text-xs leading-relaxed text-slate-700">
                      "We provide zero-lag predictive auto-dialing, instant SMS triggers, and live CRM sync that reduces agent idle time by up to 40%."
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <h4 className="font-bold text-emerald-900 text-xs uppercase tracking-wider mb-1">3. Qualification & Close</h4>
                    <p className="text-xs leading-relaxed text-slate-700">
                      "How many calling seats are currently active at your organization? We would love to set up a 15-minute live platform demonstration for your team."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* ========================================================================= */}
        {/* 3. RIGHT SOFTPHONE DOCK (Quick Dial, History, & Actions)                   */}
        {/* ========================================================================= */}
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col justify-between shrink-0 shadow-xs">
          
          <div>
            {/* Dock Header Tabs */}
            <div className="grid grid-cols-3 border-b border-slate-200 text-xs font-bold">
              <button
                onClick={() => setDockTab('history')}
                className={`py-3 text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1 ${
                  dockTab === 'history' ? 'border-sky-600 text-sky-600 bg-sky-50/30' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>History</span>
              </button>
              <button
                onClick={() => setDockTab('dialPad')}
                className={`py-3 text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1 ${
                  dockTab === 'dialPad' ? 'border-sky-600 text-sky-600 bg-sky-50/30' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>Dialpad</span>
              </button>
              <button
                onClick={() => setDockTab('contacts')}
                className={`py-3 text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1 ${
                  dockTab === 'contacts' ? 'border-sky-600 text-sky-600 bg-sky-50/30' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Contacts</span>
              </button>
            </div>

            {/* TAB 1: RECENT DISPOSITION CALL HISTORY */}
            {dockTab === 'history' && (
              <div className="p-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                  <span className="font-bold text-slate-800">Recent Disposed Calls</span>
                  <span className="text-[10px] font-mono text-slate-400">{agentDispoHistory.length} total</span>
                </div>

                <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {agentDispoHistory.map((item) => (
                    <div key={item.id} className="p-2.5 bg-slate-50 hover:bg-sky-50/50 rounded-xl border border-slate-200 transition space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 font-mono">{formatCustomerNumber(item.phone)}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            item.disposition === 'SALE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.disposition === 'INTERESTED'
                              ? 'bg-sky-100 text-sky-800'
                              : item.disposition === 'CALLBACK'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.disposition}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{item.notes}</p>
                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                        <span>{item.timestamp}</span>
                        <button
                          onClick={() => handleDialNumber(item.phone, item.customerName)}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <PhoneCall className="w-2.5 h-2.5" />
                          <span>Re-Call</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: MANUAL DIALPAD */}
            {dockTab === 'dialPad' && (
              <div className="p-4 space-y-4">
                <input
                  type="text"
                  placeholder="Enter Phone Number..."
                  value={dialPadNumber}
                  onChange={e => setDialPadNumber(e.target.value)}
                  className="w-full text-center text-lg font-mono font-black py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500"
                />

                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(digit => (
                    <button
                      key={digit}
                      onClick={() => setDialPadNumber(prev => prev + digit)}
                      className="py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl font-bold text-base text-slate-800 transition cursor-pointer"
                    >
                      {digit}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (!dialPadNumber) return;
                      handleDialNumber(dialPadNumber);
                      setDialPadNumber('');
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call Now</span>
                  </button>

                  <button
                    onClick={() => setDialPadNumber('')}
                    className="w-full py-1 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                  >
                    Clear Input
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: CONTACTS MINI LIST */}
            {dockTab === 'contacts' && (
              <div className="p-3 space-y-2">
                <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {contactsList.map(c => (
                    <div key={c.id} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{c.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{formatCustomerNumber(c.phoneNumber)}</span>
                      </div>
                      <button
                        onClick={() => handleDialNumber(c.phoneNumber, c.name)}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                      >
                        <PhoneCall className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Bottom Dock Status */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-semibold">Logged-in Campaign</span>
            <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono text-[11px] font-bold">
              {activeCampaign}
            </span>
          </div>

        </aside>

      </div>

      {/* ========================================================================= */}
      {/* 4. POST-CALL DISPOSITION & AUTO-WRAPUP MODAL                              */}
      {/* ========================================================================= */}
      {agentStatus === 'WRAPUP' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 animate-in zoom-in-95 space-y-4">
            
            {/* Header with countdown timer */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Post-Call Disposition & Wrap-Up</h3>
                <span className="text-xs text-slate-500 font-mono">
                  Customer: <strong>{formatCustomerNumber(currentLead.phone)}</strong> • Campaign: <strong className="text-sky-600">{activeCampaign}</strong>
                </span>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-amber-500 text-white font-mono font-black text-xs rounded-lg animate-pulse inline-flex items-center gap-1.5 shadow-xs">
                  <Clock className="w-3 h-3" />
                  Auto-Dispo in {dispoCountdown}s
                </span>
              </div>
            </div>

            {/* Auto Dispo Notification Banner */}
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Auto-saving as <strong>[{currentCampaignObj?.autoDispoValue || selectedDispo || 'CALL_LATER'}]</strong> on timer expiry.
                </span>
              </div>
              <span className="font-mono text-amber-700 font-bold text-[11px]">{dispoCountdown}s remaining</span>
            </div>

            {/* Campaign-Mapped Dispositions List */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Select Call Outcome (Mapped to {activeCampaign}) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {campaignMappedDispositions.map(dispo => (
                  <button
                    key={dispo}
                    type="button"
                    onClick={() => setSelectedDispo(dispo)}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition flex items-center justify-between cursor-pointer ${
                      selectedDispo === dispo
                        ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-sky-50'
                    }`}
                  >
                    <span>{dispo}</span>
                    {selectedDispo === dispo && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Inline Callback Schedule if Callback selected */}
            {(selectedDispo === 'CALLBACK' || selectedDispo === 'CALL_LATER' || selectedDispo === 'FOLLOWUP') && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1.5 animate-in fade-in text-xs">
                <label className="block font-bold text-sky-900">Schedule Callback Date & Time</label>
                <input
                  type="datetime-local"
                  value={callbackDateTime}
                  onChange={e => setCallbackDateTime(e.target.value)}
                  className="w-full p-2 bg-white border border-sky-300 rounded-lg font-mono font-semibold"
                />
              </div>
            )}

            {/* Wrap-up Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Final Call Remarks / Notes
              </label>
              <textarea
                rows={2}
                value={dispoNotes}
                onChange={e => setDispoNotes(e.target.value)}
                placeholder="Enter call outcome remarks..."
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            {/* Submit Disposition Action */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleCompleteDisposition()}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-lg transition cursor-pointer"
              >
                Submit Disposition & Return to Ready Status
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SWITCH CAMPAIGN & QUEUES MODAL (User Request #4)                       */}
      {/* Shows ONLY queues mapped to selected campaign + "Select All Queues"       */}
      {/* ========================================================================= */}
      {showSwitchCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 animate-in zoom-in-95 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">Switch Active Campaign</h3>
              </div>
              <button onClick={() => setShowSwitchCampaignModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select a target campaign. Only queues mapped to that campaign will be displayed.
            </p>

            <div className="space-y-3 text-xs">
              {/* Step 1: Select Campaign */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Select Campaign *</label>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {availableCampaigns.map(camp => (
                    <label
                      key={camp.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                        tempSelectedCampaign === camp.name
                          ? 'bg-sky-50 border-sky-400 text-sky-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="switchCampRadio"
                          checked={tempSelectedCampaign === camp.name}
                          onChange={() => handleSelectCampaignInModal(camp.name)}
                          className="text-sky-600 cursor-pointer"
                        />
                        <span>{camp.name}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-white text-slate-600 rounded text-[10px] font-mono border border-slate-200">
                        {camp.type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 2: Queues mapped STRICTLY to selected campaign */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-800">
                    Queues Mapped to {tempSelectedCampaign}
                  </label>
                  
                  {/* Select All Mapped Queues button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (tempSelectedQueues.length === mappedQueuesForSelectedCamp.length) {
                        setTempSelectedQueues([]);
                      } else {
                        setTempSelectedQueues([...mappedQueuesForSelectedCamp]);
                      }
                    }}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    {tempSelectedQueues.length === mappedQueuesForSelectedCamp.length ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        <span>Select All Queues</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  {mappedQueuesForSelectedCamp.map((queueName) => {
                    const isChecked = tempSelectedQueues.includes(queueName);
                    return (
                      <label
                        key={queueName}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition text-xs ${
                          isChecked
                            ? 'bg-white border-sky-300 text-sky-900 font-bold shadow-xs'
                            : 'bg-slate-100/60 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempSelectedQueues([...tempSelectedQueues, queueName]);
                            } else {
                              setTempSelectedQueues(tempSelectedQueues.filter(q => q !== queueName));
                            }
                          }}
                          className="rounded text-sky-600 cursor-pointer"
                        />
                        <span className="font-mono">{queueName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSwitchCampaignModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCampaignSwitch}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
              >
                Apply & Switch
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. INSTANT POST-CALL SMS MODAL                                            */}
      {/* ========================================================================= */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 animate-in zoom-in-95 space-y-3">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Trigger Instant Customer SMS</h3>
              </div>
              <button onClick={() => setShowSmsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recipient Phone Number</label>
                <input
                  type="text"
                  readOnly
                  value={formatCustomerNumber(currentLead.phone || '')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select SMS Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={e => setSelectedTemplateId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800"
                >
                  {smsTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Custom Message / Preview</label>
                <textarea
                  rows={3}
                  value={customSmsMessage}
                  onChange={e => setCustomSmsMessage(e.target.value)}
                  placeholder={`Hi ${currentLead.firstName || 'Customer'}, thank you for speaking with ${currentUser.name} from Zeedial Cloud Telephony. Here is your demo link: https://zeedial.com/demo`}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSmsModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendSms}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md"
                >
                  Dispatch SMS Immediately
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. PROFILE SIDE DRAWER                                                    */}
      {/* ========================================================================= */}
      {showProfileDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-2xs animate-in fade-in">
          <div className="w-80 bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between p-6 animate-in slide-in-from-right">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Agent Profile & Station</h3>
                <button
                  onClick={() => setShowProfileDrawer(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl">
                  <span className="text-[10px] font-bold text-sky-700 block uppercase tracking-wider">Logged In User</span>
                  <strong className="text-slate-900 font-mono text-xs">{currentUser.emailId || 'agent01@zeedial.com'}</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Active Campaign</span>
                  <span className="font-mono font-bold text-slate-900">{activeCampaign}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">SIP Extension</span>
                  <span className="font-mono font-bold text-emerald-600">{currentUser.mobileExtension || '1011'}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Active Queues</span>
                  <span className="font-mono text-xs text-sky-600 font-bold truncate max-w-[120px]">{activeQueues.join(', ')}</span>
                </div>

                <button
                  onClick={() => {
                    setShowProfileDrawer(false);
                    setShowSwitchCampaignModal(true);
                  }}
                  className="w-full py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Switch Campaign / Queues
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={onLogout}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out Station</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. CREATE MEETING / CALLBACK MODAL                                        */}
      {/* ========================================================================= */}
      {showCreateMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-base font-bold text-slate-900">Schedule Callback / Meeting</h3>
              <button onClick={() => setShowCreateMeetingModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Callback Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Solution Demo"
                  value={newMeetingForm.meetingTitle}
                  onChange={e => setNewMeetingForm({ ...newMeetingForm, meetingTitle: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newMeetingForm.phoneNumber}
                  onChange={e => setNewMeetingForm({ ...newMeetingForm, phoneNumber: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Module</label>
                  <select
                    value={newMeetingForm.module}
                    onChange={e => setNewMeetingForm({ ...newMeetingForm, module: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-semibold"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Support">Support</option>
                    <option value="Onboarding">Onboarding</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Schedule Date & Time</label>
                  <input
                    type="text"
                    value={newMeetingForm.scheduleDate}
                    onChange={e => setNewMeetingForm({ ...newMeetingForm, scheduleDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateMeetingModal(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-md"
                >
                  Schedule Callback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. ADD CONTACT MODAL                                                      */}
      {/* ========================================================================= */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Contact</h3>
              <button onClick={() => setShowAddContactModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={newContactForm.name}
                    onChange={e => setNewContactForm({ ...newContactForm, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={newContactForm.phoneNumber}
                    onChange={e => setNewContactForm({ ...newContactForm, phoneNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alternative Phone</label>
                  <input
                    type="text"
                    value={newContactForm.altPhoneNumber}
                    onChange={e => setNewContactForm({ ...newContactForm, altPhoneNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newContactForm.email}
                    onChange={e => setNewContactForm({ ...newContactForm, email: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Primary Address</label>
                  <input
                    type="text"
                    value={newContactForm.primaryAddress}
                    onChange={e => setNewContactForm({ ...newContactForm, primaryAddress: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-md"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
